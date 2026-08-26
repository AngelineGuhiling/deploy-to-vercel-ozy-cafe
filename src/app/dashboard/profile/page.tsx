"use client";

import { useEffect, useState, useCallback } from "react";

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: string;
  created_at?: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile>({ name: "", email: "", phone: "", avatar: "", role: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setMessage("Failed to load profile");
        setMessageType("error");
      }
    } catch {
      setMessage("Could not connect to server");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Upload failed");
        setMessageType("error");
        return;
      }

      setUser((prev) => ({ ...prev, avatar: data.url }));

      const updateRes = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...user, avatar: data.url }),
      });

      if (updateRes.ok) {
        setMessage("Profile picture updated!");
        setMessageType("success");
      }
    } catch {
      setMessage("Failed to upload image");
      setMessageType("error");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Profile updated successfully!");
        setMessageType("success");
        await fetchProfile();
      } else {
        setMessage(data.error || "Failed to update profile");
        setMessageType("error");
      }
    } catch {
      setMessage("Could not connect to server");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage("New passwords do not match");
      setMessageType("error");
      return;
    }
    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters");
      setMessageType("error");
      return;
    }

    setChangingPassword(true);
    setMessage("");

    try {
      const res = await fetch("/api/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Password changed successfully!");
        setMessageType("success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMessage(data.error || "Failed to change password");
        setMessageType("error");
      }
    } catch {
      setMessage("Could not connect to server");
      setMessageType("error");
    } finally {
      setChangingPassword(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "barista":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-green-100 text-green-700 border-green-200";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return "👑";
      case "barista": return "🧑‍🍳";
      default: return "🛒";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-coffee-primary">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-coffee-dark">Profile Settings</h2>

      <div className="bg-white rounded-xl shadow-sm border border-coffee-light overflow-hidden">
        <div className="bg-gradient-to-r from-coffee-primary to-coffee-dark p-6">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-coffee-accent flex items-center justify-center text-coffee-dark text-3xl font-bold overflow-hidden border-4 border-white shadow-lg">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name?.charAt(0) || "U"
                )}
              </div>
              <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                {uploading ? (
                  <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
              </label>
            </div>
            <div className="text-white">
              <h3 className="text-xl font-bold">{user.name}</h3>
              <p className="text-white/70 text-sm">{user.email}</p>
              <span className={`inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadge(user.role)}`}>
                {getRoleIcon(user.role)} {user.role}
              </span>
            </div>
          </div>
        </div>

        <div className="flex border-b border-coffee-light">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 py-3 text-sm font-semibold transition ${
              activeTab === "profile"
                ? "text-coffee-primary border-b-2 border-coffee-primary"
                : "text-coffee-primary/50 hover:text-coffee-primary"
            }`}
          >
            Profile Info
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`flex-1 py-3 text-sm font-semibold transition ${
              activeTab === "password"
                ? "text-coffee-primary border-b-2 border-coffee-primary"
                : "text-coffee-primary/50 hover:text-coffee-primary"
            }`}
          >
            Change Password
          </button>
        </div>

        {message && (
          <div className={`m-4 p-3 rounded-xl text-sm flex items-center gap-2 ${
            messageType === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-600 border border-red-200"
          }`}>
            {messageType === "success" ? (
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414-1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            {message}
          </div>
        )}

        {activeTab === "profile" && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-coffee-dark mb-1">Full Name</label>
              <input
                type="text"
                value={user.name}
                onChange={(e) => setUser({ ...user, name: e.target.value })}
                className="w-full px-4 py-2 border border-coffee-light rounded-lg focus:ring-2 focus:ring-coffee-accent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-coffee-dark mb-1">Email</label>
              <input
                type="email"
                value={user.email}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
                className="w-full px-4 py-2 border border-coffee-light rounded-lg focus:ring-2 focus:ring-coffee-accent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-coffee-dark mb-1">Phone</label>
              <input
                type="tel"
                value={user.phone || ""}
                onChange={(e) => setUser({ ...user, phone: e.target.value })}
                placeholder="+63 912 345 6789"
                className="w-full px-4 py-2 border border-coffee-light rounded-lg focus:ring-2 focus:ring-coffee-accent outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-coffee-primary text-coffee-cream py-3 rounded-lg font-semibold hover:bg-coffee-dark transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </form>
        )}

        {activeTab === "password" && (
          <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-coffee-dark mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 border border-coffee-light rounded-lg focus:ring-2 focus:ring-coffee-accent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-coffee-dark mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-coffee-light rounded-lg focus:ring-2 focus:ring-coffee-accent outline-none"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-coffee-dark mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-coffee-accent outline-none ${
                  confirmPassword && newPassword !== confirmPassword ? "border-red-300 bg-red-50" : "border-coffee-light"
                }`}
                required
                minLength={6}
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>
            <button
              type="submit"
              disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
              className="w-full bg-coffee-primary text-coffee-cream py-3 rounded-lg font-semibold hover:bg-coffee-dark transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {changingPassword ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Changing...
                </>
              ) : (
                "Change Password"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
