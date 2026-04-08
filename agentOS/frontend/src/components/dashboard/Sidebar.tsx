"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";

const navSections = [
  {
    label: "Workspace",
    items: [
      { name: "Projects", href: "/dashboard", icon: GridIcon },
      { name: "Skills", href: "/dashboard/skills", icon: ZapIcon },
      { name: "Activity", href: "/dashboard", icon: PulseIcon },
    ],
  },
  {
    label: "Account",
    items: [
      { name: "Settings", href: "/dashboard/settings", icon: GearIcon },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <aside className="flex h-screen w-[260px] shrink-0 flex-col border-r border-[#e2e2e2] bg-white">
      {/* Logo */}
      <div className="flex h-[64px] items-center border-b border-[#e2e2e2] px-5">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight text-[#0d0d0d]">
          AgentOS
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navSections.map((section) => (
          <div key={section.label} className="mb-6">
            <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-[0.5px] text-[#999]">
              {section.label}
            </p>
            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-2 py-2 text-sm transition-colors ${
                        isActive
                          ? "bg-[#f0e6ff] font-medium text-[#7b3aed]"
                          : "text-[#4d4d4d] hover:bg-[#f5f5f5] hover:text-[#0d0d0d]"
                      }`}
                    >
                      <item.icon active={isActive} />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-[#e2e2e2] px-3 py-3">
        <div className="flex items-center gap-3 px-2">
          <div className="flex size-8 items-center justify-center bg-[#9d66ff] text-xs font-bold text-white">
            {user?.email?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[#0d0d0d]">
              {user?.email ?? "Loading..."}
            </p>
          </div>
          <button
            onClick={signOut}
            className="shrink-0 p-1 text-[#999] transition-colors hover:text-[#0d0d0d]"
            title="Sign out"
          >
            <LogoutIcon />
          </button>
        </div>
      </div>
    </aside>
  );
}

/* --- Icons (matching the grid/sharp landing page aesthetic) --- */

function GridIcon({ active }: { active: boolean }) {
  const c = active ? "#7b3aed" : "#666";
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function ZapIcon({ active }: { active: boolean }) {
  const c = active ? "#7b3aed" : "#666";
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function PulseIcon({ active }: { active: boolean }) {
  const c = active ? "#7b3aed" : "#666";
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function GearIcon({ active }: { active: boolean }) {
  const c = active ? "#7b3aed" : "#666";
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
