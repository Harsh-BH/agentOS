"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProjects } from "@/hooks/useProjects";
import { post } from "@/lib/api";
import type { Project } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const { projects, loading, error, createProject, deleteProject } = useProjects();
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState<"blank" | "import">("blank");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [repoURL, setRepoURL] = useState("");
  const [creating, setCreating] = useState(false);
  const [importStatus, setImportStatus] = useState("");

  async function handleCreateBlank(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await createProject({ name: newName, description: newDesc });
      closeModal();
    } catch {
      // error via hook
    } finally {
      setCreating(false);
    }
  }

  async function handleImportRepo(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      // Step 1: Create project
      setImportStatus("Creating project...");
      const name = newName || repoURL.split("/").pop() || "Imported Project";
      const project = await createProject({ name, description: newDesc || `Imported from ${repoURL}` });

      // Step 2: Extract repo context (stages 1-5 pipeline)
      setImportStatus("Extracting context: fetching, filtering, skeletons, PageRank...");
      await post(`api/projects/${project.id}/import`, { repo_url: repoURL });

      setImportStatus("Context extracted! Redirecting...");
      closeModal();
      // Redirect to project page where user can generate CLAUDE.md or Skills & Workflows
      router.push(`/projects/${project.id}`);
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err ? (err as { message: string }).message : "Import failed";
      setImportStatus(`Error: ${msg}`);
      setCreating(false);
    }
  }

  function closeModal() {
    setShowCreate(false);
    setTab("blank");
    setNewName("");
    setNewDesc("");
    setRepoURL("");
    setImportStatus("");
    setCreating(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete project "${name}"? This will also delete all its skills and workflows.`)) return;
    await deleteProject(id);
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  return (
    <div className="h-full">
      {/* Header */}
      <div className="border-b border-[#e2e2e2] px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0d0d0d]">Projects</h1>
            <p className="mt-1 text-sm tracking-[0.16px] text-[#4d4d4d]">
              Create from scratch or import a GitHub repo for AI analysis.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-[#0d0d0d] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#333]"
          >
            <PlusIcon />
            New Project
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex border-b border-[#e2e2e2]">
        <Stat label="Projects" value={projects.length} color="#9d66ff" bg="#f0e6ff" border />
        <Stat label="With repos" value={projects.filter((p) => p.repo_url).length} color="#0ea5e9" bg="#c5ebff" />
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        {error && <div className="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm text-[#999]">Loading projects...</div>
        ) : projects.length === 0 ? (
          <EmptyState onCreateClick={() => setShowCreate(true)} />
        ) : (
          <div className="flex flex-col">
            <div className="flex items-center border-b border-[#e2e2e2] pb-3">
              <span className="flex-1 text-xs font-medium uppercase tracking-[0.5px] text-[#999]">Project</span>
              <span className="w-40 text-center text-xs font-medium uppercase tracking-[0.5px] text-[#999]">Source</span>
              <span className="w-28 text-right text-xs font-medium uppercase tracking-[0.5px] text-[#999]">Updated</span>
              <span className="w-20" />
            </div>
            {projects.map((project) => (
              <div key={project.id} className="group flex items-center border-b border-[#e2e2e2] py-4">
                <Link href={`/projects/${project.id}`} className="flex flex-1 items-center gap-4 transition-colors hover:opacity-80">
                  <div className="flex size-10 items-center justify-center bg-[#f0e6ff]">
                    <span className="text-sm font-bold text-[#9d66ff]">{project.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#0d0d0d] group-hover:text-[#7b3aed]">{project.name}</p>
                    {project.description && <p className="mt-0.5 truncate text-xs text-[#999]">{project.description}</p>}
                  </div>
                </Link>
                <div className="w-40 text-center">
                  {project.repo_url ? (
                    <span className="inline-flex items-center gap-1.5 bg-[#f0e6ff] px-2 py-0.5 text-[10px] font-medium text-[#7b3aed]">
                      <GHIcon /> GitHub
                    </span>
                  ) : (
                    <span className="text-xs text-[#ccc]">—</span>
                  )}
                </div>
                <span className="w-28 text-right text-xs text-[#999]">{timeAgo(project.updated_at)}</span>
                <div className="flex w-20 justify-end gap-2">
                  <button onClick={() => handleDelete(project.id, project.name)} className="px-2 py-1 text-xs text-[#999] hover:text-red-600">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Import modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg border border-[#e2e2e2] bg-white shadow-2xl">
            {/* Tabs */}
            <div className="flex border-b border-[#e2e2e2]">
              <button
                onClick={() => setTab("blank")}
                className={`flex-1 py-4 text-center text-sm font-medium transition-colors ${tab === "blank" ? "border-b-2 border-[#9d66ff] text-[#0d0d0d]" : "text-[#999] hover:text-[#0d0d0d]"}`}
              >
                Blank Project
              </button>
              <button
                onClick={() => setTab("import")}
                className={`flex-1 py-4 text-center text-sm font-medium transition-colors ${tab === "import" ? "border-b-2 border-[#9d66ff] text-[#0d0d0d]" : "text-[#999] hover:text-[#0d0d0d]"}`}
              >
                Import from GitHub
              </button>
            </div>

            {tab === "blank" ? (
              <form onSubmit={handleCreateBlank}>
                <div className="flex flex-col gap-5 px-6 py-5">
                  <Field label="Name" id="name" value={newName} onChange={setNewName} placeholder="My AI Pipeline" required />
                  <FieldTextarea label="Description" id="desc" value={newDesc} onChange={setNewDesc} placeholder="What will this project do?" />
                </div>
                <ModalFooter onCancel={closeModal} loading={creating} label="Create Project" />
              </form>
            ) : (
              <form onSubmit={handleImportRepo}>
                <div className="flex flex-col gap-5 px-6 py-5">
                  <Field label="GitHub URL" id="repo" value={repoURL} onChange={setRepoURL} placeholder="https://github.com/owner/repo" required />
                  <Field label="Project Name (optional)" id="name2" value={newName} onChange={setNewName} placeholder="Auto-detected from repo" />
                  <FieldTextarea label="Description (optional)" id="desc2" value={newDesc} onChange={setNewDesc} placeholder="What does this codebase do?" />
                  {importStatus && (
                    <div className={`px-4 py-3 text-sm ${importStatus.startsWith("Error") ? "border border-red-200 bg-red-50 text-red-700" : "border border-[#e2e2e2] bg-[#f0e6ff] text-[#7b3aed]"}`}>
                      {importStatus}
                    </div>
                  )}
                </div>
                <ModalFooter onCancel={closeModal} loading={creating} label="Import & Analyze" />
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Shared sub-components ---

function Stat({ label, value, color, bg, border }: { label: string; value: number; color: string; bg: string; border?: boolean }) {
  return (
    <div className={`flex flex-1 items-center gap-3 px-8 py-5 ${border ? "border-r border-[#e2e2e2]" : ""}`}>
      <div className="flex size-10 items-center justify-center" style={{ backgroundColor: bg }}>
        <span className="text-lg font-bold" style={{ color }}>{value}</span>
      </div>
      <p className="text-xs font-medium uppercase tracking-[0.5px] text-[#999]">{label}</p>
    </div>
  );
}

function Field({ label, id, value, onChange, placeholder, required }: { label: string; id: string; value: string; onChange: (v: string) => void; placeholder: string; required?: boolean }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-[#0d0d0d]">{label}</label>
      <input id={id} type="text" value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder}
        className="mt-1.5 w-full border border-[#e2e2e2] px-4 py-2.5 text-sm text-[#0d0d0d] placeholder-[#999] outline-none focus:border-[#9d66ff]" />
    </div>
  );
}

function FieldTextarea({ label, id, value, onChange, placeholder }: { label: string; id: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-[#0d0d0d]">{label}</label>
      <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} rows={2} placeholder={placeholder}
        className="mt-1.5 w-full resize-none border border-[#e2e2e2] px-4 py-2.5 text-sm text-[#0d0d0d] placeholder-[#999] outline-none focus:border-[#9d66ff]" />
    </div>
  );
}

function ModalFooter({ onCancel, loading, label }: { onCancel: () => void; loading: boolean; label: string }) {
  return (
    <div className="flex justify-end gap-3 border-t border-[#e2e2e2] px-6 py-4">
      <button type="button" onClick={onCancel} className="border border-[#e2e2e2] px-5 py-2 text-sm text-[#4d4d4d] hover:bg-[#f5f5f5]">Cancel</button>
      <button type="submit" disabled={loading} className="bg-[#0d0d0d] px-5 py-2 text-sm font-medium text-white hover:bg-[#333] disabled:opacity-50">{loading ? "Working..." : label}</button>
    </div>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="mt-6 flex flex-col items-center justify-center border border-dashed border-[#e2e2e2] py-20"
      style={{ backgroundImage: "repeating-linear-gradient(90deg, #f0e6ff 0px, #f0e6ff 1px, transparent 1px, transparent 60px), repeating-linear-gradient(0deg, #f0e6ff 0px, #f0e6ff 1px, transparent 1px, transparent 60px)" }}>
      <div className="flex size-16 items-center justify-center bg-[#9d66ff]">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
      </div>
      <h3 className="mt-5 text-lg font-bold text-[#0d0d0d]">No projects yet</h3>
      <p className="mt-2 max-w-sm text-center text-sm text-[#4d4d4d]">Create a blank project or import a GitHub repo — AI will analyze the code and generate skills & workflows.</p>
      <button onClick={onCreateClick} className="mt-6 bg-[#0d0d0d] px-6 py-3 text-sm font-medium text-white hover:bg-[#333]">Create your first project</button>
    </div>
  );
}

function PlusIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
}

function GHIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="#7b3aed"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>;
}
