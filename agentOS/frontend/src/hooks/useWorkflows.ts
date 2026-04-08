"use client";

import { useState, useEffect, useCallback } from "react";
import { get, post, patch } from "@/lib/api";
import type { Workflow } from "@/types";

export function useWorkflows(projectId: string | null) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflows = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await get<Workflow[]>(`api/projects/${projectId}/workflows`);
      setWorkflows(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load workflows";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const createWorkflow = useCallback(
    async (input: { name: string }) => {
      if (!projectId) return;
      const workflow = await post<Workflow>(`api/projects/${projectId}/workflows`, input);
      setWorkflows((prev) => [workflow, ...prev]);
      return workflow;
    },
    [projectId],
  );

  const updateWorkflow = useCallback(
    async (id: string, input: { name?: string; nodes?: unknown; edges?: unknown }) => {
      const workflow = await patch<Workflow>(`api/workflows/${id}`, input);
      setWorkflows((prev) => prev.map((w) => (w.id === id ? workflow : w)));
      return workflow;
    },
    [],
  );

  return { workflows, loading, error, fetchWorkflows, createWorkflow, updateWorkflow };
}
