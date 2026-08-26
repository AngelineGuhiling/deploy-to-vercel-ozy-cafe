"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (data.role === "customer") {
        router.push("/");
        return;
      }
      setUserRole(data.role);
      setAuthorized(true);
    } catch {
      router.push("/login");
    }
  };

  if (!authorized) {
    return (
      <div className="min-h-screen bg-coffee-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-coffee-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-coffee-cream text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-coffee-cream">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} role={userRole} />
      <div className="lg:ml-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
