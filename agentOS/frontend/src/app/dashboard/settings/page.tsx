"use client";

import { useAuth } from "@/providers/AuthProvider";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="h-full">
      <div className="border-b border-[#e2e2e2] px-8 py-6">
        <h1 className="text-2xl font-bold tracking-tight text-[#0d0d0d]">Settings</h1>
        <p className="mt-1 text-sm tracking-[0.16px] text-[#4d4d4d]">
          Manage your account and preferences.
        </p>
      </div>

      <div className="px-8 py-6">
        {/* Profile section */}
        <div className="border border-[#e2e2e2]">
          <div className="border-b border-[#e2e2e2] px-6 py-4">
            <h2 className="text-sm font-bold uppercase tracking-[0.5px] text-[#0d0d0d]">Profile</h2>
          </div>
          <div className="flex flex-col gap-5 px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center bg-[#9d66ff] text-xl font-bold text-white">
                {user?.email?.charAt(0).toUpperCase() ?? "?"}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0d0d0d]">{user?.email}</p>
                <p className="mt-0.5 text-xs text-[#999]">
                  Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* API Keys section */}
        <div className="mt-6 border border-[#e2e2e2]">
          <div className="border-b border-[#e2e2e2] px-6 py-4">
            <h2 className="text-sm font-bold uppercase tracking-[0.5px] text-[#0d0d0d]">API Keys</h2>
          </div>
          <div className="px-6 py-5">
            <p className="text-sm text-[#4d4d4d]">
              API key management is not yet available. Your workflows use Supabase auth tokens automatically.
            </p>
          </div>
        </div>

        {/* Danger zone */}
        <div className="mt-6 border border-red-200">
          <div className="border-b border-red-200 bg-red-50 px-6 py-4">
            <h2 className="text-sm font-bold uppercase tracking-[0.5px] text-red-700">Danger Zone</h2>
          </div>
          <div className="flex items-center justify-between px-6 py-5">
            <div>
              <p className="text-sm font-medium text-[#0d0d0d]">Delete account</p>
              <p className="mt-0.5 text-xs text-[#999]">Permanently delete your account and all data.</p>
            </div>
            <button className="border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
