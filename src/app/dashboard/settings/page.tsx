"use client";

import { useEffect, useState } from "react";

interface Settings {
  shop_name: string;
  shop_address: string;
  shop_phone: string;
  shop_email: string;
  opening_hours: string;
  gcash_number: string;
  gcash_qr: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({ shop_name: "", shop_address: "", shop_phone: "", shop_email: "", opening_hours: "", gcash_number: "", gcash_qr: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      setSettings(data);
    } catch {
      setSettings({
        shop_name: "Ozy Cafe",
        shop_address: "123 Coffee Street, Manila",
        shop_phone: "+63 912 345 6789",
        shop_email: "info@ozycafe.com",
        opening_hours: "8:00 AM - 10:00 PM",
        gcash_number: "",
        gcash_qr: "",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) setSettings((prev) => ({ ...prev, gcash_qr: data.url }));
      else setMessage("Failed to upload QR code");
    } catch {
      setMessage("Failed to upload QR code");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) setMessage("Settings saved successfully!");
    } catch {
      setMessage("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-coffee-primary">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-coffee-dark">Shop Settings</h2>
      <div className="bg-white rounded-xl shadow-sm border border-coffee-light p-6">
        {message && (
          <div className={`p-3 rounded-lg mb-4 text-sm ${message.includes("success") ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
            {message}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-coffee-dark mb-1">Shop Name</label>
            <input type="text" value={settings.shop_name} onChange={(e) => setSettings({ ...settings, shop_name: e.target.value })} className="w-full px-4 py-2 border border-coffee-light rounded-lg focus:ring-2 focus:ring-coffee-accent outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-coffee-dark mb-1">Address</label>
            <textarea value={settings.shop_address} onChange={(e) => setSettings({ ...settings, shop_address: e.target.value })} className="w-full px-4 py-2 border border-coffee-light rounded-lg focus:ring-2 focus:ring-coffee-accent outline-none" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-coffee-dark mb-1">Phone</label>
              <input type="tel" value={settings.shop_phone} onChange={(e) => setSettings({ ...settings, shop_phone: e.target.value })} className="w-full px-4 py-2 border border-coffee-light rounded-lg focus:ring-2 focus:ring-coffee-accent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-coffee-dark mb-1">Email</label>
              <input type="email" value={settings.shop_email} onChange={(e) => setSettings({ ...settings, shop_email: e.target.value })} className="w-full px-4 py-2 border border-coffee-light rounded-lg focus:ring-2 focus:ring-coffee-accent outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-coffee-dark mb-1">Opening Hours</label>
            <input type="text" value={settings.opening_hours} onChange={(e) => setSettings({ ...settings, opening_hours: e.target.value })} className="w-full px-4 py-2 border border-coffee-light rounded-lg focus:ring-2 focus:ring-coffee-accent outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-coffee-dark mb-1">GCash Number</label>
            <input type="text" value={settings.gcash_number} onChange={(e) => setSettings({ ...settings, gcash_number: e.target.value })} placeholder="09XX XXX XXXX" className="w-full px-4 py-2 border border-coffee-light rounded-lg focus:ring-2 focus:ring-coffee-accent outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-coffee-dark mb-2">GCash QR Code</label>
            <div className="flex items-center gap-4">
              {settings.gcash_qr ? (
                <img src={settings.gcash_qr} alt="GCash QR" className="w-28 h-28 object-contain border border-coffee-light rounded-lg bg-white" />
              ) : (
                <div className="w-28 h-28 border-2 border-dashed border-coffee-light rounded-lg flex items-center justify-center text-4xl text-coffee-primary/30">📱</div>
              )}
              <div className="flex-1">
                <label className="inline-block bg-coffee-primary text-coffee-cream px-4 py-2 rounded-lg font-semibold hover:bg-coffee-dark transition text-sm cursor-pointer">
                  {uploading ? "Uploading..." : "Upload QR Code"}
                  <input type="file" accept="image/*" onChange={handleQrUpload} className="hidden" />
                </label>
                {settings.gcash_qr && (
                  <button type="button" onClick={() => setSettings({ ...settings, gcash_qr: "" })} className="ml-3 text-red-500 text-sm hover:underline">
                    Remove
                  </button>
                )}
                <p className="text-xs text-coffee-primary/50 mt-2">Customers will see this QR when they choose GCash at checkout.</p>
              </div>
            </div>
          </div>
          <button type="submit" disabled={saving} className="w-full bg-coffee-primary text-coffee-cream py-3 rounded-lg font-semibold hover:bg-coffee-dark transition disabled:opacity-50">
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </form>
      </div>
    </div>
  );
}
