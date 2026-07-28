/**
 * Status pill — same shape and treatment as the public site's order tag
 * (see OrderConfirmation.jsx). Uses the brand's soft tints so the dashboard
 * table doesn't feel like a different product.
 */
const STATUS_STYLES = {
  pending:    "bg-amber-50    text-amber-700",
  paid:       "bg-blue-50     text-blue-700",
  processing: "bg-indigo-50   text-indigo-700",
  shipped:    "bg-purple-50   text-purple-700",
  delivered:  "bg-green-50    text-green-700",
  cancelled:  "bg-red-50      text-red-700",
};

export default function AdminStatusPill({ status }) {
  return (
    <span
      className={[
        "inline-block px-2.5 py-1 rounded-sm text-[10px] tracking-[0.08em] uppercase font-normal",
        STATUS_STYLES[status] ?? "bg-gray-50 text-gray-700",
      ].join(" ")}
    >
      {status}
    </span>
  );
}

// Re-export the map so other admin pages can reuse it (e.g. for filter chips).
export { STATUS_STYLES };
