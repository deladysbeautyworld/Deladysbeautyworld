/**
 * Order status pill — soft tint + coloured dot so status is readable by
 * colour and by label. Colours come from STATUS_META in format.js so charts match.
 */
import { STATUS_META } from "./format.js";

export default function AdminStatusPill({ status }) {
  const meta = STATUS_META[status] ?? { label: status ?? "Unknown", color: "#a79aa9", cls: "bg-gray-50 text-gray-700" };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-medium capitalize ${meta.cls}`}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}
