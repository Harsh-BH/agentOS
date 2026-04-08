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

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    await createSkill({ name: newName, type: newType });
    setShowAdd(false);
    setNewName("");
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-sm text-[#999]">Loading skills...</div>;
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
      {showAdd && (
        <form onSubmit={handleAdd} className="border-b border-[#e2e2e2] px-8 py-4">
          <div className="flex gap-3">
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} required placeholder="Skill name" className="flex-1 border border-[#e2e2e2] px-3 py-2 text-sm outline-none focus:border-[#9d66ff]" />
            <select value={newType} onChange={(e) => setNewType(e.target.value as SkillType)} className="border border-[#e2e2e2] px-3 py-2 text-sm outline-none">
              <option value="prompt">Prompt</option>
              <option value="tool">Tool</option>
              <option value="agent">Agent</option>
            </select>
            <button type="submit" className="bg-[#0d0d0d] px-4 py-2 text-xs font-medium text-white hover:bg-[#333]">Create</button>
            <button type="button" onClick={() => setShowAdd(false)} className="text-xs text-[#999]">Cancel</button>
          </div>
        </form>
      )}

      {/* Skills list */}
      <div className="px-8 py-4">
        {skills.length === 0 ? (
          <p className="py-16 text-center text-sm text-[#999]">No skills yet — generate from imported repo or add manually</p>
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

  return (
    <div className="border-b border-[#e2e2e2]">
      {/* Summary row */}
      <button onClick={onToggle} className="flex w-full items-center gap-4 py-4 text-left transition-colors hover:bg-[#fafafa]">
        <div className="flex size-9 items-center justify-center" style={{ backgroundColor: typeBg[skill.type] }}>
          <span className="text-xs font-bold" style={{ color: typeColor[skill.type] }}>{skill.type.charAt(0).toUpperCase()}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#0d0d0d]">{skill.name}</span>
            <span className="px-1.5 py-0.5 text-[10px] font-medium uppercase" style={{ backgroundColor: typeBg[skill.type], color: typeColor[skill.type] }}>{skill.type}</span>
            <span className="px-1.5 py-0.5 text-[10px] font-medium uppercase" style={{ backgroundColor: dofBg[dof], color: dofColor[dof] }}>{dof}</span>
            {gotchas.length > 0 && <span className="text-[10px] text-[#999]">{gotchas.length} gotchas</span>}
          </div>
          {trigger && <p className="mt-0.5 truncate text-xs text-[#666]">{trigger}</p>}
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}>
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {/* Expanded config */}
      {isExpanded && (
        <div className="border-t border-[#e2e2e2] bg-[#fafafa] px-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Left column */}
            <div className="flex flex-col gap-3">
              {config?.goal && (
                <ConfigBlock label="Goal" value={config.goal} />
              )}
              {trigger && (
                <ConfigBlock label="Trigger" value={trigger} />
              )}
              {config?.system_prompt && (
                <ConfigBlock label="System Prompt" value={config.system_prompt} mono />
              )}
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
          <div className="mt-4 flex justify-end border-t border-[#e2e2e2] pt-3">
            <button onClick={onDelete} className="text-xs text-[#999] hover:text-red-600">Delete skill</button>
          </div>
        </div>
      )}
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
