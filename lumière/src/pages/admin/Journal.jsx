import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabase";
import AdminPageHeader from "./components/AdminPageHeader.jsx";

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
  }) : "—";

export default function AdminJournal() {
  const navigate = useNavigate();
  const [posts, setPosts]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [search, setSearch]     = useState("");
  const [deleting, setDeleting] = useState(null);

  async function loadPosts() {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("id, title, slug, category, published, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setPosts(data ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(loadPosts, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function togglePublished(post) {
    const { error } = await supabase
      .from("posts")
      .update({ published: !post.published })
      .eq("id", post.id);
    if (!error) {
      setPosts((prev) =>
        prev.map((p) => p.id === post.id ? { ...p, published: !p.published } : p)
      );
    }
  }

  async function deletePost(id) {
    setDeleting(id);
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (!error) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
    }
    setDeleting(null);
  }

  const filtered = posts.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      <div aria-hidden className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-(--color-pink-pale) to-transparent pointer-events-none" />

      <div className="relative px-4 sm:px-6 md:px-10 py-8 sm:py-10 max-w-6xl mx-auto">

        <AdminPageHeader
          title="Journal"
          subtitle={`${posts.length} ${posts.length === 1 ? "post" : "posts"}`}
          action={
            <Link
              to="/admin/journal/new"
              className="h-9 px-5 bg-(--color-pink) text-white text-[11px] tracking-widest uppercase rounded-sm hover:bg-(--color-navy) transition-colors flex items-center gap-2"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New post
            </Link>
          }
        />

        {/* Search */}
        <div className="mb-6">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts…"
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
          ) : filtered.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-[13px] text-(--color-muted) font-light mb-4">
                {search ? "No posts match your search." : "No posts yet."}
              </p>
              {!search && (
                <Link
                  to="/admin/journal/new"
                  className="text-[11px] tracking-widest uppercase text-(--color-pink) hover:underline underline-offset-2"
                >
                  Create your first post →
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-[10px] tracking-[0.12em] uppercase text-(--color-faint) border-b border-(--color-border) bg-(--color-cream-dark)/40">
                    <th className="px-6 py-3 font-normal">Title</th>
                    <th className="px-6 py-3 font-normal">Category</th>
                    <th className="px-6 py-3 font-normal">Date</th>
                    <th className="px-6 py-3 font-normal">Status</th>
                    <th className="px-6 py-3 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((post) => (
                    <tr
                      key={post.id}
                      className="border-b border-(--color-border) last:border-b-0 hover:bg-(--color-pink-pale)/40 transition-colors"
                    >
                      <td className="px-6 py-3">
                        <p className="text-(--color-ink) font-normal truncate max-w-xs">{post.title}</p>
                        <p className="text-[11px] text-(--color-faint) font-light mt-0.5">/journal/{post.slug}</p>
                      </td>
                      <td className="px-6 py-3 text-(--color-muted) font-light">{post.category}</td>
                      <td className="px-6 py-3 text-(--color-muted) font-light">{formatDate(post.created_at)}</td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => togglePublished(post)}
                          className={`text-[10px] tracking-[0.08em] uppercase px-2.5 py-1 rounded-sm font-normal transition-colors ${
                            post.published
                              ? "bg-green-50 text-green-700 hover:bg-green-100"
                              : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                          }`}
                        >
                          {post.published ? "Published" : "Draft"}
                        </button>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <a
                            href={`/journal/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-(--color-muted) hover:text-(--color-pink) transition-colors"
                          >
                            View
                          </a>
                          <button
                            onClick={() => navigate(`/admin/journal/${post.id}/edit`)}
                            className="text-[11px] text-(--color-muted) hover:text-(--color-pink) transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm("Delete this post? This cannot be undone.")) {
                                deletePost(post.id);
                              }
                            }}
                            disabled={deleting === post.id}
                            className="text-[11px] text-(--color-muted) hover:text-red-500 transition-colors disabled:opacity-50"
                          >
                            {deleting === post.id ? "Deleting…" : "Delete"}
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
    </div>
  );
}