"use client";

import { Handle, Position, type NodeProps } from "reactflow";

interface ValidateNodeData {
  label: string;
  validation_criteria: string;
  max_retries: number;
}

export function ValidateNode({ data }: NodeProps<ValidateNodeData>) {
  return (
    <div className="min-w-[200px] border-2 border-[#22c55e] bg-white px-4 py-3 shadow-sm">
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span className="text-sm font-semibold text-[#0d0d0d]">{data.label}</span>
        <span className="bg-[#f0fdf4] px-1.5 py-0.5 text-[10px] font-medium text-[#166534]">
          {data.max_retries}x
        </span>
      </div>
      {data.validation_criteria && (
        <p className="mt-1.5 line-clamp-2 text-xs text-[#666]">{data.validation_criteria}</p>
      )}
      {/* Two source handles: pass (right) and fail (left) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="pass"
        style={{ left: "70%" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="fail"
        style={{ left: "30%" }}
      />
    </div>
  );
}
