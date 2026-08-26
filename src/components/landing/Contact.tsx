"use client";

import { useState } from "react";
import { useShopSettings } from "@/lib/ShopSettings";

export default function Contact() {
  const settings = useShopSettings();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSent(true);
        setForm({ name: "", email: "", subject: "", message: "" });
        setTimeout(() => setSent(false), 5000);
      }
    } catch {
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" className="py-20 bg-coffee-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-coffee-dark mb-4">Get in Touch</h2>
          <p className="text-coffee-primary text-lg">We&rsquo;d love to hear from you</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Your Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 border border-coffee-light rounded-xl focus:ring-2 focus:ring-coffee-accent outline-none bg-white" required />
                <input type="email" placeholder="Your Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 border border-coffee-light rounded-xl focus:ring-2 focus:ring-coffee-accent outline-none bg-white" required />
              </div>
              <input type="text" placeholder="Subject (optional)" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full px-4 py-3 border border-coffee-light rounded-xl focus:ring-2 focus:ring-coffee-accent outline-none bg-white" />
              <textarea placeholder="Your Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full px-4 py-3 border border-coffee-light rounded-xl focus:ring-2 focus:ring-coffee-accent outline-none bg-white" rows={5} required />
              <button type="submit" disabled={sending} className="bg-coffee-primary text-coffee-cream px-8 py-3 rounded-xl font-semibold hover:bg-coffee-dark transition disabled:opacity-50">
                {sending ? "Sending..." : "Send Message"}
              </button>
              {sent && <p className="text-green-600 font-medium">Message sent! We&rsquo;ll get back to you soon.</p>}
            </form>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-coffee-light p-6">
              <h3 className="font-bold text-coffee-dark mb-4">Visit Us</h3>
              <div className="space-y-3 text-coffee-primary">
                <p className="flex items-center gap-3"><span className="text-lg">📍</span> {settings.shop_address}</p>
                <p className="flex items-center gap-3"><span className="text-lg">📞</span> {settings.shop_phone}</p>
                <p className="flex items-center gap-3"><span className="text-lg">✉️</span> {settings.shop_email}</p>
                <p className="flex items-center gap-3"><span className="text-lg">🕐</span> {settings.opening_hours}</p>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-sm border border-coffee-light h-64 bg-coffee-light">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.0!2d121.0!3d14.0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTTCsDAwJzAwLjAiTiAxMjHCsDAwJzAwLjAiRQ!5e0!3m2!1sen!2sph!4v1"
                width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                title="Ozy Cafe Location"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
