"use client";

import { useEffect, useState } from "react";

interface Message {
  id: number;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Message | null>(null);

  useEffect(() => { fetchMessages(); }, []);

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/contact");
      setMessages(await res.json());
    } catch {}
    setLoading(false);
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-coffee-primary">Loading...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-coffee-dark">Contact Messages</h2>

      {selected ? (
        <div className="bg-white rounded-xl shadow-sm border border-coffee-light p-6">
          <button onClick={() => setSelected(null)} className="text-coffee-accent hover:underline mb-4 block">&larr; Back</button>
          <div className="space-y-3">
            <p><span className="font-semibold text-coffee-dark">Name:</span> <span className="text-coffee-primary">{selected.name}</span></p>
            <p><span className="font-semibold text-coffee-dark">Email:</span> <span className="text-coffee-primary">{selected.email}</span></p>
            {selected.subject && <p><span className="font-semibold text-coffee-dark">Subject:</span> <span className="text-coffee-primary">{selected.subject}</span></p>}
            <p><span className="font-semibold text-coffee-dark">Date:</span> <span className="text-coffee-primary">{new Date(selected.created_at).toLocaleString()}</span></p>
            <hr className="border-coffee-light" />
            <p className="text-coffee-dark whitespace-pre-wrap">{selected.message}</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-coffee-light overflow-hidden">
          {messages.length === 0 ? (
            <p className="text-center py-12 text-coffee-primary">No messages yet</p>
          ) : (
            <div className="divide-y divide-coffee-light">
              {messages.map((m) => (
                <button key={m.id} onClick={() => setSelected(m)} className="w-full text-left p-4 hover:bg-coffee-cream/50 transition flex items-start gap-4">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${m.is_read ? "bg-gray-300" : "bg-red-500"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-coffee-dark text-sm truncate">{m.name}{m.subject ? ` — ${m.subject}` : ""}</p>
                    <p className="text-xs text-coffee-primary/60 truncate">{m.email} &middot; {new Date(m.created_at).toLocaleString()}</p>
                    <p className="text-sm text-coffee-primary/80 truncate mt-1">{m.message}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
