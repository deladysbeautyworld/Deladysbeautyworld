import { useState, useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import { supabase } from "../utils/supabase";
import { getProducts } from "../lib/products";
import SEOMeta from "../utils/seo";

const fmt = (amount) => `₦${Number(amount).toLocaleString("en-NG")}`;

async function generateRoutine(selectedProducts) {
  const response = await fetch("/api/generate-routine", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ products: selectedProducts }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Could not generate routine.");
  }
  return data.routine;
}

// ── Product picker card ───────────────────────────────────────────────
function ProductPickerCard({ product, selected, onToggle }) {
  return (
    <button
      onClick={() => onToggle(product)}
      className={`relative text-left border rounded-sm p-3 transition-all duration-150 ${
        selected
          ? "border-(--color-pink) bg-(--color-pink-pale)"
          : "border-(--color-border) bg-white hover:border-(--color-pink)/50"
      }`}
    >
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-(--color-pink) rounded-full flex items-center justify-center z-10">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
      )}
      <div className="w-full aspect-square bg-(--color-cream-mid) rounded-sm mb-2 overflow-hidden flex items-center justify-center">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-8 h-12 bg-(--color-stone) rounded-[16px_16px_3px_3px] opacity-40" />
        )}
      </div>
      <p className="text-[10px] tracking-[0.08em] uppercase text-(--color-faint) mb-0.5 font-normal">
        {product.categories?.name}
      </p>
      <p className="text-[12px] font-normal text-(--color-ink) leading-snug">{product.name}</p>
      <p className="text-[12px] font-medium text-(--color-pink) mt-1">{fmt(product.price)}</p>
    </button>
  );
}

// ── Routine step ──────────────────────────────────────────────────────
function RoutineStep({ step, index }) {
  return (
    <div className="flex gap-4">
      <div className="w-7 h-7 rounded-full bg-(--color-pink) text-white text-[11px] font-medium flex items-center justify-center shrink-0 mt-0.5">
        {index + 1}
      </div>
      <div className="flex-1 pb-5 border-b border-(--color-border) last:border-b-0">
        <p className="text-[13px] font-medium text-(--color-ink) mb-0.5">{step.action}</p>
        {step.product && (
          <p className="text-[12px] text-(--color-pink) font-light mb-1">{step.product}</p>
        )}
        <p className="text-[12px] text-(--color-muted) font-light leading-[1.7]">{step.tip}</p>
      </div>
    </div>
  );
}

