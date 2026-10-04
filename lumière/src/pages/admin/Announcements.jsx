import { useEffect, useState } from "react";
import {
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  updateAnnouncement,
} from "../../lib/admin.js";
import AdminPageHeader from "./components/AdminPageHeader.jsx";

const EMPTY_FORM = { title: "", message: "", active: true };
const inputClass =
  "w-full border border-(--color-border) rounded-sm px-4 py-3 text-[13px] text-(--color-ink) placeholder-(--color-faint) bg-white outline-none focus:border-(--color-pink) transition-colors font-light";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const reload = async () => {
    const rows = await listAnnouncements();
    setAnnouncements(rows);
  };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const rows = await listAnnouncements();
        if (!cancelled) setAnnouncements(rows);
      } catch (loadError) {
        if (!cancelled) setError(loadError.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const openCreate = () => setEditing({ id: null, ...EMPTY_FORM });
  const openEdit = (announcement) =>
    setEditing({
      id: announcement.id,
      title: announcement.title,
      message: announcement.message,
      active: announcement.active,
    });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!editing) return;

    const title = editing.title.trim();
    const message = editing.message.trim();
    if (!title || !message) {
      setError("Add a title and message before saving.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = { title, message, active: editing.active };
      if (editing.id) {
        await updateAnnouncement(editing.id, payload);
      } else {
        await createAnnouncement(payload);
      }
      await reload();
      setEditing(null);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (announcement) => {
    setError(null);
    try {
      await updateAnnouncement(announcement.id, {
        title: announcement.title,
        message: announcement.message,
        active: !announcement.active,
      });
      await reload();
    } catch (toggleError) {
      setError(toggleError.message);
    }
  };

  const handleDelete = async (announcement) => {
    setError(null);
    try {
      await deleteAnnouncement(announcement.id);
      await reload();
      setConfirmDelete(null);
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-(--color-pink-pale) to-transparent pointer-events-none"
      />
      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 md:px-10">
        <AdminPageHeader
          title="Store announcements"
          subtitle="Publish important updates for visitors to your storefront."
          action={
            <button
              type="button"
              onClick={openCreate}
              className="h-11 rounded-sm bg-(--color-pink) px-6 text-[11px] font-normal uppercase tracking-widest text-white transition-colors hover:bg-(--color-navy)"
            >
              + New announcement
            </button>
          }
        />
        <p className="mb-5 text-[11px] font-light text-(--color-faint)">
          If multiple announcements are published, the most recently updated
          one is shown to visitors.
        </p>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700"
          >
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-sm border border-(--color-border) bg-white">
          {loading ? (
            <div className="flex justify-center px-6 py-12">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-(--color-border) border-t-(--color-pink)" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-[13px] font-light text-(--color-muted)">
                No announcements yet.
              </p>
              <p className="mt-1 text-[11px] font-light text-(--color-faint)">
                Create one when you have important news to share.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-(--color-border) bg-(--color-cream-dark)/40 text-left text-[10px] uppercase tracking-[0.12em] text-(--color-faint)">
                    <th className="px-6 py-3 font-normal">Announcement</th>
                    <th className="px-6 py-3 font-normal">Last updated</th>
                    <th className="px-6 py-3 font-normal">Published</th>
                    <th className="px-6 py-3 text-right font-normal">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {announcements.map((announcement) => (
                    <tr
                      key={announcement.id}
                      className="border-b border-(--color-border) last:border-b-0"
                    >
                      <td className="max-w-md px-6 py-4">
                        <p className="font-medium text-(--color-ink)">
                          {announcement.title}
                        </p>
                        <p className="mt-1 truncate text-[12px] font-light text-(--color-muted)">
                          {announcement.message}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-[12px] font-light text-(--color-muted)">
                        {new Date(announcement.updated_at).toLocaleDateString(
                          "en-NG",
                          { day: "numeric", month: "short", year: "numeric" }
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={announcement.active}
                          aria-label={`${
                            announcement.active ? "Unpublish" : "Publish"
                          } ${announcement.title}`}
                          onClick={() => handleToggle(announcement)}
                          className={[
                            "relative h-5 w-10 rounded-full transition-colors",
                            announcement.active
                              ? "bg-(--color-pink)"
                              : "bg-(--color-border)",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                              announcement.active ? "left-5" : "left-0.5",
                            ].join(" ")}
                          />
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openEdit(announcement)}
                          className="mr-2 h-8 px-3 text-[10px] uppercase tracking-widest text-(--color-muted) transition-colors hover:text-(--color-pink)"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(announcement)}
                          className="h-8 px-3 text-[10px] uppercase tracking-widest text-(--color-muted) transition-colors hover:text-red-500"
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

      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-10">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !saving && setEditing(null)}
          />
          <form
            onSubmit={handleSubmit}
            className="relative w-full max-w-lg rounded-sm bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-(--color-border) px-8 py-5">
              <h2 className="font-display text-[22px] font-light text-(--color-ink)">
                {editing.id ? "Edit announcement" : "New announcement"}
              </h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                aria-label="Close"
                className="text-xl leading-none text-(--color-faint) hover:text-(--color-ink)"
              >
                ×
              </button>
            </div>
            <div className="flex flex-col gap-5 px-8 py-6">
              <label className="text-[10px] uppercase tracking-[0.12em] text-(--color-faint)">
                Title
                <input
                  name="title"
                  value={editing.title}
                  onChange={(event) =>
                    setEditing((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  maxLength={120}
                  required
                  autoFocus
                  className={`${inputClass} mt-1.5`}
                  placeholder="e.g. Temporary delivery update"
                />
              </label>
              <label className="text-[10px] uppercase tracking-[0.12em] text-(--color-faint)">
                Message
                <textarea
                  name="message"
                  value={editing.message}
                  onChange={(event) =>
                    setEditing((current) => ({
                      ...current,
                      message: event.target.value,
                    }))
                  }
                  maxLength={2000}
                  required
                  rows={5}
                  className={`${inputClass} mt-1.5 resize-y`}
                  placeholder="Write the update customers need to know."
                />
              </label>
              <label className="flex items-center gap-3 text-[12px] text-(--color-muted)">
                <input
                  type="checkbox"
                  checked={editing.active}
                  onChange={(event) =>
                    setEditing((current) => ({
                      ...current,
                      active: event.target.checked,
                    }))
                  }
                  className="accent-(--color-pink)"
                />
                Publish immediately
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  disabled={saving}
                  className="h-11 flex-1 rounded-sm border border-(--color-border) text-[11px] uppercase tracking-widest text-(--color-muted) hover:border-(--color-pink) hover:text-(--color-pink) disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-11 flex-1 rounded-sm bg-(--color-pink) text-[11px] uppercase tracking-widest text-white hover:bg-(--color-navy) disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save announcement"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setConfirmDelete(null)}
          />
          <div className="relative w-full max-w-sm rounded-sm bg-white p-8 shadow-xl">
            <h2 className="mb-2 font-display text-[20px] font-light text-(--color-ink)">
              Delete announcement?
            </h2>
            <p className="mb-6 text-[13px] font-light text-(--color-muted)">
              “{confirmDelete.title}” will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="h-11 flex-1 rounded-sm border border-(--color-border) text-[11px] uppercase tracking-widest text-(--color-muted)"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDelete)}
                className="h-11 flex-1 rounded-sm bg-red-500 text-[11px] uppercase tracking-widest text-white hover:bg-red-600"
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
