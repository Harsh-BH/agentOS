import { create } from "zustand";
import type { FlowNode, FlowEdge } from "@/types";
import { get, patch } from "@/lib/api";

interface WorkflowState {
  nodes: FlowNode[];
  edges: FlowEdge[];
  workflowId: string | null;
  isDirty: boolean;
  setNodes: (nodes: FlowNode[]) => void;
  setEdges: (edges: FlowEdge[]) => void;
  loadWorkflow: (id: string) => Promise<void>;
  saveWorkflow: () => Promise<void>;
  reset: () => void;
}

export const useWorkflowStore = create<WorkflowState>((set, getState) => ({
  nodes: [],
  edges: [],
  workflowId: null,
  isDirty: false,

  setNodes: (nodes) => set({ nodes, isDirty: true }),
  setEdges: (edges) => set({ edges, isDirty: true }),

  loadWorkflow: async (id: string) => {
    const data = await get<{ nodes: FlowNode[]; edges: FlowEdge[] }>(
      `api/workflows/${id}`,
    );
    set({
      workflowId: id,
      nodes: data.nodes ?? [],
      edges: data.edges ?? [],
      isDirty: false,
    });
  },

  saveWorkflow: async () => {
    const { workflowId, nodes, edges } = getState();
    if (!workflowId) return;
    await patch(`api/workflows/${workflowId}`, { nodes, edges });
    set({ isDirty: false });
  },

  reset: () =>
    set({ nodes: [], edges: [], workflowId: null, isDirty: false }),
}));
