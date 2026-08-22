import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "../../utils/supabase";
import AdminPageHeader from "./components/AdminPageHeader.jsx";

const CATEGORY_OPTIONS = ["Skincare", "Haircare", "Fragrance", "Body Care", "Makeup", "General"];

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

const inputClass =
  "w-full border border-(--color-border) rounded-sm px-4 text-[13px] text-(--color-ink) placeholder-(--color-faint) bg-white outline-none focus:border-(--color-pink) transition-colors font-light";

export default function JournalEditor() {
  const { id }   = useParams(); // undefined = new post, id = edit
  const navigate = useNavigate();
  const isEdit   = Boolean(id && id !== "new");

  const [form, setForm] = useState({
    title:     "",
    slug:      "",
    excerpt:   "",
    content:   "",
    cover_url: "",
    category:  "Skincare",
    published: false,
  });

  const [loading, setLoading]   = useState(isEdit);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState(null);
  const [slugManual, setSlugManual] = useState(false);

  // Load existing post for edit
  useEffect(() => {
    if (!isEdit) return;
    supabase
      .from("posts")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { navigate("/admin/journal"); return; }
        setForm({
          title:     data.title     ?? "",
          slug:      data.slug      ?? "",
          excerpt:   data.excerpt   ?? "",
          content:   data.content   ?? "",
          cover_url: data.cover_url ?? "",
          category:  data.category  ?? "Skincare",
          published: data.published ?? false,
        });
        setSlugManual(true); // don't auto-overwrite slug on edit
      })
      .catch(() => navigate("/admin/journal"))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));

    // Auto-generate slug from title unless manually edited
    if (name === "title" && !slugManual) {
      setForm((f) => ({ ...f, title: value, slug: slugify(value) }));
    }
  };

  const handleSlugChange = (e) => {
    setSlugManual(true);
    setForm((f) => ({ ...f, slug: slugify(e.target.value) }));
  };

  const handleSave = async (publishOverride = null) => {
    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!form.slug.trim())  { setError("Slug is required."); return; }
    if (!form.content.trim()) { setError("Content is required."); return; }

    setSaving(true);
    setError(null);

    const payload = {
      title:     form.title.trim(),
      slug:      form.slug.trim(),
      excerpt:   form.excerpt.trim() || null,
      content:   form.content.trim(),
      cover_url: form.cover_url.trim() || null,
      category:  form.category,
      published: publishOverride !== null ? publishOverride : form.published,
    };

    try {
      if (isEdit) {
        const { error } = await supabase.from("posts").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("posts").insert(payload);
        if (error) throw error;
      }
      navigate("/admin/journal");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-(--color-border) border-t-(--color-pink) rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative">
      <div aria-hidden className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-(--color-pink-pale) to-transparent pointer-events-none" />

      <div className="relative px-4 sm:px-6 md:px-10 py-8 sm:py-10 max-w-4xl mx-auto">

        <Link
          to="/admin/journal"
          className="text-[11px] tracking-widest uppercase text-(--color-muted) hover:text-(--color-pink) mb-6 inline-block transition-colors"
        >
          ← Back to journal
        </Link>

        <AdminPageHeader
          title={isEdit ? "Edit post" : "New post"}
          subtitle={isEdit ? `Editing: ${form.title || "Untitled"}` : "Write a new journal post"}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">

          {/* Left — main content */}
          <div className="flex flex-col gap-5">

            {/* Title */}
            <div>
              <label className="text-[11px] tracking-widest uppercase text-(--color-faint) block mb-1.5 font-normal">
                Title <span className="text-(--color-pink)">*</span>
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Post title"
                className={`${inputClass} h-11`}
              />
            </div>

            {/* Slug */}
            <div>
              <label className="text-[11px] tracking-widest uppercase text-(--color-faint) block mb-1.5 font-normal">
                Slug <span className="text-(--color-pink)">*</span>
              </label>
              <div className="flex items-center border border-(--color-border) rounded-sm overflow-hidden focus-within:border-(--color-pink) transition-colors bg-white">
                <span className="px-3 text-[12px] text-(--color-faint) font-light bg-(--color-cream-dark) border-r border-(--color-border) h-11 flex items-center shrink-0">
                  /journal/
                </span>
                <input
                  value={form.slug}
                  onChange={handleSlugChange}
                  placeholder="post-slug"
                  className="flex-1 px-3 h-11 text-[13px] text-(--color-ink) bg-transparent outline-none font-light"
                />
              </div>
            </div>

            {/* Excerpt */}
            <div>
              <label className="text-[11px] tracking-widest uppercase text-(--color-faint) block mb-1.5 font-normal">
                Excerpt
              </label>
              <textarea
                name="excerpt"
                value={form.excerpt}
                onChange={handleChange}
                placeholder="Short summary shown on the journal grid (optional)"
                rows={3}
                className={`${inputClass} py-3 resize-none`}
              />
            </div>

            {/* Content */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] tracking-widest uppercase text-(--color-faint) font-normal">
                  Content <span className="text-(--color-pink)">*</span>
                </label>
                <span className="text-[11px] text-(--color-faint) font-light">
                  Use **bold** for headings, blank lines for paragraphs
                </span>
              </div>
              <textarea
                name="content"
                value={form.content}
                onChange={handleChange}
                placeholder={`**Introduction**\n\nWrite your first paragraph here.\n\n**Next section**\n\nContinue writing...`}
                rows={20}
                className={`${inputClass} py-3 resize-y font-mono text-[12px] leading-[1.7]`}
              />
            </div>
          </div>

          {/* Right — settings */}
          <div>
            <div className="sticky top-24 flex flex-col gap-5">

              {/* Publish actions */}
              <div className="bg-white border border-(--color-border) rounded-sm p-5">
                <h3 className="text-[11px] tracking-[0.12em] uppercase font-medium text-(--color-ink) mb-4">
                  Publishing
                </h3>

                <label className="flex items-center gap-3 cursor-pointer mb-5">
                  <input
                    type="checkbox"
                    name="published"
                    checked={form.published}
                    onChange={handleChange}
                    className="w-4 h-4 accent-(--color-pink)"
                  />
                  <span className="text-[13px] text-(--color-muted) font-light">
                    Published
                  </span>
                </label>

                {error && (
                  <p className="text-[12px] text-red-500 font-light mb-3">{error}</p>
                )}

                <button
                  onClick={() => handleSave()}
                  disabled={saving}
                  className="w-full h-10 bg-(--color-pink) text-white text-[11px] tracking-widest uppercase font-normal rounded-sm hover:bg-(--color-navy) transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mb-2"
                >
                  {saving && (
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {isEdit ? "Save changes" : "Save post"}
                </button>

                {!form.published && (
                  <button
                    onClick={() => handleSave(true)}
                    disabled={saving}
                    className="w-full h-10 border border-(--color-pink) text-(--color-pink) text-[11px] tracking-widest uppercase font-normal rounded-sm hover:bg-(--color-pink-pale) transition-colors disabled:opacity-60"
                  >
                    Save & publish
                  </button>
                )}
              </div>

              {/* Category */}
              <div className="bg-white border border-(--color-border) rounded-sm p-5">
                <h3 className="text-[11px] tracking-[0.12em] uppercase font-medium text-(--color-ink) mb-4">
                  Category
                </h3>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className={`${inputClass} h-10`}
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Cover image */}
              <div className="bg-white border border-(--color-border) rounded-sm p-5">
                <h3 className="text-[11px] tracking-[0.12em] uppercase font-medium text-(--color-ink) mb-4">
                  Cover image
                </h3>
                <input
                  name="cover_url"
                  value={form.cover_url}
                  onChange={handleChange}
                  placeholder="https://..."
                  className={`${inputClass} h-10`}
                />
                {form.cover_url && (
                  <div className="mt-3 aspect-video rounded-sm overflow-hidden bg-(--color-cream-mid)">
                    <img
                      src={form.cover_url}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  </div>
                )}
                <p className="text-[11px] text-(--color-faint) font-light mt-2">
                  Paste a Cloudinary or any image URL
                </p>
              </div>

              {/* Preview link */}
              {isEdit && form.slug && (
                <a
                  href={`/journal/${form.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] tracking-widest uppercase text-(--color-muted) hover:text-(--color-pink) transition-colors text-center block"
                >
                  Preview post →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}