"use client";
import Link from "next/link";
import { Building2, FileText, Image as ImageIcon, Film, Pencil, Trash2, Eye, CheckCircle2, AlertTriangle } from "lucide-react";
import { fmtMoney, fmtDate } from "./ui";
import { PAYMENT_STATUS_LABEL } from "@/lib/shared";

export function ProjectCard({ p, role, onEdit, onDelete }: { p: any; role: string; onEdit: () => void; onDelete: () => void }) {
  const s = p.expenseSummary;
  const overBudget = s && (s.status === "over" || s.status === "completed_over");

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-white p-4.5 p-[18px] transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0">
          <h3 className="truncate font-display text-base font-bold">{p.title}</h3>
          <div className="flex items-center gap-1.5 text-[12.5px] text-steel"><Building2 size={12} />{p.client}</div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${p.status === "completed" ? "bg-[#EEF0F3] text-steel" : "bg-successbg text-success"}`}>
          {p.status === "completed" ? "Completed" : "Active"}
        </span>
      </div>

      <div className="stamp-corners inline-block self-start border border-line bg-white px-2.5 py-0.5 font-mono text-[10.5px] text-steel">ID {p.code}</div>

      <div className="grid grid-cols-2 gap-2 text-[12.5px] text-steel">
        <div><span className="text-steellight">In-Charge</span><div className="font-semibold text-ink">{p.inChargeName}</div></div>
        <div><span className="text-steellight">Date</span><div className="font-semibold text-ink">{fmtDate(p.date)}</div></div>
      </div>

      <div className="flex gap-3.5 border-t border-line pt-2.5 text-xs text-steel">
        <span className="flex items-center gap-1"><FileText size={12} /> {p.docsCount || 0} docs</span>
        <span className="flex items-center gap-1"><ImageIcon size={12} /> {p.photosCount || 0} photos</span>
        <span className="flex items-center gap-1"><Film size={12} /> {p.videosCount || 0} videos</span>
      </div>

      {s && s.amountPaid !== null && (
        <div className="rounded-lg bg-paper p-2.5 text-[12.5px]">
          <div className="grid grid-cols-2 gap-2">
            <div><span className="text-steel">Amount Paid by Admin</span><div className="font-mono font-bold text-ink">{fmtMoney(s.amountPaid)}</div></div>
            <div><span className="text-steel">Total Expenses</span><div className="font-mono font-bold text-ink">{fmtMoney(s.totalExpenses)}</div></div>
          </div>
          <div className="mt-1.5 flex items-center justify-between border-t border-line pt-1.5">
            <span className="text-steel">{overBudget ? "Extra Cost" : s.savings !== null ? "Saved" : "Remaining"}</span>
            <span className={`font-mono font-bold ${overBudget ? "text-danger" : "text-success"}`}>{fmtMoney(overBudget ? s.extraCost : s.savings !== null ? s.savings : s.remaining)}</span>
          </div>
          <div className={`mt-1.5 flex items-center gap-1.5 text-[11.5px] font-semibold ${overBudget ? "text-danger" : "text-success"}`}>
            {overBudget ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />} {PAYMENT_STATUS_LABEL[s.status as keyof typeof PAYMENT_STATUS_LABEL]}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 rounded-lg bg-paper p-2.5 text-[12.5px]">
        <div><span className="text-steel">Net Revenue</span><div className={`font-mono font-bold ${p.netRevenue < 0 ? "text-danger" : "text-ink"}`}>{fmtMoney(p.netRevenue)}</div></div>
        <div><span className="text-steel">Net Amount</span><div className={`font-mono font-bold ${p.netAmount < 0 ? "text-danger" : "text-ink"}`}>{fmtMoney(p.netAmount)}</div></div>
      </div>

      <div className="mt-0.5 flex gap-2">
        <Link href={`/dashboard/projects/${p.id}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-line py-1.5 text-[12.5px] font-semibold hover:bg-paper"><Eye size={14} /> View</Link>
        <button onClick={onEdit} className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-line py-1.5 text-[12.5px] font-semibold hover:bg-paper"><Pencil size={14} /> Edit</button>
        {role === "ADMIN" && <button onClick={onDelete} className="rounded-md bg-dangerbg px-2.5 text-danger hover:bg-danger hover:text-white"><Trash2 size={14} /></button>}
      </div>
    </div>
  );
}
