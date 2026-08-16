"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui";

export default function SettingsPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const toast = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  async function changePassword() {
    setErr("");
    if (!currentPassword || !newPassword || !confirmPassword) { setErr("Fill in all three fields."); return; }
    if (newPassword.length < 8) { setErr("New password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setErr("New password and confirmation don't match."); return; }

    setBusy(true);
    const res = await fetch("/api/account/password", { method: "PATCH", body: JSON.stringify({ currentPassword, newPassword }) });
    const body = await res.json();
    setBusy(false);
    if (!res.ok) { setErr(body.error || "Could not update password."); return; }
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    toast("Password updated.", "success");
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-[22px] font-bold">Settings</h1>
        <p className="mt-1 text-[13.5px] text-steel">Your account details.</p>
      </div>

      <div className="mb-5 max-w-[480px] rounded-xl border border-line bg-white p-[22px]">
        <h4 className="mb-4 text-[15px] font-bold">Account</h4>
        <div className="mb-3.5"><div className="mb-1 text-xs font-semibold uppercase tracking-wide text-steel">Name</div><div className="text-sm">{user.name}</div></div>
        <div className="mb-3.5"><div className="mb-1 text-xs font-semibold uppercase tracking-wide text-steel">User ID</div><div className="font-mono text-sm">{user.loginId}</div></div>
        <div><div className="mb-1 text-xs font-semibold uppercase tracking-wide text-steel">Role</div><div className="text-sm">{user.role === "ADMIN" ? "Administrator" : "Project In-Charge"}</div></div>
      </div>

      <div className="max-w-[480px] rounded-xl border border-line bg-white p-[22px]">
        <h4 className="mb-4 text-[15px] font-bold">Change Password</h4>
        {err && <div className="mb-3.5 rounded-md bg-dangerbg px-3 py-2 text-[13px] text-danger">{err}</div>}
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-steel">Current Password</label>
        <input type="password" className="mb-3.5 w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-blueprint" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-steel">New Password</label>
        <input type="password" className="mb-3.5 w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-blueprint" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" />
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-steel">Confirm New Password</label>
        <input type="password" className="mb-5 w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-blueprint" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        <button onClick={changePassword} disabled={busy} className="flex items-center gap-1.5 rounded-md bg-amber px-4 py-2 text-sm font-semibold text-[#211404] hover:bg-amberdark disabled:opacity-60">
          {busy && <Loader2 size={14} className="animate-spin" />} Update Password
        </button>
      </div>
    </div>
  );
}
