"use client";

import { useCallback, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type NodeChange,
  type EdgeChange,
  type Connection,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from "reactflow";
import "reactflow/dist/style.css";
import { useWorkflowStore } from "@/stores/workflowStore";
import { SkillNode } from "./nodes/SkillNode";
import { IONode } from "./nodes/IONode";
import { PlanNode } from "./nodes/PlanNode";
import { ValidateNode } from "./nodes/ValidateNode";
import { RouterNode } from "./nodes/RouterNode";
import { LoopNode } from "./nodes/LoopNode";
import { SubagentNode } from "./nodes/SubagentNode";
import type { FlowNode } from "@/types";

const nodeTypes = {
  skillNode: SkillNode,
  ioNode: IONode,
  planNode: PlanNode,
  validateNode: ValidateNode,
  routerNode: RouterNode,
  loopNode: LoopNode,
  subagentNode: SubagentNode,
};

// Palette entries: each defines the node type and default data
const PALETTE: Array<{
  type: string;
  label: string;
  color: string;
  bg: string;
  defaultData: Record<string, unknown>;
}> = [
  { type: "ioNode",       label: "I/O",        color: "#22c55e", bg: "#dcfce7", defaultData: { label: "Input", direction: "input" } },
  { type: "planNode",     label: "Plan",        color: "#f59e0b", bg: "#fef3c7", defaultData: { label: "Plan", plan_prompt: "", requires_approval: false } },
  { type: "skillNode",    label: "Skill",       color: "#9d66ff", bg: "#f0e6ff", defaultData: { skillName: "new_skill", skillType: "prompt" } },
  { type: "validateNode", label: "Validate",    color: "#22c55e", bg: "#dcfce7", defaultData: { label: "Validate", validation_criteria: "", max_retries: 3 } },
  { type: "routerNode",   label: "Router",      color: "#38bdf8", bg: "#e0f2fe", defaultData: { label: "Router", conditions: [] } },
  { type: "loopNode",     label: "Loop",        color: "#f97316", bg: "#fff7ed", defaultData: { label: "Loop", exit_condition: "", max_iterations: 5 } },
  { type: "subagentNode", label: "Sub-agent",   color: "#7b3aed", bg: "#ede9fe", defaultData: { label: "Sub-agent", agent_goal: "", tools: [], summary_format: "" } },
];

function generateId() {
  return `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function WorkflowCanvas() {
  const { nodes, edges, setNodes, setEdges } = useWorkflowStore();
  const [paletteOpen, setPaletteOpen] = useState(true);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes(applyNodeChanges(changes, nodes));
    },
    [nodes, setNodes],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges(applyEdgeChanges(changes, edges));
    },
    [edges, setEdges],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges(addEdge(connection, edges));
    },
    [edges, setEdges],
  );

  function addNode(type: string, defaultData: Record<string, unknown>) {
    // Place new node in the center-ish of the visible canvas, offset slightly per count
    const offset = nodes.length * 20;
    const newNode: FlowNode = {
      id: generateId(),
      type,
      position: { x: 200 + offset, y: 100 + offset },
      data: { ...defaultData },
    };
    setNodes([...nodes, newNode]);
  }

  return (
    <div className="flex h-full w-full">
      {/* Node palette sidebar */}
      <div className={`flex flex-col border-r border-[#e2e2e2] bg-white transition-all duration-200 ${paletteOpen ? "w-44" : "w-10"}`}>
        {/* Toggle */}
        <button
          onClick={() => setPaletteOpen((v) => !v)}
          className="flex items-center justify-between border-b border-[#e2e2e2] px-3 py-3 text-[10px] font-medium uppercase tracking-[0.5px] text-[#999] hover:bg-[#fafafa]"
        >
          {paletteOpen && <span>Add Node</span>}
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`transition-transform duration-200 ${paletteOpen ? "" : "rotate-180"}`}
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* Node buttons */}
        {paletteOpen && (
          <div className="flex flex-col gap-1 p-2">
            {PALETTE.map((entry) => (
              <button
                key={entry.type}
                onClick={() => addNode(entry.type, entry.defaultData)}
                className="flex items-center gap-2 px-2 py-2 text-left text-xs text-[#4d4d4d] transition-colors hover:bg-[#fafafa]"
                title={`Add ${entry.label} node`}
              >
                <span
                  className="flex size-5 flex-shrink-0 items-center justify-center text-[9px] font-bold"
                  style={{ backgroundColor: entry.bg, color: entry.color }}
                >
                  {entry.label.charAt(0)}
                </span>
                <span className="truncate">{entry.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* React Flow canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          deleteKeyCode="Backspace"
        >
          <Background />
          <Controls />
          <MiniMap
            nodeColor={(n) => {
              const colors: Record<string, string> = {
                skillNode: "#9d66ff",
                ioNode: "#22c55e",
                planNode: "#f59e0b",
                validateNode: "#22c55e",
                routerNode: "#38bdf8",
                loopNode: "#f97316",
                subagentNode: "#7b3aed",
              };
              return colors[n.type ?? ""] ?? "#e2e2e2";
            }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}
