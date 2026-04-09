"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { WorkflowCanvas } from "@/components/canvas/WorkflowCanvas";
import { useWorkflowStore } from "@/stores/workflowStore";
import { get } from "@/lib/api";
import type { Workflow } from "@/types";

const AUTOSAVE_DELAY = 2000; // 2s debounce

export default function WorkflowEditorPage() {
  const { id: projectId, workflowId } = useParams<{ id: string; workflowId: string }>();
  const { nodes, edges, isDirty, loadWorkflow, saveWorkflow, reset } = useWorkflowStore();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      get<Workflow>(`api/workflows/${workflowId}`).then(setWorkflow),
      loadWorkflow(workflowId),
    ])
      .catch(() => setError("Failed to load workflow"))
      .finally(() => setLoading(false));

    return () => {
      reset();
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      if (savedStatusTimerRef.current) clearTimeout(savedStatusTimerRef.current);
    };
  }, [workflowId, loadWorkflow, reset]);

  // Auto-save: debounce 2s after every dirty change
  const doSave = useCallback(async (silent = false) => {
    if (!silent) setSaving(true);
    setSaveStatus("saving");
    try {
      await saveWorkflow();
      const updated = await get<Workflow>(`api/workflows/${workflowId}`);
      setWorkflow(updated);
      setSaveStatus("saved");
      // Fade "Saved" back to idle after 2s
      if (savedStatusTimerRef.current) clearTimeout(savedStatusTimerRef.current);
      savedStatusTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
      setError("Failed to save");
    } finally {
      setSaving(false);
    }
  }, [saveWorkflow, workflowId]);

  useEffect(() => {
    if (!isDirty) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => doSave(true), AUTOSAVE_DELAY);
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [isDirty, nodes, edges, doSave]);

  if (loading) {
    return (
      <div className="flex h-full flex-col bg-white">
        <div className="flex items-center gap-3 border-b border-[#e2e2e2] px-6 py-3">
          <div className="h-2.5 w-24 animate-pulse bg-[#f0e6ff]" />
          <div className="h-3 w-px bg-[#e2e2e2]" />
          <div className="h-3 w-32 animate-pulse bg-[#e2e2e2]" />
        </div>
        <div className="flex flex-1 items-center justify-center text-sm text-[#999]">Loading workflow…</div>
      </div>
    );
  }

  if (error && !workflow) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-sm text-red-600">{error}</p>
        <Link href={`/projects/${projectId}`} className="text-sm font-medium text-[#9d66ff] hover:underline">← Back to project</Link>
      </div>
    );
  }

  // Node type stats
  const nodeTypeCounts: Record<string, number> = {};
  for (const n of nodes) {
    const t = n.type ?? "unknown";
    nodeTypeCounts[t] = (nodeTypeCounts[t] ?? 0) + 1;
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-[#e2e2e2] px-6 py-3">
        <div className="flex items-center gap-3">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-[#999]">
            <Link href="/dashboard" className="hover:text-[#9d66ff]">Projects</Link>
            <span>/</span>
            <Link href={`/projects/${projectId}`} className="hover:text-[#9d66ff]">Project</Link>
            <span>/</span>
            <span className="font-semibold text-[#0d0d0d]">{workflow?.name ?? "Workflow"}</span>
          </div>
          <div className="h-3.5 w-px bg-[#e2e2e2]" />
          <div className="flex items-center gap-2 text-[10px] text-[#bbb]">
            <span>v{workflow?.version ?? 1}</span>
            <span>·</span>
            <span>{nodes.length} nodes</span>
            <span>·</span>
            <span>{edges.length} edges</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Node type legend */}
          <div className="hidden items-center gap-2 lg:flex">
            {Object.entries(nodeTypeCounts).map(([type, count]) => (
              <span key={type} className="flex items-center gap-1 text-[10px] text-[#999]">
                <span className="inline-block size-2" style={{ backgroundColor: nodeColor(type) }} />
                {type} ({count})
              </span>
            ))}
          </div>

          {/* Save status indicator */}
          <div className="flex items-center gap-2">
            {saveStatus === "saving" && (
              <span className="flex items-center gap-1.5 text-[10px] text-[#999]">
                <Spinner size={10} />
                Saving...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="text-[10px] font-medium text-[#22c55e]">Saved</span>
            )}
            {saveStatus === "error" && (
              <span className="text-[10px] font-medium text-red-600">Save failed</span>
            )}
            {isDirty && saveStatus === "idle" && (
              <span className="text-[10px] text-[#f59e0b]">Unsaved changes</span>
            )}
          </div>

          <div className="h-4 w-px bg-[#e2e2e2]" />
          <button
            onClick={() => doSave(false)}
            disabled={!isDirty || saving}
            className="flex items-center gap-1.5 bg-[#0d0d0d] px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#333] disabled:opacity-30"
          >
            {saving && <Spinner size={11} />}
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Error bar */}
      {error && (
        <div className="flex items-center justify-between border-b border-red-200 bg-red-50 px-6 py-2 text-xs text-red-700">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xs opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 overflow-hidden">
        <WorkflowCanvas />
      </div>
    </div>
  );
}

function nodeColor(type: string): string {
  const colors: Record<string, string> = {
    skillNode: "#9d66ff",
    ioNode: "#22c55e",
    planNode: "#f59e0b",
    validateNode: "#22c55e",
    routerNode: "#38bdf8",
    loopNode: "#f97316",
    subagentNode: "#7b3aed",
  };
  return colors[type] ?? "#999";
}

function Spinner({ size = 13 }: { size?: number }) {
  return (
    <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}
