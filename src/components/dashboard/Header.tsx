"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

interface Notification {
  id: number;
  order_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const [user, setUser] = useState<{ name: string; role: string; avatar: string | null } | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUser();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 3000);
    return () => clearInterval(interval);
  }, []);

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

  const markRead = async (id?: number) => {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(id ? { id } : {}),
    });
    fetchNotifications();
  };

  const deleteNotif = async (id: number) => {
    await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
    fetchNotifications();
  };

  const clearAll = async () => {
    if (!confirm("Delete all notifications?")) return;
    await fetch("/api/notifications", { method: "DELETE" });
    fetchNotifications();
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="bg-white shadow-sm border-b border-coffee-light sticky top-0 z-30">
      <div className="flex items-center justify-between px-6 py-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-coffee-dark p-2 hover:bg-coffee-light rounded-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="hidden lg:block">
          <h1 className="text-xl font-semibold text-coffee-dark">Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative" ref={notifRef}>
            <button onClick={() => setShowNotif(!showNotif)} className="relative p-2 hover:bg-coffee-light rounded-lg transition">
              <svg className="w-6 h-6 text-coffee-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {showNotif && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-coffee-light overflow-hidden">
                <div className="p-4 border-b border-coffee-light flex justify-between items-center">
                  <h3 className="font-bold text-coffee-dark">Notifications</h3>
                  <div className="flex gap-2">
                    {unreadCount > 0 && (
                      <button onClick={() => markRead()} className="text-[11px] text-coffee-accent hover:underline font-medium">Mark all read</button>
                    )}
                    {notifications.length > 0 && (
                      <button onClick={() => clearAll()} className="text-[11px] text-red-400 hover:text-red-600 font-medium">Clear all</button>
                    )}
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-center text-coffee-primary/50 py-8 text-sm">No notifications yet</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className={`p-4 border-b border-coffee-light/50 hover:bg-coffee-cream transition flex items-start gap-3 group ${!n.is_read ? "bg-coffee-light/30" : ""}`}>
                        {!n.is_read && <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-1.5"></div>}
                        <div className="flex-1 cursor-pointer" onClick={() => { if (!n.is_read) markRead(n.id); }}>
                          <p className="text-sm text-coffee-dark">{n.message}</p>
                          <p className="text-[10px] text-coffee-primary/40 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                          {!n.is_read && (
                            <button onClick={() => markRead(n.id)} className="text-coffee-accent hover:text-coffee-dark p-1 rounded transition" title="Mark as read">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}
                          <button onClick={() => deleteNotif(n.id)} className="text-red-400 hover:text-red-600 p-1 rounded transition" title="Delete">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-3 hover:bg-coffee-light p-2 rounded-lg transition"
          >
            <div className="w-8 h-8 bg-coffee-accent rounded-full flex items-center justify-center text-coffee-dark font-semibold text-sm overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0) || "U"
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-coffee-dark">{user?.name || "User"}</p>
              <p className="text-xs text-coffee-primary capitalize">{user?.role === "admin" ? "Owner" : user?.role === "barista" ? "Member" : user?.role || ""}</p>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
