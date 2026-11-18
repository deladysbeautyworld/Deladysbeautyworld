import { useEffect, useState } from "react";
import {
  listAdminDeliveryZones,
  createDeliveryZone,
  updateDeliveryZone,
  deleteDeliveryZone,
} from "../../lib/admin.js";
import AdminPageHeader from "./components/AdminPageHeader.jsx";

const fmt = (amount) => `₦${Number(amount).toLocaleString("en-NG")}`;

/**
 * Canonical list of Nigerian states + FCT — keeps the admin modal in sync
 * with Checkout.jsx (which also hardcodes this list).
 */
const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba",
  "Yobe","Zamfara",
];

/**
 * Admin delivery zones — list/create/edit/delete. Each zone groups one or
 * more Nigerian states under a single shipping fee. The states editor is a
 * 36-state checkbox grid with Select all / Clear shortcuts.
 */
export default function DeliveryZones() {
  const [zones, setZones]             = useState([]);
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
        const rows = await listAdminDeliveryZones();
        if (cancelled) return;
        setZones(rows);
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
    const rows = await listAdminDeliveryZones();
    setZones(rows);
  };

  const openCreate = () => {
    setEditing({ zone_name: "", fee: "", states: [] });
    setSubmitError(null);
    setModalOpen(true);
  };

  const openEdit = (zone) => {
    setEditing({
      id:        zone.id,
      zone_name: zone.zone_name,
      fee:       String(zone.fee ?? ""),
      states:    Array.isArray(zone.states) ? zone.states : [],
    });
    setSubmitError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setEditing(null);
  };

  const toggleState = (state) => {
    setEditing((prev) => {
      const has = prev.states.includes(state);
      return {
        ...prev,
        states: has
          ? prev.states.filter((s) => s !== state)
          : [...prev.states, state],
      };
    });
  };

  const setAllStates = (selected) => {
    setEditing((prev) => ({
      ...prev,
      states: selected ? [...NIGERIAN_STATES] : [],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editing) return;

    const zoneName = (editing.zone_name ?? "").trim();
    if (!zoneName) {
      setSubmitError("Zone name is required.");
      return;
    }
    const fee = Number(editing.fee);
    if (!Number.isFinite(fee) || fee < 0) {
      setSubmitError("Fee must be zero or more.");
      return;
    }
    if (!editing.states.length) {
      setSubmitError("Pick at least one state for this zone.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      if (editing.id) {
        await updateDeliveryZone(editing.id, { zone_name: zoneName, fee, states: editing.states });
      } else {
        await createDeliveryZone({ zone_name: zoneName, fee, states: editing.states });
      }
      await reload();
      closeModal();
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (zone) => {
    try {
      await deleteDeliveryZone(zone.id);
      await reload();
      setConfirmDelete(null);
    } catch (err) {
      setConfirmDelete({ ...zone, error: err.message });
    }
  };

  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-(--color-pink-pale) to-transparent pointer-events-none"
      />

      <div className="relative px-4 sm:px-6 md:px-10 py-8 sm:py-10 max-w-6xl mx-auto">

        <AdminPageHeader
          title="Delivery zones"
          subtitle={`${zones.length} ${zones.length === 1 ? "zone" : "zones"} configured`}
          action={
            <button
              onClick={openCreate}
              className="h-11 px-6 bg-(--color-pink) text-white text-[11px] tracking-widest uppercase font-normal rounded-sm hover:bg-(--color-navy) transition-colors"
            >
              + New delivery zone
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
          ) : zones.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-[13px] text-(--color-muted) font-light">
                No delivery zones yet.
              </p>
              <p className="text-[11px] text-(--color-faint) font-light mt-1">
                Add at least one zone so checkout can quote a shipping fee.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-[10px] tracking-[0.12em] uppercase text-(--color-faint) border-b border-(--color-border) bg-(--color-cream-dark)/40">
                    <th className="px-6 py-3 font-normal">Zone name</th>
                    <th className="px-6 py-3 font-normal">Fee</th>
                    <th className="px-6 py-3 font-normal">States</th>
                    <th className="px-6 py-3 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.map((z) => (
                    <tr
                      key={z.id}
                      className="border-b border-(--color-border) last:border-b-0 hover:bg-(--color-pink-pale)/40 transition-colors"
                    >
                      <td className="px-6 py-3 text-(--color-ink) font-normal">
                        {z.zone_name}
                      </td>
                      <td className="px-6 py-3 text-(--color-ink) font-medium">
                        {fmt(z.fee)}
                      </td>
                      <td className="px-6 py-3 text-(--color-muted) font-light">
                        <span title={(z.states ?? []).join(", ")}>
                          {(z.states ?? []).length}{" "}
                          {(z.states ?? []).length === 1 ? "state" : "states"}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => openEdit(z)}
                            className="h-8 px-3 border border-(--color-border) text-(--color-muted) text-[10px] tracking-widest uppercase rounded-sm hover:border-(--color-pink) hover:text-(--color-pink) transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setConfirmDelete(z)}
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
        <DeliveryZoneModal
          editing={editing}
          setEditing={setEditing}
          submitting={submitting}
          submitError={submitError}
          onSubmit={handleSubmit}
          onClose={closeModal}
          onToggleState={toggleState}
          onSelectAll={() => setAllStates(true)}
          onClearAll={() => setAllStates(false)}
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
              Delete delivery zone?
            </h3>
            <p className="text-[13px] text-(--color-muted) font-light mb-1">
              <strong className="font-normal text-(--color-ink)">
                {confirmDelete.zone_name}
              </strong>{" "}
              will be permanently removed.
            </p>
            {confirmDelete.error ? (
              <p className="text-[12px] text-red-500 font-light mt-2 mb-4">
                {confirmDelete.error}
              </p>
            ) : (
              <p className="text-[11px] text-(--color-faint) font-light mb-6">
                Customers in those states will fall back to the next matching zone (or no fee if none).
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

function DeliveryZoneModal({
  editing,
  setEditing,
  submitting,
  submitError,
  onSubmit,
  onClose,
  onToggleState,
  onSelectAll,
  onClearAll,
}) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditing((prev) => ({ ...prev, [name]: value }));
  };

  const isEdit = Boolean(editing.id);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 py-10 overflow-y-auto">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={onSubmit} className="relative bg-white rounded-sm w-full max-w-2xl shadow-xl">
        <div className="px-8 py-5 border-b border-(--color-border) flex items-center justify-between">
          <h3 className="font-display text-[22px] font-light text-(--color-ink)">
            {isEdit ? "Edit delivery zone" : "New delivery zone"}
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

        <div className="px-8 py-6 flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Zone name" required>
              <input
                name="zone_name"
                value={editing.zone_name}
                onChange={handleChange}
                required
                autoFocus
                className={inputClass}
                placeholder="e.g. Lagos Metro"
              />
            </Field>
            <Field label="Fee (₦)" required>
              <input
                name="fee"
                type="number"
                min="0"
                step="0.01"
                value={editing.fee}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder="0"
              />
            </Field>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] tracking-[0.12em] uppercase text-(--color-faint) font-normal">
                States in this zone <span className="text-(--color-pink)">*</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onSelectAll}
                  className="text-[10px] tracking-widest uppercase text-(--color-muted) hover:text-(--color-pink) transition-colors"
                >
                  Select all
                </button>
                <span className="text-(--color-faint)">·</span>
                <button
                  type="button"
                  onClick={onClearAll}
                  className="text-[10px] tracking-widest uppercase text-(--color-muted) hover:text-(--color-pink) transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border border-(--color-border) rounded-sm p-4 max-h-72 overflow-y-auto">
              {NIGERIAN_STATES.map((state) => {
                const checked = editing.states.includes(state);
                return (
                  <label
                    key={state}
                    className={[
                      "flex items-center gap-2 cursor-pointer text-[13px] py-1.5 px-2 rounded-sm transition-colors",
                      checked
                        ? "text-(--color-ink) bg-(--color-pink-pale)"
                        : "text-(--color-muted) hover:text-(--color-ink)",
                    ].join(" ")}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleState(state)}
                      className="w-4 h-4 accent-(--color-pink)"
                    />
                    {state}
                  </label>
                );
              })}
            </div>
            <p className="text-[10px] text-(--color-faint) font-light mt-2">
              {editing.states.length}{" "}
              {editing.states.length === 1 ? "state" : "states"} selected
            </p>
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
            {submitting ? "Saving…" : isEdit ? "Save changes" : "Create zone"}
          </button>
        </div>
      </form>
    </div>
  );
}