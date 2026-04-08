"use client";

import { Handle, Position, type NodeProps } from "reactflow";

interface LoopNodeData {
  label: string;
  exit_condition: string;
  max_iterations: number;
}

export function LoopNode({ data }: NodeProps<LoopNodeData>) {
  return (
    <div className="min-w-[220px] border-2 border-[#f97316] bg-white px-4 py-3 shadow-sm">
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
        </svg>
        <span className="text-sm font-semibold text-[#0d0d0d]">{data.label}</span>
        <span className="bg-[#fff7ed] px-1.5 py-0.5 text-[10px] font-medium text-[#9a3412]">
          max {data.max_iterations}
        </span>
      </div>
      {data.exit_condition && (
        <p className="mt-1.5 line-clamp-2 text-xs text-[#666]">Exit: {data.exit_condition}</p>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
