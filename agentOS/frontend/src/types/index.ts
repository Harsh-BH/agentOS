// ============================================================
// Skill types
// ============================================================

export type SkillType = "prompt" | "tool" | "agent";
export type DegreeOfFreedom = "low" | "medium" | "high";

export interface SkillConfig {
  type: SkillType;
  model: string;
  trigger: string;
  system_prompt: string;
  goal: string;
  tools: string[];
  degree_of_freedom: DegreeOfFreedom;
  gotchas: string[];
  references: string[];
  input_schema: Record<string, unknown>;
  output_schema: Record<string, unknown>;
  max_tokens: number;
}

export interface Skill {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  type: SkillType;
  config: SkillConfig;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Project
// ============================================================

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string;
  context: string;
  repo_url: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Workflow types
// ============================================================

export type WorkflowNodeType =
  | "skillNode"
  | "ioNode"
  | "planNode"
  | "validateNode"
  | "routerNode"
  | "loopNode"
  | "subagentNode";

// Node data interfaces

export interface SkillNodeData {
  skillName: string;
  skillType: SkillType;
}

export interface IONodeData {
  label: string;
  direction: "input" | "output";
}

export interface PlanNodeData {
  label: string;
  plan_prompt: string;
  requires_approval: boolean;
}

export interface ValidateNodeData {
  label: string;
  validation_criteria: string;
  max_retries: number;
}

export interface RouterNodeData {
  label: string;
  conditions: Array<{ match: string; target_handle: string }>;
}

export interface LoopNodeData {
  label: string;
  exit_condition: string;
  max_iterations: number;
}

export interface SubagentNodeData {
  label: string;
  agent_goal: string;
  tools: string[];
  summary_format: string;
}

export interface ConditionalEdgeData {
  condition: string;
}

export interface FlowNode {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  type?: string;
  data?: ConditionalEdgeData;
}

export interface Workflow {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  version: number;
  created_at: string;
  updated_at: string;
}

// ============================================================
// API
// ============================================================

export interface ApiError {
  message: string;
  status: number;
  details?: unknown;
}