// ── Saved routine card ────────────────────────────────────────────────
function SavedRoutineCard({ routine, onLoad, onDelete }) {
  return (
    <div className="border border-(--color-border) rounded-sm p-4 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[13px] font-normal text-(--color-ink) truncate">{routine.title}</p>
        <p className="text-[11px] text-(--color-faint) font-light mt-0.5">
          {routine.products?.length ?? 0} products ·{" "}
          {new Date(routine.created_at).toLocaleDateString("en-NG", {
            day: "numeric", month: "short", year: "numeric",
          })}
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => onLoad(routine)}
          className="h-8 px-3 text-[10px] tracking-widest uppercase border border-(--color-border) text-(--color-muted) rounded-sm hover:border-(--color-pink) hover:text-(--color-pink) transition-colors"
        >
          View
        </button>
        <button
          onClick={() => onDelete(routine.id)}
          className="h-8 px-3 text-[10px] tracking-widest uppercase border border-(--color-border) text-(--color-muted) rounded-sm hover:border-red-300 hover:text-red-500 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// ── Routine modal ─────────────────────────────────────────────────────
function RoutineModal({ routine, routineTitle, setRoutineTitle, user, onSave, onClose, saving, saveSuccess }) {
  const [activeSection, setActiveSection] = useState("morning");

  const SECTIONS = [
    { key: "morning", label: "☀️ Morning", steps: routine?.morning ?? [] },
    { key: "evening", label: "🌙 Evening", steps: routine?.evening ?? [] },
    { key: "weekly",  label: "📅 Weekly",  steps: routine?.weekly  ?? [] },
  ].filter((s) => s.steps.length > 0);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-sm shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Modal header */}
        <div className="px-6 py-5 border-b border-(--color-border) flex items-start justify-between gap-4 shrink-0">
          <div className="flex-1 min-w-0">
            <input
              value={routineTitle}
              onChange={(e) => setRoutineTitle(e.target.value)}
              className="font-display text-[22px] font-light text-(--color-ink) bg-transparent border-b border-transparent hover:border-(--color-border) focus:border-(--color-pink) outline-none transition-colors w-full"
            />
            {routine.skin_tip && (
              <p className="text-[12px] text-(--color-muted) font-light leading-[1.7] mt-1.5">
                💡 {routine.skin_tip}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-(--color-faint) hover:text-(--color-ink) transition-colors shrink-0 mt-1"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Section tabs */}
        <div className="flex gap-5 px-6 border-b border-(--color-border) shrink-0">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`py-3 text-[12px] tracking-[0.06em] uppercase font-normal transition-colors border-b-2 -mb-px ${
                activeSection === s.key
                  ? "border-(--color-pink) text-(--color-pink)"
                  : "border-transparent text-(--color-faint) hover:text-(--color-ink)"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Steps — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {SECTIONS.map((s) =>
            s.key === activeSection ? (
              <div key={s.key} className="flex flex-col">
                {s.steps.map((step, i) => (
                  <RoutineStep key={i} step={step} index={i} />
                ))}
              </div>
            ) : null
          )}
        </div>

        {/* Modal footer */}
        <div className="px-6 py-4 border-t border-(--color-border) bg-(--color-cream-dark) flex items-center justify-between gap-4 shrink-0">
          {user ? (
            <>
              {saveSuccess ? (
                <p className="text-[12px] text-green-600 font-light">✓ Routine saved to your profile</p>
              ) : (
                <p className="text-[12px] text-(--color-faint) font-light">
                  You can rename this routine before saving.
                </p>
              )}
              <button
                onClick={onSave}
                disabled={saving || saveSuccess}
                className="h-10 px-6 bg-(--color-pink) text-white text-[11px] tracking-widest uppercase font-normal rounded-sm hover:bg-(--color-navy) transition-colors disabled:opacity-60 flex items-center gap-2 shrink-0"
              >
                {saving && (
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {saveSuccess ? "Saved!" : "Save routine"}
              </button>
            </>
          ) : (
            <p className="text-[12px] text-(--color-faint) font-light">
              <a href="/login" className="text-(--color-pink) hover:underline underline-offset-2">
                Sign in
              </a>{" "}
              to save this routine to your profile.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────
export default function Routines() {
  const user = useAuthStore((s) => s.user);

  const [allProducts, setAllProducts]         = useState([]);
  const [selected, setSelected]               = useState([]);
  const [search, setSearch]                   = useState("");
  const [categoryFilter, setCategoryFilter]   = useState(null);
  const [categories, setCategories]           = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const [routine, setRoutine]         = useState(null);
  const [showModal, setShowModal]     = useState(false);
  const [generating, setGenerating]   = useState(false);
  const [genError, setGenError]       = useState(null);

  const [savedRoutines, setSavedRoutines] = useState([]);
  const [saving, setSaving]               = useState(false);
  const [saveSuccess, setSaveSuccess]     = useState(false);
  const [routineTitle, setRoutineTitle]   = useState("My Routine");

  // Load products + categories
  useEffect(() => {
    getProducts({ pageSize: 100 })
      .then(({ products }) => {
        // Drop null entries AND rows missing id (e.g. legacy bad data) so
        // downstream `key={product.id}` reads can never crash on null.
        setAllProducts((products ?? []).filter((p) => p && p.id != null));
      })
      .catch(() => setGenError("Could not load products. Please refresh and try again."))
      .finally(() => setProductsLoading(false));

    supabase.from("categories").select("*").order("name")
      .then(({ data }) => {
        setCategories((data ?? []).filter((c) => c && c.id != null));
      });
  }, []);

  // Load saved routines
  useEffect(() => {
    if (!user) return;
    supabase
      .from("routines")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setSavedRoutines((data ?? []).filter((r) => r && r.id != null));
      });
  }, [user]);

  const toggleProduct = (product) =>
    setSelected((prev) =>
      prev.find((p) => p.id === product.id)
        ? prev.filter((p) => p.id !== product.id)
        : [...prev, product]
    );

  const filteredProducts = allProducts.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat    = !categoryFilter || p.categories?.name === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleGenerate = async () => {
    if (selected.length === 0) return;
    setGenerating(true);
    setGenError(null);
    setRoutine(null);
    setSaveSuccess(false);
    try {
      const result = await generateRoutine(selected);
      setRoutine(result);
      setRoutineTitle(result.title ?? "My Routine");
      setShowModal(true);
    } catch {
      setGenError("Could not generate routine. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!user || !routine) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("routines")
        .insert({
          user_id:  user.id,
          title:    routineTitle,
          products: selected,
          routine,
        })
        .select()
        .single();
      if (error) throw error;
      if (data) setSavedRoutines((prev) => [data, ...prev]);
      setSaveSuccess(true);
    } catch {
      setGenError("Could not save routine. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleLoadSaved = (saved) => {
    setSelected(saved.products ?? []);
    setRoutine(saved.routine);
    setRoutineTitle(saved.title);
    setSaveSuccess(false);
    setShowModal(true);
  };

  const handleDeleteSaved = async (id) => {
    await supabase.from("routines").delete().eq("id", id);
    setSavedRoutines((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="min-h-screen bg-(--color-cream)">
      <SEOMeta
        title="Build Your Skincare Routine"
        description="Build a personalized skincare routine with authentic products from De Lady's Beauty World, a trusted Nigerian beauty store in Abuja."
        canonical="https://deladysbeautyworld.com/routines"
      />

      {/* Routine modal */}
      {showModal && routine && (
        <RoutineModal
          routine={routine}
          routineTitle={routineTitle}
          setRoutineTitle={setRoutineTitle}
          user={user}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
          saving={saving}
          saveSuccess={saveSuccess}
        />
      )}

      {/* Hero */}
      <div className="bg-(--color-cream-dark) border-b border-(--color-border)">
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-14">
          <p className="text-[11px] tracking-[0.14em] uppercase text-(--color-faint) mb-3 font-normal">
            De Lady's Beauty World
          </p>
          <h1 className="font-display text-[40px] md:text-[48px] font-light text-(--color-ink) leading-[1.1] mb-4">
            Your personalised<br /><em>beauty routine</em>
          </h1>
          <p className="text-[14px] text-(--color-muted) font-light leading-[1.8] max-w-lg">
            Select the products you own or want to try, and we'll generate a personalised daily routine just for you.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 md:px-10 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12">

          {/* Left — product picker */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[13px] font-medium text-(--color-ink)">
                Select your products
                {selected.length > 0 && (
                  <span className="ml-2 text-(--color-pink)">({selected.length} selected)</span>
                )}
              </h2>
              {selected.length > 0 && (
                <button
                  onClick={() => setSelected([])}
                  className="text-[11px] text-(--color-faint) hover:text-(--color-pink) transition-colors underline underline-offset-2"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Search */}
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full h-10 border border-(--color-border) rounded-sm px-3 text-[13px] text-(--color-ink) bg-white outline-none focus:border-(--color-pink) transition-colors font-light placeholder-(--color-faint) mb-4"
            />

            {/* Category pills */}
            <div className="flex flex-wrap gap-2 mb-5">
              <button
                onClick={() => setCategoryFilter(null)}
                className={`h-8 px-3 text-[11px] rounded-sm border transition-colors ${
                  !categoryFilter
                    ? "bg-(--color-pink) text-white border-(--color-pink)"
                    : "border-(--color-border) text-(--color-muted) hover:border-(--color-pink) hover:text-(--color-pink)"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.name === categoryFilter ? null : cat.name)}
                  className={`h-8 px-3 text-[11px] rounded-sm border transition-colors ${
                    categoryFilter === cat.name
                      ? "bg-(--color-pink) text-white border-(--color-pink)"
                      : "border-(--color-border) text-(--color-muted) hover:border-(--color-pink) hover:text-(--color-pink)"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Product grid */}
            {productsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-pulse">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-3/4 bg-(--color-border) rounded-sm" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredProducts.map((product) => (
                  <ProductPickerCard
                    key={product.id}
                    product={product}
                    selected={!!selected.find((p) => p.id === product.id)}
                    onToggle={toggleProduct}
                  />
                ))}
                {filteredProducts.length === 0 && (
                  <div className="col-span-3 py-12 text-center">
                    <p className="text-[13px] text-(--color-muted) font-light">
                      No products match your search.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right — sticky panel */}
          <div>
            <div className="sticky top-24 flex flex-col gap-5">

              {/* Selected + generate */}
              <div className="border border-(--color-border) rounded-sm p-5 bg-white">
                <h3 className="text-[11px] tracking-[0.12em] uppercase font-medium text-(--color-ink) mb-4">
                  Selected products
                </h3>

                {selected.length === 0 ? (
                  <p className="text-[12px] text-(--color-faint) font-light mb-4">
                    Pick at least one product to get started.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2 mb-4 max-h-52 overflow-y-auto">
                    {selected.map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-2">
                        <p className="text-[12px] text-(--color-ink) font-light truncate">{p.name}</p>
                        <button
                          onClick={() => toggleProduct(p)}
                          className="text-(--color-faint) hover:text-(--color-pink) transition-colors shrink-0"
                          aria-label="Remove"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={selected.length === 0 || generating}
                  className="w-full h-11 bg-(--color-pink) text-white text-[11px] tracking-widest uppercase font-normal rounded-sm hover:bg-(--color-navy) transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
                      </svg>
                      Generate my routine
                    </>
                  )}
                </button>

                {genError && (
                  <p className="text-[11px] text-red-500 font-light mt-2">{genError}</p>
                )}

                {/* View last routine button */}
                {routine && !showModal && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="w-full h-10 mt-2 border border-(--color-pink) text-(--color-pink) text-[11px] tracking-widest uppercase font-normal rounded-sm hover:bg-(--color-pink-pale) transition-colors"
                  >
                    View last routine
                  </button>
                )}
              </div>

              {/* Saved routines */}
              {user && savedRoutines.length > 0 && (
                <div className="border border-(--color-border) rounded-sm p-5 bg-white">
                  <h3 className="text-[11px] tracking-[0.12em] uppercase font-medium text-(--color-ink) mb-4">
                    Saved routines
                  </h3>
                  <div className="flex flex-col gap-3">
                    {savedRoutines.map((r) => (
                      <SavedRoutineCard
                        key={r.id}
                        routine={r}
                        onLoad={handleLoadSaved}
                        onDelete={handleDeleteSaved}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Sign in nudge for guests */}
              {!user && (
                <div className="border border-(--color-border) rounded-sm p-4 bg-(--color-cream-dark) text-center">
                  <p className="text-[12px] text-(--color-muted) font-light leading-[1.7]">
                    <a href="/login" className="text-(--color-pink) hover:underline underline-offset-2 font-normal">
                      Sign in
                    </a>{" "}
                    to save your generated routines and access them anytime.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
