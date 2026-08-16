"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wallet, IndianRupee, TrendingDown, PiggyBank, AlertTriangle } from "lucide-react";
import { EmptyState, StatCard, fmtMoney, fmtDate, fmtPercent } from "@/components/ui";

export default function FinancePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/finance")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-[22px] font-bold">Finance</h1>
        <p className="mt-1 text-[13.5px] text-steel">Financial overview across all projects.</p>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Revenue" value={fmtMoney(data?.totalRevenue || 0)} icon={Wallet} />
        <StatCard label="Total Expenses" value={fmtMoney(data?.totalExpenses || 0)} icon={TrendingDown} />
        <StatCard label="Net Profit" value={fmtMoney(data?.netProfit || 0)} icon={PiggyBank} />
        <StatCard label="Projects" value={data?.projectCount || 0} icon={AlertTriangle} />
      </div>
      {data?.projects?.length === 0 ? (
        <EmptyState icon={Wallet} title="No financial data" subtitle="Start adding revenue and expenses to projects." />
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Project</th>
                <th className="px-4 py-2 text-right">Revenue</th>
                <th className="px-4 py-2 text-right">Expenses</th>
                <th className="px-4 py-2 text-right">Profit</th>
              </tr>
            </thead>
            <tbody>
              {data?.projects?.map((p: any) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-2">{p.title}</td>
                  <td className="px-4 py-2 text-right">{fmtMoney(p.revenue || 0)}</td>
                  <td className="px-4 py-2 text-right">{fmtMoney(p.expenses || 0)}</td>
                  <td className="px-4 py-2 text-right">{fmtMoney((p.revenue || 0) - (p.expenses || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}