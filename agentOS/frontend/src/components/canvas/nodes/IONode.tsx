"use client";

import { Handle, Position, type NodeProps } from "reactflow";

interface IONodeData {
  label: string;
  direction: "input" | "output";
}

export function IONode({ data }: NodeProps<IONodeData>) {
  const isInput = data.direction === "input";

  return (
    <div className={`min-w-[160px] border-2 bg-white px-4 py-2.5 shadow-sm ${isInput ? "border-[#22c55e]" : "border-[#ef4444]"}`}>
      {!isInput && <Handle type="target" position={Position.Top} />}
      <div className="flex items-center gap-2">
        <span className={`text-xs font-bold ${isInput ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
          {isInput ? "IN" : "OUT"}
        </span>
        <span className="text-sm font-medium text-[#0d0d0d]">{data.label}</span>
      </div>
      {isInput && <Handle type="source" position={Position.Bottom} />}
    </div>
  );
}
