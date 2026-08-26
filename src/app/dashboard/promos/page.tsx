"use client";

import { useEffect, useState } from "react";

interface Promo {
  id: number;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order: number;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
}

export default function PromosPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ code: "", discount_type: "percentage", discount_value: "", min_order: "0", max_uses: "", expires_at: "" });

  useEffect(() => { fetchPromos(); }, []);

  const fetchPromos = async () => {
    try {
      const res = await fetch("/api/promo");
      setPromos(await res.json());
    } catch {}
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/promo/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          discount_value: parseFloat(form.discount_value),
          min_order: parseFloat(form.min_order),
          max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        }),
      });
      setShowModal(false);
      setForm({ code: "", discount_type: "percentage", discount_value: "", min_order: "0", max_uses: "", expires_at: "" });
      fetchPromos();
    } catch {
      alert("Failed to create promo");
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-coffee-primary">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-coffee-dark">Promo Codes</h2>
        <button onClick={() => setShowModal(true)} className="bg-coffee-primary text-coffee-cream px-4 py-2 rounded-lg hover:bg-coffee-dark transition">+ Add Promo</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-coffee-light overflow-hidden">
        <table className="w-full">
          <thead className="bg-coffee-cream">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-coffee-primary">Code</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-coffee-primary">Type</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-coffee-primary">Value</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-coffee-primary">Min Order</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-coffee-primary">Uses</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-coffee-primary">Expires</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-coffee-primary">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-coffee-light">
            {promos.map((p) => (
              <tr key={p.id} className="hover:bg-coffee-cream/50">
                <td className="px-6 py-4 text-sm font-bold text-coffee-dark">{p.code}</td>
                <td className="px-6 py-4 text-sm capitalize text-coffee-primary">{p.discount_type}</td>
                <td className="px-6 py-4 text-sm text-coffee-dark">{p.discount_type === "percentage" ? `${p.discount_value}%` : `₱${Number(p.discount_value).toFixed(2)}`}</td>
                <td className="px-6 py-4 text-sm text-coffee-primary">₱{Number(p.min_order).toFixed(2)}</td>
                <td className="px-6 py-4 text-sm text-coffee-primary">{p.used_count}{p.max_uses ? ` / ${p.max_uses}` : ""}</td>
                <td className="px-6 py-4 text-sm text-coffee-primary">{p.expires_at ? new Date(p.expires_at).toLocaleDateString() : "Never"}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${p.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{p.is_active ? "Yes" : "No"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-coffee-dark mb-4">Add Promo Code</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="w-full px-4 py-2 border border-coffee-light rounded-lg focus:ring-2 focus:ring-coffee-accent outline-none uppercase" required />
              <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })} className="w-full px-4 py-2 border border-coffee-light rounded-lg focus:ring-2 focus:ring-coffee-accent outline-none">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed (₱)</option>
              </select>
              <input type="number" step="0.01" placeholder="Discount Value" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} className="w-full px-4 py-2 border border-coffee-light rounded-lg focus:ring-2 focus:ring-coffee-accent outline-none" required />
              <input type="number" step="0.01" placeholder="Min Order (₱)" value={form.min_order} onChange={(e) => setForm({ ...form, min_order: e.target.value })} className="w-full px-4 py-2 border border-coffee-light rounded-lg focus:ring-2 focus:ring-coffee-accent outline-none" />
              <input type="number" placeholder="Max Uses (leave empty for unlimited)" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} className="w-full px-4 py-2 border border-coffee-light rounded-lg focus:ring-2 focus:ring-coffee-accent outline-none" />
              <input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="w-full px-4 py-2 border border-coffee-light rounded-lg focus:ring-2 focus:ring-coffee-accent outline-none" />
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-coffee-primary text-coffee-cream py-2 rounded-lg hover:bg-coffee-dark transition">Create</button>
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-coffee-light rounded-lg hover:bg-coffee-cream transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
