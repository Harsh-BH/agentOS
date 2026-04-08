"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useProjects } from "@/hooks/useProjects";
import { get } from "@/lib/api";
import type { Skill } from "@/types";

const typeBg: Record<string, string> = { prompt: "#f0e6ff", tool: "#e0f2fe", agent: "#fff7ed" };
const typeColor: Record<string, string> = { prompt: "#9d66ff", tool: "#38bdf8", agent: "#f97316" };
const dofBg: Record<string, string> = { low: "#fee2e2", medium: "#fef3c7", high: "#dcfce7" };
const dofColor: Record<string, string> = { low: "#991b1b", medium: "#92400e", high: "#166534" };

interface SkillWithProject extends Skill {
  project_name: string;
}

export default function DashboardSkillsPage() {
  const { projects } = useProjects();
  const [skills, setSkills] = useState<SkillWithProject[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch skills from all projects
  useEffect(() => {
    if (projects.length === 0) {
      setLoading(false);
      return;
    }

    const projectMap = new Map(projects.map((p) => [p.id, p.name]));

    Promise.all(
      projects.map((p) =>
        get<Skill[]>(`api/projects/${p.id}/skills`)
          .then((skills) => skills.map((s) => ({ ...s, project_name: projectMap.get(s.project_id) ?? "Unknown" })))
          .catch(() => [] as SkillWithProject[]),
      ),
    ).then((results) => {
      setSkills(results.flat());
      setLoading(false);
    });
  }, [projects]);

  // Stats
  const byType = { prompt: 0, tool: 0, agent: 0 };
  for (const s of skills) {
    if (s.type in byType) byType[s.type as keyof typeof byType]++;
  }

  return (
    <div className="h-full">
      <div className="border-b border-[#e2e2e2] px-8 py-6">
        <h1 className="text-2xl font-bold tracking-tight text-[#0d0d0d]">All Skills</h1>
        <p className="mt-1 text-sm tracking-[0.16px] text-[#4d4d4d]">
          Every skill across all your projects.
        </p>
      </div>

      {/* Type breakdown */}
      <div className="flex border-b border-[#e2e2e2]">
        {(["prompt", "tool", "agent"] as const).map((type, i) => (
          <div key={type} className={`flex flex-1 items-center gap-3 px-8 py-5 ${i < 2 ? "border-r border-[#e2e2e2]" : ""}`}>
            <div className="flex size-10 items-center justify-center" style={{ backgroundColor: typeBg[type] }}>
              <span className="text-lg font-bold" style={{ color: typeColor[type] }}>{byType[type]}</span>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.5px] text-[#999]">{type}</p>
              <p className="text-sm font-medium text-[#0d0d0d]">operators</p>
            </div>
          </div>
        ))}
      </div>

      {/* Skills list */}
      <div className="px-8 py-6">
        {loading ? (
          <p className="py-16 text-center text-sm text-[#999]">Loading skills...</p>
        ) : skills.length === 0 ? (
          <p className="py-16 text-center text-sm text-[#999]">No skills yet — import a repo and generate skills from a project page.</p>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center border-b border-[#e2e2e2] pb-3">
              <span className="flex-1 text-xs font-medium uppercase tracking-[0.5px] text-[#999]">Skill</span>
              <span className="w-20 text-center text-xs font-medium uppercase tracking-[0.5px] text-[#999]">Type</span>
              <span className="w-20 text-center text-xs font-medium uppercase tracking-[0.5px] text-[#999]">DoF</span>
              <span className="w-16 text-center text-xs font-medium uppercase tracking-[0.5px] text-[#999]">Gotchas</span>
              <span className="w-40 text-right text-xs font-medium uppercase tracking-[0.5px] text-[#999]">Project</span>
            </div>

            {skills.map((skill) => {
              const dof = skill.config?.degree_of_freedom ?? "medium";
              const gotchaCount = skill.config?.gotchas?.length ?? 0;
              const trigger = skill.config?.trigger ?? "";

              return (
                <Link
                  key={skill.id}
                  href={`/projects/${skill.project_id}/skills`}
                  className="group flex items-center border-b border-[#e2e2e2] py-3.5 transition-colors hover:bg-[#fafafa]"
                >
                  <div className="flex flex-1 items-center gap-3">
                    <div className="flex size-8 items-center justify-center" style={{ backgroundColor: typeBg[skill.type] }}>
                      <span className="text-xs font-bold" style={{ color: typeColor[skill.type] }}>{skill.type.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-[#0d0d0d] group-hover:text-[#7b3aed]">{skill.name}</span>
                      {trigger && <p className="mt-0.5 truncate text-xs text-[#999]">{trigger}</p>}
                    </div>
                  </div>
                  <div className="flex w-20 justify-center">
                    <span className="px-2 py-0.5 text-[10px] font-medium uppercase" style={{ backgroundColor: typeBg[skill.type], color: typeColor[skill.type] }}>{skill.type}</span>
                  </div>
                  <div className="flex w-20 justify-center">
                    <span className="px-2 py-0.5 text-[10px] font-medium uppercase" style={{ backgroundColor: dofBg[dof], color: dofColor[dof] }}>{dof}</span>
                  </div>
                  <div className="w-16 text-center text-xs text-[#999]">{gotchaCount}</div>
                  <span className="w-40 truncate text-right text-xs text-[#999]">{skill.project_name}</span>
                </Link>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
