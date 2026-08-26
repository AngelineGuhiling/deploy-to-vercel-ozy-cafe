"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useShopSettings } from "@/lib/ShopSettings";

interface Notification {
  id: number;
  order_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export default function Navbar({ cart, onCartClick }: { cart: CartItem[]; onCartClick: () => void }) {
  const router = useRouter();
  const settings = useShopSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; role: string; avatar: string | null } | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: number; name: string; description: string; price: number; type: string; category: string; image: string | null }[]>([]);

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 3000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch {}
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) setNotifications(await res.json());
    } catch {}
  };

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    try {
      const res = await fetch("/api/menu");
      if (res.ok) {
        const data = await res.json();
        const lower = q.toLowerCase();
        setSearchResults(data.filter((item: any) => item.name.toLowerCase().includes(lower) || (item.description && item.description.toLowerCase().includes(lower))));
      }
    } catch {}
  };

  const markRead = async (id?: number) => {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(id ? { id } : {}),
    });
    fetchNotifications();
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <nav className="bg-coffee-dark/95 backdrop-blur-sm fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center hover:opacity-80 transition">
            <img src="/logo.jpg" alt={`${settings.shop_name} Logo`} className="h-10 w-10 rounded-lg object-cover" />
            <span className="text-2xl font-bold text-coffee-accent ml-2">{settings.shop_name}</span>
          </Link>
          <div className="hidden md:block">
            <div className="flex items-center space-x-6">
              <a href="#home" className="text-coffee-cream hover:text-coffee-accent transition">Home</a>
              <a href="#menu" className="text-coffee-cream hover:text-coffee-accent transition">Menu</a>
              <a href="#about" className="text-coffee-cream hover:text-coffee-accent transition">About</a>
              <a href="#contact" className="text-coffee-cream hover:text-coffee-accent transition">Contact</a>
              {user ? (
                <div className="flex items-center gap-2">
                  <Link href="/orders" className="text-coffee-cream text-sm hover:text-coffee-accent transition">My Orders</Link>
                  <button onClick={() => setShowSearch(true)} className="p-1.5 hover:bg-coffee-primary/30 rounded-lg transition">
                    <svg className="w-5 h-5 text-coffee-cream" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                  <button onClick={onCartClick} className="relative p-1.5 hover:bg-coffee-primary/30 rounded-lg transition">
                    <svg className="w-5 h-5 text-coffee-cream" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                    </svg>
                    {cart.reduce((s, c) => s + c.quantity, 0) > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-coffee-accent text-coffee-dark text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                        {cart.reduce((s, c) => s + c.quantity, 0) > 9 ? "9+" : cart.reduce((s, c) => s + c.quantity, 0)}
                      </span>
                    )}
                  </button>
                  <div className="relative" ref={notifRef}>
                    <button onClick={() => setShowNotif(!showNotif)} className="relative p-1.5 hover:bg-coffee-primary/30 rounded-lg transition">
                      <svg className="w-5 h-5 text-coffee-cream" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </button>
                    {showNotif && (
                      <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-coffee-light overflow-hidden">
                        <div className="p-4 border-b border-coffee-light flex justify-between items-center">
                          <h3 className="font-bold text-coffee-dark">Notifications</h3>
                          {unreadCount > 0 && (
                            <button onClick={() => markRead()} className="text-xs text-coffee-accent hover:underline">Mark all read</button>
                          )}
                        </div>
                        <div className="max-h-72 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <p className="text-center text-coffee-primary/50 py-8 text-sm">No notifications yet</p>
                          ) : (
                            notifications.map((n) => (
                              <div key={n.id} onClick={() => { if (!n.is_read) markRead(n.id); }} className={`p-4 border-b border-coffee-light/50 hover:bg-coffee-cream transition flex items-start gap-3 cursor-pointer ${!n.is_read ? "bg-coffee-light/30" : ""}`}>
                                {!n.is_read && <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-1.5"></div>}
                                <div className="flex-1">
                                  <p className="text-sm text-coffee-dark">{n.message}</p>
                                  <p className="text-[10px] text-coffee-primary/40 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <Link href="/dashboard/profile" className="flex items-center gap-2 bg-coffee-primary/30 px-3 py-1.5 rounded-full hover:bg-coffee-primary/50 transition">
                    <div className="w-7 h-7 bg-coffee-accent rounded-full flex items-center justify-center text-coffee-dark font-semibold text-xs overflow-hidden">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        user.name?.charAt(0) || "U"
                      )}
                    </div>
                    <span className="text-coffee-cream text-sm font-medium">{user.name}</span>
                  </Link>
                  <button onClick={handleLogout} className="text-coffee-secondary text-sm hover:text-coffee-accent transition">Logout</button>
                </div>
              ) : (
                <>
                  <Link href="/login" className="border border-coffee-accent text-coffee-accent px-4 py-2 rounded-lg font-semibold hover:bg-coffee-accent hover:text-coffee-dark transition">
                    Sign In
                  </Link>
                  <Link href="/register" className="bg-coffee-accent text-coffee-dark px-4 py-2 rounded-lg font-semibold hover:bg-coffee-secondary transition">
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-coffee-cream">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="md:hidden bg-coffee-dark border-t border-coffee-secondary/20">
          <div className="px-4 py-3 space-y-2">
            <a href="#home" className="block text-coffee-cream hover:text-coffee-accent">Home</a>
            <a href="#menu" className="block text-coffee-cream hover:text-coffee-accent">Menu</a>
            <a href="#about" className="block text-coffee-cream hover:text-coffee-accent">About</a>
            <a href="#contact" className="block text-coffee-cream hover:text-coffee-accent">Contact</a>
            {user ? (
              <div className="space-y-2 pt-2 border-t border-coffee-secondary/20">
                <Link href="/orders" className="block text-coffee-cream hover:text-coffee-accent py-2">My Orders</Link>
                <Link href="/dashboard/profile" className="flex items-center gap-3 text-coffee-cream hover:text-coffee-accent py-2">
                  <div className="w-8 h-8 bg-coffee-accent rounded-full flex items-center justify-center text-coffee-dark font-semibold text-sm overflow-hidden">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user.name?.charAt(0) || "U"
                    )}
                  </div>
                  <span className="font-medium">{user.name}</span>
                </Link>
                <button onClick={handleLogout} className="w-full text-left text-coffee-secondary hover:text-red-400 transition py-2">Logout</button>
              </div>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link href="/login" className="flex-1 border border-coffee-accent text-coffee-accent px-4 py-2 rounded-lg font-semibold text-center hover:bg-coffee-accent hover:text-coffee-dark transition">
                  Sign In
                </Link>
                <Link href="/register" className="flex-1 bg-coffee-accent text-coffee-dark px-4 py-2 rounded-lg font-semibold text-center hover:bg-coffee-secondary transition">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
      {showSearch && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-start justify-center pt-24 px-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[70vh] flex flex-col shadow-2xl" style={{ animation: "slideIn 0.2s ease-out" }}>
            <div className="p-4 border-b border-coffee-light flex items-center gap-3">
              <svg className="w-5 h-5 text-coffee-primary/50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" value={searchQuery} onChange={(e) => handleSearch(e.target.value)} placeholder="Search coffee, desserts..." className="flex-1 outline-none text-coffee-dark text-lg" autoFocus />
              <button onClick={() => { setShowSearch(false); setSearchQuery(""); setSearchResults([]); }} className="text-coffee-primary/50 hover:text-coffee-dark text-2xl leading-none">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {searchQuery.trim() && searchResults.length === 0 ? (
                <p className="text-center text-coffee-primary/50 py-10">No results for &ldquo;{searchQuery}&rdquo;</p>
              ) : !searchQuery.trim() ? (
                <p className="text-center text-coffee-primary/50 py-10">Type to search the menu</p>
              ) : (
                <div className="space-y-3">
                  {searchResults.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 bg-coffee-cream rounded-xl p-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-coffee-secondary to-coffee-accent rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <span className="text-xl">{item.type === "coffee" ? "☕" : "🍰"}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-coffee-dark text-sm truncate">{item.name}</p>
                        <p className="text-xs text-coffee-primary/60 truncate">{item.category}{item.description ? ` — ${item.description}` : ""}</p>
                      </div>
                      <span className="text-coffee-accent font-bold text-sm whitespace-nowrap">₱{Number(item.price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
