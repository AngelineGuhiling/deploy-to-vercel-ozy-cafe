"use client";

import { useEffect, useState } from "react";

interface Review {
  id: number;
  menu_item_id: number;
  user_id: number;
  customer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
  item_name: string;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [filterRating, setFilterRating] = useState("all");
  const [search, setSearch] = useState("");

  const fetchReviews = async () => {
    try {
      const res = await fetch("/api/reviews?all=1");
      if (res.ok) setReviews(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  };

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) setUser(await res.json());
    } catch {}
  };

  useEffect(() => {
    fetchUser();
    fetchReviews();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this review?")) return;
    try {
      const res = await fetch(`/api/reviews?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchReviews();
    } catch {}
  };

  const filtered = reviews.filter((r) => {
    if (filterRating !== "all" && r.rating !== parseInt(filterRating)) return false;
    if (search && !r.customer_name.toLowerCase().includes(search.toLowerCase()) && !r.item_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-coffee-primary">
        <svg className="animate-spin w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading reviews...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-coffee-dark">Reviews</h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-coffee-primary text-coffee-cream rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl font-bold">{reviews.length}</div>
          <div className="text-sm opacity-80">Total</div>
        </div>
        <div className="bg-yellow-500 text-white rounded-xl p-4 text-center shadow-sm">
          <div className="text-2xl font-bold">⭐ {avgRating}</div>
          <div className="text-sm opacity-80">Average</div>
        </div>
        {ratingCounts.slice(0, 2).map((rc) => (
          <div key={rc.star} className="bg-coffee-accent text-coffee-dark rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold">{rc.count}</div>
            <div className="text-sm opacity-80">{rc.star}-Star</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-coffee-light p-4 space-y-2">
        <div className="text-xs font-semibold text-coffee-dark mb-2">Rating Breakdown</div>
        {ratingCounts.map((rc) => (
          <div key={rc.star} className="flex items-center gap-2 text-sm">
            <span className="w-6 text-right text-coffee-primary">{rc.star}★</span>
            <div className="flex-1 h-2 bg-coffee-light rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 rounded-full transition-all"
                style={{ width: reviews.length ? `${(rc.count / reviews.length) * 100}%` : "0%" }}
              />
            </div>
            <span className="w-6 text-right text-coffee-primary/60">{rc.count}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer or item..."
          className="flex-1 px-4 py-2 border border-coffee-light rounded-lg focus:ring-2 focus:ring-coffee-accent outline-none text-sm"
        />
        <div className="flex gap-2">
          {["all", "5", "4", "3", "2", "1"].map((r) => (
            <button
              key={r}
              onClick={() => setFilterRating(r)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${
                filterRating === r
                  ? "bg-coffee-primary text-coffee-cream"
                  : "bg-coffee-light text-coffee-primary hover:bg-coffee-secondary"
              }`}
            >
              {r === "all" ? "All" : `${r}★`}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-coffee-light p-8 text-center text-coffee-primary/50">
            No reviews found
          </div>
        ) : (
          filtered.map((review) => (
            <div key={review.id} className="bg-white rounded-xl border border-coffee-light p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-coffee-accent flex items-center justify-center text-coffee-dark font-bold text-xs">
                    {review.customer_name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-coffee-dark text-sm">{review.customer_name}</div>
                    <div className="text-xs text-coffee-primary/50">{review.item_name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex text-yellow-500 text-sm">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i}>{i < review.rating ? "★" : "☆"}</span>
                    ))}
                  </div>
                  {user?.role !== "customer" && (
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="text-red-400 hover:text-red-600 text-xs transition"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
              {review.comment && (
                <p className="text-sm text-coffee-primary mt-2 pl-10">{review.comment}</p>
              )}
              <div className="text-xs text-coffee-primary/40 mt-2 pl-10">
                {new Date(review.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
