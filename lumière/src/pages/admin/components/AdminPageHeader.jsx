/**
 * Branded page header for admin pages.
 *
 * Title in Playfair Display (matches the public site's "Order placed!" treatment),
 * uppercase tracked subtitle below, optional action slot on the right.
 *
 *   <AdminPageHeader
 *     title="Overview"
 *     subtitle="A snapshot of your store today."
 *     action={<Link to="/admin/orders/new">+ New order</Link>}
 *   />
 */
export default function AdminPageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-6 mb-8">
      <div>
        <h1 className="font-display text-[30px] md:text-[34px] font-light text-(--color-ink) leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[12px] text-(--color-faint) font-light mt-1.5">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
