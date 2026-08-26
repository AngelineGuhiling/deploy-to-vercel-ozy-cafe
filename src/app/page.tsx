"use client";

import { useState } from "react";
import Hero from "@/components/landing/Hero";
import MenuPreview from "@/components/landing/MenuPreview";
import About from "@/components/landing/About";
import Contact from "@/components/landing/Contact";
import Footer from "@/components/landing/Footer";
import Navbar from "@/components/landing/Navbar";
import { ShopSettingsProvider } from "@/lib/ShopSettings";

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export default function Home() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  return (
    <ShopSettingsProvider>
      <div className="min-h-screen bg-coffee-cream">
        <Navbar cart={cart} onCartClick={() => setShowCart(true)} />
        <Hero />
        <MenuPreview cart={cart} setCart={setCart} showCart={showCart} setShowCart={setShowCart} />
        <About />
        <Contact />
        <Footer />
      </div>
    </ShopSettingsProvider>
  );
}
