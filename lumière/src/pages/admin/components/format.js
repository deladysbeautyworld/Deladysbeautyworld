/* Shared admin formatting helpers and status palette. */

export const formatNaira = (amount, { compact = false } = {}) => {
  const value = Number(amount ?? 0);
  if (compact && Math.abs(value) >= 1000) {
    return `₦${new Intl.NumberFormat("en-NG", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value)}`;
  }
  return `₦${value.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
};

/** Order status labels + colours, shared by pills and charts. */
export const STATUS_META = {
  pending:    { label: "Pending",    color: "#d48a1c", cls: "bg-amber-50 text-amber-800" },
  confirmed:  { label: "Confirmed",  color: "#4f46e5", cls: "bg-indigo-50 text-indigo-700" },
  paid:       { label: "Paid",       color: "#2563eb", cls: "bg-blue-50 text-blue-700" },
  processing: { label: "Processing", color: "#4f46e5", cls: "bg-indigo-50 text-indigo-700" },
  shipped:    { label: "Shipped",    color: "#9333ea", cls: "bg-purple-50 text-purple-700" },
  delivered:  { label: "Delivered",  color: "#16834a", cls: "bg-green-50 text-green-700" },
  cancelled:  { label: "Cancelled",  color: "#c7345a", cls: "bg-rose-50 text-rose-700" },
};
