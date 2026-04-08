"use client";

import { useState, useEffect, useCallback } from "react";
import { get, post, patch, del } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import type { Project } from "@/types";

export function useProjects() {
  const { session, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await get<Project[]>("api/projects");
      setProjects(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load projects";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && session) {
      fetchProjects();
    } else if (!authLoading && !session) {
      setLoading(false);
    }
  }, [authLoading, session, fetchProjects]);

  const createProject = useCallback(
    async (input: { name: string; description: string }) => {
      const project = await post<Project>("api/projects", input);
      setProjects((prev) => [project, ...prev]);
      return project;
    },
    [],
  );

  const updateProject = useCallback(
    async (id: string, input: { name?: string; description?: string; context?: string }) => {
      const project = await patch<Project>(`api/projects/${id}`, input);
      setProjects((prev) => prev.map((p) => (p.id === id ? project : p)));
      return project;
    },
    [],
  );

  const deleteProject = useCallback(
    async (id: string) => {
      await del(`api/projects/${id}`);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    },
    [],
  );

  return { projects, loading, error, fetchProjects, createProject, updateProject, deleteProject };
}
