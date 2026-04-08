"use client";

import { Handle, Position, type NodeProps } from "reactflow";
import type { SkillType } from "@/types";

interface SkillNodeData {
  skillName: string;
  skillType: SkillType;
  // Legacy compat
  name?: string;
}

const badgeBg: Record<string, string> = {
  prompt: "#f0e6ff",
  tool: "#e0f2fe",
  agent: "#fff7ed",
};

const badgeColor: Record<string, string> = {
  prompt: "#9d66ff",
  tool: "#38bdf8",
  agent: "#f97316",
};

export function SkillNode({ data }: NodeProps<SkillNodeData>) {
  const name = data.skillName || data.name || "Skill";
  const type = data.skillType || "prompt";

  return (
    <div className="min-w-[180px] border border-[#e2e2e2] bg-white px-4 py-3 shadow-sm">
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2">
        <div
          className="flex size-5 items-center justify-center text-[10px] font-bold"
          style={{ backgroundColor: badgeBg[type], color: badgeColor[type] }}
        >
          {type.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-medium text-[#0d0d0d]">{name}</span>
        <span
          className="px-1.5 py-0.5 text-[10px] font-medium uppercase"
          style={{ backgroundColor: badgeBg[type], color: badgeColor[type] }}
        >
          {type}
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
