export const dynamic = 'force-dynamic';

"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { HardHat, User, Lock, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setError("");
    if (!loginId || !password) { setError("Enter both User ID and Password."); return; }
    setBusy(true);
    const res = await signIn("credentials", { loginId, password, redirect: false });
    setBusy(false);
    if (res?.error) { setError("Invalid User ID or Password."); return; }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-wrap">
      <div className="blueprint-grid flex flex-1 basis-[46%] min-h-[420px] flex-col justify-between bg-ink p-12 text-white">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber">
            <HardHat size={18} color="#211404" />
          </div>
          <span className="font-display text-lg font-bold tracking-wide">PRAXIS</span>
        </div>
        <div>
          <div className="stamp-corners mb-5 inline-block border border-white/30 px-2.5 py-1 font-mono text-[11px] tracking-wide text-steellight">
            SITE-OPS / PROJECT CONTROL
          </div>
          <h1 className="mb-4 max-w-[460px] font-display text-[clamp(30px,4vw,44px)] font-bold leading-tight">
            Every project,<br />one set of drawings.
          </h1>
          <p className="max-w-[400px] text-[15px] leading-relaxed text-steellight">
            Track documents, media, revenue and site charges across every project — with admins and in-charges seeing exactly what they need to.
          </p>
        </div>
        <div className="flex gap-7 font-mono text-[12.5px] text-[#7C8798]">
          <span>ROLE-BASED ACCESS</span><span>·</span><span>LIVE LEDGERS</span><span>·</span><span>SITE DOCS</span>
        </div>
      </div>

      <div className="flex flex-1 basis-[54%] items-center justify-center p-8">
        <div className="w-full max-w-[380px]">
          <h2 className="mb-1.5 font-display text-2xl font-bold">Sign in</h2>
          <p className="mb-7 text-[13.5px] text-steel">Enter your ID and password to reach your dashboard.</p>

          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-steel">User ID</label>
          <div className="relative mb-4">
            <User size={15} className="absolute left-3 top-3.5 text-steellight" />
            <input
              className="w-full rounded-md border border-line bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20"
              value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder="e.g. Praxis2026"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
          </div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-steel">Password</label>
          <div className="relative mb-2.5">
            <Lock size={15} className="absolute left-3 top-3.5 text-steellight" />
            <input
              type="password"
              className="w-full rounded-md border border-line bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20"
              value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
          </div>

          {error && (
            <div className="mb-2.5 flex items-center gap-1.5 text-[13px] text-danger">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-amber py-2.5 font-semibold text-[#211404] transition hover:bg-amberdark disabled:opacity-60"
            onClick={handleLogin} disabled={busy}>
            {busy && <Loader2 size={16} className="animate-spin" />} Sign in
          </button>
        </div>
      </div>
    </div>
  );
}

