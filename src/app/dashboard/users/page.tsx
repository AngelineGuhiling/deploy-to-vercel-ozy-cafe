"use client";

import { useEffect, useState } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  avatar: string | null;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [filterRole, setFilterRole] = useState("all");
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) setUsers(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) setCurrentUser(await res.json());
    } catch {}
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this user?")) return;
    try {
      const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchUsers();
      else {
        const data = await res.json();
        alert(data.error);
      }
    } catch {}
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin": return "bg-purple-100 text-purple-700";
      case "barista": return "bg-blue-100 text-blue-700";
      default: return "bg-green-100 text-green-700";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return "👑";
      case "barista": return "🧑‍🍳";
      default: return "🛒";
    }
  };

  const filtered = users.filter((u) => {
    if (filterRole !== "all" && u.role !== filterRole) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const roleCounts = {
    total: users.length,
    admin: users.filter((u) => u.role === "admin").length,
    barista: users.filter((u) => u.role === "barista").length,
    customer: users.filter((u) => u.role === "customer").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-coffee-primary">
        <svg className="animate-spin w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading users...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-coffee-dark">Users</h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: roleCounts.total, color: "bg-coffee-primary text-coffee-cream" },
          { label: "Admin", value: roleCounts.admin, color: "bg-purple-500 text-white" },
          { label: "Barista", value: roleCounts.barista, color: "bg-blue-500 text-white" },
          { label: "Customer", value: roleCounts.customer, color: "bg-green-500 text-white" },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.color} rounded-xl p-4 text-center shadow-sm`}>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-sm opacity-80">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="flex-1 px-4 py-2 border border-coffee-light rounded-lg focus:ring-2 focus:ring-coffee-accent outline-none text-sm"
        />
        <div className="flex gap-2">
          {["all", "admin", "barista", "customer"].map((role) => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                filterRole === role
                  ? "bg-coffee-primary text-coffee-cream"
                  : "bg-coffee-light text-coffee-primary hover:bg-coffee-secondary"
              }`}
            >
              {role === "all" ? "All" : role.charAt(0).toUpperCase() + role.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-coffee-light overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-coffee-primary/50">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-coffee-cream">
                  <th className="text-left px-4 py-3 font-semibold text-coffee-dark">User</th>
                  <th className="text-left px-4 py-3 font-semibold text-coffee-dark">Role</th>
                  <th className="text-left px-4 py-3 font-semibold text-coffee-dark">Phone</th>
                  <th className="text-left px-4 py-3 font-semibold text-coffee-dark">Joined</th>
                  {currentUser?.role === "admin" && (
                    <th className="text-left px-4 py-3 font-semibold text-coffee-dark">Action</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-coffee-light hover:bg-coffee-cream/50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-coffee-accent flex items-center justify-center text-coffee-dark font-bold text-sm overflow-hidden">
                          {u.avatar ? (
                            <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            u.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-coffee-dark">{u.name}</div>
                          <div className="text-xs text-coffee-primary/60">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${getRoleBadge(u.role)}`}>
                        {getRoleIcon(u.role)} {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-coffee-primary">{u.phone || "—"}</td>
                    <td className="px-4 py-3 text-coffee-primary">
                      {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    {currentUser?.role === "admin" && (
                      <td className="px-4 py-3">
                        {u.id !== currentUser.id && (
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="text-red-500 hover:text-red-700 text-xs font-medium transition"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
