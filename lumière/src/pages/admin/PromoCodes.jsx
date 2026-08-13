import { useEffect, useState } from "react";
import {
  listPromoCodes,
  createPromoCode,
  togglePromoCode,
  deletePromoCode,
} from "../../lib/admin.js";
import AdminPageHeader from "./components/AdminPageHeader.jsx";

/**
 * Admin promo codes — full CRUD. The data-access helpers in lib/admin.js
 * already exist (`listPromoCodes`, `createPromoCode`, `togglePromoCode`,
 * `deletePromoCode`); this file is the UI that consumes them.
 */
export default function PromoCodes() {
  const [codes, setCodes]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  const [modalOpen, setModalOpen]       = useState(false);
  const [editing, setEditing]           = useState(null);
  const [submitting, setSubmitting]     = useState(false);
  const [submitError, setSubmitError]   = useState(null);

  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const rows = await listPromoCodes();
        if (cancelled) return;
        setCodes(rows);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const reload = async () => {
    const rows = await listPromoCodes();
    setCodes(rows);
  };

  const openCreate = () => {
    setEditing({
      code:       "",
      type:       "percent",
      value:      "",
      min_order:  "0",
      max_uses:   "",
      expires_at: "",
      active:     true,
    });
    setSubmitError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setEditing(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editing) return;

    const code = (editing.code ?? "").trim();
    if (!code) {
      setSubmitError("Code is required.");
      return;
    }
    const value = Number(editing.value);
    if (!Number.isFinite(value) || value <= 0) {
      setSubmitError("Value must be greater than zero.");
      return;
    }
    const minOrder = Number(editing.min_order ?? 0);
    if (!Number.isFinite(minOrder) || minOrder < 0) {
      setSubmitError("Minimum order must be zero or more.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      await createPromoCode({
        code,
        type:       editing.type,
        value,
        min_order:  minOrder,
        max_uses:   editing.max_uses ? Number(editing.max_uses) : null,
        expires_at: editing.expires_at || null,
      });
      await reload();
      closeModal();
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (code) => {
    try {
      await togglePromoCode(code.id, !code.active);
      setCodes((rows) => rows.map((r) => (r.id === code.id ? { ...r, active: !r.active } : r)));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (code) => {
    try {
      await deletePromoCode(code.id);
      await reload();
      setConfirmDelete(null);
    } catch (err) {
      setConfirmDelete({ ...code, error: err.message });
    }
  };

  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-(--color-pink-pale) to-transparent pointer-events-none"
      />

      <div className="relative px-6 md:px-10 py-10 max-w-6xl mx-auto">

        <AdminPageHeader
          title="Promo codes"
          subtitle={`${codes.length} ${codes.length === 1 ? "code" : "codes"} active in your store`}
          action={
            <button
              onClick={openCreate}
              className="h-11 px-6 bg-(--color-pink) text-white text-[11px] tracking-widest uppercase font-normal rounded-sm hover:bg-(--color-navy) transition-colors"
            >
              + New promo code
            </button>
          }
        />

        {error && (
          <div className="mb-6 px-4 py-3 border border-red-200 bg-red-50 text-[12px] text-red-700 rounded-sm">
            {error}
          </div>
        )}

        <div className="bg-white border border-(--color-border) rounded-sm overflow-hidden">
          {loading ? (
            <div className="px-6 py-12 flex justify-center">
              <div className="w-5 h-5 border-2 border-(--color-border) border-t-(--color-pink) rounded-full animate-spin" />
            </div>
          ) : codes.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-[13px] text-(--color-muted) font-light">
                No promo codes yet.
              </p>
              <p className="text-[11px] text-(--color-faint) font-light mt-1">
                Create one to offer discounts at checkout.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-[10px] tracking-[0.12em] uppercase text-(--color-faint) border-b border-(--color-border) bg-(--color-cream-dark)/40">
                    <th className="px-6 py-3 font-normal">Code</th>
                    <th className="px-6 py-3 font-normal">Discount</th>
                    <th className="px-6 py-3 font-normal">Min order</th>
                    <th className="px-6 py-3 font-normal">Uses</th>
                    <th className="px-6 py-3 font-normal">Expires</th>
                    <th className="px-6 py-3 font-normal">Active</th>
                    <th className="px-6 py-3 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-(--color-border) last:border-b-0 hover:bg-(--color-pink-pale)/40 transition-colors"
                    >
                      <td className="px-6 py-3 font-mono text-[12px] text-(--color-ink) font-medium">
                        {c.code}
                      </td>
                      <td className="px-6 py-3 text-(--color-ink)">
                        {c.type === "percent"
                          ? `${Number(c.value)}%`
                          : `₦${Number(c.value).toLocaleString("en-NG")}`}
                      </td>
                      <td className="px-6 py-3 text-(--color-muted) font-light">
                        ₦{Number(c.min_order ?? 0).toLocaleString("en-NG")}
                      </td>
                      <td className="px-6 py-3 text-(--color-muted) font-light">
                        {c.uses ?? 0}
                        {c.max_uses ? ` / ${c.max_uses}` : " / ∞"}
                      </td>
                      <td className="px-6 py-3 text-(--color-muted) font-light">
                        {c.expires_at
                          ? new Date(c.expires_at).toLocaleDateString("en-NG", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => handleToggle(c)}
                          aria-label={c.active ? "Deactivate" : "Activate"}
                          className={[
                            "relative w-10 h-5 rounded-full transition-colors",
                            c.active ? "bg-(--color-pink)" : "bg-(--color-border)",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform",
                              c.active ? "left-5" : "left-0.5",
                            ].join(" ")}
                          />
                        </button>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => setConfirmDelete(c)}
                          className="h-8 px-3 border border-(--color-border) text-(--color-muted) text-[10px] tracking-widest uppercase rounded-sm hover:border-red-300 hover:text-red-500 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create modal */}
      {modalOpen && editing && (
        <PromoCodeModal
          editing={editing}
          setEditing={setEditing}
          submitting={submitting}
          submitError={submitError}
          onSubmit={handleSubmit}
          onClose={closeModal}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !confirmDelete.error && setConfirmDelete(null)}
          />
          <div className="relative bg-white rounded-sm p-8 w-full max-w-sm shadow-xl">
            <h3 className="font-display text-[20px] font-light text-(--color-ink) mb-2">
              Delete promo code?
            </h3>
            <p className="text-[13px] text-(--color-muted) font-light mb-1">
              <strong className="font-mono font-normal text-(--color-ink)">
                {confirmDelete.code}
              </strong>{" "}
              will be permanently removed.
            </p>
            <p className="text-[11px] text-(--color-faint) font-light mb-6">
              Customers will no longer be able to apply this code.
            </p>

            {confirmDelete.error && (
              <p className="text-[12px] text-red-500 font-light mb-4">
                {confirmDelete.error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 h-11 border border-(--color-border) text-(--color-muted) text-[11px] tracking-widest uppercase font-normal rounded-sm hover:border-(--color-pink) hover:text-(--color-pink) transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 h-11 bg-red-500 text-white text-[11px] tracking-widest uppercase font-normal rounded-sm hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------- modal -------- */

function Field({ label, required, children }) {
  return (
    <div>
      <label className="text-[10px] tracking-[0.12em] uppercase text-(--color-faint) font-normal block mb-1.5">
        {label} {required && <span className="text-(--color-pink)">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full h-11 border border-(--color-border) rounded-sm px-4 text-[13px] text-(--color-ink) placeholder-(--color-faint) bg-white outline-none focus:border-(--color-pink) transition-colors font-light";

function PromoCodeModal({ editing, setEditing, submitting, submitError, onSubmit, onClose }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditing((prev) => ({ ...prev, [name]: value }));
  };

  // Auto-uppercase the code on blur so we don't rely on the user typing in caps.
  const handleCodeBlur = () => {
    setEditing((prev) => ({ ...prev, code: (prev.code ?? "").toUpperCase().trim() }));
  };

  const isPercent = editing.type === "percent";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 py-10 overflow-y-auto">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={onSubmit} className="relative bg-white rounded-sm w-full max-w-lg shadow-xl">
        <div className="px-8 py-5 border-b border-(--color-border) flex items-center justify-between">
          <h3 className="font-display text-[22px] font-light text-(--color-ink)">
            New promo code
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-(--color-faint) hover:text-(--color-ink) transition-colors text-[20px] leading-none"
          >
            ×
          </button>
        </div>

        <div className="px-8 py-6 flex flex-col gap-4">
          <Field label="Code" required>
            <input
              name="code"
              value={editing.code}
              onChange={handleChange}
              onBlur={handleCodeBlur}
              required
              autoFocus
              className={`${inputClass} font-mono uppercase`}
              placeholder="SUMMER20"
            />
          </Field>

          <Field label="Discount type" required>
            <div className="flex gap-2">
              {["percent", "fixed"].map((t) => (
                <label
                  key={t}
                  className={[
                    "flex-1 h-11 border rounded-sm flex items-center justify-center text-[12px] tracking-widest uppercase cursor-pointer transition-colors",
                    editing.type === t
                      ? "border-(--color-pink) bg-(--color-pink-pale) text-(--color-ink)"
                      : "border-(--color-border) text-(--color-muted) hover:border-(--color-pink) hover:text-(--color-pink)",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name="type"
                    value={t}
                    checked={editing.type === t}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  {t === "percent" ? "Percent off" : "Fixed amount"}
                </label>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label={isPercent ? "Percent (%)" : "Amount (₦)"} required>
              <div className="relative">
                <input
                  name="value"
                  type="number"
                  min="0"
                  step={isPercent ? "1" : "0.01"}
                  value={editing.value}
                  onChange={handleChange}
                  required
                  className={`${inputClass} pr-10`}
                  placeholder="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-(--color-faint)">
                  {isPercent ? "%" : "₦"}
                </span>
              </div>
            </Field>
            <Field label="Minimum order (₦)">
              <input
                name="min_order"
                type="number"
                min="0"
                value={editing.min_order}
                onChange={handleChange}
                className={inputClass}
                placeholder="0"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Max uses">
              <input
                name="max_uses"
                type="number"
                min="0"
                value={editing.max_uses}
                onChange={handleChange}
                className={inputClass}
                placeholder="Unlimited"
              />
            </Field>
            <Field label="Expires at">
              <input
                name="expires_at"
                type="datetime-local"
                value={editing.expires_at}
                onChange={handleChange}
                className={inputClass}
              />
            </Field>
          </div>

          {submitError && (
            <p className="text-[12px] text-red-500 font-light">{submitError}</p>
          )}
        </div>

        <div className="px-8 py-5 border-t border-(--color-border) flex gap-3 justify-end bg-(--color-cream-dark)/30">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-11 px-6 border border-(--color-border) text-(--color-muted) text-[11px] tracking-widest uppercase font-normal rounded-sm hover:border-(--color-pink) hover:text-(--color-pink) transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="h-11 px-6 bg-(--color-ink) text-(--color-cream) text-[11px] tracking-widest uppercase font-normal rounded-sm hover:bg-(--color-ink-soft) transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {submitting ? "Creating…" : "Create code"}
          </button>
        </div>
      </form>
    </div>
  );
}