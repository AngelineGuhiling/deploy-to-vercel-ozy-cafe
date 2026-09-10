"use client";

import { useEffect } from "react";
import { useShopSettings } from "@/lib/ShopSettings";

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

interface ReceiptProps {
  order: {
    id: number;
    customer_name: string;
    total: number;
    status: string;
    payment_method: string;
    order_type: string;
    delivery_address: string | null;
    customer_phone: string | null;
    created_at: string;
  };
  items: ReceiptItem[];
  onClose: () => void;
}

export default function ReceiptModal({ order, items, onClose }: ReceiptProps) {
  const settings = useShopSettings();

  const handleClose = () => onClose();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const discount = Math.max(0, subtotal - order.total);
  const date = new Date(order.created_at);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 print:static print:block print:p-0">
      <div className="absolute inset-0 bg-black/60 print:hidden" onClick={handleClose} />
      <div className="print-area relative bg-white rounded-2xl shadow-2xl max-w-sm w-full print:max-w-none print:rounded-none print:shadow-none print:static">
        <div className="flex items-center justify-between px-4 py-3 border-b border-coffee-light bg-coffee-dark text-coffee-cream rounded-t-2xl print:hidden">
          <h3 className="font-bold text-coffee-accent">Receipt #{order.id}</h3>
          <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition">✕</button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-4 print:max-h-none print:p-4">
          <div className="text-center border-b border-dashed border-coffee-light pb-3 mb-3">
            <h1 className="text-lg font-extrabold text-coffee-dark print:text-black">{settings.shop_name}</h1>
            <p className="text-xs text-coffee-primary print:text-black">{settings.shop_address}</p>
            <p className="text-xs text-coffee-primary print:text-black">{settings.shop_phone} &middot; {settings.shop_email}</p>
            <p className="text-[10px] text-coffee-primary/60 print:text-black">Open {settings.opening_hours}</p>
          </div>

          <div className="text-xs space-y-0.5 mb-3 text-coffee-dark print:text-black">
            <div className="flex justify-between"><span>Receipt No:</span><span className="font-semibold">#{order.id}</span></div>
            <div className="flex justify-between"><span>Date:</span><span>{date.toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span>Time:</span><span>{date.toLocaleTimeString()}</span></div>
            <div className="flex justify-between"><span>Customer:</span><span>{order.customer_name || "Walk-in"}</span></div>
            <div className="flex justify-between"><span>Type:</span><span className="capitalize">{order.order_type || "dine-in"}</span></div>
            {order.customer_phone && (
              <div className="flex justify-between"><span>Contact:</span><span>{order.customer_phone}</span></div>
            )}
            {order.delivery_address && (
              <div className="flex justify-between"><span>Address:</span><span className="text-right">{order.delivery_address}</span></div>
            )}
          </div>

          <div className="border-t border-dashed border-coffee-light py-2 mb-2">
            <div className="flex justify-between text-xs font-bold text-coffee-dark uppercase tracking-wide mb-1 print:text-black">
              <span>Item</span><span className="text-right">Qty &times; Price = Amount</span>
            </div>
            {items.length === 0 ? (
              <p className="text-xs text-coffee-primary/60 py-1 print:text-black">{"No line items recorded"}</p>
            ) : (
              items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-xs text-coffee-dark py-0.5 print:text-black">
                  <span className="flex-1 pr-2">{it.name}</span>
                  <span className="text-right whitespace-nowrap">{it.quantity} &times; ₱{it.price.toFixed(2)} = ₱{(it.quantity * it.price).toFixed(2)}</span>
                </div>
              ))
            )}
          </div>

          <div className="space-y-1 text-sm text-coffee-dark print:text-black">
            <div className="flex justify-between"><span>Subtotal</span><span>₱{subtotal.toFixed(2)}</span></div>
            {discount > 0 && (
              <div className="flex justify-between text-red-500 print:text-black"><span>Discount</span><span>-₱{discount.toFixed(2)}</span></div>
            )}
            <div className="flex justify-between font-extrabold text-base border-t border-dashed border-coffee-light pt-1 print:text-black">
              <span>TOTAL</span><span>₱{order.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs mt-1"><span>Payment</span><span className="capitalize">{order.payment_method}</span></div>
            <div className="flex justify-between text-xs"><span>Status</span><span className="capitalize">{order.status}</span></div>
          </div>

          <div className="text-center mt-5 pt-3 border-t border-dashed border-coffee-light">
            <p className="text-xs font-semibold text-coffee-dark print:text-black">Thank you for visiting {settings.shop_name}!</p>
            <p className="text-[10px] text-coffee-primary/70 print:text-black">Please come again &middot; Have a nice day ☕</p>
          </div>
        </div>
        <div className="p-4 border-t border-coffee-light flex gap-2 print:hidden">
          <button onClick={handleClose} className="flex-1 px-4 py-2.5 rounded-xl border border-coffee-light text-coffee-primary hover:bg-coffee-cream transition text-sm font-medium">Close</button>
          <button onClick={() => window.print()} className="flex-1 px-4 py-2.5 rounded-xl bg-coffee-primary text-coffee-cream hover:bg-coffee-dark transition text-sm font-semibold flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
