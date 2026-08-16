"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "./ui";

export function ProjectFormModal({ initial, inchargeUsers, canReassign, busy, onClose, onSave }: {
  initial?: any; inchargeUsers: { id: string; name: string; loginId: string }[]; canReassign: boolean; busy?: boolean;
  onClose: () => void; onSave: (data: { title: string; client: string; inChargeId: string; date: string }) => void;
}) {
  const [title, setTitle] = useState(initial?.title || "");
  const [client, setClient] = useState(initial?.client || "");
  const [inChargeId, setInChargeId] = useState(initial?.inChargeId || inchargeUsers[0]?.id || "");
  const [date, setDate] = useState(initial?.date ? new Date(initial.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
  const [err, setErr] = useState("");

  return (
    <Modal title={initial ? "Edit Project" : "Create New Project"} onClose={onClose}>
      {err && <div className="mb-3.5 rounded-md bg-dangerbg px-3 py-2 text-[13px] text-danger">{err}</div>}
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-steel">Project Title</label>
      <input className="mb-3.5 w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-blueprint" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Riverside Residency — Tower B" />
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-steel">Client Details</label>
      <input className="mb-3.5 w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-blueprint" value={client} onChange={(e) => setClient(e.target.value)} placeholder="e.g. Meridian Developers Pvt. Ltd." />
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-steel">Project In-Charge</label>
      <select disabled={!canReassign} className="mb-1.5 w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-blueprint disabled:bg-[#F4F5F6] disabled:text-steellight" value={inChargeId} onChange={(e) => setInChargeId(e.target.value)}>
        {inchargeUsers.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.loginId})</option>)}
      </select>
      {!canReassign && <div className="mb-3.5 text-xs text-steel">Only an admin can reassign the project in-charge.</div>}
      <label className="mb-1.5 mt-3.5 block text-xs font-semibold uppercase tracking-wide text-steel">Date</label>
      <input type="date" className="mb-5 w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-blueprint" value={date} onChange={(e) => setDate(e.target.value)} />
      <div className="flex justify-end gap-2.5">
        <button className="rounded-md border border-line px-4 py-2 text-sm font-semibold hover:bg-paper" onClick={onClose} disabled={busy}>Cancel</button>
        <button className="flex items-center gap-1.5 rounded-md bg-amber px-4 py-2 text-sm font-semibold text-[#211404] hover:bg-amberdark" disabled={busy}
          onClick={() => {
            if (!title.trim() || !client.trim() || !inChargeId) { setErr("Please fill in project title, client and in-charge."); return; }
            onSave({ title: title.trim(), client: client.trim(), inChargeId, date });
          }}>
          {busy && <Loader2 size={14} className="animate-spin" />} {initial ? "Save Changes" : "Create Project"}
        </button>
      </div>
    </Modal>
  );
}
