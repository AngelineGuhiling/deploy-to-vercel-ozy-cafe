"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const adminItems = [
  { name: "Overview", href: "/dashboard", icon: "📊" },
  { name: "Menu", href: "/dashboard/menu", icon: "📋" },
  { name: "Inventory", href: "/dashboard/inventory", icon: "📦" },
  { name: "Orders", href: "/dashboard/orders", icon: "🛒" },
  { name: "Attendance", href: "/dashboard/attendance", icon: "📅" },
  { name: "Reviews", href: "/dashboard/reviews", icon: "⭐" },
  { name: "Users", href: "/dashboard/users", icon: "👥" },
  { name: "Messages", href: "/dashboard/messages", icon: "✉️" },
  { name: "Promos", href: "/dashboard/promos", icon: "🏷️" },
  { name: "Analytics", href: "/dashboard/analytics", icon: "📈" },
  { name: "Profile", href: "/dashboard/profile", icon: "👤" },
  { name: "Settings", href: "/dashboard/settings", icon: "⚙️" },
];

const baristaItems = [
  { name: "Overview", href: "/dashboard", icon: "📊" },
  { name: "Inventory", href: "/dashboard/inventory", icon: "📦" },
  { name: "Orders", href: "/dashboard/orders", icon: "🛒" },
  { name: "Attendance", href: "/dashboard/attendance", icon: "📅" },
  { name: "Reviews", href: "/dashboard/reviews", icon: "⭐" },
  { name: "Users", href: "/dashboard/users", icon: "👥" },
  { name: "Analytics", href: "/dashboard/analytics", icon: "📈" },
  { name: "Profile", href: "/dashboard/profile", icon: "👤" },
];

export default function Sidebar({ isOpen, onClose, role }: { isOpen: boolean; onClose: () => void; role: string }) {
  const menuItems = role === "admin" ? adminItems : baristaItems;
  const pathname = usePathname();
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <>
      {navigating && (
        <div className="fixed inset-0 bg-coffee-dark z-[100] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-coffee-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-coffee-cream text-lg">Loading...</p>
          </div>
        </div>
      )}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-coffee-dark text-coffee-cream z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <button onClick={() => { setNavigating(true); setTimeout(() => router.push("/"), 400); }} className="w-full p-6 border-b border-coffee-secondary/20 flex items-center gap-3 hover:bg-coffee-primary/30 transition text-left">
          <img src="/logo.jpg" alt="Ozy Cafe Logo" className="h-10 w-10 rounded-lg object-cover" />
          <div>
            <h2 className="text-xl font-bold text-coffee-accent">Ozy Cafe</h2>
            <p className="text-xs text-coffee-secondary">Management System</p>
          </div>
        </button>
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                pathname === item.href
                  ? "bg-coffee-primary text-coffee-cream"
                  : "text-coffee-secondary hover:bg-coffee-primary/50 hover:text-coffee-cream"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-coffee-secondary hover:bg-red-500/20 hover:text-red-400 transition"
          >
            <span className="text-lg">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
