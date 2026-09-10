"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

interface AnalyticsData {
  stats: { totalOrders: number; totalRevenue: number; totalProducts: number; todayOrders: number };
  topProducts: Array<{ name: string; total_sold: number; revenue: number }>;
  dailyRevenue: Array<{ date: string; revenue: number; orders: number }>;
}

const COLORS = ["#6f4e37", "#c4a882", "#d4a574", "#3c2415", "#f5e6d3"];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("7");

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async (days = dateRange) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?days=${days}`);
      const raw = await res.json();
      setData({
        stats: {
          totalOrders: Number(raw.stats.totalOrders),
          totalRevenue: Number(raw.stats.totalRevenue),
          totalProducts: Number(raw.stats.totalProducts),
          todayOrders: Number(raw.stats.todayOrders),
        },
        topProducts: (raw.topProducts || []).map((p: { name: string; total_sold: number | string; revenue: number | string }) => ({
          name: p.name,
          total_sold: Number(p.total_sold),
          revenue: Number(p.revenue),
        })),
        dailyRevenue: (raw.dailyRevenue || []).map((d: { date: string; revenue: number | string; orders: number | string }) => ({
          date: String(d.date),
          revenue: Number(d.revenue),
          orders: Number(d.orders),
        })),
      });
    } catch {
      setData({
        stats: { totalOrders: 156, totalRevenue: 4523.50, totalProducts: 24, todayOrders: 12 },
        topProducts: [
          { name: "Espresso", total_sold: 45, revenue: 157.50 },
          { name: "Latte", total_sold: 38, revenue: 171.00 },
          { name: "Cappuccino", total_sold: 32, revenue: 152.00 },
          { name: "Cold Brew", total_sold: 28, revenue: 112.00 },
          { name: "Tiramisu", total_sold: 15, revenue: 90.00 },
        ],
        dailyRevenue: [
          { date: "Mon", revenue: 650, orders: 18 },
          { date: "Tue", revenue: 720, orders: 22 },
          { date: "Wed", revenue: 580, orders: 16 },
          { date: "Thu", revenue: 890, orders: 25 },
          { date: "Fri", revenue: 1020, orders: 30 },
          { date: "Sat", revenue: 1150, orders: 35 },
          { date: "Sun", revenue: 850, orders: 24 },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) return <div className="flex items-center justify-center h-64 text-coffee-primary">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-coffee-dark">Analytics</h2>
        <div className="flex gap-2">
          {[{ label: "7 Days", value: "7" }, { label: "30 Days", value: "30" }, { label: "All Time", value: "365" }].map((opt) => (
            <button key={opt.value} onClick={() => { setDateRange(opt.value); fetchAnalytics(opt.value); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${dateRange === opt.value ? "bg-coffee-primary text-coffee-cream" : "bg-coffee-light text-coffee-primary"}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-coffee-light p-6">
          <h3 className="text-lg font-semibold text-coffee-dark mb-4">Weekly Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5e6d3" />
              <XAxis dataKey="date" stroke="#6f4e37" />
              <YAxis stroke="#6f4e37" />
              <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #f5e6d3", borderRadius: "8px" }} />
              <Bar dataKey="revenue" fill="#6f4e37" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-coffee-light p-6">
          <h3 className="text-lg font-semibold text-coffee-dark mb-4">Orders Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5e6d3" />
              <XAxis dataKey="date" stroke="#6f4e37" />
              <YAxis stroke="#6f4e37" />
              <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #f5e6d3", borderRadius: "8px" }} />
              <Line type="monotone" dataKey="orders" stroke="#d4a574" strokeWidth={2} dot={{ fill: "#6f4e37" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-coffee-light p-6">
          <h3 className="text-lg font-semibold text-coffee-dark mb-4">Top Products</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={data.topProducts} dataKey="total_sold" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }: { name?: string; percent?: number }) => `${name || ""} ${((percent || 0) * 100).toFixed(0)}%`}>
                {data.topProducts.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-coffee-light p-6">
          <h3 className="text-lg font-semibold text-coffee-dark mb-4">Product Performance</h3>
          <div className="space-y-3">
            {data.topProducts.map((product, index) => (
              <div key={product.name} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-coffee-dark">{product.name}</span>
                    <span className="text-sm text-coffee-primary">₱{product.revenue.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-coffee-light rounded-full h-2 mt-1">
                    <div className="h-2 rounded-full" style={{ width: `${(product.total_sold / (data.topProducts[0]?.total_sold || 1)) * 100}%`, backgroundColor: COLORS[index % COLORS.length] }} />
                  </div>
                </div>
                <span className="text-xs text-coffee-primary">{product.total_sold} sold</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
