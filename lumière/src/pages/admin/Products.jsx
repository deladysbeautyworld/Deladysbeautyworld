import { useEffect, useState } from "react";
import {
  listAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  listAdminCategories,
  createCategory,
  listProductVariants,
  deleteVariantsForProduct,
  createVariant,
} from "../../lib/admin.js";
import AdminPageHeader from "./components/AdminPageHeader.jsx";

/* Allowed variant types — kept in sync with ProductDetail.jsx */
const VARIANT_TYPES = [
  { value: "shade", label: "Shade" },
  { value: "size",  label: "Size"  },
  { value: "scent", label: "Scent" },
];

/* Generate a stable client-side id for variants that haven't been saved yet. */
const newVariantId = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID)
    ? `tmp-${crypto.randomUUID()}`
    : `tmp-${Math.random().toString(36).slice(2)}`;

const fmt = (amount) => `₦${Number(amount).toLocaleString("en-NG")}`;

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  stock: "",
  category_id: "",
  image_url: "",
  is_featured: false,
  tags: [],
};

const STATUS_STYLES = {
  in_stock:  "bg-green-50 text-green-700",
  low_stock: "bg-amber-50 text-amber-700",
  out:       "bg-red-50  text-red-700",
};

function stockLabel(stock) {
  const n = Number(stock);
  if (n <= 0) return { label: "Out of stock", cls: STATUS_STYLES.out };
  if (n <= 5) return { label: `Low · ${n}`,   cls: STATUS_STYLES.low_stock };
  return { label: `${n} in stock`, cls: STATUS_STYLES.in_stock };
}

/**
 * Admin products — searchable list, with create/edit/delete.
 * Create and edit share the same modal — clicking "New" passes `null`,
 * clicking a row's pencil passes the product.
 */
