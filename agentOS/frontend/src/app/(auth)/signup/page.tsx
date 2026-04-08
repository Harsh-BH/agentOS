"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  async function handleOAuth(provider: "github" | "google") {
    setError(null);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (authError) setError(authError.message);
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto flex size-16 items-center justify-center bg-[#9d66ff]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </div>
          <h1 className="mt-6 text-2xl font-bold tracking-[-0.5px] text-[#0d0d0d]">Check your email</h1>
          <p className="mt-2 text-sm text-[#4d4d4d]">
            We sent a confirmation link to <strong>{email}</strong>.
            Click it to activate your account.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block text-sm font-medium text-[#9d66ff] hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left — decorative panel */}
      <div className="relative hidden w-1/2 overflow-hidden border-r border-[#e2e2e2] bg-white lg:block">
        <div className="absolute inset-0 opacity-[0.12]" style={{
          backgroundImage: "repeating-linear-gradient(90deg, #9d66ff 0px, #9d66ff 1px, transparent 1px, transparent 90px), repeating-linear-gradient(0deg, #9d66ff 0px, #9d66ff 1px, transparent 1px, transparent 90px)",
        }} />
        <div className="absolute bottom-0 left-0 right-0 top-0 flex items-end justify-end p-[90px]">
          <div className="grid w-[360px] grid-cols-4 grid-rows-5 gap-0">
            <div className="aspect-square" />
            <div className="aspect-square bg-[#c084fc]" />
            <div className="aspect-square bg-[#9d66ff]" />
            <div className="aspect-square bg-[#7b3aed]" />
            <div className="aspect-square bg-[#e9d5ff]" />
            <div className="aspect-square" />
            <div className="aspect-square bg-[#7b3aed]" />
            <div className="aspect-square bg-[#9d66ff]" />
            <div className="aspect-square bg-[#9d66ff]" />
            <div className="aspect-square bg-[#c084fc]" />
            <div className="aspect-square" />
            <div className="aspect-square bg-[#e9d5ff]" />
            <div className="aspect-square" />
            <div className="aspect-square bg-[#9d66ff]" />
            <div className="aspect-square bg-[#c084fc]" />
            <div className="aspect-square" />
            <div className="aspect-square bg-[#7b3aed]" />
            <div className="aspect-square" />
            <div className="aspect-square bg-[#9d66ff]" />
            <div className="aspect-square bg-[#e9d5ff]" />
          </div>
        </div>
        <div className="relative z-10 flex h-full flex-col justify-between p-[90px]">
          <Link href="/" className="text-xl font-bold tracking-tight text-[#0d0d0d]">
            AgentOS
          </Link>
          <div>
            <h2 className="text-[48px] leading-[48px] tracking-[-1.28px] text-[#0d0d0d]">
              Start building<br />in minutes.
            </h2>
            <p className="mt-5 max-w-[400px] text-lg leading-[26px] text-[#4d4d4d]">
              Create your free account and design AI workflows
              on a visual canvas — powered by Claude.
            </p>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex flex-1 items-center justify-center bg-white px-8">
        <div className="w-full max-w-[380px]">
          <div className="lg:hidden">
            <Link href="/" className="text-xl font-bold tracking-tight text-[#0d0d0d]">AgentOS</Link>
            <div className="mb-8 mt-1 h-px bg-[#e2e2e2]" />
          </div>

          <h1 className="text-3xl font-bold tracking-[-0.5px] text-[#0d0d0d]">
            Create your account
          </h1>
          <p className="mt-2 text-sm tracking-[0.16px] text-[#4d4d4d]">
            Get started with AgentOS for free
          </p>

          {error && (
            <div className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={() => handleOAuth("github")}
              className="flex w-full items-center justify-center gap-3 border border-[#e2e2e2] px-4 py-3 text-sm font-medium text-[#0d0d0d] transition-colors hover:bg-[#f5f5f5]"
            >
              <GitHubIcon />
              Continue with GitHub
            </button>
            <button
              onClick={() => handleOAuth("google")}
              className="flex w-full items-center justify-center gap-3 border border-[#e2e2e2] px-4 py-3 text-sm font-medium text-[#0d0d0d] transition-colors hover:bg-[#f5f5f5]"
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#e2e2e2]" />
            <span className="text-[11px] uppercase tracking-[0.5px] text-[#999]">or</span>
            <div className="h-px flex-1 bg-[#e2e2e2]" />
          </div>

          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#0d0d0d]">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="mt-1.5 w-full border border-[#e2e2e2] px-4 py-3 text-sm text-[#0d0d0d] placeholder-[#999] outline-none transition-colors focus:border-[#9d66ff]"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#0d0d0d]">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Min. 6 characters"
                className="mt-1.5 w-full border border-[#e2e2e2] px-4 py-3 text-sm text-[#0d0d0d] placeholder-[#999] outline-none transition-colors focus:border-[#9d66ff]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-[#0d0d0d] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#333] disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#4d4d4d]">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-[#9d66ff] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
