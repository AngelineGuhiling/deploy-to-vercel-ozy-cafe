"use client";

import { useEffect, useState } from "react";

interface InventoryItem {
  id: number;
  item_name: string;
  quantity: number;
  unit: string;
  min_stock: number;
  cost_per_unit: number;
}

interface ProductItem {
  id: number;
  name: string;
  type: string;
  category: string;
  price: number;
  is_available: boolean;
}

export default function InventoryPage() {
  const [tab, setTab] = useState<"products" | "ingredients">("products");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [form, setForm] = useState({ item_name: "", quantity: "", unit: "kg", min_stock: "", cost_per_unit: "" });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [invRes, menuRes] = await Promise.all([fetch("/api/inventory"), fetch("/api/menu")]);
      const invData = await invRes.json();
      const menuData = await menuRes.json();
      setItems(invData.map((item: InventoryItem) => ({
        ...item,
        quantity: Number(item.quantity),
        min_stock: Number(item.min_stock),
        cost_per_unit: Number(item.cost_per_unit),
      })));
      setProducts(menuData.map((item: ProductItem) => ({ ...item, price: Number(item.price) })));
    } catch {
      setItems([
        { id: 1, item_name: "Coffee Beans (Arabica)", quantity: 25, unit: "kg", min_stock: 5, cost_per_unit: 800 },
        { id: 2, item_name: "Milk", quantity: 50, unit: "liters", min_stock: 10, cost_per_unit: 60 },
        { id: 3, item_name: "Sugar", quantity: 15, unit: "kg", min_stock: 3, cost_per_unit: 45 },
        { id: 4, item_name: "Cups (Medium)", quantity: 200, unit: "pcs", min_stock: 50, cost_per_unit: 5 },
      ]);
      setProducts([
        { id: 1, name: "Classic Espresso", type: "coffee", category: "Espresso", price: 56.00, is_available: true },
        { id: 2, name: "Vanilla Latte", type: "coffee", category: "Latte", price: 60.00, is_available: true },
        { id: 3, name: "Tiramisu Cake", type: "dessert", category: "Cakes", price: 75.00, is_available: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleProduct = async (product: ProductItem) => {
    setTogglingId(product.id);
    try {
      const res = await fetch("/api/menu", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id, is_available: !product.is_available }),
      });
      if (res.ok) {
        setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, is_available: !p.is_available } : p)));
      }
    } catch {
      alert("Failed to update stock status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      ...form,
      quantity: parseFloat(form.quantity),
      min_stock: parseFloat(form.min_stock) || 0,
      cost_per_unit: parseFloat(form.cost_per_unit) || 0,
      id: editingItem?.id,
    };

    try {
      if (editingItem) {
        await fetch("/api/inventory", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      } else {
        await fetch("/api/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      }
      setShowModal(false);
      setEditingItem(null);
      setForm({ item_name: "", quantity: "", unit: "kg", min_stock: "", cost_per_unit: "" });
      fetchAll();
    } catch {
      alert("Failed to save item");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this item?")) return;
    await fetch(`/api/inventory?id=${id}`, { method: "DELETE" });
    fetchAll();
  };

  const openEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setForm({
      item_name: item.item_name,
      quantity: item.quantity.toString(),
      unit: item.unit,
      min_stock: item.min_stock.toString(),
      cost_per_unit: item.cost_per_unit.toString(),
    });
    setShowModal(true);
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-coffee-primary">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-coffee-dark">Inventory Management</h2>
        {tab === "ingredients" && (
          <button onClick={() => { setEditingItem(null); setForm({ item_name: "", quantity: "", unit: "kg", min_stock: "", cost_per_unit: "" }); setShowModal(true); }} className="bg-coffee-primary text-coffee-cream px-4 py-2 rounded-lg hover:bg-coffee-dark transition">
            + Add Ingredient
          </button>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
        <button onClick={() => setTab("products")} className={`px-5 py-2 rounded-full font-semibold transition ${tab === "products" ? "bg-coffee-primary text-coffee-cream" : "bg-coffee-light text-coffee-primary hover:bg-coffee-secondary"}`}>
          Menu Products ({products.length})
        </button>
        <button onClick={() => setTab("ingredients")} className={`px-5 py-2 rounded-full font-semibold transition ${tab === "ingredients" ? "bg-coffee-primary text-coffee-cream" : "bg-coffee-light text-coffee-primary hover:bg-coffee-secondary"}`}>
          Ingredients ({items.length})
        </button>
      </div>

      {tab === "products" ? (
        <div className="bg-white rounded-xl shadow-sm border border-coffee-light overflow-hidden">
          {products.length === 0 ? (
            <p className="p-6 text-coffee-primary/60 text-sm">No menu products found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-coffee-cream">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-medium text-coffee-primary">Product</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-coffee-primary">Type</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-coffee-primary">Price</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-coffee-primary">Stock Status</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-coffee-primary">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-coffee-light">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-coffee-cream/50">
                      <td className="px-6 py-4 text-sm font-medium text-coffee-dark">{p.name}</td>
                      <td className="px-6 py-4 text-sm text-coffee-primary capitalize">{p.type}</td>
                      <td className="px-6 py-4 text-sm text-coffee-dark">₱{p.price.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${p.is_available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {p.is_available ? "In Stock" : "Out of Stock"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-coffee-primary/70">{p.is_available ? "In Stock" : "Out of Stock"}</span>
                          <button
                            type="button"
                            disabled={togglingId === p.id}
                            onClick={() => toggleProduct(p)}
                            className={`w-12 h-6 rounded-full transition relative disabled:opacity-50 ${p.is_available ? "bg-green-500" : "bg-gray-300"}`}
                            title={p.is_available ? "Click to mark Out of Stock" : "Click to mark In Stock"}
                          >
                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition ${p.is_available ? "left-6" : "left-0.5"}`} />
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
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-coffee-light overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-coffee-cream">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-coffee-primary">Item</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-coffee-primary">Quantity</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-coffee-primary">Min Stock</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-coffee-primary">Cost/Unit</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-coffee-primary">Status</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-coffee-primary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-coffee-light">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-coffee-cream/50">
                    <td className="px-6 py-4 text-sm font-medium text-coffee-dark">{item.item_name}</td>
                    <td className="px-6 py-4 text-sm text-coffee-dark">{item.quantity} {item.unit}</td>
                    <td className="px-6 py-4 text-sm text-coffee-primary">{item.min_stock} {item.unit}</td>
                    <td className="px-6 py-4 text-sm text-coffee-dark">₱{item.cost_per_unit.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${item.quantity <= item.min_stock ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                        {item.quantity <= item.min_stock ? "Low Stock" : "In Stock"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(item)} className="text-blue-500 hover:text-blue-700 text-sm">Edit</button>
                        <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-coffee-dark mb-4">{editingItem ? "Edit Item" : "Add Inventory Item"}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-coffee-dark mb-1">Item Name</label>
                <input type="text" value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} className="w-full px-4 py-2 border border-coffee-light rounded-lg focus:ring-2 focus:ring-coffee-accent outline-none" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-coffee-dark mb-1">Quantity</label>
                  <input type="number" step="0.01" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="w-full px-4 py-2 border border-coffee-light rounded-lg focus:ring-2 focus:ring-coffee-accent outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-coffee-dark mb-1">Unit</label>
                  <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full px-4 py-2 border border-coffee-light rounded-lg focus:ring-2 focus:ring-coffee-accent outline-none">
                    <option value="kg">Kilograms</option>
                    <option value="liters">Liters</option>
                    <option value="pcs">Pieces</option>
                    <option value="grams">Grams</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-coffee-dark mb-1">Min Stock</label>
                  <input type="number" step="0.01" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} className="w-full px-4 py-2 border border-coffee-light rounded-lg focus:ring-2 focus:ring-coffee-accent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-coffee-dark mb-1">Cost per Unit (₱)</label>
                  <input type="number" step="0.01" value={form.cost_per_unit} onChange={(e) => setForm({ ...form, cost_per_unit: e.target.value })} className="w-full px-4 py-2 border border-coffee-light rounded-lg focus:ring-2 focus:ring-coffee-accent outline-none" />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-coffee-primary text-coffee-cream py-2 rounded-lg hover:bg-coffee-dark transition">
                  {editingItem ? "Update" : "Add"} Item
                </button>
                <button type="button" onClick={() => { setShowModal(false); setEditingItem(null); }} className="px-4 py-2 border border-coffee-light rounded-lg hover:bg-coffee-cream transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}