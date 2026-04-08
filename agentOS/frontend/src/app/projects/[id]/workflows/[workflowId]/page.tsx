"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { WorkflowCanvas } from "@/components/canvas/WorkflowCanvas";
import { useWorkflowStore } from "@/stores/workflowStore";
import { get } from "@/lib/api";
import type { Workflow } from "@/types";

export default function WorkflowEditorPage() {
  const { id: projectId, workflowId } = useParams<{ id: string; workflowId: string }>();
  const { nodes, edges, isDirty, loadWorkflow, saveWorkflow, reset } = useWorkflowStore();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      get<Workflow>(`api/workflows/${workflowId}`).then(setWorkflow),
      loadWorkflow(workflowId),
    ])
      .catch(() => setError("Failed to load workflow"))
      .finally(() => setLoading(false));

    return () => reset();
  }, [workflowId, loadWorkflow, reset]);

  async function handleSave() {
    setSaving(true);
    try {
      await saveWorkflow();
      const updated = await get<Workflow>(`api/workflows/${workflowId}`);
      setWorkflow(updated);
    } catch {
      setError("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-sm text-[#999]">Loading workflow...</div>;
  }

  if (error && !workflow) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-sm text-red-600">{error}</p>
        <Link href={`/projects/${projectId}`} className="text-sm font-medium text-[#9d66ff] hover:underline">Back to project</Link>
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
    <div className="flex h-screen flex-col bg-white">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-[#e2e2e2] px-6 py-3">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${projectId}`} className="text-xs font-medium text-[#9d66ff] hover:underline">
            &larr; Back
          </Link>
          <div className="h-4 w-px bg-[#e2e2e2]" />
          <div>
            <h1 className="text-sm font-bold text-[#0d0d0d]">{workflow?.name ?? "Workflow"}</h1>
            <div className="flex items-center gap-3 text-[10px] text-[#999]">
              <span>v{workflow?.version ?? 1}</span>
              <span>{nodes.length} nodes</span>
              <span>{edges.length} edges</span>
              {isDirty && <span className="font-medium text-[#f59e0b]">Unsaved changes</span>}
            </div>
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
          <div className="h-4 w-px bg-[#e2e2e2]" />
          <button
            onClick={handleSave}
            disabled={!isDirty || saving}
            className="bg-[#0d0d0d] px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#333] disabled:opacity-30"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Error bar */}
      {error && (
        <div className="border-b border-red-200 bg-red-50 px-6 py-2 text-xs text-red-700">{error}</div>
      )}

      {/* Canvas */}
      <div className="flex-1">
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
