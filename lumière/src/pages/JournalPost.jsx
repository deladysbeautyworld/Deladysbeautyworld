import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import SEOMeta from "../utils/seo";
import { getCanonicalUrl } from "../utils/seoConfig";

function renderContent(content) {
  if (!content) return null;

  // Split by double newlines into paragraphs
  return content.split("\n\n").map((block, i) => {
    // Bold headings — lines starting with **
    if (block.startsWith("**") && block.endsWith("**")) {
      return (
        <h3 key={i} className="font-display text-[20px] font-light text-(--color-ink) mt-8 mb-3">
          {block.replace(/\*\*/g, "")}
        </h3>
      );
    }

    // Process inline bold within paragraphs
    const parts = block.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className="text-[14px] text-(--color-muted) font-light leading-[1.9] mb-4">
        {parts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <strong key={j} className="font-medium text-(--color-ink)">
              {part.replace(/\*\*/g, "")}
            </strong>
          ) : (
            part
          )
        )}
      </p>
    );
  });
}

export default function JournalPost() {
  const { slug }   = useParams();
  const navigate   = useNavigate();
  const [post, setPost]       = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("posts")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { navigate("/journal"); return; }
        setPost(data);

        // Load related posts from same category
        return supabase
          .from("posts")
          .select("id, title, slug, excerpt, category, created_at")
          .eq("published", true)
          .eq("category", data.category)
          .neq("slug", slug)
          .limit(3);
      })
      .then((res) => {
        if (res?.data) setRelated(res.data);
      })
      .catch(() => navigate("/journal"))
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-6 md:px-10 py-16 animate-pulse">
        <div className="h-3 w-24 bg-(--color-border) rounded mb-6" />
        <div className="h-10 w-3/4 bg-(--color-border) rounded mb-4" />
        <div className="h-3 w-48 bg-(--color-border) rounded mb-12" />
        <div className="aspect-video bg-(--color-border) rounded-sm mb-10" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-3 bg-(--color-border) rounded mb-3 last:w-2/3" />
        ))}
      </div>
    );
  }

  if (!post) return null;

  const date = new Date(post.created_at).toLocaleDateString("en-NG", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="min-h-screen bg-(--color-cream)">
      <SEOMeta
        title={post.title}
        description={post.excerpt || `Read ${post.title} in the De Lady's Beauty World journal.`}
        canonical={getCanonicalUrl(`/journal/${post.slug}`)}
        ogImage={post.cover_url || undefined}
        ogType="article"
      />
      <div className="max-w-2xl mx-auto px-6 md:px-10 py-12">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[11px] tracking-[0.08em] uppercase text-(--color-faint) mb-8">
          <Link to="/" className="hover:text-(--color-pink) transition-colors">Home</Link>
          <span>/</span>
          <Link to="/journal" className="hover:text-(--color-pink) transition-colors">Journal</Link>
          <span>/</span>
          <span className="text-(--color-ink) truncate max-w-50">{post.title}</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[11px] tracking-widest uppercase text-(--color-pink) font-normal">
              {post.category}
            </span>
            <span className="text-(--color-border)">·</span>
            <span className="text-[12px] text-(--color-faint) font-light">{date}</span>
          </div>
          <h1 className="font-display text-[32px] md:text-[40px] font-light text-(--color-ink) leading-[1.15]">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-[15px] text-(--color-muted) font-light leading-[1.7] mt-4 border-l-2 border-(--color-pink) pl-4">
              {post.excerpt}
            </p>
          )}
        </div>

        {/* Cover image */}
        {post.cover_url && (
          <div className="aspect-video bg-(--color-cream-mid) rounded-sm overflow-hidden mb-10">
            <img
              src={post.cover_url}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <article className="mb-16">
          {renderContent(post.content)}
        </article>

        {/* Back link */}
        <Link
          to="/journal"
          className="inline-flex items-center gap-2 text-[11px] tracking-widest uppercase text-(--color-muted) hover:text-(--color-pink) transition-colors border-b border-(--color-border) pb-16"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Back to Journal
        </Link>

        {/* Related posts */}
        {related.length > 0 && (
          <div className="border-t border-(--color-border) pt-12">
            <h2 className="font-display text-[24px] font-light text-(--color-ink) mb-8">
              More in {post.category}
            </h2>
            <div className="flex flex-col gap-5">
              {related.map((r) => (
                <Link
                  key={r.id}
                  to={`/journal/${r.slug}`}
                  className="group flex items-start gap-4 py-4 border-b border-(--color-border) last:border-b-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] tracking-widest uppercase text-(--color-pink) font-normal mb-1">
                      {r.category}
                    </p>
                    <p className="text-[14px] font-normal text-(--color-ink) group-hover:text-(--color-pink) transition-colors leading-snug">
                      {r.title}
                    </p>
                    <p className="text-[12px] text-(--color-faint) font-light mt-1 line-clamp-2">
                      {r.excerpt}
                    </p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-(--color-faint) group-hover:text-(--color-pink) transition-colors shrink-0 mt-1">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
