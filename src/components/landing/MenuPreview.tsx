"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useShopSettings } from "@/lib/ShopSettings";

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  type: string;
  image: string | null;
  is_available: boolean;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export default function MenuPreview({ cart, setCart, showCart, setShowCart }: { cart: CartItem[]; setCart: React.Dispatch<React.SetStateAction<CartItem[]>>; showCart: boolean; setShowCart: (show: boolean) => void }) {
  const router = useRouter();
  const settings = useShopSettings();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeTab, setActiveTab] = useState<"coffee" | "dessert">("coffee");
  const [coffeeCat, setCoffeeCat] = useState<string>("all");
  const [dessertCat, setDessertCat] = useState<string>("all");
  const [showCheckout, setShowCheckout] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [customerName, setCustomerName] = useState("Walk-in");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentRef, setPaymentRef] = useState("");
  const [orderType, setOrderType] = useState("dine-in");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState<any>(null);
  const [promoError, setPromoError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [detailQty, setDetailQty] = useState(1);
  const [menuSearch, setMenuSearch] = useState("");

  useEffect(() => {
    fetchMenuItems();
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setIsLoggedIn(true);
        setUserId(data.id);
        setCustomerName(data.name);
        setCustomerPhone(data.phone || "");
        setDeliveryAddress(data.address || "");
      }
    } catch {
      setIsLoggedIn(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const res = await fetch("/api/menu");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMenuItems(data.map((item: MenuItem) => ({ ...item, price: Number(item.price) })));
    } catch {
      setMenuItems([
        { id: 1, name: "Classic Espresso", description: "Rich and bold single shot of pure espresso", price: 56.00, category: "Espresso", type: "coffee", image: "/classic espresso.jpg", is_available: true },
        { id: 2, name: "Double Espresso", description: "Double shot for extra energy", price: 55.00, category: "Espresso", type: "coffee", image: "/double espresso.jpg", is_available: true },
        { id: 3, name: "Vanilla Latte", description: "Smooth latte with a touch of vanilla", price: 60.00, category: "Latte", type: "coffee", image: "/vanilla latte.jpg", is_available: true },
        { id: 4, name: "Caramel Latte", description: "Creamy latte with caramel drizzle", price: 60.00, category: "Latte", type: "coffee", image: "/caramel latte.jpg", is_available: true },
        { id: 5, name: "Cappuccino", description: "Classic Italian cappuccino with frothy milk", price: 60.00, category: "Cappuccino", type: "coffee", image: "/cappucinno.jpg", is_available: true },
        { id: 6, name: "Hazelnut Cappuccino", description: "Cappuccino with a warm hazelnut twist", price: 65.00, category: "Cappuccino", type: "coffee", image: "/hazelnut cappuccino.jpg", is_available: true },
        { id: 7, name: "Iced Cold Brew", description: "Smooth 24-hour steeped cold brew", price: 49.00, category: "Cold Brew", type: "coffee", image: "/ice cold brew.jpg", is_available: true },
        { id: 8, name: "Vanilla Cold Brew", description: "Cold brew sweetened with vanilla", price: 49.00, category: "Cold Brew", type: "coffee", image: "/vanilla cold brew.jpg", is_available: true },
        { id: 9, name: "Caramel Macchiato", description: "Espresso with steamed milk and caramel", price: 39.00, category: "Specialty", type: "coffee", image: "/caramel macchiato.jpg", is_available: true },
        { id: 10, name: "Mocha Supreme", description: "Chocolate, espresso, and steamed milk", price: 70.00, category: "Specialty", type: "coffee", image: "/mocha supreme.jpg", is_available: true },
        { id: 11, name: "Tiramisu Cake", description: "Classic Italian coffee-flavored dessert", price: 75.00, category: "Cakes", type: "dessert", image: "/Tiramisu cake.jpg", is_available: true },
        { id: 12, name: "Cheesecake", description: "Creamy New York style cheesecake", price: 54.97, category: "Cakes", type: "dessert", image: "/cheesecake.jpg", is_available: true },
        { id: 13, name: "Butter Croissant", description: "Freshly baked flaky butter croissant", price: 54.97, category: "Pastries", type: "dessert", image: "/butter croissant.jpg", is_available: true },
        { id: 14, name: "Blueberry Muffin", description: "Soft muffin packed with blueberries", price: 25.00, category: "Pastries", type: "dessert", image: "/blueberry muffin.jpg", is_available: true },
        { id: 15, name: "Chocolate Chip Cookie", description: "Warm chewy cookie with chocolate chips", price: 30.00, category: "Cookies", type: "dessert", image: "/chocolate chip cookie.jpg", is_available: true },
        { id: 16, name: "Oatmeal Raisin Cookie", description: "Healthy oats with sweet raisins", price: 30.00, category: "Cookies", type: "dessert", image: "/oatmeal raisin cookie.jpg", is_available: true },
      ]);
    }
  };

  const handleOrder = (item: MenuItem) => {
    if (!item.is_available) return;
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
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
    const soldOut = cart.filter((c) => !menuItems.find((m) => m.id === c.id)?.is_available);
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
            order_type: orderType,
            delivery_address: deliveryAddress,
            customer_phone: customerPhone,
            created_by: userId,
            promo_code: promoApplied ? promoApplied.code : null,
            discount: promoApplied ? Number(promoApplied.discount_amount) : 0,
            payment_ref: paymentMethod === "gcash" ? paymentRef : null,
            items: cart.map((c) => ({ menu_item_id: c.id, quantity: c.quantity, price: c.price })),
          }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrderSuccess(`Order #${data.id} placed! ₱${Math.max(0, cartTotal - (promoApplied ? Number(promoApplied.discount_amount) : 0)).toFixed(2)}`);
        setCart([]);
        setCustomerName("Walk-in");
        setPaymentMethod("cash");
        setPaymentRef("");
        setOrderType("dine-in");
        setDeliveryAddress("");
        setCustomerPhone("");
        setPromoCode("");
        setPromoApplied(null);
        setShowCheckout(false);
        setShowCart(false);
        setTimeout(() => setOrderSuccess(""), 4000);
      }
    } catch {
      alert("Failed to place order");
    }
  };

  const filteredItems = menuItems.filter(item => {
    if (item.type !== activeTab) return false;
    if (activeTab === "coffee" && coffeeCat !== "all" && item.category !== coffeeCat) return false;
    if (activeTab === "dessert" && dessertCat !== "all" && item.category !== dessertCat) return false;
    if (menuSearch) {
      const q = menuSearch.toLowerCase();
      if (!item.name.toLowerCase().includes(q) && !item.description.toLowerCase().includes(q) && !item.category.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <section id="menu" className="py-20 bg-coffee-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-coffee-dark mb-4">Our Menu</h2>
          <p className="text-coffee-primary text-lg">Handcrafted drinks and delicious treats</p>
        </div>

        {orderSuccess && (
        <div className="fixed top-20 right-4 z-[70] bg-green-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2" style={{ animation: "slideIn 0.3s ease-out" }}>
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          {orderSuccess}
        </div>
      )}

        <div className="flex justify-center gap-4 mb-12">
          <button
            onClick={() => { setActiveTab("coffee"); setDessertCat("all"); }}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              activeTab === "coffee"
                ? "bg-coffee-primary text-coffee-cream"
                : "bg-coffee-light text-coffee-primary hover:bg-coffee-secondary"
            }`}
          >
            Coffee
          </button>
          <button
            onClick={() => { setActiveTab("dessert"); setCoffeeCat("all"); }}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              activeTab === "dessert"
                ? "bg-coffee-primary text-coffee-cream"
                : "bg-coffee-light text-coffee-primary hover:bg-coffee-secondary"
            }`}
          >
            Desserts
          </button>
        </div>

        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-coffee-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" value={menuSearch} onChange={(e) => setMenuSearch(e.target.value)} placeholder="Search menu..." className="w-full pl-10 pr-4 py-3 rounded-full border border-coffee-light focus:ring-2 focus:ring-coffee-accent outline-none text-sm bg-white shadow-sm" />
            {menuSearch && <button onClick={() => setMenuSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-coffee-primary/40 hover:text-coffee-dark">✕</button>}
          </div>
        </div>

        {activeTab === "coffee" && (
          <div className="flex justify-center gap-3 mb-8 flex-wrap">
            {["all", "Espresso", "Cappuccino", "Latte", "Cold Brew", "Specialty"].map((cat) => (
              <button key={cat} onClick={() => setCoffeeCat(cat)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${coffeeCat === cat ? "bg-coffee-secondary text-coffee-dark" : "bg-coffee-light text-coffee-primary hover:bg-coffee-secondary/50"}`}>
                {cat === "all" ? "All" : cat}
              </button>
            ))}
          </div>
        )}

        {activeTab === "dessert" && (
          <div className="flex justify-center gap-3 mb-8">
            {["all", "Cakes", "Pastries", "Cookies"].map((cat) => (
              <button key={cat} onClick={() => setDessertCat(cat)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${dessertCat === cat ? "bg-coffee-secondary text-coffee-dark" : "bg-coffee-light text-coffee-primary hover:bg-coffee-secondary/50"}`}>
                {cat === "all" ? "All" : cat}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map((item) => (
            <div key={item.id} onClick={() => { setSelectedItem(item); setDetailQty(1); }} className={`bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition transform hover:-translate-y-1 cursor-pointer ${!item.is_available ? "opacity-90" : ""}`}>
              <div className="h-48 bg-gradient-to-br from-coffee-secondary to-coffee-accent flex items-center justify-center relative">
                {item.image ? <img src={encodeURI(item.image)} alt={item.name} className="w-full h-full object-cover" /> : <span className="text-6xl">{item.type === "coffee" ? "☕" : "🍰"}</span>}
                {!item.is_available && (
                  <div className="absolute inset-0 bg-coffee-dark/50 flex items-center justify-center">
                    <span className="bg-coffee-dark text-coffee-cream text-lg font-bold px-5 py-2 rounded-full uppercase tracking-wide">Sold Out</span>
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-coffee-dark">{item.name}</h3>
                  <span className="text-coffee-accent font-bold text-lg whitespace-nowrap ml-2">₱{item.price.toFixed(2)}</span>
                </div>
                <p className="text-coffee-primary/70 mb-3">{item.description}</p>
                <div className="flex items-center justify-between">
                  <span className="inline-block bg-coffee-light text-coffee-primary text-sm px-3 py-1 rounded-full">
                    {item.category}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleOrder(item); }}
                    disabled={!item.is_available}
                    className={`px-4 py-2 rounded-lg font-semibold transition text-sm ${
                      item.is_available
                        ? "bg-coffee-primary text-coffee-cream hover:bg-coffee-dark"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {item.is_available ? (isLoggedIn ? "Order" : "Sign in to Order") : "Out of Stock"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCart && isLoggedIn && (
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

      {showCheckout && isLoggedIn && (
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
                  <div className="mt-4 text-left">
                    <label className="block text-sm font-medium text-coffee-dark mb-1">GCash Reference Number</label>
                    <input type="text" value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} placeholder="Reference No. (optional)" className="w-full px-4 py-2 border border-coffee-light rounded-lg focus:ring-2 focus:ring-coffee-accent outline-none" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-coffee-dark mb-2">Order Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "dine-in", label: "🍽️ Dine In" },
                    { key: "takeout", label: "🥡 Takeout" },
                  ].map((ot) => (
                    <button key={ot.key} type="button" onClick={() => setOrderType(ot.key)} className={`p-3 rounded-xl border-2 text-left transition ${orderType === ot.key ? "border-coffee-primary bg-coffee-light" : "border-coffee-light hover:border-coffee-secondary"}`}>
                      <div className="font-semibold text-coffee-dark text-sm">{ot.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {orderType === "takeout" && (
                <div className="bg-coffee-cream rounded-xl p-4 space-y-2 text-sm">
                  <p className="font-medium text-coffee-dark">📞 {customerPhone || "No contact number on file"}</p>
                  <p className="text-coffee-primary/70 flex gap-1.5 leading-relaxed">
                    <span>📍</span>
                    <span>{deliveryAddress || "No address on file — update it in your profile"}</span>
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-coffee-dark mb-1">Promo Code</label>
                <div className="flex gap-2">
                  <input type="text" value={promoCode} onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoApplied(null); setPromoError(""); }} placeholder="Enter code" className="flex-1 px-4 py-2 border border-coffee-light rounded-lg focus:ring-2 focus:ring-coffee-accent outline-none uppercase" />
                  <button type="button" onClick={async () => { if (!promoCode.trim()) return; setPromoError(""); try { const res = await fetch("/api/promo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: promoCode, order_total: cartTotal }) }); const data = await res.json(); if (data.valid) { setPromoApplied(data); } else { setPromoError(data.error || "Invalid code"); setPromoApplied(null); } } catch { setPromoError("Failed to validate"); } }} className="bg-coffee-primary text-coffee-cream px-4 py-2 rounded-lg font-semibold hover:bg-coffee-dark transition text-sm">Apply</button>
                </div>
                {promoError && <p className="text-red-500 text-xs mt-1">{promoError}</p>}
                {promoApplied && <p className="text-green-600 text-xs mt-1">Discount: {promoApplied.discount_type === "percentage" ? `${promoApplied.discount_value}% off` : `₱${promoApplied.discount_value.toFixed(2)} off`}</p>}
              </div>

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
                {promoApplied && (
                  <div className="flex justify-between text-sm text-green-600 font-medium">
                    <span>Discount ({promoApplied.code})</span>
                    <span>-₱{Number(promoApplied.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                {promoApplied && (
                  <div className="flex justify-between font-bold text-coffee-dark border-t border-coffee-light pt-2">
                    <span>Final Total</span>
                    <span className="text-coffee-accent">₱{Math.max(0, cartTotal - Number(promoApplied.discount_amount)).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleCheckout} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2">
                ✓ Place Order
              </button>
              <button onClick={() => setShowCheckout(false)} className="px-4 py-3 border border-coffee-light rounded-xl hover:bg-coffee-cream transition">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {selectedItem && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()} style={{ animation: "slideIn 0.2s ease-out" }}>
            <div className="h-64 bg-gradient-to-br from-coffee-secondary to-coffee-accent flex items-center justify-center relative">
              {selectedItem.image ? <img src={encodeURI(selectedItem.image)} alt={selectedItem.name} className="w-full h-full object-cover" /> : <span className="text-8xl">{selectedItem.type === "coffee" ? "☕" : "🍰"}</span>}
              <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 bg-black/30 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/50 transition">&times;</button>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-2xl font-bold text-coffee-dark">{selectedItem.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-block bg-coffee-light text-coffee-primary text-sm px-3 py-0.5 rounded-full">{selectedItem.category}</span>
                    {!selectedItem.is_available && (
                      <span className="inline-block bg-red-100 text-red-700 text-sm font-semibold px-3 py-0.5 rounded-full">Sold Out</span>
                    )}
                  </div>
                </div>
                <span className="text-coffee-accent font-bold text-2xl whitespace-nowrap">₱{Number(selectedItem.price).toFixed(2)}</span>
              </div>
              <p className="text-coffee-primary/70 mb-6">{selectedItem.description}</p>
              <div className="flex items-center gap-4 mb-6">
                <span className="text-coffee-dark font-semibold">Quantity:</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setDetailQty(Math.max(1, detailQty - 1))} className="w-10 h-10 bg-coffee-light rounded-xl flex items-center justify-center hover:bg-coffee-secondary transition text-coffee-dark font-bold text-lg">-</button>
                  <span className="w-8 text-center font-bold text-coffee-dark text-lg">{detailQty}</span>
                  <button onClick={() => setDetailQty(detailQty + 1)} className="w-10 h-10 bg-coffee-light rounded-xl flex items-center justify-center hover:bg-coffee-secondary transition text-coffee-dark font-bold text-lg">+</button>
                </div>
              </div>
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => { if (!isLoggedIn) { router.push("/login"); return; } setCart((prev) => { const existing = prev.find((c) => c.id === selectedItem.id); if (existing) { return prev.map((c) => c.id === selectedItem.id ? { ...c, quantity: c.quantity + detailQty } : c); } return [...prev, { id: selectedItem.id, name: selectedItem.name, price: selectedItem.price, quantity: detailQty }]; }); setShowCart(true); setSelectedItem(null); }}
                  disabled={!selectedItem.is_available}
                  className={`flex-1 py-3 rounded-xl font-semibold transition text-lg ${
                    selectedItem.is_available
                      ? "bg-coffee-primary text-coffee-cream hover:bg-coffee-dark"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {selectedItem.is_available ? (isLoggedIn ? "Add to Cart" : "Sign in to Order") : "Out of Stock"}
                </button>
                <button onClick={() => setSelectedItem(null)} className="px-6 py-3 border border-coffee-light rounded-xl hover:bg-coffee-cream transition font-medium">Close</button>
              </div>

              <div className="border-t border-coffee-light pt-6">
                <h4 className="font-bold text-coffee-dark mb-4">Reviews</h4>
                {isLoggedIn && (
                  <ReviewForm menuItemId={selectedItem.id} onSubmitted={() => {}} />
                )}
                <ReviewList menuItemId={selectedItem.id} />
              </div>
            </div>
          </div>
        </div>
      )}

      </section>
  );
}

function ReviewForm({ menuItemId, onSubmitted }: { menuItemId: number; onSubmitted: () => void }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    setSubmitting(true);
    try {
      await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menu_item_id: menuItemId, rating, comment }),
      });
      setDone(true);
      setRating(0);
      setComment("");
      onSubmitted();
    } catch {}
    setSubmitting(false);
  };

  if (done) return <p className="text-green-600 text-sm mb-4">Review submitted! Thank you.</p>;

  return (
    <form onSubmit={handleSubmit} className="mb-4 p-4 bg-coffee-cream rounded-xl">
      <p className="text-sm font-medium text-coffee-dark mb-2">Rate this item</p>
      <div className="flex gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} type="button" onClick={() => setRating(star)} className={`text-2xl ${star <= rating ? "text-yellow-400" : "text-gray-300"} hover:scale-110 transition`}>★</button>
        ))}
      </div>
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Write a review (optional)" className="w-full px-3 py-2 border border-coffee-light rounded-lg text-sm outline-none focus:ring-2 focus:ring-coffee-accent mb-2" rows={2} />
      <button type="submit" disabled={submitting || rating === 0} className="bg-coffee-primary text-coffee-cream text-sm px-4 py-2 rounded-lg font-semibold hover:bg-coffee-dark transition disabled:opacity-50">
        {submitting ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}

function ReviewList({ menuItemId }: { menuItemId: number }) {
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/reviews?menu_item_id=${menuItemId}`)
      .then((res) => res.json())
      .then(setReviews)
      .catch(() => {});
  }, [menuItemId]);

  if (reviews.length === 0) return <p className="text-coffee-primary/50 text-sm">No reviews yet. Be the first!</p>;

  return (
    <div className="space-y-3 max-h-48 overflow-y-auto">
      {reviews.map((r) => (
        <div key={r.id} className="p-3 bg-coffee-cream rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-coffee-dark">{r.user_name || r.customer_name}</span>
            <span className="text-yellow-400 text-sm">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
          </div>
          {r.comment && <p className="text-sm text-coffee-primary/70">{r.comment}</p>}
        </div>
      ))}
    </div>
  );
}
