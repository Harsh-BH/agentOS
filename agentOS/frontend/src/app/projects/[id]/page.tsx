"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { get, post } from "@/lib/api";
import { useSkills } from "@/hooks/useSkills";
import { useWorkflows } from "@/hooks/useWorkflows";
import type { Project, SkillType } from "@/types";

interface ImportResult {
  files_scanned: number;
  files_ranked: number;
  stack: string[];
  tokens_used: number;
}

interface ClaudeMDResult {
  claude_md: string;
}

interface SkillsResult {
  summary: string;
  skills_created: number;
  workflows_created: number;
}

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const { skills, fetchSkills, createSkill, deleteSkill } = useSkills(id);
  const { workflows, fetchWorkflows, createWorkflow } = useWorkflows(id);

  // Import
  const [showImport, setShowImport] = useState(false);
  const [importURL, setImportURL] = useState("");
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState("");

  // Generation
  const [generatingMD, setGeneratingMD] = useState(false);
  const [generatingSkills, setGeneratingSkills] = useState(false);
  const [claudeMD, setClaudeMD] = useState<string | null>(null);
  const [genStatus, setGenStatus] = useState("");
  const [genIsError, setGenIsError] = useState(false);
  const genStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Skill creation
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [skillName, setSkillName] = useState("");
  const [skillType, setSkillType] = useState<SkillType>("prompt");
  const [creatingSkill, setCreatingSkill] = useState(false);

  // Workflow creation
  const [showAddWorkflow, setShowAddWorkflow] = useState(false);
  const [workflowName, setWorkflowName] = useState("");
  const [creatingWorkflow, setCreatingWorkflow] = useState(false);

  // Copied state for CLAUDE.md copy button
  const [copied, setCopied] = useState(false);

  const refreshProject = useCallback(async () => {
    try {
      const p = await get<Project>(`api/projects/${id}`);
      setProject(p);
    } catch {
      setProject(null);
    }
  }, [id]);

  useEffect(() => {
    refreshProject().finally(() => setLoadingProject(false));
  }, [refreshProject]);

  // Escape key closes import modal
  useEffect(() => {
    if (!showImport) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeImportModal();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [showImport]);

  // Auto-dismiss success genStatus after 4s
  function showGenStatus(msg: string, isError = false) {
    if (genStatusTimerRef.current) clearTimeout(genStatusTimerRef.current);
    setGenStatus(msg);
    setGenIsError(isError);
    if (!isError) {
      genStatusTimerRef.current = setTimeout(() => setGenStatus(""), 4000);
    }
  }

  function closeImportModal() {
    setShowImport(false);
    setImportURL("");
    setImportStatus("");
  }

  const hasContext = project?.context && project.context.startsWith("{");

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    setImporting(true);
    setImportStatus("Fetching repo, filtering, extracting skeletons, ranking by PageRank...");
    try {
      const result = await post<ImportResult>(`api/projects/${id}/import`, { repo_url: importURL });
      setImportStatus(`Context extracted: ${result.files_scanned} files scanned, ${result.files_ranked} ranked, ~${result.tokens_used} tokens. Stack: ${result.stack.join(", ")}`);
      await refreshProject();
      setTimeout(() => closeImportModal(), 2000);
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err ? (err as { message: string }).message : "Import failed";
      setImportStatus(`Error: ${msg}`);
    } finally {
      setImporting(false);
    }
  }

  async function handleGenerateClaudeMD() {
    setGeneratingMD(true);
    showGenStatus("Generating CLAUDE.md from saved context...");
    try {
      const result = await post<ClaudeMDResult>(`api/projects/${id}/generate-claude-md`, {});
      setClaudeMD(result.claude_md);
      showGenStatus("CLAUDE.md generated successfully");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err ? (err as { message: string }).message : "Generation failed";
      showGenStatus(`Error: ${msg}`, true);
    } finally {
      setGeneratingMD(false);
    }
  }

  async function handleGenerateSkills() {
    setGeneratingSkills(true);
    showGenStatus("Generating skills & workflows from saved context...");
    try {
      const result = await post<SkillsResult>(`api/projects/${id}/generate-skills`, {});
      showGenStatus(`Created ${result.skills_created} skills and ${result.workflows_created} workflows`);
      fetchSkills();
      fetchWorkflows();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err ? (err as { message: string }).message : "Generation failed";
      showGenStatus(`Error: ${msg}`, true);
    } finally {
      setGeneratingSkills(false);
    }
  }

  async function handleCreateSkill(e: React.FormEvent) {
    e.preventDefault();
    setCreatingSkill(true);
    try {
      await createSkill({ name: skillName, type: skillType });
      setShowAddSkill(false);
      setSkillName("");
    } finally {
      setCreatingSkill(false);
    }
  }

  async function handleCreateWorkflow(e: React.FormEvent) {
    e.preventDefault();
    setCreatingWorkflow(true);
    try {
      await createWorkflow({ name: workflowName });
      setShowAddWorkflow(false);
      setWorkflowName("");
    } finally {
      setCreatingWorkflow(false);
    }
  }

  function handleCopyMD() {
    if (!claudeMD) return;
    navigator.clipboard.writeText(claudeMD);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loadingProject) {
    return (
      <div className="min-h-screen bg-white">
        <div className="border-b border-[#e2e2e2] px-8 py-5">
          <div className="h-3 w-20 animate-pulse bg-[#f0e6ff]" />
          <div className="mt-4 h-6 w-48 animate-pulse bg-[#e2e2e2]" />
          <div className="mt-2 h-3 w-64 animate-pulse bg-[#f5f5f5]" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-sm text-[#999]">Project not found</p>
        <Link href="/dashboard" className="text-sm font-medium text-[#9d66ff] hover:underline">Back to dashboard</Link>
      </div>
    );
  }

  const typeBg: Record<string, string> = { prompt: "#f0e6ff", tool: "#e0f2fe", agent: "#fff7ed" };
  const typeColor: Record<string, string> = { prompt: "#9d66ff", tool: "#38bdf8", agent: "#f97316" };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-[#e2e2e2] px-8 py-5">
        <Link href="/dashboard" className="text-xs font-medium text-[#9d66ff] hover:underline">&larr; Back to projects</Link>
        <div className="mt-2 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0d0d0d]">{project.name}</h1>
            {project.description && <p className="mt-1 text-sm text-[#4d4d4d]">{project.description}</p>}
            {project.repo_url && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-[#999]">
                <GHIcon size={12} color="#999" />
                {project.repo_url}
                {hasContext && <span className="ml-2 bg-[#acffd1] px-1.5 py-0.5 text-[10px] font-medium text-[#001612]">CONTEXT READY</span>}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!project.repo_url && (
              <button onClick={() => setShowImport(true)} className="flex items-center gap-2 border border-[#e2e2e2] px-4 py-2 text-sm font-medium text-[#0d0d0d] hover:bg-[#f5f5f5]">
                <GHIcon size={14} color="currentColor" />
                Import Repo
              </button>
            )}
            {hasContext && (
              <>
                <button
                  onClick={handleGenerateClaudeMD}
                  disabled={generatingMD}
                  className="flex items-center gap-2 bg-[#9d66ff] px-4 py-2 text-sm font-medium text-white hover:bg-[#7b3aed] disabled:opacity-50"
                >
                  {generatingMD && <Spinner />}
                  {generatingMD ? "Generating..." : "Generate CLAUDE.md"}
                </button>
                <button
                  onClick={handleGenerateSkills}
                  disabled={generatingSkills}
                  className="flex items-center gap-2 bg-[#0d0d0d] px-4 py-2 text-sm font-medium text-white hover:bg-[#333] disabled:opacity-50"
                >
                  {generatingSkills && <Spinner />}
                  {generatingSkills ? "Generating..." : "Generate Skills & Workflows"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Status bar */}
      {genStatus && (
        <div className={`flex items-center justify-between border-b border-[#e2e2e2] px-8 py-3 text-sm transition-all ${genIsError ? "bg-red-50 text-red-700" : "bg-[#f0e6ff] text-[#7b3aed]"}`}>
          <span>{genStatus}</span>
          <button onClick={() => setGenStatus("")} className="ml-4 text-xs opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* CLAUDE.md output */}
      {claudeMD && (
        <div className="border-b border-[#e2e2e2] px-8 py-4">
          <div className="flex items-center justify-between pb-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.5px] text-[#0d0d0d]">Generated CLAUDE.md</h2>
            <button
              onClick={handleCopyMD}
              className="border border-[#e2e2e2] px-3 py-1 text-xs text-[#4d4d4d] transition-colors hover:bg-[#f5f5f5]"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="max-h-[400px] overflow-auto border border-[#e2e2e2] bg-[#fafafa] p-4 text-xs leading-relaxed text-[#333]">
            {claudeMD}
          </pre>
        </div>
      )}

      {/* Skills + Workflows columns */}
      <div className="flex">
        {/* Skills */}
        <div className="flex-1 border-r border-[#e2e2e2]">
          <div className="flex items-center justify-between border-b border-[#e2e2e2] px-8 py-4">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-bold uppercase tracking-[0.5px] text-[#0d0d0d]">Skills ({skills.length})</h2>
              {skills.length > 0 && <Link href={`/projects/${id}/skills`} className="text-[10px] font-medium text-[#9d66ff] hover:underline">View all</Link>}
            </div>
            <button
              onClick={() => { setShowAddSkill(true); setShowAddWorkflow(false); }}
              className="bg-[#0d0d0d] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#333]"
            >
              + Add Skill
            </button>
          </div>

          {/* Add skill inline form */}
          <div className={`overflow-hidden border-b border-[#e2e2e2] transition-all duration-200 ${showAddSkill ? "max-h-24 opacity-100" : "max-h-0 opacity-0"}`}>
            <form onSubmit={handleCreateSkill} className="px-8 py-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  required
                  placeholder="Skill name"
                  className="flex-1 border border-[#e2e2e2] px-3 py-2 text-sm outline-none focus:border-[#9d66ff]"
                  autoFocus={showAddSkill}
                />
                <select
                  value={skillType}
                  onChange={(e) => setSkillType(e.target.value as SkillType)}
                  className="border border-[#e2e2e2] px-3 py-2 text-sm outline-none"
                >
                  <option value="prompt">Prompt</option>
                  <option value="tool">Tool</option>
                  <option value="agent">Agent</option>
                </select>
                <button
                  type="submit"
                  disabled={creatingSkill}
                  className="flex items-center gap-1.5 bg-[#0d0d0d] px-4 py-2 text-xs font-medium text-white hover:bg-[#333] disabled:opacity-50"
                >
                  {creatingSkill && <Spinner />}
                  {creatingSkill ? "Creating..." : "Create"}
                </button>
                <button type="button" onClick={() => setShowAddSkill(false)} className="px-2 text-xs text-[#999]">Cancel</button>
              </div>
            </form>
          </div>

          <div className="px-8">
            {skills.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="flex size-10 items-center justify-center bg-[#f0e6ff]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9d66ff" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" /></svg>
                </div>
                <p className="mt-3 text-sm font-medium text-[#0d0d0d]">No skills yet</p>
                <p className="mt-1 text-xs text-[#999]">Import a repo and generate, or add manually</p>
              </div>
            ) : skills.map((skill) => {
              const dof = skill.config?.degree_of_freedom;
              const trigger = skill.config?.trigger;
              const gotchaCount = skill.config?.gotchas?.length ?? 0;
              const dofBgMap: Record<string, string> = { low: "#fee2e2", medium: "#fef3c7", high: "#dcfce7" };
              const dofColorMap: Record<string, string> = { low: "#991b1b", medium: "#92400e", high: "#166534" };
              return (
                <div key={skill.id} className="flex items-center justify-between border-b border-[#e2e2e2] py-3 transition-colors hover:bg-[#fafafa]">
                  <div className="flex items-center gap-3">
                    <div className="flex size-7 items-center justify-center" style={{ backgroundColor: typeBg[skill.type] }}>
                      <span className="text-xs font-bold" style={{ color: typeColor[skill.type] }}>{skill.type.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#0d0d0d]">{skill.name}</span>
                        <span className="px-1.5 py-0.5 text-[10px] font-medium uppercase" style={{ backgroundColor: typeBg[skill.type], color: typeColor[skill.type] }}>{skill.type}</span>
                        {dof && <span className="px-1.5 py-0.5 text-[10px] font-medium uppercase" style={{ backgroundColor: dofBgMap[dof], color: dofColorMap[dof] }}>{dof}</span>}
                        {gotchaCount > 0 && <span className="text-[10px] text-[#999]">{gotchaCount} gotchas</span>}
                      </div>
                      {trigger && <p className="mt-0.5 truncate text-xs text-[#999]">{trigger}</p>}
                    </div>
                  </div>
                  <button onClick={() => deleteSkill(skill.id)} className="text-xs text-[#ccc] hover:text-red-600 transition-colors">Delete</button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Workflows */}
        <div className="flex-1">
          <div className="flex items-center justify-between border-b border-[#e2e2e2] px-8 py-4">
            <h2 className="text-sm font-bold uppercase tracking-[0.5px] text-[#0d0d0d]">Workflows ({workflows.length})</h2>
            <button
              onClick={() => { setShowAddWorkflow(true); setShowAddSkill(false); }}
              className="bg-[#0d0d0d] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#333]"
            >
              + Add Workflow
            </button>
          </div>

          {/* Add workflow inline form */}
          <div className={`overflow-hidden border-b border-[#e2e2e2] transition-all duration-200 ${showAddWorkflow ? "max-h-24 opacity-100" : "max-h-0 opacity-0"}`}>
            <form onSubmit={handleCreateWorkflow} className="px-8 py-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  required
                  placeholder="Workflow name"
                  className="flex-1 border border-[#e2e2e2] px-3 py-2 text-sm outline-none focus:border-[#9d66ff]"
                  autoFocus={showAddWorkflow}
                />
                <button
                  type="submit"
                  disabled={creatingWorkflow}
                  className="flex items-center gap-1.5 bg-[#0d0d0d] px-4 py-2 text-xs font-medium text-white hover:bg-[#333] disabled:opacity-50"
                >
                  {creatingWorkflow && <Spinner />}
                  {creatingWorkflow ? "Creating..." : "Create"}
                </button>
                <button type="button" onClick={() => setShowAddWorkflow(false)} className="px-2 text-xs text-[#999]">Cancel</button>
              </div>
            </form>
          </div>

          <div className="px-8">
            {workflows.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="flex size-10 items-center justify-center bg-[#c5ebff]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                </div>
                <p className="mt-3 text-sm font-medium text-[#0d0d0d]">No workflows yet</p>
                <p className="mt-1 text-xs text-[#999]">Import a repo and generate, or add manually</p>
              </div>
            ) : workflows.map((wf) => (
              <Link key={wf.id} href={`/projects/${id}/workflows/${wf.id}`} className="group flex items-center justify-between border-b border-[#e2e2e2] py-3 transition-colors hover:bg-[#fafafa]">
                <div className="flex items-center gap-3">
                  <div className="flex size-7 items-center justify-center bg-[#c5ebff]"><span className="text-xs font-bold text-[#0ea5e9]">W</span></div>
                  <span className="text-sm font-medium text-[#0d0d0d] transition-colors group-hover:text-[#7b3aed]">{wf.name}</span>
                  <span className="text-[10px] text-[#999]">v{wf.version}</span>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" className="transition-colors group-hover:stroke-[#7b3aed]"><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Import modal */}
      {showImport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => { if (e.target === e.currentTarget) closeImportModal(); }}
        >
          <form onSubmit={handleImport} className="w-full max-w-lg border border-[#e2e2e2] bg-white shadow-2xl">
            <div className="border-b border-[#e2e2e2] px-6 py-5">
              <h2 className="text-lg font-bold text-[#0d0d0d]">Import GitHub Repository</h2>
              <p className="mt-1 text-sm text-[#4d4d4d]">
                Extracts structured context from the repo (skeletons, dependency graph, PageRank ranking).
                Then you choose what to generate from it.
              </p>
            </div>
            <div className="flex flex-col gap-4 px-6 py-5">
              <div>
                <label htmlFor="import-url" className="block text-sm font-medium text-[#0d0d0d]">GitHub URL</label>
                <input
                  id="import-url"
                  type="text"
                  value={importURL}
                  onChange={(e) => setImportURL(e.target.value)}
                  required
                  placeholder="https://github.com/owner/repo"
                  className="mt-1.5 w-full border border-[#e2e2e2] px-4 py-2.5 text-sm text-[#0d0d0d] placeholder-[#999] outline-none focus:border-[#9d66ff]"
                  autoFocus
                />
              </div>
              {importStatus && (
                <div className={`px-4 py-3 text-sm ${importStatus.startsWith("Error") ? "border border-red-200 bg-red-50 text-red-700" : importStatus.startsWith("Context") ? "border border-green-200 bg-green-50 text-green-700" : "border border-[#e2e2e2] bg-[#f0e6ff] text-[#7b3aed]"}`}>
                  {importStatus}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 border-t border-[#e2e2e2] px-6 py-4">
              <button
                type="button"
                onClick={closeImportModal}
                className="border border-[#e2e2e2] px-5 py-2 text-sm text-[#4d4d4d] hover:bg-[#f5f5f5]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={importing}
                className="flex items-center gap-2 bg-[#0d0d0d] px-5 py-2 text-sm font-medium text-white hover:bg-[#333] disabled:opacity-50"
              >
                {importing && <Spinner />}
                {importing ? "Extracting context..." : "Import & Extract Context"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function GHIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}
