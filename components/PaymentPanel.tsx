"use client";
import { useState } from "react";
import { IndianRupee, Pencil, Trash2, AlertTriangle, CheckCircle2, Loader2, History } from "lucide-react";
import { Modal, ConfirmDialog, StatCard, ProgressBar, fmtMoney, fmtPercent, fmtDate, useToast } from "./ui";
import { PAYMENT_STATUS_LABEL, PaymentStatus } from "@/lib/shared";

const STATUS_TONE: Record<PaymentStatus, "ink" | "amber" | "danger" | "success"> = {
  no_amount: "ink",
  within: "success",
  fully_used: "amber",
  over: "danger",
  completed_saved: "success",
  completed_over: "danger",
};

export function PaymentPanel({ projectId, isAdmin, payment, paymentHistory, expenseSummary, onChanged }: {
  projectId: string;
  isAdmin: boolean;
  payment: { amount: any; recordedBy: { name: string }; updatedAt: string } | null;
  paymentHistory: { id: string; action: string; previousAmount: any; newAmount: any; performedBy: { name: string }; createdAt: string }[];
  expenseSummary: { amountPaid: number | null; totalExpenses: number; remaining: number | null; extraCost: number; usagePercent: number | null; savings: number | null; status: PaymentStatus };
  onChanged: () => void;
}) {
  const toast = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [amountInput, setAmountInput] = useState(payment ? String(payment.amount) : "");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const s = expenseSummary;
  const tone = STATUS_TONE[s.status];

  async function save() {
    if (amountInput === "" || isNaN(Number(amountInput)) || Number(amountInput) < 0) {
      setErr("Enter a valid, non-negative amount.");
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/projects/${projectId}/payment`, { method: "POST", body: JSON.stringify({ amount: Number(amountInput) }) });
    const body = await res.json();
    setBusy(false);
    if (!res.ok) { toast(body.error || "Could not save the amount.", "error"); return; }
    toast(payment ? "Amount updated." : "Amount saved.", "success");
    setEditOpen(false);
    onChanged();
  }

  async function remove() {
    setBusy(true);
    const res = await fetch(`/api/projects/${projectId}/payment`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) { const b = await res.json(); toast(b.error || "Could not remove the amount.", "error"); return; }
    toast("Amount removed.", "success");
    setDeleteOpen(false);
    onChanged();
  }

  const warning =
    s.amountPaid !== null && s.usagePercent !== null
      ? s.usagePercent >= 100
        ? { icon: "🚨", text: "Project has exceeded the amount paid." }
        : s.usagePercent >= 90
        ? { icon: "⚠️", text: "Amount is almost fully used." }
        : s.usagePercent >= 80
        ? { icon: "⚠️", text: "80% of the allocated amount has been used." }
        : null
      : null;

  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-sm font-bold">Payment &amp; Expense Summary</h4>
        {isAdmin && payment && (
          <div className="flex gap-1.5">
            <button onClick={() => { setAmountInput(String(payment.amount)); setErr(""); setEditOpen(true); }} className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-[12.5px] font-semibold hover:bg-paper"><Pencil size={13} /> Edit</button>
            <button onClick={() => setDeleteOpen(true)} className="flex items-center gap-1.5 rounded-md bg-dangerbg px-2.5 py-1.5 text-[12.5px] font-semibold text-danger hover:bg-danger hover:text-white"><Trash2 size={13} /> Delete</button>
          </div>
        )}
      </div>

      {s.amountPaid === null ? (
        <div className="flex flex-col items-start gap-3 rounded-lg bg-paper p-4">
          <div>
            <div className="text-[11.5px] font-semibold uppercase tracking-wide text-steel">Amount Paid by Admin</div>
            <div className="mt-0.5 font-mono text-lg font-bold text-steel">Not Added</div>
          </div>
          {isAdmin ? (
            <button onClick={() => { setAmountInput(""); setErr(""); setEditOpen(true); }} className="flex items-center gap-1.5 rounded-md bg-amber px-3.5 py-2 text-[13px] font-semibold text-[#211404] hover:bg-amberdark">
              <IndianRupee size={14} /> Add Amount Paid
            </button>
          ) : (
            <p className="text-[12.5px] text-steel">The admin hasn't recorded a payment amount for this project yet.</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={IndianRupee} label="Amount Paid" value={fmtMoney(s.amountPaid)} tone="amber" />
            <StatCard icon={IndianRupee} label="Total Expenses" value={fmtMoney(s.totalExpenses)} />
            {s.extraCost > 0 ? (
              <StatCard icon={AlertTriangle} label="Extra Cost" value={fmtMoney(s.extraCost)} tone="danger" />
            ) : (
              <StatCard icon={CheckCircle2} label={s.savings !== null ? "Saved" : "Remaining"} value={fmtMoney(s.savings !== null ? s.savings : s.remaining)} tone="success" />
            )}
            <StatCard icon={CheckCircle2} label="Status" value={PAYMENT_STATUS_LABEL[s.status]} tone={tone} />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between text-[12.5px]">
              <span className="font-semibold text-steel">Budget Usage</span>
              <span className="font-mono font-bold">{fmtPercent(s.usagePercent)}</span>
            </div>
            <ProgressBar percent={s.usagePercent} tone={s.status === "over" || s.status === "completed_over" ? "danger" : s.status === "fully_used" ? "amber" : "success"} />
          </div>

          {warning && (
            <div className={`flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-[13px] font-medium ${s.usagePercent! >= 100 ? "bg-dangerbg text-danger" : "bg-[#FDF3E4] text-amberdark"}`}>
              <span>{warning.icon}</span> {warning.text}
            </div>
          )}

          {isAdmin && paymentHistory.length > 0 && (
            <div>
              <button onClick={() => setHistoryOpen(true)} className="flex items-center gap-1.5 text-[12.5px] font-semibold text-steel hover:text-ink">
                <History size={13} /> View amount history
              </button>
            </div>
          )}
        </div>
      )}

      {editOpen && (
        <Modal title={payment ? "Edit Amount Paid" : "Add Amount Paid"} onClose={() => setEditOpen(false)} width={400}>
          {err && <div className="mb-3.5 rounded-md bg-dangerbg px-3 py-2 text-[13px] text-danger">{err}</div>}
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-steel">Amount Paid to Project In-Charge (₹)</label>
          <input type="number" min={0} autoFocus className="mb-5 w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-blueprint"
            value={amountInput} onChange={(e) => setAmountInput(e.target.value)} placeholder="0" />
          <div className="flex justify-end gap-2.5">
            <button className="rounded-md border border-line px-4 py-2 text-sm font-semibold hover:bg-paper" onClick={() => setEditOpen(false)} disabled={busy}>Cancel</button>
            <button className="flex items-center gap-1.5 rounded-md bg-amber px-4 py-2 text-sm font-semibold text-[#211404] hover:bg-amberdark" onClick={save} disabled={busy}>
              {busy && <Loader2 size={14} className="animate-spin" />} Save Amount
            </button>
          </div>
        </Modal>
      )}

      {deleteOpen && (
        <ConfirmDialog title="Remove the amount paid?" confirmLabel="Delete Amount" busy={busy}
          message="Are you sure you want to remove the amount paid to this Project In-Charge? This will remove the current payment amount from the project — expense records are not affected."
          onCancel={() => setDeleteOpen(false)} onConfirm={remove} />
      )}

      {historyOpen && (
        <Modal title="Amount History" onClose={() => setHistoryOpen(false)} width={480}>
          <div className="flex flex-col gap-3">
            {paymentHistory.map((h) => (
              <div key={h.id} className="rounded-lg border border-line p-3 text-[13px]">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-semibold capitalize">{h.performedBy.name} {h.action} the amount</span>
                  <span className="text-[11.5px] text-steel">{fmtDate(h.createdAt)}</span>
                </div>
                <div className="text-steel">
                  {h.previousAmount !== null && <>Previous: <span className="font-mono">{fmtMoney(Number(h.previousAmount))}</span> </>}
                  {h.newAmount !== null && <> New: <span className="font-mono font-semibold text-ink">{fmtMoney(Number(h.newAmount))}</span></>}
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
