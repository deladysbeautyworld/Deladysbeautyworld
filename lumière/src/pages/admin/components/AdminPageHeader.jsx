/**
 * Page header for admin pages: Playfair title, a short plain-language
 * description, and an optional action slot on the right.
 *
 *   <AdminPageHeader
 *     eyebrow="Catalog"
 *     title="Products"
 *     subtitle="317 products synced from the POS."
 *     action={<button className="admin-btn admin-btn--primary">New</button>}
 *   />
 */
export default function AdminPageHeader({ eyebrow, title, subtitle, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 sm:gap-6 mb-7">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[11px] tracking-[0.16em] uppercase text-(--color-pink) font-medium mb-1.5">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-[28px] md:text-[32px] text-(--color-ink) leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[13.5px] text-(--color-muted) mt-1.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="w-full sm:w-auto shrink-0 flex gap-2">{action}</div>}
    </div>
  );
}
