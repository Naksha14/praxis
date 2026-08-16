"use client";
import React, { createContext, useCallback, useContext, useState } from "react";
import { X, CheckCircle2, AlertCircle, Loader2, Plus, Pencil, Trash2 } from "lucide-react";

/* ---------------- Toast system ---------------- */
type Toast = { id: string; msg: string; type: "success" | "error" | "info" };
const ToastCtx = createContext<(msg: string, type?: Toast["type"]) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((msg: string, type: Toast["type"] = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="fixed right-4 top-4 z-[200] flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className={`flex min-w-[260px] items-center gap-2.5 rounded-lg px-4 py-3 text-[13.5px] font-medium text-white shadow-lg ${t.type === "success" ? "bg-success" : t.type === "error" ? "bg-danger" : "bg-ink"}`}>
            {t.type === "success" ? <CheckCircle2 size={16} /> : t.type === "error" ? <AlertCircle size={16} /> : <Loader2 size={16} />}
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------------- Modal ---------------- */
export function Modal({ title, onClose, children, width = 520 }: { title: string; onClose: () => void; children: React.ReactNode; width?: number }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/55 p-4 backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white shadow-2xl" style={{ maxWidth: width }}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="font-display text-[17px] font-bold">{title}</h3>
          <button className="rounded-md p-1.5 text-steel hover:bg-paper" onClick={onClose}><X size={17} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, message, confirmLabel = "Delete", onConfirm, onCancel, busy }: { title: string; message: string; confirmLabel?: string; onConfirm: () => void; onCancel: () => void; busy?: boolean }) {
  return (
    <Modal title={title} onClose={onCancel} width={420}>
      <p className="mb-5 text-sm leading-relaxed text-steel">{message}</p>
      <div className="flex justify-end gap-2.5">
        <button className="rounded-md border border-line px-4 py-2 text-sm font-semibold hover:bg-paper" onClick={onCancel} disabled={busy}>Cancel</button>
        <button className="flex items-center gap-1.5 rounded-md bg-dangerbg px-4 py-2 text-sm font-semibold text-danger hover:bg-danger hover:text-white" onClick={onConfirm} disabled={busy}>
          {busy && <Loader2 size={14} className="animate-spin" />} {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

/* ---------------- Empty state ---------------- */
export function EmptyState({ icon: Icon, title, subtitle, action }: { icon: any; title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border-[1.5px] border-dashed border-line bg-white py-14 text-center">
      <div className="mx-auto mb-4 flex h-13 w-13 items-center justify-center rounded-xl bg-paper" style={{ height: 52, width: 52 }}>
        <Icon size={24} className="text-steel" />
      </div>
      <h3 className="mb-1.5 font-display text-base">{title}</h3>
      <p className="mx-auto mb-4 max-w-[340px] text-[13.5px] text-steel">{subtitle}</p>
      {action}
    </div>
  );
}

/* ---------------- Stat card ---------------- */
export function StatCard({ icon: Icon, label, value, tone = "ink" }: { icon: any; label: string; value: React.ReactNode; tone?: "ink" | "amber" | "danger" | "success" }) {
  const bg = tone === "amber" ? "bg-[#FDF3E4]" : tone === "danger" ? "bg-dangerbg" : tone === "success" ? "bg-successbg" : "bg-[#EEF1F5]";
  const fg = tone === "amber" ? "text-amberdark" : tone === "danger" ? "text-danger" : tone === "success" ? "text-success" : "text-blueprint";
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-4">
      <div className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg ${bg}`}>
        <Icon size={18} className={fg} />
      </div>
      <div className="min-w-0">
        <div className="text-[11.5px] font-semibold uppercase tracking-wide text-steel">{label}</div>
        <div className="truncate font-display font-mono text-lg font-bold">{value}</div>
      </div>
    </div>
  );
}

/* ---------------- Ledger table ---------------- */
export function fmtMoney(n: number | null | undefined) {
  if (n === null || n === undefined) return "—";
  return "₹" + Number(n).toLocaleString("en-IN");
}
export function fmtDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
export function fmtBytes(b: number) {
  if (!b) return "0 KB";
  if (b < 1024 * 1024) return (b / 1024).toFixed(0) + " KB";
  return (b / (1024 * 1024)).toFixed(1) + " MB";
}

export function fmtPercent(p: number | null) {
  if (p === null) return "—";
  if (!isFinite(p) || p >= 9999) return "999%+";
  return `${p}%`;
}

export function ProgressBar({ percent, tone = "amber" }: { percent: number | null; tone?: "amber" | "danger" | "success" }) {
  const pct = percent === null ? 0 : Math.min(isFinite(percent) ? percent : 100, 100);
  const barColor = tone === "danger" ? "bg-danger" : tone === "success" ? "bg-success" : "bg-amber";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[#EEF0F3]">
      <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Ledger({ rows, addLabel, emptyText, onAdd, onEdit, onDelete }: {
  rows: any[]; addLabel: string; emptyText: string; onAdd: () => void; onEdit: (r: any) => void; onDelete: (r: any) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
        <h4 className="text-sm font-bold">{addLabel.replace("+ Add ", "")}</h4>
        <button className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-semibold hover:bg-paper" onClick={onAdd}><Plus size={13} /> {addLabel}</button>
      </div>
      {rows.length === 0 ? (
        <div className="px-4 py-7 text-center text-[13px] text-steel">{emptyText}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-paper">
                {["Date", "Description", "Amount", "Added By", ""].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-steel">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-line">
                  <td className="whitespace-nowrap px-4 py-2.5">{fmtDate(r.date)}</td>
                  <td className="px-4 py-2.5">{r.description || "—"}</td>
                  <td className="px-4 py-2.5 font-mono font-bold">{fmtMoney(Number(r.amount))}</td>
                  <td className="px-4 py-2.5 text-steel">{r.addedBy?.name || r.addedBy}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button className="rounded p-1.5 hover:bg-paper" onClick={() => onEdit(r)}><Pencil size={13} /></button>
                    <button className="rounded p-1.5 hover:bg-paper" onClick={() => onDelete(r)}><Trash2 size={13} className="text-danger" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function EntryFormModal({ title, initial, onSave, onClose, busy }: {
  title: string; initial?: any; onSave: (data: { date: string; description: string; amount: number }) => void; onClose: () => void; busy?: boolean;
}) {
  const [date, setDate] = useState(initial?.date ? new Date(initial.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState(initial?.description || "");
  const [amount, setAmount] = useState(initial?.amount ?? "");
  const [err, setErr] = useState("");
  return (
    <Modal title={title} onClose={onClose} width={440}>
      {err && <div className="mb-3.5 rounded-md bg-dangerbg px-3 py-2 text-[13px] text-danger">{err}</div>}
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-steel">Date</label>
      <input type="date" className="mb-3.5 w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-blueprint" value={date} onChange={(e) => setDate(e.target.value)} />
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-steel">Description</label>
      <input className="mb-3.5 w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-blueprint" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Cement — 200 bags" />
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-steel">Amount (₹)</label>
      <input type="number" className="mb-5 w-full rounded-md border border-line px-3 py-2.5 text-sm outline-none focus:border-blueprint" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
      <div className="flex justify-end gap-2.5">
        <button className="rounded-md border border-line px-4 py-2 text-sm font-semibold hover:bg-paper" onClick={onClose} disabled={busy}>Cancel</button>
        <button className="flex items-center gap-1.5 rounded-md bg-amber px-4 py-2 text-sm font-semibold text-[#211404] hover:bg-amberdark" disabled={busy}
          onClick={() => { if (amount === "" || isNaN(Number(amount))) { setErr("Enter a valid amount."); return; } onSave({ date, description, amount: Number(amount) }); }}>
          {busy && <Loader2 size={14} className="animate-spin" />} Save
        </button>
      </div>
    </Modal>
  );
}
