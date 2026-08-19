import { useState, useEffect, useCallback } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuthStore } from "./../../stores/authStore";
import { supabase } from "./../../utils/supabase";
import { getUserOrders } from "./../../lib/admin";

const fmt  = (amount) => `₦${Number(amount).toLocaleString("en-NG")}`;
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
  });

const TABS = ["Details", "Orders", "Routines", "Security"];

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba",
  "Yobe","Zamfara",
];

const STATUS_STYLES = {
  pending:   "bg-amber-50 text-amber-700",
  confirmed: "bg-blue-50 text-blue-700",
  shipped:   "bg-purple-50 text-purple-700",
  delivered: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-700",
};

const inputClass =
  "w-full h-11 border border-(--color-border) rounded-sm px-4 text-[13px] text-(--color-ink) placeholder-[var(--color-faint)] bg-white outline-none focus:border-(--color-pink) transition-colors font-light";

function Field({ label, children }) {
  return (
    <div>
      <label className="text-[11px] tracking-widest uppercase text-(--color-faint) block mb-1.5 font-normal">
        {label}
      </label>
      {children}
    </div>
  );
}

/* ── Details tab ── */
function DetailsTab({ user, profile, onSaved }) {
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? "",
    phone:     profile?.phone     ?? "",
    address:   profile?.address   ?? "",
    city:      profile?.city      ?? "",
    state:     profile?.state     ?? "",
  });
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState(null);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id:        user.id,
          email:     user.email,
          full_name: form.full_name,
          phone:     form.phone     || null,
          address:   form.address   || null,
          city:      form.city      || null,
          state:     form.state     || null,
        });
      if (error) throw error;
      setSuccess(true);
      onSaved(form);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[13px] font-medium text-(--color-ink) mb-5">
          Personal information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full name">
            <input
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Your full name"
              className={inputClass}
            />
          </Field>
          <Field label="Email address">
            <input
              value={user.email}
              disabled
              className={`${inputClass} bg-(--color-cream-dark) cursor-not-allowed text-(--color-faint)`}
            />
          </Field>
          <Field label="Phone number">
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="080XXXXXXXX"
              className={inputClass}
            />
          </Field>
        </div>
      </div>

      <div className="border-t border-(--color-border) pt-6">
        <h2 className="text-[13px] font-medium text-(--color-ink) mb-5">
          Saved delivery address
        </h2>
        <p className="text-[12px] text-(--color-faint) font-light mb-4">
          This will be pre-filled at checkout to save you time.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Street address">
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Street address"
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="City">
            <input
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="e.g. Warri"
              className={inputClass}
            />
          </Field>
          <Field label="State">
            <select
              name="state"
              value={form.state}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">Select state</option>
              {NIGERIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {error && (
        <p className="text-[12px] text-red-500 font-light">{error}</p>
      )}

      {success && (
        <p className="text-[12px] text-green-600 font-light">
          ✓ Profile saved successfully.
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="self-start h-11 px-8 bg-(--color-pink) text-white text-[11px] tracking-widest uppercase font-normal rounded-sm hover:bg-(--color-navy) transition-colors disabled:opacity-60 flex items-center gap-2"
      >
        {saving && (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
        Save changes
      </button>
    </div>
  );
}

/* ── Orders tab ── */
function OrdersTab({ userId }) {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserOrders(userId)
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-3 animate-pulse">
        {[1,2,3].map((i) => (
          <div key={i} className="h-20 bg-(--color-border) rounded-sm" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="font-display text-[22px] font-light text-(--color-ink) mb-2">
          No orders yet
        </p>
        <p className="text-[13px] text-(--color-muted) font-light">
          Your orders will appear here once you make a purchase.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {orders.map((order) => {
        const itemCount = order.order_items?.reduce((s, i) => s + i.quantity, 0) ?? 0;
        return (
          <div key={order.id} className="border border-(--color-border) rounded-sm p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <p className="text-[11px] tracking-[0.08em] uppercase text-(--color-faint) mb-1 font-normal">
                  Order · {fmtDate(order.created_at)}
                </p>
                <p className="text-[12px] font-mono text-(--color-muted)">
                  {order.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <span className={`text-[10px] tracking-[0.08em] uppercase px-2.5 py-1 rounded-sm font-normal ${STATUS_STYLES[order.status] ?? "bg-gray-50 text-gray-600"}`}>
                {order.status}
              </span>
            </div>

            {/* Product thumbnails */}
            {order.order_items?.length > 0 && (
              <div className="flex gap-2 mb-3">
                {order.order_items.slice(0, 4).map((item, i) => (
                  <div
                    key={i}
                    className="w-12 h-12 bg-(--color-cream-mid) rounded-sm overflow-hidden flex items-center justify-center shrink-0"
                  >
                    {item.products?.image_url ? (
                      <img
                        src={item.products.image_url}
                        alt={item.products.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-4 h-7 bg-(--color-stone) rounded-[8px_8px_2px_2px] opacity-40" />
                    )}
                  </div>
                ))}
                {order.order_items.length > 4 && (
                  <div className="w-12 h-12 bg-(--color-cream-dark) rounded-sm flex items-center justify-center text-[11px] text-(--color-muted) font-normal shrink-0">
                    +{order.order_items.length - 4}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between border-t border-(--color-border) pt-3">
              <p className="text-[12px] text-(--color-muted) font-light">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </p>
              <p className="text-[14px] font-medium text-(--color-ink)">
                {fmt(order.total)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Security tab ── */
function SecurityTab({ user }) {
  const [form, setForm]       = useState({ password: "", confirm: "" });
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState(null);
  const signOut               = useAuthStore((s) => s.signOut);
  const navigate              = useNavigate();

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handlePasswordChange = async () => {
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { error } = await supabase.auth.updateUser({
        password: form.password,
      });
      if (error) throw error;
      setSuccess(true);
      setForm({ password: "", confirm: "" });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Account info */}
      <div className="bg-(--color-cream-dark) rounded-sm px-5 py-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-(--color-pink) flex items-center justify-center text-white text-[16px] font-medium shrink-0">
          {user?.user_metadata?.full_name?.[0] ?? user?.email?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="text-[14px] font-normal text-(--color-ink)">
            {user?.user_metadata?.full_name ?? "Your account"}
          </p>
          <p className="text-[12px] text-(--color-muted) font-light">{user?.email}</p>
        </div>
      </div>

      {/* Change password */}
      <div>
        <h2 className="text-[13px] font-medium text-(--color-ink) mb-1">
          Change password
        </h2>
        <p className="text-[12px] text-(--color-faint) font-light mb-5">
          Leave blank if you signed in with Google.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="New password">
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min. 6 characters"
              className={inputClass}
            />
          </Field>
          <Field label="Confirm password">
            <input
              name="confirm"
              type="password"
              value={form.confirm}
              onChange={handleChange}
              placeholder="Repeat new password"
              className={inputClass}
            />
          </Field>
        </div>

        {error && (
          <p className="text-[12px] text-red-500 font-light mt-3">{error}</p>
        )}
        {success && (
          <p className="text-[12px] text-green-600 font-light mt-3">
            ✓ Password updated successfully.
          </p>
        )}

        <button
          onClick={handlePasswordChange}
          disabled={saving || !form.password}
          className="mt-4 h-11 px-8 bg-(--color-ink) text-(--color-cream) text-[11px] tracking-widest uppercase font-normal rounded-sm hover:bg-(--color-ink-soft) transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving && (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          Update password
        </button>
      </div>

      {/* Sign out */}
      <div className="border-t border-(--color-border) pt-6">
        <h2 className="text-[13px] font-medium text-(--color-ink) mb-1">
          Sign out
        </h2>
        <p className="text-[12px] text-(--color-faint) font-light mb-4">
          You'll need to sign in again to access your account.
        </p>
        <button
          onClick={handleSignOut}
          className="h-11 px-8 border border-(--color-border) text-(--color-muted) text-[11px] tracking-widest uppercase font-normal rounded-sm hover:border-red-300 hover:text-red-500 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

/* ── Saved routines tab ── */
function RoutinesTab({ userId }) {
  const [routines, setRoutines]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [openId, setOpenId]       = useState(null);
  const [error, setError]         = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("routines")
      .select("id, title, products, routine, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (err) {
      console.error("Failed to load routines:", err);
      setError(err.message);
    } else {
      // Defensive: drop nulls / rows without an id so we never crash on render.
      setRoutines((data ?? []).filter((r) => r && r.id != null));
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { if (userId) load(); }, [userId, load]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this routine?")) return;
    const { error: err } = await supabase.from("routines").delete().eq("id", id);
    if (err) {
      console.error("Failed to delete routine:", err);
      setError(err.message);
      return;
    }
    setRoutines((prev) => prev.filter((r) => r.id !== id));
    if (openId === id) setOpenId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-(--color-border) border-t-(--color-pink) rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-[12px] text-red-500 font-light">Could not load routines: {error}</p>
    );
  }

  if (routines.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-(--color-border) rounded-sm">
        <p className="text-[13px] text-(--color-muted) font-light mb-3">
          You haven't saved any routines yet.
        </p>
        <a
          href="/routines"
          className="inline-block h-9 px-5 leading-9 bg-(--color-pink) text-white text-[11px] tracking-widest uppercase font-normal rounded-sm hover:bg-(--color-navy) transition-colors"
        >
          Generate a routine
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {routines.map((r) => (
        <RoutineCard
          key={r.id}
          routine={r}
          isOpen={openId === r.id}
          onToggle={() => setOpenId(openId === r.id ? null : r.id)}
          onDelete={() => handleDelete(r.id)}
        />
      ))}
    </div>
  );
}

function RoutineCard({ routine, isOpen, onToggle, onDelete }) {
  const sections = [
    { key: "morning", label: "☀️ Morning", steps: routine.routine?.morning ?? [] },
    { key: "evening", label: "🌙 Evening", steps: routine.routine?.evening ?? [] },
    { key: "weekly",  label: "📅 Weekly",  steps: routine.routine?.weekly  ?? [] },
  ].filter((s) => s.steps.length > 0);

  return (
    <div className="border border-(--color-border) rounded-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 p-4 bg-white">
        <button
          onClick={onToggle}
          className="flex-1 min-w-0 text-left"
        >
          <p className="text-[14px] font-normal text-(--color-ink) truncate">
            {routine.title || "Untitled routine"}
          </p>
          <p className="text-[11px] text-(--color-faint) font-light mt-0.5">
            {fmtDate(routine.created_at)} · {routine.products?.length ?? 0} products
          </p>
        </button>
        <button
          onClick={onDelete}
          className="shrink-0 h-8 px-3 text-[10px] tracking-widest uppercase border border-(--color-border) text-(--color-muted) rounded-sm hover:border-red-300 hover:text-red-500 transition-colors"
        >
          Delete
        </button>
      </div>

      {/* Body */}
      {isOpen && (
        <div className="border-t border-(--color-border) px-4 py-4 bg-(--color-cream-dark) flex flex-col gap-5">
          {routine.routine?.skin_tip && (
            <p className="text-[12px] text-(--color-muted) font-light italic leading-[1.7]">
              {routine.routine.skin_tip}
            </p>
          )}

          {sections.map((s) => (
            <div key={s.key}>
              <h4 className="text-[11px] tracking-[0.12em] uppercase font-medium text-(--color-ink) mb-3">
                {s.label}
              </h4>
              <div className="flex flex-col">
                {s.steps.map((step, i) => (
                  <div key={i} className="flex gap-3 pb-3 border-b border-(--color-border) last:border-b-0 last:pb-0">
                    <div className="w-6 h-6 rounded-full bg-(--color-pink) text-white text-[10px] font-medium flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-(--color-ink)">{step.action}</p>
                      {step.product && (
                        <p className="text-[11px] text-(--color-pink) font-light mt-0.5">{step.product}</p>
                      )}
                      <p className="text-[12px] text-(--color-muted) font-light mt-1 leading-[1.6]">{step.tip}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Products used */}
          {routine.products?.length > 0 && (
            <div>
              <h4 className="text-[11px] tracking-[0.12em] uppercase font-medium text-(--color-ink) mb-2">
                Products used
              </h4>
              <ul className="flex flex-col gap-1">
                {routine.products.map((p, i) => (
                  <li key={i} className="text-[12px] text-(--color-muted) font-light">
                    · {p.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main Profile page ── */
export default function Profile() {
  const user    = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);

  const [activeTab, setActiveTab] = useState("Details");
  const [profile, setProfile]     = useState(null);

  useEffect(() => {
    if (!user) return;

    async function loadProfile() {
      // Read the row if it exists. PGRST116 = no rows, which is fine —
      // the signup flow may not have mirrored the user yet.
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Failed to load profile:", error);
        setProfile(null);
        return;
      }

      if (!data) {
        // Auto-create a profile row for users who signed up before this
        // existed (or whose signup mirror failed). This satisfies the
        // routines.user_id foreign key too.
        const { data: created, error: createErr } = await supabase
          .from("profiles")
          .insert({
            id:        user.id,
            email:     user.email,
            full_name: user.user_metadata?.full_name ?? null,
          })
          .select()
          .maybeSingle();
        if (createErr) console.error("Failed to create profile row:", createErr);
        setProfile(created ?? null);
        return;
      }

      setProfile(data);
    }

    loadProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-(--color-border) border-t-(--color-pink) rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="px-6 md:px-10 py-12 max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-[34px] font-light text-(--color-ink)">
          My account
        </h1>
        <p className="text-[13px] text-(--color-muted) font-light mt-1">
          {user.email}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-(--color-border) mb-8 gap-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-[12px] tracking-[0.08em] uppercase font-normal transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "border-(--color-pink) text-(--color-pink)"
                : "border-transparent text-(--color-faint) hover:text-(--color-ink)"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "Details" && (
        <DetailsTab
          user={user}
          profile={profile}
          onSaved={(updated) => setProfile((p) => ({ ...p, ...updated }))}
        />
      )}
      {activeTab === "Orders" && <OrdersTab userId={user.id} />}
      {activeTab === "Routines" && <RoutinesTab userId={user.id} />}
      {activeTab === "Security" && <SecurityTab user={user} />}
    </div>
  );
}