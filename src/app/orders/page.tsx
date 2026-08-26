"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Order {
  id: number;
  customer_name: string;
  total: number;
  status: string;
  payment_method: string;
  order_type: string;
  pickup_time: string | null;
  created_at: string;
  items: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders/my")
      .then((res) => { if (!res.ok) throw new Error(); return res.json(); })
      .then((data) => setOrders(data.map((o: Order) => ({ ...o, total: Number(o.total) }))))
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <div className="min-h-screen bg-coffee-cream flex items-center justify-center"><p className="text-coffee-primary">Loading...</p></div>;

  return (
    <div className="min-h-screen bg-coffee-cream">
      <nav className="bg-coffee-dark/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.jpg" alt="Logo" className="h-8 w-8 rounded-lg object-cover" />
            <span className="text-xl font-bold text-coffee-accent">My Orders</span>
          </Link>
          <Link href="/" className="text-coffee-cream hover:text-coffee-accent transition">&larr; Back</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {orders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📋</p>
            <h2 className="text-2xl font-bold text-coffee-dark mb-2">No orders yet</h2>
            <p className="text-coffee-primary mb-6">Place your first order from our menu!</p>
            <Link href="/#menu" className="bg-coffee-primary text-coffee-cream px-6 py-3 rounded-xl font-semibold hover:bg-coffee-dark transition">Browse Menu</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-coffee-light p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-coffee-dark">Order #{order.id}</h3>
                    <p className="text-sm text-coffee-primary/60">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs rounded-full font-medium ${order.status === "completed" ? "bg-green-100 text-green-700" : order.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-sm text-coffee-dark mb-2">{order.items}</p>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-coffee-primary/70 capitalize">
                    {order.order_type || "dine-in"}
                    {order.pickup_time ? ` @ ${order.pickup_time}` : ""} &middot; {order.payment_method}
                  </span>
                  <span className="text-coffee-accent font-bold text-lg">₱{order.total.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
