"use client";

import { Handle, Position, type NodeProps } from "reactflow";

interface RouterNodeData {
  label: string;
  conditions: Array<{ match: string; target_handle: string }>;
}

export function RouterNode({ data }: NodeProps<RouterNodeData>) {
  const conditions = data.conditions ?? [];

  return (
    <div className="min-w-[200px] border-2 border-[#38bdf8] bg-white px-4 py-3 shadow-sm">
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="18" r="3" />
          <circle cx="6" cy="6" r="3" />
          <path d="M13 6h3a2 2 0 012 2v7" />
          <line x1="6" y1="9" x2="6" y2="21" />
        </svg>
        <span className="text-sm font-semibold text-[#0d0d0d]">{data.label}</span>
      </div>
      {conditions.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {conditions.map((c, i) => (
            <span key={i} className="bg-[#e0f2fe] px-1.5 py-0.5 text-[10px] font-medium text-[#0369a1]">
              {c.match}
            </span>
          ))}
        </div>
      )}
      {/* One handle per condition */}
      {conditions.map((c, i) => (
        <Handle
          key={c.target_handle}
          type="source"
          position={Position.Bottom}
          id={c.target_handle}
          style={{ left: `${((i + 1) / (conditions.length + 1)) * 100}%` }}
        />
      ))}
      {conditions.length === 0 && (
        <Handle type="source" position={Position.Bottom} />
      )}
    </div>
  );
}
