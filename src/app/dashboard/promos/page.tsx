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

const emptyForm = { code: "", discount_type: "percentage", discount_value: "", min_order: "0", max_uses: "", expires_at: "" };

export default function PromosPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchPromos(); }, []);

  const fetchPromos = async () => {
    try {
      const res = await fetch("/api/promo");
      setPromos(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      ...form,
      discount_value: parseFloat(form.discount_value),
      min_order: parseFloat(form.min_order),
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
    };

    if (editingId) {
      await fetch("/api/promo/manage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...body }),
      });
    } else {
      await fetch("/api/promo/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
    fetchPromos();
  };

  const handleEdit = (promo: Promo) => {
    setEditingId(promo.id);
    setForm({
      code: promo.code,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value.toString(),
      min_order: promo.min_order.toString(),
      max_uses: promo.max_uses?.toString() || "",
      expires_at: promo.expires_at ? promo.expires_at.split("T")[0] : "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this promo?")) return;
    await fetch(`/api/promo/manage?id=${id}`, { method: "DELETE" });
    fetchPromos();
  };

  const toggleActive = async (id: number, current: boolean) => {
    await fetch("/api/promo/manage", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active: !current }),
    });
    fetchPromos();
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-coffee-primary">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-coffee-dark">Promo Codes</h2>
        <button onClick={openCreate} className="bg-coffee-primary text-coffee-cream px-4 py-2 rounded-lg hover:bg-coffee-dark transition">+ Add Promo</button>
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
              <th className="text-left px-6 py-3 text-sm font-medium text-coffee-primary">Actions</th>
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
                  <button onClick={() => toggleActive(p.id, p.is_active)} className={`px-2 py-1 text-xs rounded-full cursor-pointer transition ${p.is_active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"}`}>
                    {p.is_active ? "Yes" : "No"}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(p)} className="text-blue-500 hover:text-blue-700 text-xs font-medium">Edit</button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {promos.length === 0 && <div className="text-center py-12 text-coffee-primary/50">No promos yet</div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-coffee-dark mb-4">{editingId ? "Edit Promo" : "Add Promo Code"}</h3>
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
                <button type="submit" className="flex-1 bg-coffee-primary text-coffee-cream py-2 rounded-lg hover:bg-coffee-dark transition">{editingId ? "Update" : "Create"}</button>
                <button type="button" onClick={() => { setShowModal(false); setEditingId(null); setForm(emptyForm); }} className="px-4 py-2 border border-coffee-light rounded-lg hover:bg-coffee-cream transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
