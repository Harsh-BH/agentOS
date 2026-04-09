"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useProjects } from "@/hooks/useProjects";
import { post } from "@/lib/api";
import type { Project } from "@/types";

/* ─────────────────────────────────────────────── */
/*  Page                                           */
/* ─────────────────────────────────────────────── */

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { projects, loading, error, createProject, deleteProject } = useProjects();

  // Modal
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState<"blank" | "import">("blank");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [repoURL, setRepoURL] = useState("");
  const [creating, setCreating] = useState(false);
  const [importStatus, setImportStatus] = useState("");

  // Search
  const [search, setSearch] = useState("");

  // Inline delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Open modal when sidebar "New Project" link fires ?new=1
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setShowCreate(true);
      // Clean the query param without hard-reload
      router.replace("/dashboard");
    }
  }, [searchParams, router]);

  // Escape closes modal
  useEffect(() => {
    if (!showCreate) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeModal(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showCreate]);

  // Auto-cancel delete confirm after 3 s
  useEffect(() => {
    if (!deleteConfirm) return;
    deleteTimerRef.current = setTimeout(() => setDeleteConfirm(null), 3000);
    return () => { if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current); };
  }, [deleteConfirm]);

  /* handlers */

  async function handleCreateBlank(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await createProject({ name: newName, description: newDesc });
      closeModal();
    } finally {
      setCreating(false);
    }
  }

  async function handleImportRepo(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      setImportStatus("Creating project…");
      const name = newName || repoURL.split("/").pop() || "Imported Project";
      const project = await createProject({ name, description: newDesc || `Imported from ${repoURL}` });
      setImportStatus("Extracting context: fetching, filtering, skeletons, PageRank…");
      await post(`api/projects/${project.id}/import`, { repo_url: repoURL });
      setImportStatus("Done! Redirecting…");
      closeModal();
      router.push(`/projects/${project.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Import failed";
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

  async function handleDelete(id: string) {
    if (deleteConfirm !== id) { setDeleteConfirm(id); return; }
    setDeleteConfirm(null);
    await deleteProject(id);
  }

  /* derived */
  const filtered = search.trim()
    ? projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : projects;

  const withRepo = projects.filter((p) => !!p.repo_url).length;
  const withContext = projects.filter((p) => p.context?.startsWith("{")).length;

  return (
    <div className="flex h-full flex-col bg-[#fafafa]">

      {/* ── Top bar ───────────────────────────────── */}
      <div className="border-b border-[#e2e2e2] bg-white px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#0d0d0d]">Projects</h1>
            <p className="mt-0.5 text-xs text-[#999]">
              {projects.length} project{projects.length !== 1 ? "s" : ""}
              {withRepo > 0 && <> · {withRepo} with repo</>}
              {withContext > 0 && <> · {withContext} context-ready</>}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects…"
                className="w-52 border border-[#e2e2e2] bg-white py-2 pl-8 pr-3 text-xs text-[#0d0d0d] placeholder-[#bbb] outline-none focus:border-[#9d66ff]"
              />
            </div>

            {/* CTA */}
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-[#0d0d0d] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#333]"
            >
              <PlusIcon />
              New Project
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {error && (
          <div className="mb-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          /* Skeleton grid */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex flex-col gap-3 border border-[#e2e2e2] bg-white p-5 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="size-10 bg-[#f0e6ff]" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 w-32 bg-[#e2e2e2]" />
                    <div className="h-2 w-48 bg-[#f5f5f5]" />
                  </div>
                </div>
                <div className="mt-2 h-2 w-20 bg-[#f5f5f5]" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 && search ? (
          /* No search results */
          <div className="flex flex-col items-center py-20 text-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
            <p className="mt-4 text-sm font-medium text-[#0d0d0d]">No results for &ldquo;{search}&rdquo;</p>
            <button onClick={() => setSearch("")} className="mt-2 text-xs text-[#9d66ff] hover:underline">Clear search</button>
          </div>
        ) : projects.length === 0 ? (
          <EmptyState onCreateClick={() => setShowCreate(true)} />
        ) : (
          /* Project card grid */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                deleteConfirm={deleteConfirm}
                onDelete={handleDelete}
                onCancelDelete={() => setDeleteConfirm(null)}
              />
            ))}

            {/* "Add another" ghost card */}
            <button
              onClick={() => setShowCreate(true)}
              className="flex min-h-[140px] flex-col items-center justify-center gap-2 border border-dashed border-[#d4c5ff] bg-white text-[#bbb] transition-colors hover:border-[#9d66ff] hover:text-[#9d66ff]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span className="text-xs font-medium">New Project</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Create / Import modal ─────────────────── */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="w-full max-w-md border border-[#e2e2e2] bg-white shadow-2xl">
            {/* Tabs */}
            <div className="flex border-b border-[#e2e2e2]">
              <TabBtn active={tab === "blank"}  onClick={() => setTab("blank")}  label="Blank Project"      />
              <TabBtn active={tab === "import"} onClick={() => setTab("import")} label="Import from GitHub" />
            </div>

            {tab === "blank" ? (
              <form onSubmit={handleCreateBlank}>
                <div className="flex flex-col gap-5 px-6 py-5">
                  <Field label="Name" id="name" value={newName} onChange={setNewName} placeholder="My AI Pipeline" required autoFocus />
                  <FieldTextarea label="Description" id="desc" value={newDesc} onChange={setNewDesc} placeholder="What will this project do?" />
                </div>
                <ModalFooter onCancel={closeModal} loading={creating} label="Create Project" />
              </form>
            ) : (
              <form onSubmit={handleImportRepo}>
                <div className="flex flex-col gap-4 px-6 py-5">
                  <Field label="GitHub URL" id="repo" value={repoURL} onChange={setRepoURL} placeholder="https://github.com/owner/repo" required autoFocus />
                  <Field label="Project name (optional)" id="name2" value={newName} onChange={setNewName} placeholder="Auto-detected from repo" />
                  <FieldTextarea label="Description (optional)" id="desc2" value={newDesc} onChange={setNewDesc} placeholder="What does this codebase do?" />
                  {importStatus && (
                    <StatusBanner
                      isError={importStatus.startsWith("Error")}
                      message={importStatus}
                    />
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

/* ─────────────────────────────────────────────── */
/*  Project Card                                   */
/* ─────────────────────────────────────────────── */

function ProjectCard({
  project,
  deleteConfirm,
  onDelete,
  onCancelDelete,
}: {
  project: Project;
  deleteConfirm: string | null;
  onDelete: (id: string) => void;
  onCancelDelete: () => void;
}) {
  const hasContext = project.context?.startsWith("{");

  /* pick a consistent hue per project initial */
  const hues: Record<string, { bg: string; text: string }> = {
    A: { bg: "#f0e6ff", text: "#7b3aed" }, B: { bg: "#e0f2fe", text: "#0369a1" },
    C: { bg: "#fef3c7", text: "#92400e" }, D: { bg: "#dcfce7", text: "#166534" },
    E: { bg: "#fff1f2", text: "#9f1239" }, F: { bg: "#fef9c3", text: "#713f12" },
  };
  const letter = project.name.charAt(0).toUpperCase();
  const color = hues[letter] ?? { bg: "#f0e6ff", text: "#7b3aed" };

  const confirming = deleteConfirm === project.id;

  return (
    <div className="group relative flex flex-col border border-[#e2e2e2] bg-white transition-all duration-150 hover:border-[#c4a0ff] hover:shadow-sm">

      {/* Card body — clickable link */}
      <Link href={`/projects/${project.id}`} className="flex flex-1 flex-col p-5">

        {/* Avatar + badges row */}
        <div className="flex items-start justify-between">
          <div
            className="flex size-10 items-center justify-center text-sm font-bold"
            style={{ backgroundColor: color.bg, color: color.text }}
          >
            {letter}
          </div>

          <div className="flex items-center gap-1.5">
            {hasContext && (
              <span className="bg-[#acffd1] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#064e3b]">
                AI Ready
              </span>
            )}
            {project.repo_url && (
              <span className="flex items-center gap-1 bg-[#f0e6ff] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#7b3aed]">
                <GHIcon />
                GitHub
              </span>
            )}
          </div>
        </div>

        {/* Name */}
        <h3 className="mt-3 text-sm font-semibold leading-snug text-[#0d0d0d] transition-colors group-hover:text-[#7b3aed]">
          {project.name}
        </h3>

        {/* Description */}
        {project.description ? (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#888]">
            {project.description}
          </p>
        ) : (
          <p className="mt-1 text-xs italic text-[#ccc]">No description</p>
        )}
      </Link>

      {/* Card footer */}
      <div className="flex items-center justify-between border-t border-[#f0f0f0] px-5 py-3">
        <span className="text-[10px] text-[#bbb]">{timeAgo(project.updated_at)}</span>

        {/* Delete control */}
        {confirming ? (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[#999]">Delete?</span>
            <button
              onClick={() => onDelete(project.id)}
              className="bg-red-600 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-red-700"
            >
              Yes
            </button>
            <button
              onClick={onCancelDelete}
              className="border border-[#e2e2e2] px-2 py-0.5 text-[10px] text-[#666] hover:bg-[#f5f5f5]"
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={() => onDelete(project.id)}
            className="text-[10px] text-[#ccc] opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────── */
/*  Empty state                                    */
/* ─────────────────────────────────────────────── */

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="flex size-16 items-center justify-center bg-[#9d66ff]">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <rect x="3"  y="3"  width="7" height="7" />
          <rect x="14" y="3"  width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3"  y="14" width="7" height="7" />
        </svg>
      </div>

      <h3 className="mt-6 text-lg font-bold text-[#0d0d0d]">No projects yet</h3>
      <p className="mt-2 max-w-xs text-center text-sm text-[#777]">
        Create a blank project to start building, or import a GitHub repo and let AI generate skills &amp; workflows.
      </p>

      <div className="mt-8 flex gap-3">
        <button
          onClick={onCreateClick}
          className="bg-[#0d0d0d] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#333]"
        >
          Create project
        </button>
        <button
          onClick={onCreateClick}
          className="flex items-center gap-2 border border-[#e2e2e2] px-5 py-2.5 text-sm font-medium text-[#4d4d4d] hover:bg-[#f5f5f5]"
        >
          <GHIconLg />
          Import from GitHub
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────── */
/*  Utility sub-components                         */
/* ─────────────────────────────────────────────── */

function TabBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-3.5 text-center text-sm font-medium transition-colors ${
        active ? "border-b-2 border-[#9d66ff] text-[#0d0d0d]" : "text-[#999] hover:text-[#0d0d0d]"
      }`}
    >
      {label}
    </button>
  );
}