export default function Products() {
  const [filter, setFilter]             = useState({ search: "", page: 0 });
  const { search, page }                = filter;
  const [data, setData]                 = useState({ products: [], total: 0, totalPages: 0 });
  const [categories, setCategories]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  const [modalOpen, setModalOpen]       = useState(false);
  const [editing, setEditing]           = useState(null);  // null = create mode
  const [submitting, setSubmitting]     = useState(false);
  const [submitError, setSubmitError]   = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Reload products when search or page changes
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await listAdminProducts({ search, page, pageSize: 20 });
        if (cancelled) return;
        setData(result);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [search, page]);

  // Pull categories once for the modal's dropdown. Using the admin helper so
  // categories just created on /admin/categories appear immediately.
  useEffect(() => {
    listAdminCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const setSearch = (newSearch) => {
    // Reset to first page when search text changes
    setFilter({ search: newSearch, page: 0 });
  };

  const setPage = (newPage) => {
    setFilter((f) => ({ ...f, page: newPage }));
  };

  const reload = async () => {
    const result = await listAdminProducts({ search, page, pageSize: 20 });
    setData(result);
  };

  const openCreate = () => {
    setEditing({ ...EMPTY_FORM });
    setSubmitError(null);
    setModalOpen(true);
  };

  const openEdit = async (product) => {
    setEditing({
      id:          product.id,
      name:        product.name ?? "",
      description: product.description ?? "",
      price:       String(product.price ?? ""),
      stock:       String(product.stock ?? 0),
      category_id: product.category_id ?? "",
      image_url:   product.image_url ?? "",
      is_featured: Boolean(product.is_featured),
      tags:        Array.isArray(product.tags) ? product.tags : [],
      variants:    [],
      showVariants: false,
    });
    setSubmitError(null);
    setModalOpen(true);

    // Load existing variants for this product into the modal's local state.
    try {
      const vs = await listProductVariants(product.id);
      setEditing((prev) => ({
        ...prev,
        variants: vs.map((v) => ({
          id:        v.id,
          name:      v.name,
          type:      v.type,
          price:     String(v.price ?? ""),
          stock:     String(v.stock ?? 0),
          sku:       v.sku ?? "",
        })),
        showVariants: vs.length > 0,
      }));
    } catch {
      // Variant loading failure shouldn't block the modal — just leave empty.
    }
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setEditing(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const variants = Array.isArray(editing.variants) ? editing.variants : [];

      if (editing.id) {
        await updateProduct(editing.id, editing);
        // Variants are stored in a separate table — easiest is delete + re-insert.
        await deleteVariantsForProduct(editing.id);
        for (const v of variants) {
          if (!v.name?.trim()) continue;
          await createVariant(editing.id, {
            name:  v.name,
            type:  v.type,
            price: v.price,
            stock: v.stock,
            sku:   v.sku,
          });
        }
      } else {
        const created = await createProduct(editing);
        for (const v of variants) {
          if (!v.name?.trim()) continue;
          await createVariant(created.id, {
            name:  v.name,
            type:  v.type,
            price: v.price,
            stock: v.stock,
            sku:   v.sku,
          });
        }
      }
      await reload();
      closeModal();
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (product) => {
    try {
      await deleteProduct(product.id);
      await reload();
      setConfirmDelete(null);
    } catch (err) {
      // Show inline error via simple confirm-replace — fall back to alert-equivalent
      setConfirmDelete({ ...product, error: err.message });
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
          title="Products"
          subtitle={`${data.total} ${data.total === 1 ? "product" : "products"} in your store`}
          action={
            <button
              onClick={openCreate}
              className="h-11 px-6 bg-(--color-pink) text-white text-[11px] tracking-widest uppercase font-normal rounded-sm hover:bg-(--color-navy) transition-colors"
            >
              + New product
            </button>
          }
        />

        {/* Search */}
        <div className="mb-6">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name…"
            className="w-full sm:w-80 h-11 border border-(--color-border) rounded-sm px-4 text-[13px] text-(--color-ink) placeholder-(--color-faint) bg-white outline-none focus:border-(--color-pink) transition-colors font-light"
          />
        </div>

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
          ) : data.products.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-[13px] text-(--color-muted) font-light">
                {search ? "No products match your search." : "No products yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-[10px] tracking-[0.12em] uppercase text-(--color-faint) border-b border-(--color-border) bg-(--color-cream-dark)/40">
                    <th className="px-6 py-3 font-normal">Product</th>
                    <th className="px-6 py-3 font-normal">Category</th>
                    <th className="px-6 py-3 font-normal">Price</th>
                    <th className="px-6 py-3 font-normal">Stock</th>
                    <th className="px-6 py-3 font-normal">Featured</th>
                    <th className="px-6 py-3 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.products.map((p) => {
                    const stock = stockLabel(p.stock);
                    return (
                      <tr
                        key={p.id}
                        className="border-b border-(--color-border) last:border-b-0 hover:bg-(--color-pink-pale)/40 transition-colors"
                      >
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-(--color-cream-mid) rounded-sm overflow-hidden flex items-center justify-center shrink-0">
                              {p.image_url ? (
                                <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-3 h-6 bg-(--color-stone) rounded-[6px_6px_1px_1px] opacity-40" />
                              )}
                            </div>
                            <p className="text-(--color-ink) font-normal truncate max-w-50">
                              {p.name}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-(--color-muted) font-light">
                          {p.categories?.name ?? "—"}
                        </td>
                        <td className="px-6 py-3 text-(--color-ink) font-medium">
                          {fmt(p.price)}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`inline-block px-2.5 py-1 rounded-sm text-[10px] tracking-[0.08em] uppercase font-normal ${stock.cls}`}>
                            {stock.label}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-(--color-muted) font-light">
                          {p.is_featured ? "Yes" : "—"}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => openEdit(p)}
                              className="h-8 px-3 border border-(--color-border) text-(--color-muted) text-[10px] tracking-widest uppercase rounded-sm hover:border-(--color-pink) hover:text-(--color-pink) transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setConfirmDelete(p)}
                              className="h-8 px-3 border border-(--color-border) text-(--color-muted) text-[10px] tracking-widest uppercase rounded-sm hover:border-red-300 hover:text-red-500 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 text-[12px] text-(--color-muted)">
            <p className="font-light">
              Page {page + 1} of {data.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="h-9 px-4 border border-(--color-border) rounded-sm text-[11px] tracking-widest uppercase hover:border-(--color-pink) hover:text-(--color-pink) transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
                disabled={page >= data.totalPages - 1}
                className="h-9 px-4 border border-(--color-border) rounded-sm text-[11px] tracking-widest uppercase hover:border-(--color-pink) hover:text-(--color-pink) transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / edit modal */}
      {modalOpen && editing && (
        <ProductModal
          editing={editing}
          setEditing={setEditing}
          categories={categories}
          submitting={submitting}
          submitError={submitError}
          onSubmit={handleSubmit}
          onClose={closeModal}
          onCategoryCreated={(newCat) => {
            // Add the freshly-created category to the dropdown so it's visible
            // without having to close and reopen the modal.
            setCategories((prev) => {
              if (prev.some((c) => c.id === newCat.id)) return prev;
              return [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name));
            });
          }}
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
              Delete product?
            </h3>
            <p className="text-[13px] text-(--color-muted) font-light mb-1">
              <strong className="font-normal text-(--color-ink)">{confirmDelete.name}</strong>
              {" "}will be permanently removed.
            </p>
            <p className="text-[11px] text-(--color-faint) font-light mb-6">
              This cannot be undone.
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

const modalInputClass =
  "w-full h-11 border border-(--color-border) rounded-sm px-4 text-[13px] text-(--color-ink) placeholder-(--color-faint) bg-white outline-none focus:border-(--color-pink) transition-colors font-light";

function ProductModal({
  editing,
  setEditing,
  categories,
  submitting,
  submitError,
  onSubmit,
  onClose,
  onCategoryCreated,
}) {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditing((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const isEdit = Boolean(editing.id);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 py-10 overflow-y-auto">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <form
        onSubmit={onSubmit}
        className="relative bg-white rounded-sm w-full max-w-lg shadow-xl"
      >
        <div className="px-8 py-5 border-b border-(--color-border) flex items-center justify-between">
          <h3 className="font-display text-[22px] font-light text-(--color-ink)">
            {isEdit ? "Edit product" : "New product"}
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
              className={modalInputClass}
              placeholder="Product name"
            />
          </Field>

          <Field label="Description">
            <textarea
              name="description"
              value={editing.description}
              onChange={handleChange}
              rows={3}
              className={`${modalInputClass} h-auto py-3 resize-none`}
              placeholder="Short description"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Price (₦)" required>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={editing.price}
                onChange={handleChange}
                required
                className={modalInputClass}
                placeholder="0"
              />
            </Field>
            <Field label="Stock">
              <input
                name="stock"
                type="number"
                min="0"
                value={editing.stock}
                onChange={handleChange}
                className={modalInputClass}
                placeholder="0"
              />
            </Field>
          </div>

          <Field label="Category">
            {editing._newCategoryOpen ? (
              <NewCategoryInline
                onCancel={() => setEditing((p) => ({ ...p, _newCategoryOpen: false }))}
                onCreated={(newCat) => {
                  onCategoryCreated(newCat);
                  setEditing((p) => ({
                    ...p,
                    _newCategoryOpen: false,
                    category_id: newCat.id,
                  }));
                }}
              />
            ) : (
              <select
                name="category_id"
                value={editing.category_id}
                onChange={(e) => {
                  if (e.target.value === "__new__") {
                    setEditing((p) => ({ ...p, _newCategoryOpen: true, category_id: "" }));
                  } else {
                    handleChange(e);
                  }
                }}
                className={modalInputClass}
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                <option value="__new__">+ New category…</option>
              </select>
            )}
          </Field>

          <Field label="Image URL">
            <input
              name="image_url"
              value={editing.image_url}
              onChange={handleChange}
              className={modalInputClass}
              placeholder="https://…"
            />
          </Field>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              name="is_featured"
              type="checkbox"
              checked={editing.is_featured}
              onChange={handleChange}
              className="w-4 h-4 accent-(--color-pink)"
            />
            <span className="text-[13px] text-(--color-muted) font-light">
              Feature on the homepage
            </span>
          </label>

          {/* Variants — optional. Toggle on to add shade / size / scent rows. */}
          <div className="border border-(--color-border) rounded-sm p-4">
            <label className="flex items-center gap-3 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={Boolean(editing.showVariants)}
                onChange={(e) => {
                  const on = e.target.checked;
                  setEditing((prev) => ({
                    ...prev,
                    showVariants: on,
                    variants: on && (!prev.variants || prev.variants.length === 0)
                      ? [{ id: newVariantId(), name: "", type: "shade", price: "", stock: "0", sku: "" }]
                      : prev.variants ?? [],
                  }));
                }}
                className="w-4 h-4 accent-(--color-pink)"
              />
              <span className="text-[12px] tracking-[0.12em] uppercase text-(--color-ink) font-normal">
                This product has variants
              </span>
            </label>

            {editing.showVariants && (
              <div className="flex flex-col gap-3">
                {(editing.variants ?? []).map((v, idx) => (
                  <div
                    key={v.id}
                    className="grid grid-cols-12 gap-2 items-start"
                  >
                    <div className="col-span-3">
                      <label className="text-[10px] tracking-widest uppercase text-(--color-faint) block mb-1">
                        Type
                      </label>
                      <select
                        value={v.type}
                        onChange={(e) => {
                          const type = e.target.value;
                          setEditing((prev) => ({
                            ...prev,
                            variants: prev.variants.map((row, i) =>
                              i === idx ? { ...row, type } : row
                            ),
                          }));
                        }}
                        className="w-full h-9 border border-(--color-border) rounded-sm px-2 text-[12px] text-(--color-ink) bg-white outline-none focus:border-(--color-pink)"
                      >
                        {VARIANT_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <label className="text-[10px] tracking-widest uppercase text-(--color-faint) block mb-1">
                        Name
                      </label>
                      <input
                        value={v.name}
                        onChange={(e) => {
                          const name = e.target.value;
                          setEditing((prev) => ({
                            ...prev,
                            variants: prev.variants.map((row, i) =>
                              i === idx ? { ...row, name } : row
                            ),
                          }));
                        }}
                        placeholder="e.g. Rose"
                        className="w-full h-9 border border-(--color-border) rounded-sm px-2 text-[12px] text-(--color-ink) bg-white outline-none focus:border-(--color-pink)"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] tracking-widest uppercase text-(--color-faint) block mb-1">
                        Price (₦)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={v.price}
                        onChange={(e) => {
                          const price = e.target.value;
                          setEditing((prev) => ({
                            ...prev,
                            variants: prev.variants.map((row, i) =>
                              i === idx ? { ...row, price } : row
                            ),
                          }));
                        }}
                        placeholder="0"
                        className="w-full h-9 border border-(--color-border) rounded-sm px-2 text-[12px] text-(--color-ink) bg-white outline-none focus:border-(--color-pink)"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="text-[10px] tracking-widest uppercase text-(--color-faint) block mb-1">
                        Stock
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={v.stock}
                        onChange={(e) => {
                          const stock = e.target.value;
                          setEditing((prev) => ({
                            ...prev,
                            variants: prev.variants.map((row, i) =>
                              i === idx ? { ...row, stock } : row
                            ),
                          }));
                        }}
                        placeholder="0"
                        className="w-full h-9 border border-(--color-border) rounded-sm px-2 text-[12px] text-(--color-ink) bg-white outline-none focus:border-(--color-pink)"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] tracking-widest uppercase text-(--color-faint) block mb-1">
                        SKU
                      </label>
                      <input
                        value={v.sku}
                        onChange={(e) => {
                          const sku = e.target.value;
                          setEditing((prev) => ({
                            ...prev,
                            variants: prev.variants.map((row, i) =>
                              i === idx ? { ...row, sku } : row
                            ),
                          }));
                        }}
                        placeholder="OPT"
                        className="w-full h-9 border border-(--color-border) rounded-sm px-2 text-[12px] text-(--color-ink) font-mono bg-white outline-none focus:border-(--color-pink)"
                      />
                    </div>
                    <div className="col-span-1 flex items-end justify-end h-full pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing((prev) => ({
                            ...prev,
                            variants: prev.variants.filter((_, i) => i !== idx),
                          }));
                        }}
                        aria-label="Remove variant"
                        className="w-9 h-9 border border-(--color-border) text-(--color-muted) rounded-sm hover:border-red-300 hover:text-red-500 transition-colors flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setEditing((prev) => ({
                      ...prev,
                      variants: [
                        ...(prev.variants ?? []),
                        { id: newVariantId(), name: "", type: "shade", price: "", stock: "0", sku: "" },
                      ],
                    }));
                  }}
                  className="h-9 px-4 border border-dashed border-(--color-border) text-(--color-muted) text-[11px] tracking-widest uppercase rounded-sm hover:border-(--color-pink) hover:text-(--color-pink) transition-colors"
                >
                  + Add variant
                </button>
              </div>
            )}
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
            {submitting ? "Saving…" : isEdit ? "Save changes" : "Create product"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------- inline category creation (shown inside the Category <select>) ---------- */

function NewCategoryInline({ onCancel, onCreated }) {
  const [name, setName]       = useState("");
  const [slug, setSlug]       = useState("");
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState(null);

  // Mirror the helper in lib/admin.js — we don't export it from there, so a
  // small duplicate keeps this component self-contained.
  const slugify = (s) =>
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const cat = await createCategory({ name: trimmed, slug });
      onCreated(cat);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-(--color-pink) bg-(--color-pink-pale)/40 rounded-sm p-3 flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name"
          className="h-9 border border-(--color-border) rounded-sm px-2 text-[12px] text-(--color-ink) bg-white outline-none focus:border-(--color-pink)"
        />
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder={slugify(name) || "auto-slug"}
          className="h-9 border border-(--color-border) rounded-sm px-2 text-[12px] font-mono text-(--color-ink) bg-white outline-none focus:border-(--color-pink)"
        />
      </div>
      {error && (
        <p className="text-[11px] text-red-500 font-light">{error}</p>
      )}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="h-8 px-3 text-[10px] tracking-widest uppercase text-(--color-muted) hover:text-(--color-ink) transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={busy}
          className="h-8 px-3 bg-(--color-ink) text-(--color-cream) text-[10px] tracking-widest uppercase rounded-sm hover:bg-(--color-ink-soft) transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          {busy && (
            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          Save
        </button>
      </div>
    </div>
  );
}
