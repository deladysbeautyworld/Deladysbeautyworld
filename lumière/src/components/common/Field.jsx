/**
 * Shared form field for admin pages. Label + optional hint + children.
 * Matches the public Checkout.jsx field pattern so the admin feels like
 * the same product.
 */
export default function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="block text-[11px] tracking-[0.12em] uppercase text-(--color-faint) mb-1.5 font-normal">
        {label} {required && <span className="text-(--color-pink)">*</span>}
      </label>
      {children}
      {hint && (
        <p className="text-[11px] text-(--color-faint) font-light mt-1.5">
          {hint}
        </p>
      )}
    </div>
  );
}
