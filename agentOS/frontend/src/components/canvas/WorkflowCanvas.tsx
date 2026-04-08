"use client";

import { useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type NodeChange,
  type EdgeChange,
  type Connection,
  applyNodeChanges,
  applyEdgeChanges,
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

const nodeTypes = {
  skillNode: SkillNode,
  ioNode: IONode,
  planNode: PlanNode,
  validateNode: ValidateNode,
  routerNode: RouterNode,
  loopNode: LoopNode,
  subagentNode: SubagentNode,
};

export function WorkflowCanvas() {
  const { nodes, edges, setNodes, setEdges } = useWorkflowStore();

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
    (_connection: Connection) => {
      // Will be implemented to create edges between nodes
      void _connection;
    },
    [],
  );

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
