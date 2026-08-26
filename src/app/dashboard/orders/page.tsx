"use client";

import { useEffect, useState } from "react";

interface Order {
  id: number;
  customer_name: string;
  total: number;
  status: string;
  payment_method: string;
  order_type: string;
  pickup_time: string | null;
  created_at: string;
  staff_name: string | null;
  staff_role: string | null;
  items: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      setOrders(data.map((o: Order) => ({ ...o, total: Number(o.total) })));
    } catch {
      setOrders([
        { id: 1, customer_name: "Juan Dela Cruz", total: 185.00, status: "completed", payment_method: "cash", order_type: "dine-in", pickup_time: null, created_at: new Date().toISOString(), staff_name: "Maria Santos", staff_role: "member", items: "Espresso x2, Latte x1" },
        { id: 2, customer_name: "Walk-in", total: 95.50, status: "completed", payment_method: "card", order_type: "dine-in", pickup_time: null, created_at: new Date().toISOString(), staff_name: "Jose Reyes", staff_role: "member", items: "Cappuccino x1, Muffin x2" },
        { id: 3, customer_name: "Anna Garcia", total: 250.00, status: "pending", payment_method: "digital", order_type: "takeout", pickup_time: "14:30", created_at: new Date().toISOString(), staff_name: null, staff_role: null, items: "Cold Brew x3, Tiramisu x2" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    await fetch("/api/orders", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    fetchOrders();
  };

  const filteredOrders = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  if (loading) return <div className="flex items-center justify-center h-64 text-coffee-primary">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-coffee-dark">Customer Orders</h2>
        <div className="flex gap-2">
          {["all", "pending", "completed", "cancelled"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-full text-sm font-medium transition capitalize ${filter === f ? "bg-coffee-primary text-coffee-cream" : "bg-coffee-light text-coffee-primary"}`}>
              {f}
            </button>
          ))}
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
                <th className="text-left px-6 py-3 text-sm font-medium text-coffee-primary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-coffee-light">
              {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-coffee-cream/50">
                    <td className="px-6 py-4 text-sm font-medium text-coffee-dark">#{order.id}</td>
                    <td className="px-6 py-4 text-sm text-coffee-dark">{order.customer_name}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="capitalize text-coffee-dark">{order.order_type || "dine-in"}</span>
                      {order.pickup_time && <span className="text-coffee-primary/60 ml-1">@{order.pickup_time}</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-coffee-primary max-w-[200px] truncate">{order.items}</td>
                    <td className="px-6 py-4 text-sm font-medium text-coffee-dark">₱{order.total.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-coffee-primary capitalize">{order.payment_method}</td>
                    <td className="px-6 py-4 text-sm">
                      {order.staff_name ? (
                        <span className="text-coffee-dark">{order.staff_name} <span className="text-[10px] text-coffee-primary/50">({order.staff_role === "admin" ? "Owner" : order.staff_role === "barista" ? "Member" : order.staff_role})</span></span>
                      ) : (
                        <span className="text-coffee-primary/50">Walk-in</span>
                      )}
                    </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${order.status === "completed" ? "bg-green-100 text-green-700" : order.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      {order.status === "pending" && (
                        <>
                          <button onClick={() => updateStatus(order.id, "completed")} className="text-green-500 hover:text-green-700 text-xs px-2 py-1 rounded bg-green-50">Complete</button>
                          <button onClick={() => updateStatus(order.id, "cancelled")} className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded bg-red-50">Cancel</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredOrders.length === 0 && (
          <div className="text-center py-12 text-coffee-primary">No orders found</div>
        )}
      </div>
    </div>
  );
}
