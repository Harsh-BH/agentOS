"use client";

import { Handle, Position, type NodeProps } from "reactflow";

interface PlanNodeData {
  label: string;
  plan_prompt: string;
  requires_approval: boolean;
}

export function PlanNode({ data }: NodeProps<PlanNodeData>) {
  return (
    <div className="min-w-[200px] border-2 border-[#f59e0b] bg-white px-4 py-3 shadow-sm">
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" />
        </svg>
        <span className="text-sm font-semibold text-[#0d0d0d]">{data.label}</span>
        {data.requires_approval && (
          <span className="bg-[#fef3c7] px-1.5 py-0.5 text-[10px] font-medium text-[#92400e]">
            APPROVAL
          </span>
        )}
      </div>
      {data.plan_prompt && (
        <p className="mt-1.5 line-clamp-2 text-xs text-[#666]">{data.plan_prompt}</p>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