function Field({ label, id, value, onChange, placeholder, required, autoFocus }: {
  label: string; id: string; value: string; onChange: (v: string) => void;
  placeholder: string; required?: boolean; autoFocus?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-[0.5px] text-[#666]">{label}</label>
      <input
        id={id} type="text" value={value} required={required} autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="mt-1.5 w-full border border-[#e2e2e2] px-3 py-2.5 text-sm text-[#0d0d0d] placeholder-[#bbb] outline-none transition-colors focus:border-[#9d66ff]"
      />
    </div>
  );
}

function FieldTextarea({ label, id, value, onChange, placeholder }: {
  label: string; id: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-[0.5px] text-[#666]">{label}</label>
      <textarea
        id={id} rows={2} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="mt-1.5 w-full resize-none border border-[#e2e2e2] px-3 py-2.5 text-sm text-[#0d0d0d] placeholder-[#bbb] outline-none transition-colors focus:border-[#9d66ff]"
      />
    </div>
  );
}

function ModalFooter({ onCancel, loading, label }: { onCancel: () => void; loading: boolean; label: string }) {
  return (
    <div className="flex justify-end gap-3 border-t border-[#e2e2e2] px-6 py-4">
      <button type="button" onClick={onCancel} className="border border-[#e2e2e2] px-4 py-2 text-sm text-[#4d4d4d] hover:bg-[#f5f5f5]">
        Cancel
      </button>
      <button type="submit" disabled={loading} className="flex items-center gap-2 bg-[#0d0d0d] px-4 py-2 text-sm font-medium text-white hover:bg-[#333] disabled:opacity-50">
        {loading && <Spinner />}
        {loading ? "Working…" : label}
      </button>
    </div>
  );
}

function StatusBanner({ isError, message }: { isError: boolean; message: string }) {
  return (
    <div className={`flex items-start gap-2 px-3 py-2.5 text-xs ${
      isError ? "border border-red-200 bg-red-50 text-red-700" : "border border-[#e2e2e2] bg-[#f0e6ff] text-[#7b3aed]"
    }`}>
      {isError ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-px shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      ) : (
        <Spinner size={13} />
      )}
      <span>{message}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────── */
/*  Micro-helpers                                  */
/* ─────────────────────────────────────────────── */

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24)    return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function GHIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="#7b3aed">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function GHIconLg() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function Spinner({ size = 14 }: { size?: number }) {
  return (
    <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}
