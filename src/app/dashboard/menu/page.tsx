"use client";

import { useEffect, useState } from "react";

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id: number;
  category: string;
  type: string;
  image: string | null;
  is_available: boolean;
}

interface Category {
  id: number;
  name: string;
  type: string;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface InventoryItem {
  id: number;
  item_name: string;
  unit: string;
  quantity: number;
}

interface RecipeRow {
  menu_item_id: number;
  inventory_item_id: number;
  quantity_per_serving: number;
}

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [activeTab, setActiveTab] = useState<"coffee" | "dessert" | "all">("all");
  const [form, setForm] = useState({ name: "", description: "", price: "", category_id: "", image: "" });
  const [uploading, setUploading] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("Walk-in");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [settings, setSettings] = useState({ shop_name: "", gcash_number: "", gcash_qr: "" });
  const [orderSuccess, setOrderSuccess] = useState("");

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [recipes, setRecipes] = useState<RecipeRow[]>([]);
  const [recipeItem, setRecipeItem] = useState<MenuItem | null>(null);
  const [recipeRows, setRecipeRows] = useState<{ inventory_item_id: string; quantity_per_serving: string }[]>([]);
  const [recipeSaving, setRecipeSaving] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [menuRes, catRes, settingsRes, invRes, recRes] = await Promise.all([fetch("/api/menu"), fetch("/api/categories"), fetch("/api/settings"), fetch("/api/inventory"), fetch("/api/recipes")]);
      const menuData = await menuRes.json();
      const catData = await catRes.json();
      const settingsData = await settingsRes.json();
      const invData = await invRes.json();
      const recData = await recRes.json();
      if (menuData.error) throw new Error(menuData.error);
      setItems(menuData.map((item: MenuItem) => ({ ...item, price: Number(item.price) })));
      setCategories(catData);
      if (settingsData && settingsData.gcash_number !== undefined) setSettings(settingsData);
      if (Array.isArray(invData)) setInventory(invData);
      if (Array.isArray(recData)) setRecipes(recData.map((r: RecipeRow) => ({ ...r, quantity_per_serving: Number(r.quantity_per_serving) })));
    } catch {
      setCategories([
        { id: 1, name: "Espresso", type: "coffee" },
        { id: 2, name: "Latte", type: "coffee" },
        { id: 3, name: "Cappuccino", type: "coffee" },
        { id: 4, name: "Cold Brew", type: "coffee" },
        { id: 5, name: "Specialty", type: "coffee" },
        { id: 6, name: "Cakes", type: "dessert" },
        { id: 7, name: "Pastries", type: "dessert" },
        { id: 8, name: "Cookies", type: "dessert" },
      ]);
      setItems([
        { id: 1, name: "Classic Espresso", description: "Rich and bold single shot of pure espresso", price: 3.50, category_id: 1, category: "Espresso", type: "coffee", image: null, is_available: true },
        { id: 2, name: "Double Espresso", description: "Double shot for extra energy", price: 4.50, category_id: 1, category: "Espresso", type: "coffee", image: null, is_available: true },
        { id: 3, name: "Vanilla Latte", description: "Smooth latte with a touch of vanilla", price: 4.50, category_id: 2, category: "Latte", type: "coffee", image: null, is_available: true },
        { id: 4, name: "Caramel Latte", description: "Creamy latte with caramel drizzle", price: 5.00, category_id: 2, category: "Latte", type: "coffee", image: null, is_available: true },
        { id: 5, name: "Cappuccino", description: "Classic Italian cappuccino with frothy milk", price: 4.75, category_id: 3, category: "Cappuccino", type: "coffee", image: null, is_available: true },
        { id: 6, name: "Iced Cold Brew", description: "Smooth 24-hour steeped cold brew", price: 4.00, category_id: 4, category: "Cold Brew", type: "coffee", image: null, is_available: true },
        { id: 7, name: "Caramel Macchiato", description: "Espresso with steamed milk and caramel", price: 5.50, category_id: 5, category: "Specialty", type: "coffee", image: null, is_available: true },
        { id: 8, name: "Mocha Supreme", description: "Chocolate, espresso, and steamed milk", price: 5.75, category_id: 5, category: "Specialty", type: "coffee", image: null, is_available: true },
        { id: 9, name: "Tiramisu Cake", description: "Classic Italian coffee-flavored dessert", price: 6.00, category_id: 6, category: "Cakes", type: "dessert", image: null, is_available: true },
        { id: 10, name: "Cheesecake", description: "Creamy New York style cheesecake", price: 5.50, category_id: 6, category: "Cakes", type: "dessert", image: null, is_available: true },
        { id: 11, name: "Butter Croissant", description: "Freshly baked flaky butter croissant", price: 3.25, category_id: 7, category: "Pastries", type: "dessert", image: null, is_available: true },
        { id: 12, name: "Blueberry Muffin", description: "Soft muffin packed with blueberries", price: 3.00, category_id: 7, category: "Pastries", type: "dessert", image: null, is_available: true },
        { id: 13, name: "Chocolate Chip Cookie", description: "Warm chewy cookie with chocolate chips", price: 2.50, category_id: 8, category: "Cookies", type: "dessert", image: null, is_available: true },
        { id: 14, name: "Oatmeal Raisin Cookie", description: "Healthy oats with sweet raisins", price: 2.50, category_id: 8, category: "Cookies", type: "dessert", image: null, is_available: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
    setShowCart(true);
  };

  const updateCartQty = (id: number, delta: number) => {
    setCart((prev) => {
      return prev.map((c) => c.id === id ? { ...c, quantity: c.quantity + delta } : c).filter((c) => c.quantity > 0);
    });
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    const soldOut = cart.filter((c) => !items.find((m) => m.id === c.id)?.is_available);
    if (soldOut.length > 0) {
      alert(`Can't checkout — sold out: ${soldOut.map((c) => c.name).join(", ")}`);
      return;
    }
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName || "Walk-in",
          payment_method: paymentMethod,
          items: cart.map((c) => ({ menu_item_id: c.id, quantity: c.quantity, price: c.price })),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrderSuccess(`Order #${data.id} placed! Total: ₱${cartTotal.toFixed(2)}`);
        setCart([]);
        setCustomerName("Walk-in");
        setPaymentMethod("cash");
        setShowCheckout(false);
        setShowCart(false);
        setTimeout(() => setOrderSuccess(""), 4000);
      } else {
        alert(data.error || "Failed to place order");
      }
    } catch {
      alert("Failed to place order");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      setForm({ ...form, image: data.url });
    } catch {
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      ...form,
      price: parseFloat(form.price),
      category_id: form.category_id ? parseInt(form.category_id) : null,
      id: editingItem?.id,
      is_available: editingItem?.is_available,
    };
    try {
      if (editingItem) {
        await fetch("/api/menu", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      } else {
        await fetch("/api/menu", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      }
      setShowAddModal(false);
      setEditingItem(null);
      setForm({ name: "", description: "", price: "", category_id: "", image: "" });
      fetchData();
    } catch {
      alert("Failed to save item");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this item?")) return;
    await fetch(`/api/menu?id=${id}`, { method: "DELETE" });
    fetchData();
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setForm({ name: item.name, description: item.description || "", price: item.price.toString(), category_id: item.category_id?.toString() || "", image: item.image || "" });
    setShowAddModal(true);
  };

  const openRecipe = (item: MenuItem) => {
    setRecipeItem(item);
    setRecipeRows(
      recipes
        .filter((r) => r.menu_item_id === item.id)
        .map((r) => ({
          inventory_item_id: String(r.inventory_item_id),
          quantity_per_serving: String(r.quantity_per_serving),
        }))
    );
  };

  const recipeCount = (menuItemId: number) => recipes.filter((r) => r.menu_item_id === menuItemId).length;

  const saveRecipe = async () => {
    if (!recipeItem) return;
    setRecipeSaving(true);
    try {
      const res = await fetch("/api/recipes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menu_item_id: recipeItem.id,
          recipes: recipeRows
            .filter((r) => r.inventory_item_id && Number(r.quantity_per_serving) > 0)
            .map((r) => ({ inventory_item_id: Number(r.inventory_item_id), quantity_per_serving: Number(r.quantity_per_serving) })),
        }),
      });
      if (!res.ok) throw new Error();
      const name = recipeItem.name;
      setRecipeItem(null);
      setRecipeRows([]);
      fetchData();
      setOrderSuccess(`Ingredients saved for ${name}`);
      setTimeout(() => setOrderSuccess(""), 3000);
    } catch {
      alert("Failed to save ingredients");
    } finally {
      setRecipeSaving(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (activeTab === "all") return true;
    return item.type === activeTab;
  });

  if (loading) return <div className="flex items-center justify-center h-64 text-coffee-primary">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-coffee-dark">Menu Management</h2>
        <div className="flex gap-3">
          <button onClick={() => setShowCart(true)} className="bg-coffee-accent text-coffee-dark px-4 py-2 rounded-lg hover:bg-coffee-secondary transition flex items-center gap-2 font-semibold">
            🛒 Cart {cart.length > 0 && <span className="bg-coffee-dark text-coffee-cream text-xs px-2 py-0.5 rounded-full">{cart.reduce((s, c) => s + c.quantity, 0)}</span>}
          </button>
          <button onClick={() => { setEditingItem(null); setForm({ name: "", description: "", price: "", category_id: "", image: "" }); setShowAddModal(true); }} className="bg-coffee-primary text-coffee-cream px-4 py-2 rounded-lg hover:bg-coffee-dark transition">
            + Add Item
          </button>
        </div>
      </div>

      {orderSuccess && (
        <div className="fixed top-20 right-4 z-[70] bg-green-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2" style={{ animation: "slideIn 0.3s ease-out" }}>
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          {orderSuccess}
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        {[{ key: "all" as const, label: "All", count: items.length }, { key: "coffee" as const, label: "Coffee", count: items.filter(i => i.type === "coffee").length }, { key: "dessert" as const, label: "Desserts", count: items.filter(i => i.type === "dessert").length }].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-5 py-2 rounded-full font-semibold transition ${activeTab === tab.key ? "bg-coffee-primary text-coffee-cream" : "bg-coffee-light text-coffee-primary hover:bg-coffee-secondary"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm border border-coffee-light overflow-hidden flex flex-col">
            <div className="h-36 bg-gradient-to-br from-coffee-secondary to-coffee-accent flex items-center justify-center">
              {item.image ? <img src={encodeURI(item.image)} alt={item.name} className="w-full h-full object-cover" /> : <span className="text-5xl">{item.type === "coffee" ? "☕" : "🍰"}</span>}
            </div>
            <div className="p-4 flex flex-col flex-1">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-coffee-dark text-sm">{item.name}</h3>
                <span className="text-coffee-accent font-bold text-sm whitespace-nowrap ml-2">₱{item.price.toFixed(2)}</span>
              </div>
              <p className="text-xs text-coffee-primary/70 mb-3 flex-1">{item.description}</p>
              <div className="flex items-center gap-1 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full ${item.is_available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {item.is_available ? "Available" : "Out of Stock"}
                </span>
                <div className="flex-1" />
                <div className="relative group">
                  <button className="bg-coffee-primary text-coffee-cream text-xs px-3 py-1.5 rounded-lg hover:bg-coffee-dark transition font-semibold">
                    Actions ▾
                  </button>
                  <div className="absolute right-0 bottom-full mb-1 hidden group-hover:block bg-white border border-coffee-light rounded-lg shadow-lg z-20 min-w-[120px]">
                    {item.is_available && (
                      <button onClick={() => addToCart(item)} className="w-full text-left text-xs px-3 py-2 hover:bg-coffee-cream text-coffee-dark transition rounded-t-lg">+ Order</button>
                    )}
                    <button onClick={() => openEdit(item)} className="w-full text-left text-xs px-3 py-2 hover:bg-coffee-cream text-blue-600 transition">Edit</button>
                    <button onClick={() => openRecipe(item)} className="w-full text-left text-xs px-3 py-2 hover:bg-coffee-cream text-coffee-dark transition">Ingredients{recipeCount(item.id) > 0 ? ` (${recipeCount(item.id)})` : ""}</button>
                    <button onClick={() => handleDelete(item.id)} className="w-full text-left text-xs px-3 py-2 hover:bg-red-50 text-red-500 transition rounded-b-lg">Delete</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-end">
          <div className="bg-white h-full w-full max-w-md shadow-2xl flex flex-col">
            <div className="p-6 border-b border-coffee-light flex justify-between items-center">
              <h3 className="text-xl font-bold text-coffee-dark">🛒 Your Cart</h3>
              <button onClick={() => setShowCart(false)} className="text-coffee-primary hover:text-coffee-dark text-2xl">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <p className="text-center text-coffee-primary/50 py-10">Cart is empty. Add items from the menu.</p>
              ) : (
                <div className="space-y-4">
                  {cart.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 bg-coffee-cream rounded-xl p-3">
                      <div className="flex-1">
                        <p className="font-semibold text-coffee-dark text-sm">{c.name}</p>
                        <p className="text-coffee-accent font-bold text-sm">₱{c.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateCartQty(c.id, -1)} className="w-7 h-7 bg-white border rounded-lg flex items-center justify-center hover:bg-red-50 text-coffee-dark font-bold">-</button>
                        <span className="w-6 text-center font-semibold text-coffee-dark">{c.quantity}</span>
                        <button onClick={() => updateCartQty(c.id, 1)} className="w-7 h-7 bg-white border rounded-lg flex items-center justify-center hover:bg-green-50 text-coffee-dark font-bold">+</button>
                      </div>
                      <span className="font-bold text-coffee-dark text-sm w-16 text-right">₱{(c.price * c.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-6 border-t border-coffee-light space-y-4">
                <div className="flex justify-between text-lg font-bold text-coffee-dark">
                  <span>Total</span>
                  <span className="text-coffee-accent">₱{cartTotal.toFixed(2)}</span>
                </div>
                <button onClick={() => { setShowCheckout(true); }} className="w-full bg-coffee-primary text-coffee-cream py-3 rounded-xl font-semibold hover:bg-coffee-dark transition">
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-coffee-dark mb-5">Checkout</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-coffee-dark mb-1">Customer Name</label>
                <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Walk-in" className="w-full px-4 py-2 border border-coffee-light rounded-lg focus:ring-2 focus:ring-coffee-accent outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-coffee-dark mb-2">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "cash", label: "💵 Cash", desc: "Pay with cash" },
                    { key: "gcash", label: "📱 GCash", desc: "Scan QR to pay" },
                  ].map((pm) => (
                    <button key={pm.key} type="button" onClick={() => setPaymentMethod(pm.key)} className={`p-3 rounded-xl border-2 text-left transition ${paymentMethod === pm.key ? "border-coffee-primary bg-coffee-light" : "border-coffee-light hover:border-coffee-secondary"}`}>
                      <div className="font-semibold text-coffee-dark text-sm">{pm.label}</div>
                      <div className="text-xs text-coffee-primary/60">{pm.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === "gcash" && (
                <div className="bg-coffee-cream rounded-xl p-4 text-center">
                  {settings.gcash_qr ? (
                    <>
                      <p className="text-sm font-medium text-coffee-dark mb-3">Scan to pay with GCash</p>
                      <img src={settings.gcash_qr} alt="GCash QR" className="w-40 h-40 object-contain mx-auto rounded-lg bg-white border border-coffee-light p-2" />
                      {settings.gcash_number && (
                        <p className="text-sm text-coffee-primary mt-3">GCash: <span className="font-semibold text-coffee-dark">{settings.gcash_number}</span></p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-coffee-primary/60 py-4">GCash QR not set up yet. Please pay with cash.</p>
                  )}
                </div>
              )}

              <div className="bg-coffee-cream rounded-xl p-4">
                <p className="text-sm font-medium text-coffee-primary mb-2">Order Summary</p>
                {cart.map((c) => (
                  <div key={c.id} className="flex justify-between text-sm py-1">
                    <span className="text-coffee-dark">{c.name} x{c.quantity}</span>
                    <span className="font-medium text-coffee-dark">₱{(c.price * c.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-coffee-light mt-2 pt-2 flex justify-between font-bold text-coffee-dark">
                  <span>Total</span>
                  <span className="text-coffee-accent">₱{cartTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleCheckout} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2">
                ✓ Place Order
              </button>
              <button onClick={() => setShowCheckout(false)} className="px-4 py-3 border border-coffee-light rounded-xl hover:bg-coffee-cream transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-coffee-dark mb-4">{editingItem ? "Edit Item" : "Add New Item"}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-coffee-dark mb-1">Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 border border-coffee-light rounded-lg focus:ring-2 focus:ring-coffee-accent outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-coffee-dark mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2 border border-coffee-light rounded-lg focus:ring-2 focus:ring-coffee-accent outline-none" rows={3} />
              </div>
              <div>
                <label className="block text-sm font-medium text-coffee-dark mb-1">Price (₱)</label>
                <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-4 py-2 border border-coffee-light rounded-lg focus:ring-2 focus:ring-coffee-accent outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-coffee-dark mb-1">Category</label>
                <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full px-4 py-2 border border-coffee-light rounded-lg focus:ring-2 focus:ring-coffee-accent outline-none" required>
                  <option value="">Select category</option>
                  <optgroup label="Coffee">
                    {categories.filter((c) => c.type === "coffee").map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Desserts">
                    {categories.filter((c) => c.type === "dessert").map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
              {editingItem && (
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-coffee-dark">Available</label>
                  <button type="button" onClick={() => setEditingItem({ ...editingItem, is_available: !editingItem.is_available })} className={`w-12 h-6 rounded-full transition relative ${editingItem.is_available ? "bg-green-500" : "bg-gray-300"}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition ${editingItem.is_available ? "left-6" : "left-0.5"}`} />
                  </button>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-coffee-dark mb-1">Image</label>
                <div
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.add("border-coffee-primary", "bg-coffee-light/50"); }}
                  onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.remove("border-coffee-primary", "bg-coffee-light/50"); }}
                  onDrop={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.remove("border-coffee-primary", "bg-coffee-light/50"); const file = e.dataTransfer.files?.[0]; if (file && file.type.startsWith("image/")) { setUploading(true); const fd = new FormData(); fd.append("file", file); fetch("/api/upload", { method: "POST", body: fd }).then(r => r.json()).then(d => { setForm({ ...form, image: d.url }); }).catch(() => alert("Failed to upload image")).finally(() => setUploading(false)); } }}
                  className="border-2 border-dashed border-coffee-light rounded-lg p-4 text-center cursor-pointer hover:border-coffee-secondary transition"
                  onClick={() => document.getElementById("menu-image-input")?.click()}
                >
                  {form.image ? (
                    <img src={form.image} alt="Preview" className="mx-auto w-20 h-20 object-cover rounded-lg" />
                  ) : (
                    <p className="text-sm text-coffee-primary/60">Drag & drop an image here, or <span className="text-coffee-primary font-medium">click to browse</span></p>
                  )}
                  {uploading && <p className="text-sm text-coffee-primary mt-1">Uploading...</p>}
                </div>
                <input id="menu-image-input" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-coffee-primary text-coffee-cream py-2 rounded-lg hover:bg-coffee-dark transition">
                  {editingItem ? "Update" : "Add"} Item
                </button>
                <button type="button" onClick={() => { setShowAddModal(false); setEditingItem(null); }} className="px-4 py-2 border border-coffee-light rounded-lg hover:bg-coffee-cream transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {recipeItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-coffee-dark mb-1">🧪 Ingredients — {recipeItem.name}</h3>
            <p className="text-xs text-coffee-primary mb-4">Ingredients deducted from inventory per serving each time this item is ordered.</p>

            {recipeRows.length === 0 ? (
              <p className="text-sm text-coffee-primary/60 py-4">No ingredients linked yet. Add at least one to track stock usage.</p>
            ) : (
              <div className="space-y-2 mb-3">
                {recipeRows.map((row, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <select
                      value={row.inventory_item_id}
                      onChange={(e) => setRecipeRows(recipeRows.map((r, j) => j === i ? { ...r, inventory_item_id: e.target.value } : r))}
                      className="flex-1 px-3 py-2 border border-coffee-light rounded-lg text-sm focus:ring-2 focus:ring-coffee-accent outline-none"
                    >
                      <option value="">Select ingredient</option>
                      {inventory.map((inv) => (
                        <option key={inv.id} value={inv.id}>{inv.item_name} ({inv.quantity} {inv.unit} in stock)</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="0.001"
                      step="0.001"
                      value={row.quantity_per_serving}
                      onChange={(e) => setRecipeRows(recipeRows.map((r, j) => j === i ? { ...r, quantity_per_serving: e.target.value } : r))}
                      placeholder="Qty"
                      className="w-24 px-3 py-2 border border-coffee-light rounded-lg text-sm focus:ring-2 focus:ring-coffee-accent outline-none"
                    />
                    <button onClick={() => setRecipeRows(recipeRows.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-700 text-sm px-2">✕</button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setRecipeRows([...recipeRows, { inventory_item_id: "", quantity_per_serving: "" }])}
              className="text-sm text-coffee-accent hover:text-coffee-dark font-semibold mb-4"
            >
              + Add ingredient
            </button>

            <div className="flex gap-3 mt-2">
              <button onClick={saveRecipe} disabled={recipeSaving} className="flex-1 bg-coffee-primary text-coffee-cream py-2 rounded-lg hover:bg-coffee-dark transition disabled:opacity-50">
                {recipeSaving ? "Saving..." : "Save Ingredients"}
              </button>
              <button onClick={() => { setRecipeItem(null); setRecipeRows([]); }} className="px-4 py-2 border border-coffee-light rounded-lg hover:bg-coffee-cream transition">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
