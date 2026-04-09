"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";

const navItems = [
  { name: "Projects",  href: "/dashboard",          icon: GridIcon  },
  { name: "Skills",    href: "/dashboard/skills",   icon: ZapIcon   },
  { name: "Settings",  href: "/dashboard/settings", icon: GearIcon  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const initial = user?.email?.charAt(0).toUpperCase() ?? "?";
  const email   = user?.email ?? "";

  return (
    <aside className="flex h-screen w-[240px] shrink-0 flex-col border-r border-[#e2e2e2] bg-white">

      {/* ── Logo ─────────────────────────────────────── */}
      <div className="flex h-[60px] items-center gap-2.5 border-b border-[#e2e2e2] px-5">
        <div className="flex size-7 items-center justify-center bg-[#9d66ff]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3"  y="14" width="7" height="7" />
          </svg>
        </div>
        <Link href="/dashboard" className="text-[15px] font-bold tracking-tight text-[#0d0d0d]">
          AgentOS
        </Link>
      </div>

      {/* ── New Project shortcut ─────────────────────── */}
      <div className="border-b border-[#e2e2e2] px-4 py-3">
        <Link
          href="/dashboard?new=1"
          className="flex w-full items-center justify-center gap-2 border border-dashed border-[#c8b0ff] bg-[#f8f4ff] px-3 py-2 text-xs font-medium text-[#7b3aed] transition-colors hover:bg-[#f0e6ff]"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5"  y1="12" x2="19" y2="12" />
          </svg>
          New Project
        </Link>
      </div>

      {/* ── Nav ─────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.6px] text-[#bbb]">
          Workspace
        </p>
        <ul className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`relative flex items-center gap-2.5 px-2 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-[#f0e6ff] font-semibold text-[#7b3aed]"
                      : "font-medium text-[#555] hover:bg-[#f7f7f7] hover:text-[#0d0d0d]"
                  }`}
                >
                  {/* left-border accent on active */}
                  {isActive && (
                    <span className="absolute inset-y-0 left-0 w-0.5 bg-[#9d66ff]" />
                  )}
                  <item.icon active={isActive} />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── User footer ─────────────────────────────── */}
      <div className="border-t border-[#e2e2e2] p-3">
        <div className="flex items-center gap-2.5 px-1">
          {/* Avatar */}
          <div className="flex size-8 shrink-0 items-center justify-center bg-[#9d66ff] text-xs font-bold text-white">
            {initial}
          </div>

          {/* Email — truncated */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-[#0d0d0d]">{email}</p>
            <p className="text-[10px] text-[#999]">Free plan</p>
          </div>

          {/* Sign out */}
          <button
            onClick={signOut}
            title="Sign out"
            className="shrink-0 rounded-sm p-1 text-[#bbb] transition-colors hover:bg-[#f5f5f5] hover:text-[#0d0d0d]"
          >
            <LogoutIcon />
          </button>
        </div>
      </div>
    </aside>
  );
}

/* ── Icons ─────────────────────────────────────────────────── */

function GridIcon({ active }: { active: boolean }) {
  const c = active ? "#7b3aed" : "#888";
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2">
      <rect x="3"  y="3"  width="7" height="7" />
      <rect x="14" y="3"  width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3"  y="14" width="7" height="7" />
    </svg>
  );
}

function ZapIcon({ active }: { active: boolean }) {
  const c = active ? "#7b3aed" : "#888";
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function GearIcon({ active }: { active: boolean }) {
  const c = active ? "#7b3aed" : "#888";
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
