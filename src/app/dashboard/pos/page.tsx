"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import ReceiptModal from "@/components/ReceiptModal";

const OrderTracker = dynamic(() => import("@/components/OrderTracker"), { ssr: false });

interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category_id: number | null;
  category: string | null;
  type: string | null;
  image: string | null;
  is_available: boolean | number;
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

interface ReceiptData {
  order: {
    id: number;
    customer_name: string;
    total: number;
    status: string;
    payment_method: string;
    order_type: string;
    delivery_address: string | null;
    customer_phone: string | null;
    created_at: string;
  };
  items: { name: string; quantity: number; price: number }[];
}

interface Order {
  id: number;
  customer_name: string;
  total: number;
  status: string;
  payment_method: string;
  order_type: string;
  delivery_address: string | null;
  customer_phone: string | null;
  delivery_status: string | null;
  created_at: string;
}

export default function PosPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState("all");
  const [search, setSearch] = useState("");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("Walk-in");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [orderType, setOrderType] = useState("dine-in");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentRef, setPaymentRef] = useState("");
  const [tendered, setTendered] = useState("");

  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState<{ code: string; discount_amount: number } | null>(null);
  const [promoError, setPromoError] = useState("");

  const [orders, setOrders] = useState<Order[]>([]);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  useEffect(() => {
    Promise.all([fetch("/api/menu"), fetch("/api/categories")])
      .then(async ([menuRes, catRes]) => [await menuRes.json(), await catRes.json()] as [MenuItem[], Category[]])
      .then(([menu, cats]) => {
        setMenuItems(menu.map((m) => ({ ...m, price: Number(m.price) })));
        setCategories(cats);
      })
      .catch(() => setError("Failed to load menu"))
      .finally(() => setLoading(false));
    fetch("/api/profile").then((r) => r.json()).then((d) => setUserId(d.id || null)).catch(() => {});
  }, []);

  const fetchOrders = () => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data: Order[]) => setOrders(data.filter((o) => o.status === "pending") as Order[]))
      .catch(() => {});
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const addToCart = (item: MenuItem) => {
    if (!item.is_available) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart((prev) => prev.map((c) => c.id === id ? { ...c, quantity: c.quantity + delta } : c).filter((c) => c.quantity > 0));
  };

  const removeItem = (id: number) => {
    setCart((prev) => prev.filter((c) => c.id !== id));
  };

  const subtotal = useMemo(() => cart.reduce((sum, c) => sum + c.price * c.quantity, 0), [cart]);
  const discount = promoApplied ? Number(promoApplied.discount_amount) : 0;
  const total = Math.max(0, subtotal - discount);
  const cashTendered = parseFloat(tendered) || 0;
  const change = cashTendered - total;
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const applyPromo = async () => {
    setPromoError("");
    if (!promoCode.trim()) return;
    if (subtotal <= 0) {
      setPromoError("Add items first before applying a promo.");
      return;
    }
    try {
      const res = await fetch("/api/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode, order_total: subtotal }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPromoError(data.error || "Invalid promo code");
        setPromoApplied(null);
        return;
      }
      setPromoApplied({ code: data.code, discount_amount: data.discount_amount });
      setSuccess(`Promo ${data.code} applied: -₱${Number(data.discount_amount).toFixed(2)}`);
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setPromoError("Failed to validate promo code");
    }
  };

  const clearAll = () => {
    setCart([]);
    setCustomerName("Walk-in");
    setCustomerPhone("");
    setDeliveryAddress("");
    setOrderType("dine-in");
    setPaymentMethod("cash");
    setPaymentRef("");
    setTendered("");
    setPromoCode("");
    setPromoApplied(null);
    setPromoError("");
    setError("");
  };

  const placeOrder = async () => {
    if (cart.length === 0) {
      setError("Cart is empty.");
      return;
    }
    if (paymentMethod === "cash" && cashTendered < total) {
      setError("Tendered amount is less than the total.");
      return;
    }
    setProcessing(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName || "Walk-in",
          payment_method: paymentMethod,
          order_type: orderType,
          delivery_address: orderType === "takeout" ? deliveryAddress || null : null,
          customer_phone: customerPhone || null,
          created_by: userId,
          promo_code: promoApplied ? promoApplied.code : null,
          discount: promoApplied ? Number(promoApplied.discount_amount) : 0,
          payment_ref: paymentMethod === "gcash" ? paymentRef || null : null,
          items: cart.map((c) => ({ menu_item_id: c.id, quantity: c.quantity, price: c.price })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to place order");
        return;
      }
      const orderId = data.id;
      setSuccess(`Order #${orderId} placed — ₱${total.toFixed(2)}`);
      const order = {
        id: orderId,
        customer_name: customerName || "Walk-in",
        total,
        status: "pending",
        payment_method: paymentMethod,
        order_type: orderType,
        delivery_address: orderType === "takeout" ? deliveryAddress || null : null,
        customer_phone: customerPhone || null,
        created_at: new Date().toISOString(),
      };
      if (orderType === "takeout") {
        setTrackingOrder(order as Order);
      }
      setReceipt({ order, items: cart.map((c) => ({ name: c.name, quantity: c.quantity, price: c.price })) });
      clearAll();
      fetchOrders();
      setTimeout(() => setSuccess(""), 4000);
    } catch {
      setError("Failed to place order. Check your connection.");
    } finally {
      setProcessing(false);
    }
  };

  const updateOrderStatus = async (id: number, status: string) => {
    try {
      await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      fetchOrders();
    } catch {}
  };

  const updateDeliveryStatus = async (id: number, delivery_status: string) => {
    try {
      await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, delivery_status }),
      });
      fetchOrders();
    } catch {}
  };

  const formatTracking = (s: string | null) => {
    switch (s) {
      case "preparing": return "🍳 Preparing";
      case "ready_for_pickup": return "🛵 Ready";
      case "out_for_delivery": return "⚡ Out for Delivery";
      case "delivered": return "🎉 Delivered";
      default: return "🧾 Pending";
    }
  };

  const openReceipt = (id: number) => {
    fetch(`/api/orders/receipt?id=${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.order) {
          setReceipt({ order: { ...data.order, total: Number(data.order.total) }, items: data.items });
        }
      })
      .catch(() => {});
  };

  const filteredItems = menuItems.filter((item) => {
    if (activeCat !== "all" && (item.category !== activeCat)) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-coffee-primary">Loading POS...</p></div>;
  }

  return (
    <div className="space-y-6">
      {success && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[150] bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">
          {success}
        </div>
      )}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[150] bg-red-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">

      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h1 className="text-2xl font-bold text-coffee-dark">Point of Sale</h1>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items..."
            className="sm:w-64 px-4 py-2.5 rounded-xl border border-coffee-light bg-white focus:ring-2 focus:ring-coffee-accent outline-none transition text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setActiveCat("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${activeCat === "all" ? "bg-coffee-primary text-coffee-cream" : "bg-white text-coffee-primary border border-coffee-light hover:bg-coffee-cream"}`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.name)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${activeCat === cat.name ? "bg-coffee-primary text-coffee-cream" : "bg-white text-coffee-primary border border-coffee-light hover:bg-coffee-cream"}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-coffee-light">
            <p className="text-5xl mb-4">☕</p>
            <p className="text-coffee-primary">No items found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item) => {
              const available = !!item.is_available;
              return (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  disabled={!available}
                  className={`bg-white rounded-2xl border border-coffee-light overflow-hidden text-left transition hover:shadow-lg hover:-translate-y-0.5 ${available ? "cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
                >
                  <div className="relative h-32 bg-coffee-cream">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-coffee-primary/30 text-4xl">☕</div>
                    )}
                    {!available && (
                      <span className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full">SOLD OUT</span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-coffee-dark line-clamp-1">{item.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-coffee-accent font-bold">₱{item.price.toFixed(2)}</span>
                      <span className="w-7 h-7 rounded-full bg-coffee-primary text-coffee-cream text-sm font-bold flex items-center justify-center">+</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="lg:w-[380px] lg:shrink-0">
        <div className="bg-white rounded-2xl border border-coffee-light sticky top-6 max-h-[calc(100vh-6rem)] flex flex-col overflow-hidden">
          <div className="p-4 border-b border-coffee-light flex items-center justify-between">
            <h2 className="font-bold text-coffee-dark">Current Order</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-coffee-primary">{cartCount} item(s)</span>
              <button onClick={clearAll} className="text-xs text-red-500 hover:text-red-700 font-medium">Clear</button>
            </div>
          </div>

          <div className="p-4 border-b border-coffee-light space-y-3">
            <div>
              <label className="block text-xs font-medium text-coffee-primary mb-1">Customer Name</label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-coffee-light focus:ring-2 focus:ring-coffee-accent outline-none transition text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {["dine-in", "takeout"].map((type) => (
                <button
                  key={type}
                  onClick={() => setOrderType(type)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition ${orderType === type ? "bg-coffee-primary text-coffee-cream" : "border border-coffee-light text-coffee-primary hover:bg-coffee-cream"}`}
                >
                  {type === "dine-in" ? "🍽️ Dine-in" : "🥡 Takeout"}
                </button>
              ))}
            </div>
            <div>
              <label className="block text-xs font-medium text-coffee-primary mb-1">Contact Number</label>
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. 0917 123 4567"
                className="w-full px-3 py-2 rounded-lg border border-coffee-light focus:ring-2 focus:ring-coffee-accent outline-none transition text-sm"
              />
            </div>
            {orderType === "takeout" && (
              <div>
                <label className="block text-xs font-medium text-coffee-primary mb-1">Delivery Address</label>
                <textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="e.g. 123 Coffee Street, Barangay, City"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-coffee-light focus:ring-2 focus:ring-coffee-accent outline-none transition text-sm resize-none"
                />
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[160px]">
            {cart.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-3xl mb-2">🛒</p>
                <p className="text-sm text-coffee-primary/60">Tap items from the menu to add to the order.</p>
              </div>
            ) : (
              cart.map((c) => (
                <div key={c.id} className="flex items-center gap-3 bg-coffee-cream rounded-xl p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-coffee-dark truncate">{c.name}</p>
                    <p className="text-xs text-coffee-primary">₱{c.price.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(c.id, -1)} className="w-6 h-6 rounded-full bg-white border border-coffee-light text-coffee-primary text-sm font-bold hover:bg-coffee-cream transition">−</button>
                    <span className="w-6 text-center text-sm font-semibold text-coffee-dark">{c.quantity}</span>
                    <button onClick={() => updateQty(c.id, 1)} className="w-6 h-6 rounded-full bg-white border border-coffee-light text-coffee-primary text-sm font-bold hover:bg-coffee-cream transition">+</button>
                  </div>
                  <span className="text-sm font-bold text-coffee-accent w-16 text-right">₱{(c.price * c.quantity).toFixed(2)}</span>
                  <button onClick={() => removeItem(c.id)} className="text-coffee-primary/40 hover:text-red-500 transition text-sm">✕</button>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-coffee-light space-y-4">
            <div>
              <label className="block text-xs font-medium text-coffee-primary mb-1">Promo Code</label>
              <div className="flex gap-2">
                <input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="e.g. WELCOME10"
                  className="flex-1 px-3 py-2 rounded-lg border border-coffee-light focus:ring-2 focus:ring-coffee-accent outline-none transition text-sm uppercase"
                />
                <button onClick={applyPromo} className="px-4 py-2 rounded-lg bg-coffee-dark text-coffee-cream text-sm font-medium hover:bg-coffee-primary transition">Apply</button>
              </div>
              {promoError && <p className="text-xs text-red-500 mt-1">{promoError}</p>}
              {promoApplied && (
                <p className="text-xs text-green-600 mt-1 font-medium">Promo {promoApplied.code} applied: -₱{promoApplied.discount_amount.toFixed(2)}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-coffee-primary mb-1">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {["cash", "gcash"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    className={`px-2 py-2 rounded-lg text-xs font-medium capitalize transition ${paymentMethod === m ? "bg-coffee-primary text-coffee-cream" : "border border-coffee-light text-coffee-primary hover:bg-coffee-cream"}`}
                  >
                    {m === "cash" ? "💵 Cash" : "📱 GCash"}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === "cash" && (
              <div>
                <label className="block text-xs font-medium text-coffee-primary mb-1">Cash Tendered</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={tendered}
                  onChange={(e) => setTendered(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-lg border border-coffee-light focus:ring-2 focus:ring-coffee-accent outline-none transition text-sm"
                />
                <p className={`text-sm font-semibold mt-1 ${change >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {change >= 0 ? `Change: ₱${change.toFixed(2)}` : `Short: ₱${Math.abs(change).toFixed(2)}`}
                </p>
              </div>
            )}

            {paymentMethod === "gcash" && (
              <div>
                <label className="block text-xs font-medium text-coffee-primary mb-1">GCash Reference No.</label>
                <input
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. 1234567890"
                  className="w-full px-3 py-2 rounded-lg border border-coffee-light focus:ring-2 focus:ring-coffee-accent outline-none transition text-sm"
                />
              </div>
            )}

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-coffee-primary">
                <span>Subtotal</span>
                <span className="text-coffee-dark font-medium">₱{subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-coffee-primary">
                  <span>Discount</span>
                  <span className="text-red-500 font-medium">-₱{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-coffee-light">
                <span className="font-bold text-coffee-dark">TOTAL</span>
                <span className="text-2xl font-extrabold text-coffee-accent">₱{total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={placeOrder}
              disabled={processing || cart.length === 0}
              className="w-full bg-coffee-primary text-coffee-cream py-3.5 rounded-xl font-bold text-base hover:bg-coffee-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </>
              ) : (
                <>💰 Charge ₱{total.toFixed(2)}</>
              )}
            </button>
          </div>
        </div>
      </div>
      </div>

      <div className="bg-white rounded-2xl border border-coffee-light p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-coffee-dark text-lg">🛵 Active Orders &amp; Tracking</h2>
          <span className="text-xs text-coffee-primary">{orders.length} pending</span>
        </div>
        {orders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm text-coffee-primary/60">No pending orders.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {orders.map((order) => (
              <div key={order.id} className="rounded-xl border border-coffee-light p-4 bg-coffee-cream/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-coffee-dark">Order #{order.id}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">{order.status}</span>
                </div>
                <p className="text-xs text-coffee-primary">👤 {order.customer_name}{order.customer_phone ? ` · 📞 ${order.customer_phone}` : ""}</p>
                {order.order_type === "takeout" && (
                  <>
                    <p className="text-xs text-coffee-primary">📍 {order.delivery_address || "No address"}</p>
                    <span className="text-xs font-medium mt-1 inline-block">{formatTracking(order.delivery_status)}</span>
                  </>
                )}
                <p className="text-sm font-bold text-coffee-accent mt-1">₱{Number(order.total).toFixed(2)}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {order.order_type === "takeout" && (
                    <>
                      {order.delivery_status === "pending" && (
                        <button onClick={() => updateDeliveryStatus(order.id, "preparing")} className="text-[11px] px-2 py-1 rounded bg-amber-50 text-amber-600 hover:bg-amber-100">🍳 Preparing</button>
                      )}
                      {order.delivery_status === "preparing" && (
                        <button onClick={() => updateDeliveryStatus(order.id, "ready_for_pickup")} className="text-[11px] px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100">🛵 Ready for Pickup</button>
                      )}
                      {order.delivery_status === "ready_for_pickup" && (
                        <button onClick={() => updateDeliveryStatus(order.id, "out_for_delivery")} className="text-[11px] px-2 py-1 rounded bg-orange-50 text-orange-600 hover:bg-orange-100">⚡ Out for Delivery</button>
                      )}
                      {order.delivery_status === "out_for_delivery" && (
                        <button onClick={() => updateDeliveryStatus(order.id, "delivered")} className="text-[11px] px-2 py-1 rounded bg-green-50 text-green-600 hover:bg-green-100">🎉 Delivered</button>
                      )}
                      {order.delivery_address && (
                        <button onClick={() => setTrackingOrder(order)} className="text-[11px] px-2 py-1 rounded bg-coffee-cream text-coffee-accent border border-coffee-light">🗺️ Track</button>
                      )}
                    </>
                  )}
                  <button onClick={() => openReceipt(order.id)} className="text-[11px] px-2 py-1 rounded bg-coffee-cream text-coffee-accent border border-coffee-light">🧾 Receipt</button>
                  <button onClick={() => updateOrderStatus(order.id, "completed")} className="text-[11px] px-2 py-1 rounded bg-green-50 text-green-600 hover:bg-green-100">✔ Complete</button>
                  <button onClick={() => updateOrderStatus(order.id, "cancelled")} className="text-[11px] px-2 py-1 rounded bg-red-50 text-red-500 hover:bg-red-100">✕ Cancel</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {receipt && (
        <ReceiptModal
          order={{ ...receipt.order, total: Number(receipt.order.total) }}
          items={receipt.items.map((it) => ({ ...it, price: Number(it.price) }))}
          onClose={() => setReceipt(null)}
        />
      )}

      {trackingOrder && (
        <OrderTracker
          orderId={trackingOrder.id}
          orderNumber={trackingOrder.id}
          deliveryAddress={trackingOrder.delivery_address || ""}
          customerName={trackingOrder.customer_name}
          customerPhone={trackingOrder.customer_phone || ""}
          deliveryStatus={trackingOrder.delivery_status}
          mode="driver"
          onClose={() => setTrackingOrder(null)}
        />
      )}
    </div>
  );
}