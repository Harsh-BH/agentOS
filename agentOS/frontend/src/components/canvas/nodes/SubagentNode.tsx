"use client";

import { Handle, Position, type NodeProps } from "reactflow";

interface SubagentNodeData {
  label: string;
  agent_goal: string;
  tools: string[];
  summary_format: string;
}

export function SubagentNode({ data }: NodeProps<SubagentNodeData>) {
  const tools = data.tools ?? [];

  return (
    <div className="min-w-[200px] border-2 border-[#9d66ff] bg-white px-4 py-3 shadow-sm">
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9d66ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12h8" />
          <path d="M12 8v8" />
        </svg>
        <span className="text-sm font-semibold text-[#0d0d0d]">{data.label}</span>
        <span className="bg-[#f0e6ff] px-1.5 py-0.5 text-[10px] font-medium text-[#7b3aed]">
          ISOLATED
        </span>
      </div>
      {data.agent_goal && (
        <p className="mt-1.5 line-clamp-2 text-xs text-[#666]">{data.agent_goal}</p>
      )}
      {tools.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {tools.map((t) => (
            <span key={t} className="bg-[#f5f5f5] px-1 py-0.5 text-[9px] text-[#999]">{t}</span>
          ))}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
