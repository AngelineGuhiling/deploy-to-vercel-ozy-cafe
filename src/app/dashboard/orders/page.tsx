"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import ReceiptModal from "@/components/ReceiptModal";
const OrderTracker = dynamic(() => import("@/components/OrderTracker"), { ssr: false });

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
  staff_name: string | null;
  staff_role: string | null;
  items: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [receipt, setReceipt] = useState<{ order: Order; items: { name: string; quantity: number; price: number }[] } | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const highlightRef = useRef<HTMLTableRowElement>(null);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const view = new URLSearchParams(window.location.search).get("view");
    if (view) {
      const t = setTimeout(() => setHighlightId(Number(view)), 0);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightId, orders]);

  const openReceipt = async (id: number) => {
    setReceiptLoading(true);
    try {
      const res = await fetch(`/api/orders/receipt?id=${id}`);
      const data = await res.json();
      if (data.order) {
        setReceipt({ order: { ...data.order, total: Number(data.order.total) }, items: data.items });
      }
    } catch {}
    setReceiptLoading(false);
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      setOrders(data.map((o: Order) => ({ ...o, total: Number(o.total) })));
    } catch {
      setOrders([
        { id: 1, customer_name: "Juan Dela Cruz", total: 185.00, status: "completed", payment_method: "cash", order_type: "dine-in", delivery_address: null, customer_phone: null, delivery_status: null, created_at: new Date().toISOString(), staff_name: "Maria Santos", staff_role: "member", items: "Espresso x2, Latte x1" },
        { id: 2, customer_name: "Walk-in", total: 95.50, status: "completed", payment_method: "gcash", order_type: "dine-in", delivery_address: null, customer_phone: null, delivery_status: null, created_at: new Date().toISOString(), staff_name: "Jose Reyes", staff_role: "member", items: "Cappuccino x1, Muffin x2" },
        { id: 3, customer_name: "Anna Garcia", total: 250.00, status: "pending", payment_method: "gcash", order_type: "takeout", delivery_address: "123 Coffee Street", customer_phone: "09171234567", delivery_status: "out_for_delivery", created_at: new Date().toISOString(), staff_name: null, staff_role: null, items: "Cold Brew x3, Tiramisu x2" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    await fetch("/api/orders", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    fetchOrders();
  };

  const updateDeliveryStatus = async (id: number, deliveryStatus: string) => {
    await fetch("/api/orders", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, delivery_status: deliveryStatus }) });
    fetchOrders();
  };

  const formatTracking = (s: string | null) =>
    s === "preparing" ? "Preparing"
    : s === "ready_for_pickup" ? "Ready for Pickup"
    : s === "out_for_delivery" ? "Out for Delivery"
    : s === "pending" ? "Pending"
    : s === "delivered" ? "Delivered"
    : s === "confirmed" ? "Preparing"
    : s || "";

  const trackingBadge = (s: string | null) =>
    s === "preparing" ? "bg-amber-100 text-amber-700"
    : s === "ready_for_pickup" ? "bg-blue-100 text-blue-700"
    : s === "out_for_delivery" ? "bg-orange-100 text-orange-700"
    : s === "delivered" ? "bg-green-100 text-green-700"
    : s === "pending" ? "bg-yellow-100 text-yellow-700"
    : "bg-gray-100 text-gray-700";

  const statusBadge = (s: string) =>
    s === "reserved" ? "bg-blue-100 text-blue-700"
    : s === "served" ? "bg-green-100 text-green-700"
    : s === "completed" ? "bg-green-100 text-green-700"
    : s === "pending" ? "bg-yellow-100 text-yellow-700"
    : "bg-red-100 text-red-700";

  const filteredOrders = orders.filter((o) => {
    if (filter !== "all" && o.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        o.customer_name.toLowerCase().includes(q) ||
        o.staff_name?.toLowerCase().includes(q) ||
        o.items?.toLowerCase().includes(q) ||
        `#${o.id}`.includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredOrders.length / perPage);
  const paginatedOrders = filteredOrders.slice((page - 1) * perPage, page * perPage);

  if (loading) return <div className="flex items-center justify-center h-64 text-coffee-primary">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-coffee-dark">Customer Orders</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search orders..." className="px-4 py-2 border border-coffee-light rounded-lg text-sm focus:ring-2 focus:ring-coffee-accent outline-none w-full sm:w-56" />
          <div className="flex gap-2 flex-wrap">
            {["all", "reserved", "served", "pending", "completed", "cancelled"].map((f) => (
              <button key={f} onClick={() => { setFilter(f); setPage(1); }} className={`px-4 py-2 rounded-full text-sm font-medium transition capitalize ${filter === f ? "bg-coffee-primary text-coffee-cream" : "bg-coffee-light text-coffee-primary"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-coffee-light overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-coffee-cream">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-coffee-primary">Order</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-coffee-primary">Customer</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-coffee-primary">Type</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-coffee-primary">Items</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-coffee-primary">Total</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-coffee-primary">Payment</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-coffee-primary">Placed By</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-coffee-primary">Status</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-coffee-primary">Tracking</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-coffee-primary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-coffee-light">
              {paginatedOrders.map((order) => {
              const tracking = order.delivery_status || "pending";
              return (
                  <tr key={order.id} ref={order.id === highlightId ? highlightRef : null} className={`transition-colors duration-500 ${order.id === highlightId ? "bg-yellow-50 ring-2 ring-yellow-300 rounded" : "hover:bg-coffee-cream/50"}`}>
                    <td className="px-6 py-4 text-sm font-medium text-coffee-dark">#{order.id}</td>
                    <td className="px-6 py-4 text-sm text-coffee-dark">{order.customer_name}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="capitalize text-coffee-dark">{order.order_type || "dine-in"}</span>
                      {order.delivery_address && <span className="text-coffee-primary/60 ml-1">@ {order.delivery_address}</span>}
                      {order.customer_phone && <span className="block text-coffee-primary/60">📞 {order.customer_phone}</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-coffee-primary max-w-[200px] truncate">{order.items}</td>
                    <td className="px-6 py-4 text-sm font-medium text-coffee-dark">₱{order.total.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-coffee-primary capitalize">{order.payment_method}</td>
                    <td className="px-6 py-4 text-sm font-medium text-coffee-dark">{order.staff_name ? (
                        <span className="text-coffee-dark">{order.staff_name} <span className="text-[10px] text-coffee-primary/50">({order.staff_role === "admin" ? "Owner" : order.staff_role === "barista" ? "Member" : order.staff_role})</span></span>
                      ) : (
                        <span className="text-coffee-primary/50">Walk-in</span>
                      )}
                    </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full capitalize ${statusBadge(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {order.order_type === "takeout" && (
                      <span className={`px-2 py-1 text-xs rounded-full ${trackingBadge(tracking)}`}>
                        {formatTracking(tracking)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      <button onClick={() => openReceipt(order.id)} disabled={receiptLoading} className="text-coffee-accent hover:text-coffee-dark text-xs px-2 py-1 rounded bg-coffee-cream border border-coffee-light disabled:opacity-50">Receipt</button>
                      {(order.status === "reserved" || order.status === "pending") && (
                        <>
                          <button onClick={() => updateStatus(order.id, "served")} className="text-green-500 hover:text-green-700 text-xs px-2 py-1 rounded bg-green-50">Mark Served</button>
                          {order.status === "pending" && (
                            <button onClick={() => updateStatus(order.id, "completed")} className="text-green-500 hover:text-green-700 text-xs px-2 py-1 rounded bg-green-50">Complete</button>
                          )}
                          <button onClick={() => updateStatus(order.id, "cancelled")} className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded bg-red-50">Cancel</button>
                        </>
                      )}
                      {order.order_type === "takeout" && (
                        <>
                          {tracking === "pending" && (
                            <button onClick={() => updateDeliveryStatus(order.id, "preparing")} className="text-amber-500 hover:text-amber-700 text-xs px-2 py-1 rounded bg-amber-50">Preparing</button>
                          )}
                          {tracking === "preparing" && (
                            <>
                              <button onClick={() => updateDeliveryStatus(order.id, "ready_for_pickup")} className="text-blue-500 hover:text-blue-700 text-xs px-2 py-1 rounded bg-blue-50">Ready for Pickup</button>
                              <button onClick={() => updateDeliveryStatus(order.id, "out_for_delivery")} className="text-orange-500 hover:text-orange-700 text-xs px-2 py-1 rounded bg-orange-50">Out for Delivery</button>
                            </>
                          )}
                          {tracking === "ready_for_pickup" && (
                            <>
                              <button onClick={() => updateDeliveryStatus(order.id, "out_for_delivery")} className="text-orange-500 hover:text-orange-700 text-xs px-2 py-1 rounded bg-orange-50">Out for Delivery</button>
                              <button onClick={() => updateDeliveryStatus(order.id, "delivered")} className="text-green-500 hover:text-green-700 text-xs px-2 py-1 rounded bg-green-50">Delivered</button>
                            </>
                          )}
                          {tracking === "out_for_delivery" && (
                            <button onClick={() => updateDeliveryStatus(order.id, "delivered")} className="text-green-500 hover:text-green-700 text-xs px-2 py-1 rounded bg-green-50">Delivered</button>
                          )}
                          {order.delivery_address && (
                            <button
                              onClick={() => setTrackingOrder(order)}
                              className="text-coffee-accent hover:text-coffee-dark text-xs px-2 py-1 rounded bg-coffee-cream border border-coffee-light"
                              title="Open live tracking map"
                            >
                              🗺️ Track
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
        {filteredOrders.length === 0 && (
          <div className="text-center py-12 text-coffee-primary">No orders found</div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-coffee-light">
            <span className="text-sm text-coffee-primary">Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filteredOrders.length)} of {filteredOrders.length}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1 text-sm rounded border border-coffee-light disabled:opacity-40 hover:bg-coffee-cream">Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 text-sm rounded ${page === p ? "bg-coffee-primary text-coffee-cream" : "border border-coffee-light hover:bg-coffee-cream"}`}>{p}</button>
              ))}
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-3 py-1 text-sm rounded border border-coffee-light disabled:opacity-40 hover:bg-coffee-cream">Next</button>
            </div>
          </div>
        )}
      </div>

      {receipt && (
        <ReceiptModal
          order={receipt.order}
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
