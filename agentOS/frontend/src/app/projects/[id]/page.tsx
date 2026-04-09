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
interface ClaudeMDResult { claude_md: string; }
interface SkillsResult { summary: string; skills_created: number; workflows_created: number; }

const typeBg:    Record<string, string> = { prompt: "#f0e6ff", tool: "#e0f2fe", agent: "#fff7ed" };
const typeColor: Record<string, string> = { prompt: "#9d66ff", tool: "#38bdf8", agent: "#f97316" };
const dofBg:     Record<string, string> = { low: "#fee2e2", medium: "#fef3c7", high: "#dcfce7" };
const dofColor:  Record<string, string> = { low: "#991b1b", medium: "#92400e", high: "#166534" };

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject]           = useState<Project | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const { skills, fetchSkills, createSkill, deleteSkill } = useSkills(id);
  const { workflows, fetchWorkflows, createWorkflow }     = useWorkflows(id);

  const [showImport, setShowImport]     = useState(false);
  const [importURL, setImportURL]       = useState("");
  const [importing, setImporting]       = useState(false);
  const [importStatus, setImportStatus] = useState("");

  const [generatingMD, setGeneratingMD]         = useState(false);
  const [generatingSkills, setGeneratingSkills] = useState(false);
  const [claudeMD, setClaudeMD]                 = useState<string | null>(null);
  const [genStatus, setGenStatus]               = useState("");
  const [genIsError, setGenIsError]             = useState(false);
  const genTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showAddSkill, setShowAddSkill]     = useState(false);
  const [skillName, setSkillName]           = useState("");
  const [skillType, setSkillType]           = useState<SkillType>("prompt");
  const [creatingSkill, setCreatingSkill]   = useState(false);

  const [showAddWorkflow, setShowAddWorkflow]   = useState(false);
  const [workflowName, setWorkflowName]         = useState("");
  const [creatingWorkflow, setCreatingWorkflow] = useState(false);

  const [copied, setCopied] = useState(false);

  const refreshProject = useCallback(async () => {
    try { setProject(await get<Project>(`api/projects/${id}`)); }
    catch { setProject(null); }
  }, [id]);

  useEffect(() => { refreshProject().finally(() => setLoadingProject(false)); }, [refreshProject]);

  useEffect(() => {
    if (!showImport) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") closeImportModal(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [showImport]);

  function showStatus(msg: string, isError = false) {
    if (genTimerRef.current) clearTimeout(genTimerRef.current);
    setGenStatus(msg); setGenIsError(isError);
    if (!isError) genTimerRef.current = setTimeout(() => setGenStatus(""), 4000);
  }

  function closeImportModal() { setShowImport(false); setImportURL(""); setImportStatus(""); }

  const hasContext = project?.context?.startsWith("{");

  async function handleImport(e: React.FormEvent) {
    e.preventDefault(); setImporting(true);
    setImportStatus("Fetching repo, filtering, extracting skeletons, ranking…");
    try {
      const r = await post<ImportResult>(`api/projects/${id}/import`, { repo_url: importURL });
      setImportStatus(`Done! ${r.files_scanned} files · ${r.files_ranked} ranked · Stack: ${r.stack.join(", ")}`);
      await refreshProject();
      setTimeout(closeImportModal, 2200);
    } catch (err: unknown) {
      setImportStatus(`Error: ${err instanceof Error ? err.message : "Import failed"}`);
    } finally { setImporting(false); }
  }

  async function handleGenerateClaudeMD() {
    setGeneratingMD(true); showStatus("Generating CLAUDE.md…");
    try {
      const r = await post<ClaudeMDResult>(`api/projects/${id}/generate-claude-md`, {});
      setClaudeMD(r.claude_md); showStatus("CLAUDE.md generated");
    } catch (err: unknown) {
      showStatus(`Error: ${err instanceof Error ? err.message : "Failed"}`, true);
    } finally { setGeneratingMD(false); }
  }

  async function handleGenerateSkills() {
    setGeneratingSkills(true); showStatus("Generating skills & workflows…");
    try {
      const r = await post<SkillsResult>(`api/projects/${id}/generate-skills`, {});
      showStatus(`Created ${r.skills_created} skills · ${r.workflows_created} workflows`);
      fetchSkills(); fetchWorkflows();
    } catch (err: unknown) {
      showStatus(`Error: ${err instanceof Error ? err.message : "Failed"}`, true);
    } finally { setGeneratingSkills(false); }
  }

  async function handleCreateSkill(e: React.FormEvent) {
    e.preventDefault(); setCreatingSkill(true);
    try { await createSkill({ name: skillName, type: skillType }); setShowAddSkill(false); setSkillName(""); }
    finally { setCreatingSkill(false); }
  }

  async function handleCreateWorkflow(e: React.FormEvent) {
    e.preventDefault(); setCreatingWorkflow(true);
    try { await createWorkflow({ name: workflowName }); setShowAddWorkflow(false); setWorkflowName(""); }
    finally { setCreatingWorkflow(false); }
  }

  function handleCopyMD() {
    if (!claudeMD) return;
    navigator.clipboard.writeText(claudeMD);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  /* ── Loading skeleton ── */
  if (loadingProject) return (
    <div className="flex h-full flex-col bg-[#fafafa]">
      <div className="border-b border-[#e2e2e2] bg-white px-8 py-5">
        <div className="h-3 w-24 animate-pulse bg-[#f0e6ff]" />
        <div className="mt-3 h-6 w-52 animate-pulse bg-[#e2e2e2]" />
        <div className="mt-2 h-3 w-72 animate-pulse bg-[#f5f5f5]" />
      </div>
    </div>
  );

  /* ── Not found ── */
  if (!project) return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <p className="text-sm text-[#999]">Project not found</p>
      <Link href="/dashboard" className="text-sm font-medium text-[#9d66ff] hover:underline">← Back to dashboard</Link>
    </div>
  );

  return (
    <div className="flex h-full flex-col bg-[#fafafa]">

      {/* ── Header ──────────────────────────────────── */}
      <div className="border-b border-[#e2e2e2] bg-white px-8 py-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-[#999]">
          <Link href="/dashboard" className="hover:text-[#9d66ff]">Projects</Link>
          <span>/</span>
          <span className="font-medium text-[#0d0d0d]">{project.name}</span>
        </div>

        <div className="mt-2 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-[#0d0d0d]">{project.name}</h1>
            {project.description && (
              <p className="mt-0.5 text-sm text-[#666]">{project.description}</p>
            )}
            {project.repo_url && (
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1 text-xs text-[#999]">
                  <GHIcon size={11} color="#999" />
                  {project.repo_url}
                </span>
                {hasContext && (
                  <span className="bg-[#acffd1] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#064e3b]">
                    AI Ready
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right-side actions */}
          <div className="flex shrink-0 items-center gap-2">
            {!project.repo_url && (
              <button
                onClick={() => setShowImport(true)}
                className="flex items-center gap-2 border border-[#e2e2e2] bg-white px-3 py-2 text-xs font-medium text-[#4d4d4d] transition-colors hover:bg-[#f5f5f5]"
              >
                <GHIcon size={13} color="currentColor" /> Import Repo
              </button>
            )}
            {hasContext && (
              <>
                <button onClick={handleGenerateClaudeMD} disabled={generatingMD}
                  className="flex items-center gap-1.5 border border-[#9d66ff] px-3 py-2 text-xs font-medium text-[#7b3aed] transition-colors hover:bg-[#f0e6ff] disabled:opacity-50">
                  {generatingMD ? <><Spinner />Generating…</> : "Generate CLAUDE.md"}
                </button>
                <button onClick={handleGenerateSkills} disabled={generatingSkills}
                  className="flex items-center gap-1.5 bg-[#9d66ff] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-[#7b3aed] disabled:opacity-50">
                  {generatingSkills ? <><Spinner />Generating…</> : "✦ Generate Skills & Workflows"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Status banner ───────────────────────────── */}
      {genStatus && (
        <div className={`flex items-center justify-between px-8 py-2.5 text-xs ${
          genIsError ? "bg-red-50 text-red-700" : "bg-[#f0e6ff] text-[#7b3aed]"
        }`}>
          <span>{genStatus}</span>
          <button onClick={() => setGenStatus("")} className="opacity-50 hover:opacity-100">✕</button>
        </div>
      )}

      {/* ── CLAUDE.md output ────────────────────────── */}
      {claudeMD && (
        <div className="border-b border-[#e2e2e2] bg-white px-8 py-4">
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-xs font-semibold uppercase tracking-[0.5px] text-[#0d0d0d]">Generated CLAUDE.md</h2>
            <button onClick={handleCopyMD}
              className="border border-[#e2e2e2] px-2.5 py-1 text-[10px] font-medium text-[#4d4d4d] transition-colors hover:bg-[#f5f5f5]">
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>
          <pre className="max-h-72 overflow-auto border border-[#e2e2e2] bg-[#fafafa] p-4 text-xs leading-relaxed text-[#444]">
            {claudeMD}
          </pre>
        </div>
      )}

      {/* ── Skills + Workflows ──────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Skills column */}
        <div className="flex w-1/2 flex-col border-r border-[#e2e2e2] bg-white">
          {/* Column header */}
          <div className="flex items-center justify-between border-b border-[#e2e2e2] px-6 py-3">
            <div className="flex items-center gap-2">
              <span className="flex size-5 items-center justify-center bg-[#f0e6ff]">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9d66ff" strokeWidth="2.5">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </span>
              <h2 className="text-xs font-semibold uppercase tracking-[0.5px] text-[#0d0d0d]">
                Skills
              </h2>
              <span className="bg-[#f0e6ff] px-1.5 py-0.5 text-[10px] font-bold text-[#9d66ff]">
                {skills.length}
              </span>
              {skills.length > 0 && (
                <Link href={`/projects/${id}/skills`} className="text-[10px] text-[#9d66ff] hover:underline">
                  View all →
                </Link>
              )}
            </div>
            <button
              onClick={() => { setShowAddSkill(true); setShowAddWorkflow(false); }}
              className="flex items-center gap-1 bg-[#0d0d0d] px-2.5 py-1.5 text-[10px] font-medium text-white hover:bg-[#333]"
            >
              <span className="text-[13px] leading-none">+</span> Add
            </button>
          </div>

          {/* Add skill form */}
          <div className={`overflow-hidden border-b border-[#e2e2e2] transition-all duration-200 ${showAddSkill ? "max-h-20 opacity-100" : "max-h-0 opacity-0"}`}>
            <form onSubmit={handleCreateSkill} className="flex items-center gap-2 px-6 py-3">
              <input type="text" value={skillName} onChange={(e) => setSkillName(e.target.value)}
                required placeholder="Skill name" autoFocus={showAddSkill}
                className="flex-1 border border-[#e2e2e2] px-3 py-1.5 text-xs outline-none focus:border-[#9d66ff]" />
              <select value={skillType} onChange={(e) => setSkillType(e.target.value as SkillType)}
                className="border border-[#e2e2e2] px-2 py-1.5 text-xs outline-none">
                <option value="prompt">Prompt</option>
                <option value="tool">Tool</option>
                <option value="agent">Agent</option>
              </select>
              <button type="submit" disabled={creatingSkill}
                className="flex items-center gap-1 bg-[#0d0d0d] px-3 py-1.5 text-[10px] font-medium text-white disabled:opacity-50">
                {creatingSkill ? <><Spinner />…</> : "Create"}
              </button>
              <button type="button" onClick={() => setShowAddSkill(false)} className="text-[10px] text-[#999]">✕</button>
            </form>
          </div>

          {/* Skills list */}
          <div className="flex-1 overflow-y-auto">
            {skills.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <div className="flex size-10 items-center justify-center bg-[#f0e6ff]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9d66ff" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <p className="mt-3 text-xs font-semibold text-[#0d0d0d]">No skills yet</p>
                <p className="mt-1 text-[11px] text-[#999]">Import a repo and generate, or add manually</p>
              </div>
            ) : skills.map((skill) => {
              const dof    = skill.config?.degree_of_freedom;
              const trigger = skill.config?.trigger;
              const gc     = skill.config?.gotchas?.length ?? 0;
              return (
                <div key={skill.id}
                  className="group flex items-center gap-3 border-b border-[#f0f0f0] px-6 py-3 transition-colors hover:bg-[#fafafa]">
                  <div className="flex size-7 shrink-0 items-center justify-center text-[10px] font-bold"
                    style={{ backgroundColor: typeBg[skill.type], color: typeColor[skill.type] }}>
                    {skill.type.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-semibold text-[#0d0d0d]">{skill.name}</span>
                      <span className="px-1 py-0.5 text-[9px] font-medium uppercase"
                        style={{ backgroundColor: typeBg[skill.type], color: typeColor[skill.type] }}>
                        {skill.type}
                      </span>
                      {dof && (
                        <span className="px-1 py-0.5 text-[9px] font-medium uppercase"
                          style={{ backgroundColor: dofBg[dof], color: dofColor[dof] }}>
                          {dof}
                        </span>
                      )}
                      {gc > 0 && <span className="text-[9px] text-[#bbb]">{gc} gotchas</span>}
                    </div>
                    {trigger && <p className="mt-0.5 truncate text-[11px] text-[#999]">{trigger}</p>}
                  </div>
                  <button onClick={() => deleteSkill(skill.id)}
                    className="text-[10px] text-[#ddd] opacity-0 transition-all group-hover:opacity-100 hover:text-red-500">
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Workflows column */}
        <div className="flex w-1/2 flex-col bg-white">
          {/* Column header */}
          <div className="flex items-center justify-between border-b border-[#e2e2e2] px-6 py-3">
            <div className="flex items-center gap-2">
              <span className="flex size-5 items-center justify-center bg-[#e0f2fe]">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2.5">
                  <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                </svg>
              </span>
              <h2 className="text-xs font-semibold uppercase tracking-[0.5px] text-[#0d0d0d]">
                Workflows
              </h2>
              <span className="bg-[#e0f2fe] px-1.5 py-0.5 text-[10px] font-bold text-[#0ea5e9]">
                {workflows.length}
              </span>
            </div>
            <button
              onClick={() => { setShowAddWorkflow(true); setShowAddSkill(false); }}
              className="flex items-center gap-1 bg-[#0d0d0d] px-2.5 py-1.5 text-[10px] font-medium text-white hover:bg-[#333]"
            >
              <span className="text-[13px] leading-none">+</span> Add
            </button>
          </div>

          {/* Add workflow form */}
          <div className={`overflow-hidden border-b border-[#e2e2e2] transition-all duration-200 ${showAddWorkflow ? "max-h-20 opacity-100" : "max-h-0 opacity-0"}`}>
            <form onSubmit={handleCreateWorkflow} className="flex items-center gap-2 px-6 py-3">
              <input type="text" value={workflowName} onChange={(e) => setWorkflowName(e.target.value)}
                required placeholder="Workflow name" autoFocus={showAddWorkflow}
                className="flex-1 border border-[#e2e2e2] px-3 py-1.5 text-xs outline-none focus:border-[#9d66ff]" />
              <button type="submit" disabled={creatingWorkflow}
                className="flex items-center gap-1 bg-[#0d0d0d] px-3 py-1.5 text-[10px] font-medium text-white disabled:opacity-50">
                {creatingWorkflow ? <><Spinner />…</> : "Create"}
              </button>
              <button type="button" onClick={() => setShowAddWorkflow(false)} className="text-[10px] text-[#999]">✕</button>
            </form>
          </div>

          {/* Workflows list */}
          <div className="flex-1 overflow-y-auto">
            {workflows.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <div className="flex size-10 items-center justify-center bg-[#e0f2fe]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                  </svg>
                </div>
                <p className="mt-3 text-xs font-semibold text-[#0d0d0d]">No workflows yet</p>
                <p className="mt-1 text-[11px] text-[#999]">Import a repo and generate, or add manually</p>
              </div>
            ) : workflows.map((wf) => (
              <Link key={wf.id} href={`/projects/${id}/workflows/${wf.id}`}
                className="group flex items-center gap-3 border-b border-[#f0f0f0] px-6 py-3 transition-colors hover:bg-[#f0f8ff]">
                <div className="flex size-7 shrink-0 items-center justify-center bg-[#e0f2fe] text-[10px] font-bold text-[#0ea5e9]">
                  W
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#0d0d0d] transition-colors group-hover:text-[#0369a1]">
                    {wf.name}
                  </p>
                  <p className="mt-0.5 text-[10px] text-[#bbb]">
                    v{wf.version} · {(wf.nodes ?? []).length} nodes
                  </p>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"
                  className="shrink-0 transition-colors group-hover:stroke-[#0ea5e9]">
                  <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Import modal ────────────────────────────── */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
          onClick={(e) => { if (e.target === e.currentTarget) closeImportModal(); }}>
          <form onSubmit={handleImport} className="w-full max-w-md border border-[#e2e2e2] bg-white shadow-2xl">
            <div className="border-b border-[#e2e2e2] px-6 py-4">
              <h2 className="text-base font-bold text-[#0d0d0d]">Import GitHub Repository</h2>
              <p className="mt-1 text-xs text-[#777]">
                Fetches the repo, extracts skeletons, builds a dependency graph and ranks files by PageRank. Then you generate skills or CLAUDE.md from the saved context.
              </p>
            </div>
            <div className="flex flex-col gap-4 px-6 py-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.5px] text-[#666]">GitHub URL</label>
                <input autoFocus type="text" value={importURL} required
                  onChange={(e) => setImportURL(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  className="mt-1.5 w-full border border-[#e2e2e2] px-3 py-2.5 text-sm placeholder-[#bbb] outline-none focus:border-[#9d66ff]" />
              </div>
              {importStatus && (
                <div className={`px-3 py-2.5 text-xs ${
                  importStatus.startsWith("Error")
                    ? "border border-red-200 bg-red-50 text-red-700"
                    : importStatus.startsWith("Done")
                    ? "border border-green-200 bg-green-50 text-green-700"
                    : "border border-[#e2e2e2] bg-[#f0e6ff] text-[#7b3aed]"
                }`}>
                  {importStatus}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-[#e2e2e2] px-6 py-4">
              <button type="button" onClick={closeImportModal}
                className="border border-[#e2e2e2] px-4 py-2 text-xs text-[#4d4d4d] hover:bg-[#f5f5f5]">
                Cancel
              </button>
              <button type="submit" disabled={importing}
                className="flex items-center gap-2 bg-[#0d0d0d] px-4 py-2 text-xs font-medium text-white hover:bg-[#333] disabled:opacity-50">
                {importing ? <><Spinner />Extracting…</> : "Import & Extract Context"}
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
    <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}
