"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

const adminItems = [
  { name: "Overview", href: "/dashboard", icon: "📊" },
  { name: "Menu", href: "/dashboard/menu", icon: "📋" },
  { name: "Inventory", href: "/dashboard/inventory", icon: "📦" },
  { name: "POS", href: "/dashboard/pos", icon: "🖥️" },
  { name: "Orders", href: "/dashboard/orders", icon: "🛒" },
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
  { name: "POS", href: "/dashboard/pos", icon: "🖥️" },
  { name: "Orders", href: "/dashboard/orders", icon: "🛒" },
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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    fetch("/api/profile").then(r => r.json()).then(d => { setUserName(d.name || ""); setUserAvatar(d.avatar || null); }).catch(() => {});
  }, []);

  const handleDragScroll = (e: React.MouseEvent<HTMLElement>) => {
    const el = navRef.current;
    if (!el) return;
    const startY = e.pageY - el.offsetTop;
    const scrollStart = el.scrollTop;
    const onMove = (ev: MouseEvent) => {
      el.scrollTop = scrollStart - (ev.pageY - el.offsetTop - startY);
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

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
        className={`fixed top-0 left-0 h-full bg-coffee-dark text-coffee-cream z-50 transform transition-all duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 w-64`}
      >
        <button onClick={() => { setNavigating(true); setTimeout(() => router.push("/"), 400); }} className="w-full border-b border-coffee-secondary/20 flex items-center gap-3 hover:bg-coffee-primary/30 transition text-left p-6">
          <img src="/logo.jpg" alt="Ozy Cafe Logo" className="h-10 w-10 rounded-lg object-cover" />
          <div>
            <h2 className="text-xl font-bold text-coffee-accent">Ozy Cafe</h2>
            <p className="text-xs text-coffee-secondary">Management System</p>
          </div>
        </button>
        <nav ref={navRef} onMouseDown={handleDragScroll} className="p-3 space-y-1 pb-28 overflow-y-auto cursor-grab active:cursor-grabbing select-none" style={{ scrollbarWidth: "thin" }}>
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-lg transition px-4 py-3 ${
                pathname === item.href
                  ? "bg-coffee-primary text-coffee-cream"
                  : "text-coffee-secondary hover:bg-coffee-primary/50 hover:text-coffee-cream"
              }`}
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-coffee-secondary/20 bg-coffee-dark">
          {showUserMenu && (
            <div className="p-2 border-b border-coffee-secondary/20 space-y-1">
              <Link href="/dashboard/profile" onClick={onClose} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-coffee-secondary hover:bg-coffee-primary/50 hover:text-coffee-cream transition">
                <span>👤</span> Profile
              </Link>
              {role === "admin" && (
                <Link href="/dashboard/settings" onClick={onClose} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-coffee-secondary hover:bg-coffee-primary/50 hover:text-coffee-cream transition">
                  <span>⚙️</span> Settings
                </Link>
              )}
            </div>
          )}
          <div className="p-3 space-y-1">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center gap-3 rounded-lg transition hover:bg-coffee-primary/50 hover:text-coffee-cream px-4 py-2"
            >
              <div className="w-8 h-8 rounded-full bg-coffee-accent flex items-center justify-center text-coffee-dark font-bold text-sm flex-shrink-0 overflow-hidden">
                {userAvatar ? <img src={userAvatar} alt="" className="w-full h-full object-cover" /> : userName?.charAt(0) || "U"}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-coffee-cream truncate">{userName || "User"}</p>
                <p className="text-[10px] text-coffee-secondary capitalize">{role === "admin" ? "Owner" : "Member"}</p>
              </div>
              <span className={`text-xs transition-transform ${showUserMenu ? "rotate-180" : ""}`}>▾</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 rounded-lg text-coffee-secondary hover:bg-red-500/20 hover:text-red-400 transition px-4 py-2"
            >
              <span className="text-sm flex-shrink-0">🚪</span>
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
