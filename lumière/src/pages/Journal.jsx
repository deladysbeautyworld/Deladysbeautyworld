import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../utils/supabase";

const CATEGORIES = ["All", "Skincare", "Haircare", "Fragrance", "Body Care"];

function PostCard({ post }) {
  const date = new Date(post.created_at).toLocaleDateString("en-NG", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <Link
      to={`/journal/${post.slug}`}
      className="group flex flex-col bg-white border border-(--color-border) rounded-sm overflow-hidden hover:shadow-md transition-shadow duration-300"
    >
      {/* Cover image */}
      <div className="aspect-video bg-(--color-cream-mid) overflow-hidden flex items-center justify-center">
        {post.cover_url ? (
          <img
            src={post.cover_url}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-30">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-(--color-stone)">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[10px] tracking-widest uppercase text-(--color-pink) font-normal">
            {post.category}
          </span>
          <span className="text-(--color-border)">·</span>
          <span className="text-[11px] text-(--color-faint) font-light">{date}</span>
        </div>

        <h2 className="font-display text-[18px] font-light text-(--color-ink) leading-snug mb-3 group-hover:text-(--color-pink) transition-colors">
          {post.title}
        </h2>

        <p className="text-[13px] text-(--color-muted) font-light leading-[1.7] flex-1 line-clamp-3">
          {post.excerpt}
        </p>

        <div className="flex items-center gap-1.5 mt-4 text-(--color-pink)">
          <span className="text-[11px] tracking-[0.08em] uppercase font-normal">Read more</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-(--color-border) rounded-sm overflow-hidden animate-pulse">
      <div className="aspect-video bg-(--color-border)" />
      <div className="p-5 flex flex-col gap-3">
        <div className="h-2 w-20 bg-(--color-border) rounded" />
        <div className="h-5 w-3/4 bg-(--color-border) rounded" />
        <div className="h-3 w-full bg-(--color-border) rounded" />
        <div className="h-3 w-2/3 bg-(--color-border) rounded" />
      </div>
    </div>
  );
}

export default function Journal() {
  const [posts, setPosts]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    supabase
      .from("posts")
      .select("id, title, slug, excerpt, cover_url, category, created_at")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => setPosts(data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeCategory === "All"
    ? posts
    : posts.filter((p) => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-(--color-cream)">

      {/* Hero */}
      <div className="bg-(--color-cream-dark) border-b border-(--color-border)">
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-14">
          <p className="text-[11px] tracking-[0.14em] uppercase text-(--color-faint) mb-3 font-normal">
            De Lady's Beauty World
          </p>
          <h1 className="font-display text-[40px] md:text-[48px] font-light text-(--color-ink) leading-[1.1] mb-4">
            The Journal
          </h1>
          <p className="text-[14px] text-(--color-muted) font-light leading-[1.8] max-w-lg">
            Beauty tips, skincare guides, and expert advice — written for Nigerian women, by people who understand your skin.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 md:px-10 py-12">

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`h-9 px-4 text-[11px] tracking-[0.06em] uppercase rounded-sm border transition-colors font-normal ${
                activeCategory === cat
                  ? "bg-(--color-pink) text-white border-(--color-pink)"
                  : "border-(--color-border) text-(--color-muted) hover:border-(--color-pink) hover:text-(--color-pink)"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-display text-[24px] font-light text-(--color-ink) mb-2">
              No articles yet
            </p>
            <p className="text-[13px] text-(--color-muted) font-light">
              Check back soon — new content is on the way.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}