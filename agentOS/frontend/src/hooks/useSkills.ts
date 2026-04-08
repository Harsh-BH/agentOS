"use client";

import { useState, useEffect, useCallback } from "react";
import { get, post, del } from "@/lib/api";
import type { Skill, SkillType } from "@/types";

export function useSkills(projectId: string | null) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSkills = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await get<Skill[]>(`api/projects/${projectId}/skills`);
      setSkills(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load skills";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  const createSkill = useCallback(
    async (input: { name: string; type: SkillType }) => {
      if (!projectId) return;
      const skill = await post<Skill>(`api/projects/${projectId}/skills`, input);
      setSkills((prev) => [skill, ...prev]);
      return skill;
    },
    [projectId],
  );

  const deleteSkill = useCallback(
    async (id: string) => {
      await del(`api/skills/${id}`);
      setSkills((prev) => prev.filter((s) => s.id !== id));
    },
    [],
  );

  return { skills, loading, error, fetchSkills, createSkill, deleteSkill };
}
