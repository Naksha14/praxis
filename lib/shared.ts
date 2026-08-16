// Shared between server and client. Keep in sync with any UI-side validation.

export const MAX_DOC_SIZE = 25 * 1024 * 1024; // 25 MB
export const MAX_PHOTO_SIZE = 15 * 1024 * 1024; // 15 MB
export const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500 MB

export const ALLOWED_DOC_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
export const ALLOWED_PHOTO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/heic"];
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo"];

export function sumAmounts(rows: { amount: any }[]) {
  return rows.reduce((a, r) => a + Number(r.amount), 0);
}

export function computeTotals(p: {
  revenues: { amount: any }[];
  expenditures: { amount: any }[];
  labourCharges: { amount: any }[];
  materialCharges: { amount: any }[];
  transportCharges: { amount: any }[];
  extraCharges: { amount: any }[];
}) {
  const totalRevenue = sumAmounts(p.revenues);
  const totalExpenditure = sumAmounts(p.expenditures);
  const netRevenue = totalRevenue - totalExpenditure;
  const totalLabour = sumAmounts(p.labourCharges);
  const totalMaterial = sumAmounts(p.materialCharges);
  const totalTransport = sumAmounts(p.transportCharges);
  const totalExtra = sumAmounts(p.extraCharges);
  const totalCharges = totalLabour + totalMaterial + totalTransport + totalExtra;
  const netAmount = netRevenue - totalCharges;
  // "Total Project Expenses" for the Admin-Payment tracker below is every
  // outflow already tracked elsewhere in Praxis (Expenditure + all four
  // charge types) — deliberately reusing the existing ledgers rather than
  // introducing a parallel Expense table, since they already capture
  // project_id/amount/category(-equivalent)/date/description/created_by.
  const totalProjectExpenses = totalExpenditure + totalCharges;
  return {
    totalRevenue, totalExpenditure, netRevenue, totalLabour, totalMaterial, totalTransport, totalExtra,
    totalCharges, netAmount, totalProjectExpenses,
  };
}

export type PaymentStatus = "no_amount" | "within" | "fully_used" | "over" | "completed_saved" | "completed_over";

export interface ExpenseSummary {
  amountPaid: number | null;
  totalExpenses: number;
  remaining: number | null;
  extraCost: number;
  usagePercent: number | null;
  savings: number | null;
  status: PaymentStatus;
}

// The single source of truth for Remaining / Extra Cost / Usage % / Savings /
// Status, used identically by the project card, project detail page, and the
// finance dashboard so the three never disagree with each other.
export function computeExpenseSummary(amountPaid: number | null, totalExpenses: number, projectStatus: string): ExpenseSummary {
  if (amountPaid === null) {
    return { amountPaid: null, totalExpenses, remaining: null, extraCost: 0, usagePercent: null, savings: null, status: "no_amount" };
  }

  const isCompleted = projectStatus === "completed";
  const over = totalExpenses > amountPaid;
  const remaining = over ? 0 : amountPaid - totalExpenses;
  const extraCost = over ? totalExpenses - amountPaid : 0;
  // Note: Infinity would silently become null over JSON (JSON.stringify has
  // no representation for it), so a real ₹0-amount-with-expenses case uses a
  // large finite sentinel instead — fmtPercent() in components/ui.tsx treats
  // anything >= 9999 the same as "unbounded."
  const usagePercent = amountPaid > 0 ? Math.round((totalExpenses / amountPaid) * 100) : totalExpenses > 0 ? 9999 : 0;
  const savings = isCompleted && !over ? amountPaid - totalExpenses : null;

  let status: PaymentStatus;
  if (over) status = isCompleted ? "completed_over" : "over";
  else if (isCompleted) status = "completed_saved";
  else if (totalExpenses === amountPaid && amountPaid > 0) status = "fully_used";
  else status = "within";

  return { amountPaid, totalExpenses, remaining, extraCost, usagePercent, savings, status };
}

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  no_amount: "Budget Not Added",
  within: "Within Amount",
  fully_used: "Fully Used",
  over: "Over Amount",
  completed_saved: "Completed",
  completed_over: "Completed — Over Amount",
};
