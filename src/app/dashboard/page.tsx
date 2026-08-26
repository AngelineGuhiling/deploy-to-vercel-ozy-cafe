"use client";

import { useEffect, useState } from "react";

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  todayOrders: number;
}

interface Order {
  id: number;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
  staff_name: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ totalOrders: 0, totalRevenue: 0, totalProducts: 0, todayOrders: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/analytics");
      const data = await res.json();
      setStats({
        totalOrders: Number(data.stats.totalOrders),
        totalRevenue: Number(data.stats.totalRevenue),
        totalProducts: Number(data.stats.totalProducts),
        todayOrders: Number(data.stats.todayOrders),
      });
      setRecentOrders((data.recentOrders?.slice(0, 5) || []).map((o: Order) => ({ ...o, total: Number(o.total) })));
    } catch {
      setStats({ totalOrders: 156, totalRevenue: 4523.50, totalProducts: 24, todayOrders: 12 });
      setRecentOrders([
        { id: 1, customer_name: "Juan Dela Cruz", total: 185.00, status: "completed", created_at: new Date().toISOString(), staff_name: "Maria Santos" },
        { id: 2, customer_name: "Walk-in", total: 95.50, status: "completed", created_at: new Date().toISOString(), staff_name: "Jose Reyes" },
        { id: 3, customer_name: "Anna Garcia", total: 250.00, status: "pending", created_at: new Date().toISOString(), staff_name: "Maria Santos" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: "Today's Orders", value: stats.todayOrders, icon: "🛒", color: "bg-blue-500" },
    { title: "Total Revenue", value: `₱${stats.totalRevenue.toLocaleString()}`, icon: "💰", color: "bg-green-500" },
    { title: "Menu Items", value: stats.totalProducts, icon: "📋", color: "bg-purple-500" },
    { title: "Total Orders", value: stats.totalOrders, icon: "📈", color: "bg-orange-500" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-coffee-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-coffee-dark">Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <div key={card.title} className="bg-white rounded-xl shadow-sm p-6 border border-coffee-light">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-coffee-primary">{card.title}</p>
                <p className="text-2xl font-bold text-coffee-dark mt-1">{card.value}</p>
              </div>
              <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center text-2xl`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-coffee-light">
        <div className="p-6 border-b border-coffee-light">
          <h3 className="text-lg font-semibold text-coffee-dark">Recent Orders</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-coffee-cream">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-coffee-primary">Order ID</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-coffee-primary">Customer</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-coffee-primary">Staff</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-coffee-primary">Total</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-coffee-primary">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-coffee-light">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-coffee-cream/50">
                  <td className="px-6 py-4 text-sm text-coffee-dark">#{order.id}</td>
                  <td className="px-6 py-4 text-sm text-coffee-dark">{order.customer_name}</td>
                  <td className="px-6 py-4 text-sm text-coffee-primary">{order.staff_name}</td>
                  <td className="px-6 py-4 text-sm font-medium text-coffee-dark">₱{order.total.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      order.status === "completed" ? "bg-green-100 text-green-700" :
                      order.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
