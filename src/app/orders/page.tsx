"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  items: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<{ order: Order; items: { name: string; quantity: number; price: number }[] } | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);

  const fetchMyOrders = async () => {
    try {
      const res = await fetch("/api/orders/my");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOrders(data.map((o: Order) => ({ ...o, total: Number(o.total) })));
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyOrders();
    const interval = setInterval(fetchMyOrders, 5000);
    return () => clearInterval(interval);
  }, [router]);

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

  const trackingSteps = [
    { key: "pending", label: "Pending", sub: "Order received" },
    { key: "preparing", label: "Preparing", sub: "Preparing your order" },
    { key: "ready_for_pickup", label: "Ready for Pickup", sub: "Ready to be picked up" },
    { key: "out_for_delivery", label: "Out for Delivery", sub: "In transit" },
    { key: "delivered", label: "Delivered", sub: "Order completed" },
  ];

  const trackingIndex = (s: string | null) => {
    const idx = trackingSteps.findIndex((t) => t.key === s);
    return idx === -1 ? 0 : idx;
  };

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
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-xs rounded-full font-medium ${order.status === "completed" ? "bg-green-100 text-green-700" : order.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                      {order.status}
                    </span>
                    {order.order_type === "takeout" && (
                      <span className="capitalize text-coffee-dark text-xs">{trackingSteps[trackingIndex(order.delivery_status)].label}</span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-coffee-dark mb-2">{order.items}</p>
                {(order.delivery_address || order.customer_phone) && (
                  <p className="text-xs text-coffee-primary/70 mb-2">
                    {order.customer_phone && <>📞 {order.customer_phone}{order.delivery_address ? " · " : ""}</>}
                    {order.delivery_address && <>📍 {order.delivery_address}</>}
                  </p>
                )}
                {order.order_type === "takeout" && (
                  <div className="mb-4">
                    {(() => {
                      const current = trackingIndex(order.delivery_status);
                      const progress = current / (trackingSteps.length - 1);
                      return (
                        <div className="relative pt-1">
                          <div className="absolute top-[5px] left-[10%] right-[10%] h-0.5 bg-coffee-light" />
                          {current > 0 && (
                            <div className="absolute top-[5px] left-[10%] h-0.5 bg-green-500" style={{ width: `${Math.round(progress * 80)}%` }} />
                          )}
                          <div className="flex justify-between relative">
                            {trackingSteps.map((step, i) => {
                              const done = i < current;
                              const isCurrent = i === current;
                              return (
                                <div key={step.key} className="flex flex-col items-center w-full gap-1">
                                  <span className={`w-3 h-3 rounded-full z-[1] ${done || isCurrent ? "bg-green-500" : "bg-coffee-light"} ${isCurrent ? "ring-2 ring-green-300" : ""}`} />
                                  <span className={`text-[10px] text-center whitespace-nowrap ${isCurrent ? "text-coffee-dark font-semibold" : done ? "text-coffee-primary" : "text-coffee-primary/50"}`}>{step.label}</span>
                                  <span className="hidden sm:block text-[9px] text-center text-coffee-primary/40">{step.sub}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
                <div className="flex justify-between items-center text-sm">
                  <div className="flex gap-2">
                    <button onClick={() => openReceipt(order.id)} disabled={receiptLoading} className="text-coffee-accent hover:text-coffee-dark text-xs font-semibold border border-coffee-light rounded-lg px-3 py-1.5 disabled:opacity-50 transition">
                      View Receipt
                    </button>
                    {order.order_type === "takeout" && order.delivery_address && (
                      <button onClick={() => setTrackingOrder(order)} className="text-coffee-accent hover:text-coffee-dark text-xs font-semibold border border-coffee-light rounded-lg px-3 py-1.5 transition">
                        🗺️ Track
                      </button>
                    )}
                  </div>
                  <span className="text-coffee-accent font-bold text-lg">₱{order.total.toFixed(2)}</span>
                </div>
              </div>
            ))}
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
          mode="customer"
          onClose={() => setTrackingOrder(null)}
        />
      )}
    </div>
  );
}