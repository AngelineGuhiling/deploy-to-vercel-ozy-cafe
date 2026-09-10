"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface ShopSettings {
  shop_name: string;
  shop_address: string;
  shop_phone: string;
  shop_email: string;
  opening_hours: string;
  gcash_number: string;
  gcash_qr: string;
}

const defaultSettings: ShopSettings = {
  shop_name: "Ozy Cafe",
  shop_address: "123 Coffee Street, Manila",
  shop_phone: "+63 912 345 6789",
  shop_email: "info@ozycafe.com",
  opening_hours: "8:00 AM - 10:00 PM",
  gcash_number: "",
  gcash_qr: "",
};

const ShopSettingsContext = createContext<ShopSettings>(defaultSettings);

export function ShopSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ShopSettings>(defaultSettings);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.shop_name) {
          setSettings(data);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <ShopSettingsContext.Provider value={settings}>
      {children}
    </ShopSettingsContext.Provider>
  );
}

export function useShopSettings() {
  return useContext(ShopSettingsContext);
}
