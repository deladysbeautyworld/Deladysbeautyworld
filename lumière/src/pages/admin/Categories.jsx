import { useEffect, useState } from "react";
import {
  listAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../lib/admin.js";
import AdminPageHeader from "./components/AdminPageHeader.jsx";

/**
 * Admin categories — list/create/edit/delete. Slugs are auto-derived from
 * the name when blank, but editable.
 */
export default function Categories() {
  const [categories, setCategories]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  const [modalOpen, setModalOpen]     = useState(false);
  const [editing, setEditing]         = useState(null);
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const rows = await listAdminCategories();
        if (cancelled) return;
        setCategories(rows);
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
    const rows = await listAdminCategories();
    setCategories(rows);
  };

  const openCreate = () => {
    setEditing({ name: "", slug: "" });
    setSubmitError(null);
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditing({ id: cat.id, name: cat.name, slug: cat.slug });
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
    const name = (editing.name ?? "").trim();
    if (!name) {
      setSubmitError("Name is required.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (editing.id) {
        await updateCategory(editing.id, { name, slug: editing.slug });
      } else {
        await createCategory({ name, slug: editing.slug });
      }
      await reload();
      closeModal();
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cat) => {
    try {
      await deleteCategory(cat.id);
      await reload();
      setConfirmDelete(null);
    } catch (err) {
      setConfirmDelete({ ...cat, error: err.message });
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
          title="Categories"
          subtitle={`${categories.length} ${categories.length === 1 ? "category" : "categories"} in your store`}
          action={
            <button
              onClick={openCreate}
              className="h-11 px-6 bg-(--color-pink) text-white text-[11px] tracking-widest uppercase font-normal rounded-sm hover:bg-(--color-navy) transition-colors"
            >
              + New category
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
          ) : categories.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-[13px] text-(--color-muted) font-light">
                No categories yet.
              </p>
              <p className="text-[11px] text-(--color-faint) font-light mt-1">
                Categories let you group products on the shop page.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-[10px] tracking-[0.12em] uppercase text-(--color-faint) border-b border-(--color-border) bg-(--color-cream-dark)/40">
                    <th className="px-6 py-3 font-normal">Name</th>
                    <th className="px-6 py-3 font-normal">Slug</th>
                    <th className="px-6 py-3 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-(--color-border) last:border-b-0 hover:bg-(--color-pink-pale)/40 transition-colors"
                    >
                      <td className="px-6 py-3 text-(--color-ink) font-normal">
                        {c.name}
                      </td>
                      <td className="px-6 py-3 text-(--color-muted) font-light font-mono text-[12px]">
                        {c.slug}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => openEdit(c)}
                            className="h-8 px-3 border border-(--color-border) text-(--color-muted) text-[10px] tracking-widest uppercase rounded-sm hover:border-(--color-pink) hover:text-(--color-pink) transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setConfirmDelete(c)}
                            className="h-8 px-3 border border-(--color-border) text-(--color-muted) text-[10px] tracking-widest uppercase rounded-sm hover:border-red-300 hover:text-red-500 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create / edit modal */}
      {modalOpen && editing && (
        <CategoryModal
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
              Delete category?
            </h3>
            <p className="text-[13px] text-(--color-muted) font-light mb-1">
              <strong className="font-normal text-(--color-ink)">
                {confirmDelete.name}
              </strong>{" "}
              will be permanently removed.
            </p>
            {confirmDelete.error ? (
              <p className="text-[12px] text-red-500 font-light mt-2 mb-4">
                {confirmDelete.error}
              </p>
            ) : (
              <p className="text-[11px] text-(--color-faint) font-light mb-6">
                Products in this category will lose their category link.
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

function CategoryModal({ editing, setEditing, submitting, submitError, onSubmit, onClose }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditing((prev) => ({ ...prev, [name]: value }));
  };

  const isEdit = Boolean(editing.id);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 py-10 overflow-y-auto">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={onSubmit} className="relative bg-white rounded-sm w-full max-w-md shadow-xl">
        <div className="px-8 py-5 border-b border-(--color-border) flex items-center justify-between">
          <h3 className="font-display text-[22px] font-light text-(--color-ink)">
            {isEdit ? "Edit category" : "New category"}
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
          <Field label="Name" required>
            <input
              name="name"
              value={editing.name}
              onChange={handleChange}
              required
              autoFocus
              className={inputClass}
              placeholder="e.g. Skincare"
            />
          </Field>

          <Field label="Slug (URL)">
            <input
              name="slug"
              value={editing.slug}
              onChange={handleChange}
              className={`${inputClass} font-mono`}
              placeholder="auto-derived from name"
            />
            <p className="text-[10px] text-(--color-faint) font-light mt-1.5">
              Used in URLs like /shop?category=<strong>{editing.slug || "your-slug"}</strong>.
              Leave blank to auto-derive.
            </p>
          </Field>

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
            {submitting ? "Saving…" : isEdit ? "Save changes" : "Create category"}
          </button>
        </div>
      </form>
    </div>
  );
}