"use client";`n`nexport const dynamic = 'force-dynamic';`n`n`n`n`n`nimport { useEffect, useState } from "react";
import Link from "next/link";
import { Wallet, IndianRupee, TrendingDown, PiggyBank, AlertTriangle } from "lucide-react";
import { EmptyState, StatCard, fmtMoney, fmtDate, fmtPercent } from "@/components/ui";
import { PAYMENT_STATUS_LABEL, PaymentStatus } from "@/lib/shared";

const STATUS_TONE: Record<PaymentStatus, "ink" | "amber" | "danger" | "success"> = {
  no_amount: "ink", within: "success", fully_used: "amber", over: "danger", completed_saved: "success", completed_over: "danger",
};

export default function FinancePage() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [payments, setPayments] = useState<{ rows: any[]; summary: any } | null>(null);

  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/finance")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setRows)
      .catch(() => { setRows([]); setErr("Could not load finance data. Please refresh the page."); });
    fetch("/api/finance/payments")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setPayments)
      .catch(() => { setPayments({ rows: [], summary: { totalAmountPaid: 0, totalExpenses: 0, totalRemaining: 0, totalExtraCost: 0, totalSavings: 0 } }); setErr("Could not load finance data. Please refresh the page."); });
  }, []);

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-[22px] font-bold">Finance</h1>
        <p className="mt-1 text-[13.5px] text-steel">Revenue, expenditure, and Admin-paid amounts across all visible projects.</p>
      </div>

      {err && <div className="mb-5 rounded-md bg-dangerbg px-3.5 py-2.5 text-[13px] text-danger">{err}</div>}

      {/* --- Amount Paid by Admin vs Project Expenses --- */}
      <div className="mb-8">
        <h3 className="mb-3 text-[15px] font-bold">Payments &amp; Expenses</h3>
        {payments === null ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-line/40" />)}</div>
        ) : (
          <>
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <StatCard icon={IndianRupee} label="Total Amount Paid" value={fmtMoney(payments.summary.totalAmountPaid)} tone="amber" />
              <StatCard icon={TrendingDown} label="Total Expenses" value={fmtMoney(payments.summary.totalExpenses)} />
              <StatCard icon={IndianRupee} label="Total Remaining" value={fmtMoney(payments.summary.totalRemaining)} tone="success" />
              <StatCard icon={AlertTriangle} label="Total Extra Cost" value={fmtMoney(payments.summary.totalExtraCost)} tone={payments.summary.totalExtraCost > 0 ? "danger" : "ink"} />
              <StatCard icon={PiggyBank} label="Total Savings" value={fmtMoney(payments.summary.totalSavings)} tone="success" />
            </div>

            {payments.rows.length === 0 ? (
              <EmptyState icon={IndianRupee} title="No amounts added yet." subtitle="Once an admin adds an Amount Paid to a project, the breakdown will appear here." />
            ) : (
              <div className="overflow-hidden rounded-xl border border-line bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[13px]">
                    <thead>
                      <tr className="bg-paper">
                        {["Project", "In-Charge", "Amount Paid", "Expenses", "Remaining", "Extra Cost", "Usage", "Status"].map((h) => (
                          <th key={h} className="whitespace-nowrap px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-steel">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {payments.rows.map((r) => (
                        <tr key={r.id} className="border-t border-line">
                          <td className="px-4 py-2.5 font-semibold"><Link href={`/dashboard/projects/${r.id}`} className="hover:text-blueprint hover:underline">{r.title}</Link></td>
                          <td className="px-4 py-2.5 text-steel">{r.inChargeName}</td>
                          <td className="px-4 py-2.5 font-mono font-bold">{fmtMoney(r.amountPaid)}</td>
                          <td className="px-4 py-2.5 font-mono">{fmtMoney(r.totalExpenses)}</td>
                          <td className="px-4 py-2.5 font-mono">{r.remaining !== null ? fmtMoney(r.remaining) : "—"}</td>
                          <td className={`px-4 py-2.5 font-mono ${r.extraCost > 0 ? "font-bold text-danger" : ""}`}>{r.extraCost > 0 ? fmtMoney(r.extraCost) : "—"}</td>
                          <td className="px-4 py-2.5 font-mono">{fmtPercent(r.usagePercent)}</td>
                          <td className="px-4 py-2.5">
                            <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${
                              STATUS_TONE[r.status as PaymentStatus] === "danger" ? "bg-dangerbg text-danger" :
                              STATUS_TONE[r.status as PaymentStatus] === "success" ? "bg-successbg text-success" :
                              STATUS_TONE[r.status as PaymentStatus] === "amber" ? "bg-[#FDF3E4] text-amberdark" : "bg-[#EEF0F3] text-steel"
                            }`}>{PAYMENT_STATUS_LABEL[r.status as PaymentStatus]}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* --- Existing revenue / expenditure ledger --- */}
      <h3 className="mb-3 text-[15px] font-bold">Revenue &amp; Expenditure</h3>
      {rows === null ? (
        <div className="grid gap-2.5">{[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-line/40" />)}</div>
      ) : rows.length === 0 ? (
        <EmptyState icon={Wallet} title="No finance entries yet." subtitle="Revenue and expenditure recorded across all projects will appear here." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-paper">
                  {["Date", "Project", "Type", "Description", "Amount", "Added By"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-steel">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-line">
                    <td className="whitespace-nowrap px-4 py-2.5">{fmtDate(r.date)}</td>
                    <td className="px-4 py-2.5 font-semibold">
                      <Link href={`/dashboard/projects/${r.project.id}`} className="hover:text-blueprint hover:underline">{r.project.title}</Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${r.kind === "Revenue" ? "bg-successbg text-success" : "bg-[#EEF0F3] text-steel"}`}>{r.kind}</span>
                    </td>
                    <td className="px-4 py-2.5">{r.description || "—"}</td>
                    <td className="px-4 py-2.5 font-mono font-bold">{fmtMoney(Number(r.amount))}</td>
                    <td className="px-4 py-2.5 text-steel">{r.addedBy.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}



