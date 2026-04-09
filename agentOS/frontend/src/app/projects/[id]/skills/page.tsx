"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSkills } from "@/hooks/useSkills";
import type { Skill, SkillType } from "@/types";

const typeBg: Record<string, string> = { prompt: "#f0e6ff", tool: "#e0f2fe", agent: "#fff7ed" };
const typeColor: Record<string, string> = { prompt: "#9d66ff", tool: "#38bdf8", agent: "#f97316" };
const dofBg: Record<string, string> = { low: "#fee2e2", medium: "#fef3c7", high: "#dcfce7" };
const dofColor: Record<string, string> = { low: "#991b1b", medium: "#92400e", high: "#166534" };

export default function ProjectSkillsPage() {
  const { id } = useParams<{ id: string }>();
  const { skills, loading, createSkill, deleteSkill } = useSkills(id);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<SkillType>("prompt");
  const [creating, setCreating] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await createSkill({ name: newName, type: newType });
      setShowAdd(false);
      setNewName("");
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="border-b border-[#e2e2e2] px-8 py-5">
          <div className="h-3 w-24 animate-pulse bg-[#f0e6ff]" />
          <div className="mt-3 h-6 w-40 animate-pulse bg-[#e2e2e2]" />
        </div>
        <div className="px-8 py-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 border-b border-[#e2e2e2] py-4 animate-pulse">
              <div className="size-9 bg-[#f0e6ff]" />
              <div className="flex flex-1 flex-col gap-2">
                <div className="h-3 w-36 bg-[#e2e2e2]" />
                <div className="h-2 w-56 bg-[#f5f5f5]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-[#e2e2e2] px-8 py-5">
        <Link href={`/projects/${id}`} className="text-xs font-medium text-[#9d66ff] hover:underline">&larr; Back to project</Link>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0d0d0d]">Skills ({skills.length})</h1>
            <p className="mt-1 text-sm text-[#4d4d4d]">Reusable operators for this project. Click to expand config.</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="bg-[#0d0d0d] px-4 py-2 text-sm font-medium text-white hover:bg-[#333]">+ Add Skill</button>
        </div>
      </div>

      {/* Add skill form */}
      <div className={`overflow-hidden border-b border-[#e2e2e2] transition-all duration-200 ${showAdd ? "max-h-24 opacity-100" : "max-h-0 opacity-0"}`}>
        <form onSubmit={handleAdd} className="px-8 py-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              placeholder="Skill name"
              className="flex-1 border border-[#e2e2e2] px-3 py-2 text-sm outline-none focus:border-[#9d66ff]"
              autoFocus={showAdd}
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as SkillType)}
              className="border border-[#e2e2e2] px-3 py-2 text-sm outline-none"
            >
              <option value="prompt">Prompt</option>
              <option value="tool">Tool</option>
              <option value="agent">Agent</option>
            </select>
            <button
              type="submit"
              disabled={creating}
              className="flex items-center gap-1.5 bg-[#0d0d0d] px-4 py-2 text-xs font-medium text-white hover:bg-[#333] disabled:opacity-50"
            >
              {creating && <Spinner />}
              {creating ? "Creating..." : "Create"}
            </button>
            <button type="button" onClick={() => setShowAdd(false)} className="text-xs text-[#999]">Cancel</button>
          </div>
        </form>
      </div>

      {/* Skills list */}
      <div className="px-8 py-4">
        {skills.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="flex size-12 items-center justify-center bg-[#f0e6ff]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9d66ff" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" /></svg>
            </div>
            <p className="mt-4 text-sm font-medium text-[#0d0d0d]">No skills yet</p>
            <p className="mt-1 text-xs text-[#999]">Generate from an imported repo, or add manually</p>
            <button onClick={() => setShowAdd(true)} className="mt-4 border border-[#e2e2e2] px-4 py-2 text-xs font-medium text-[#4d4d4d] hover:bg-[#f5f5f5]">
              Add your first skill
            </button>
          </div>
        ) : (
          skills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              isExpanded={expanded === skill.id}
              onToggle={() => setExpanded(expanded === skill.id ? null : skill.id)}
              onDelete={() => deleteSkill(skill.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function SkillCard({ skill, isExpanded, onToggle, onDelete }: {
  skill: Skill;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const config = skill.config;
  const dof = config?.degree_of_freedom ?? "medium";
  const gotchas = config?.gotchas ?? [];
  const refs = config?.references ?? [];
  const trigger = config?.trigger ?? "";
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  return (
    <div className="border-b border-[#e2e2e2]">
      {/* Summary row */}
      <button onClick={onToggle} className="flex w-full items-center gap-4 py-4 text-left transition-colors hover:bg-[#fafafa]">
        <div className="flex size-9 flex-shrink-0 items-center justify-center" style={{ backgroundColor: typeBg[skill.type] }}>
          <span className="text-xs font-bold" style={{ color: typeColor[skill.type] }}>{skill.type.charAt(0).toUpperCase()}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-[#0d0d0d]">{skill.name}</span>
            <span className="px-1.5 py-0.5 text-[10px] font-medium uppercase" style={{ backgroundColor: typeBg[skill.type], color: typeColor[skill.type] }}>{skill.type}</span>
            <span className="px-1.5 py-0.5 text-[10px] font-medium uppercase" style={{ backgroundColor: dofBg[dof], color: dofColor[dof] }}>{dof}</span>
            {gotchas.length > 0 && <span className="text-[10px] text-[#999]">{gotchas.length} gotchas</span>}
          </div>
          {trigger && <p className="mt-0.5 truncate text-xs text-[#666]">{trigger}</p>}
        </div>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"
          className={`flex-shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {/* Expanded config — CSS max-height transition */}
      <div
        className={`overflow-hidden transition-all duration-250 ease-in-out ${isExpanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="border-t border-[#e2e2e2] bg-[#fafafa] px-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Left column */}
            <div className="flex flex-col gap-3">
              {config?.goal && <ConfigBlock label="Goal" value={config.goal} />}
              {trigger && <ConfigBlock label="Trigger" value={trigger} />}
              {config?.system_prompt && <ConfigBlock label="System Prompt" value={config.system_prompt} mono />}
              {config?.tools && config.tools.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.5px] text-[#999]">Tools</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {config.tools.map((t) => (
                      <span key={t} className="border border-[#e2e2e2] bg-white px-2 py-0.5 text-xs text-[#4d4d4d]">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-3">
              {gotchas.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.5px] text-[#999]">Gotchas</p>
                  <ul className="mt-1 flex flex-col gap-1">
                    {gotchas.map((g, i) => (
                      <li key={i} className="flex gap-2 text-xs text-[#4d4d4d]">
                        <span className="mt-0.5 text-[#f59e0b]">!</span>
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {refs.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.5px] text-[#999]">References</p>
                  <ul className="mt-1 flex flex-col gap-0.5">
                    {refs.map((r) => (
                      <li key={r} className="font-mono text-xs text-[#7b3aed]">{r}</li>
                    ))}
                  </ul>
                </div>
              )}
              {config?.max_tokens && (
                <ConfigBlock label="Max Tokens" value={String(config.max_tokens)} />
              )}
            </div>
          </div>

          {/* Delete */}
          <div className="mt-4 flex items-center justify-end gap-2 border-t border-[#e2e2e2] pt-3">
            {deleteConfirm ? (
              <>
                <span className="text-xs text-[#999]">Are you sure?</span>
                <button
                  onClick={onDelete}
                  className="bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="border border-[#e2e2e2] px-3 py-1 text-xs text-[#4d4d4d] hover:bg-[#f5f5f5]"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="text-xs text-[#999] hover:text-red-600 transition-colors"
              >
                Delete skill
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfigBlock({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-[0.5px] text-[#999]">{label}</p>
      <p className={`mt-0.5 text-xs text-[#4d4d4d] ${mono ? "font-mono" : ""} ${value.length > 200 ? "line-clamp-4" : ""}`}>{value}</p>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}
