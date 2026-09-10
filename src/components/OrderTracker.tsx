"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const destinationIcon = L.divIcon({
  className: "",
  html: `<div style="width:30px;height:30px;border-radius:50%;background:#ef4444;border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5z"/></svg></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const riderIcon = L.divIcon({
  className: "",
  html: `<div class="ozy-rider-icon" style="font-size:32px;line-height:1;filter:drop-shadow(0 3px 5px rgba(0,0,0,.5));"></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function haversineKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const la1 = (a[0] * Math.PI) / 180;
  const la2 = (b[0] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function bearing(a: [number, number], b: [number, number]) {
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const la1 = (a[0] * Math.PI) / 180;
  const la2 = (b[0] * Math.PI) / 180;
  const x = Math.sin(dLng) * Math.cos(la2);
  const y = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dLng);
  return (Math.atan2(x, y) * 180) / Math.PI + 360;
}

interface OrderTrackerProps {
  orderId: number;
  orderNumber?: number;
  deliveryAddress: string;
  customerName?: string;
  customerPhone?: string;
  deliveryStatus?: string | null;
  mode: "driver" | "customer";
  onClose: () => void;
}

const phaseFor = (status?: string | null) => {
  switch (status) {
    case "preparing":
      return { icon: "🍳", msg: "Preparing your order…", sub: "It's being made fresh for you" };
    case "ready_for_pickup":
      return { icon: "🛵", msg: "Order ready — rider is picking it up", sub: "Almost out for delivery" };
    case "out_for_delivery":
      return { icon: "⚡", msg: "Your rider is on the way!", sub: "Following your order in real time" };
    case "delivered":
      return { icon: "🎉", msg: "Delivered! Enjoy your order ☕", sub: "Thank you for ordering with us" };
    default:
      return { icon: "🧾", msg: "Order confirmed", sub: "Waiting for progress updates" };
  }
};

export default function OrderTracker({ orderId, orderNumber, deliveryAddress, customerName, customerPhone, deliveryStatus, mode, onClose }: OrderTrackerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const riderMarkerRef = useRef<L.Marker | null>(null);
  const riderElRef = useRef<HTMLElement | null>(null);
  const routeRef = useRef<L.Polyline | null>(null);
  const animRef = useRef<number | null>(null);
  const lastPosRef = useRef<[number, number] | null>(null);
  const driverPosRef = useRef<[number, number] | null>(null);

  const [mapReady, setMapReady] = useState(false);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [driverPos, setDriverPos] = useState<[number, number] | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [etaMin, setEtaMin] = useState<number | null>(null);
  const [note, setNote] = useState(mode === "driver" ? "Looking for your location…" : "Waiting for driver location…");

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: true }).setView([14.5995, 120.9842], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    mapRef.current = map;
    setMapReady(true);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!deliveryAddress.trim() || mapReady) return;
    fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(deliveryAddress)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && data[0]) {
          setDestination([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        } else {
          setNote("Could not find the delivery address on the map. Showing a general view.");
        }
      })
      .catch(() => setNote("Could not geocode the delivery address."));
  }, [deliveryAddress, mapReady]);

  const ensureRiderMarker = (pos: [number, number]): L.Marker | null => {
    const map = mapRef.current;
    if (!map) return null;
    if (!riderMarkerRef.current) {
      riderMarkerRef.current = L.marker(pos, { icon: riderIcon, interactive: false, title: "Delivery rider" }).addTo(map);
      riderElRef.current = (riderMarkerRef.current.getElement()?.querySelector(".ozy-rider-icon") as HTMLElement) ?? null;
      if (riderElRef.current) riderElRef.current.textContent = "🛵";
    }
    return riderMarkerRef.current;
  };

  const animateTo = (target: [number, number]) => {
    const marker = ensureRiderMarker(target);
    const map = mapRef.current;
    if (!marker || !map) return;

    const from = lastPosRef.current ?? target;
    lastPosRef.current = target;

    if (animRef.current) cancelAnimationFrame(animRef.current);

    const duration = 2000;
    const start = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const lat = from[0] + (target[0] - from[0]) * t;
      const lng = from[1] + (target[1] - from[1]) * t;
      marker.setLatLng([lat, lng]);

      if (riderElRef.current && (from[0] !== target[0] || from[1] !== target[1])) {
        riderElRef.current.style.transform = `rotate(${((bearing(from, target) % 360) + 360) % 360}deg)`;
      }

      if (destination && routeRef.current) {
        routeRef.current.setLatLngs([[lat, lng], destination]);
      }

      if (t < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        animRef.current = null;
        autoFit(marker.getLatLng());
      }
    };

    animRef.current = requestAnimationFrame(step);
  };

  const autoFit = (riderLatLng?: L.LatLngExpression) => {
    const map = mapRef.current;
    if (!map) return;
    const pts: L.LatLngExpression[] = [];
    if (destination) pts.push(destination);
    if (riderLatLng) pts.push(riderLatLng);
    else if (lastPosRef.current) pts.push(lastPosRef.current);
    if (pts.length > 0) map.fitBounds(L.latLngBounds(pts).pad(0.35));
  };

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !destination) return;
    if (!destMarkerRef.current) {
      destMarkerRef.current = L.marker(destination, { icon: destinationIcon, interactive: false, title: "Delivery destination" }).addTo(map);
    } else {
      destMarkerRef.current.setLatLng(destination);
    }
    if (!routeRef.current) {
      routeRef.current = L.polyline([], { color: "#3b82f6", weight: 4, opacity: 0.9, dashArray: "0.1 8", lineCap: "round" }).addTo(map);
    }
  }, [destination, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !destination) return;
    if (!routeRef.current) {
      routeRef.current = L.polyline([], { color: "#3b82f6", weight: 4, opacity: 0.9, dashArray: "0.1 8", lineCap: "round" }).addTo(map);
    }
    if (!driverPos) return;
    driverPosRef.current = driverPos;
    animateTo(driverPos);
    setDistanceKm(destination ? haversineKm(driverPos, destination) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverPos, mapReady, destination]);

  useEffect(() => {
    if (distanceKm == null) return;
    setEtaMin(Math.max(1, Math.ceil(distanceKm / 0.32)));
  }, [distanceKm]);

  useEffect(() => {
    if (!destination || !lastPosRef.current) return;
    setDistanceKm(haversineKm(lastPosRef.current, destination));
  }, [destination, driverPos]);

  useEffect(() => {
    if (mode !== "driver" || typeof navigator === "undefined" || !navigator.geolocation) return;

    const sendLocation = (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const p: [number, number] = [lat, lng];
      driverPosRef.current = p;
      setDriverPos(p);
      setNote("Sharing your live location with the customer.");
      fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, lat, lng }),
      }).catch(() => {});
    };

    const onError = (e: GeolocationPositionError) => {
      setNote(`Location unavailable: ${e.message}`);
    };

    setNote("Requesting your location…");
    const watchId = navigator.geolocation.watchPosition(sendLocation, onError, {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 15000,
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [mode, orderId]);

  useEffect(() => {
    if (mode !== "customer") return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/orders/track?id=${orderId}`);
        const data = await res.json();
        if (data && data.driver_lat != null && data.driver_lng != null) {
          const p: [number, number] = [Number(data.driver_lat), Number(data.driver_lng)];
          driverPosRef.current = p;
          setDriverPos(p);
          setNote("Your rider is moving — tracking live.");
        } else {
          setNote("Rider hasn't shared their location yet. Hang tight!");
        }
      } catch {
        setNote("Could not reach the tracking service.");
      }
    };

    setNote("Connecting…");
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [mode, orderId]);

  useEffect(() => {
    if (mapReady && destination) autoFit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination, mapReady]);

  const phase = phaseFor(deliveryStatus);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-0 sm:p-4">
      <div className="relative w-full h-full sm:h-[88vh] sm:max-h-[700px] sm:max-w-lg bg-white overflow-hidden sm:rounded-3xl sm:shadow-2xl">
        <div ref={containerRef} className="absolute inset-0 z-0" />

        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 via-black/30 to-transparent text-white px-5 pt-5 pb-12">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg leading-tight">Live Tracking</h3>
              <p className="text-xs text-white/80">{mode === "driver" ? "Driver view" : "Customer view"}{orderNumber ? ` · Order #${orderNumber}` : ""}</p>
            </div>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 backdrop-blur hover:bg-white/30 transition" title="Close">
              ✕
            </button>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl">{phase.icon}</div>
            <div>
              <p className="font-semibold">{phase.msg}</p>
              <p className="text-xs text-white/80">{phase.sub}</p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10 bg-white/95 backdrop-blur rounded-t-2xl shadow-[0_-8px_24px_rgba(0,0,0,.12)] p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-xl">🛵</div>
            <div className="flex-1">
              <p className="text-sm font-bold text-coffee-dark">
                {mode === "driver" ? "You are delivering this order" : "Delivery rider"}
              </p>
              <p className="text-xs flex items-center gap-1 text-coffee-primary/70">
                <span className={`w-2 h-2 rounded-full ${driverPos ? "bg-green-500 animate-pulse" : "bg-yellow-400"}`} />
                {note}
              </p>
            </div>
            {etaMin != null && (
              <div className="text-right">
                <p className="text-lg font-extrabold text-coffee-accent leading-none">{etaMin} min</p>
                <p className="text-[10px] text-coffee-primary/60">ETA</p>
              </div>
            )}
          </div>

          {distanceKm != null && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-coffee-primary mb-1">
                <span>Rider → you</span>
                <span className="font-semibold text-coffee-dark">{distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`}</span>
              </div>
              <div className="h-2 rounded-full bg-coffee-light overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all" style={{ width: `${Math.min(100, Math.max(5, 100 - distanceKm * 20))}%` }} />
              </div>
            </div>
          )}

          <div className="border-t border-coffee-light pt-3">
            {customerName && (
              <p className="text-sm font-medium text-coffee-dark">
                Deliver to: <span className="capitalize">{customerName}</span>
              </p>
            )}
            <p className="text-sm text-coffee-primary">📍 {deliveryAddress}</p>
            {customerPhone && <p className="text-sm text-coffee-primary">📞 {customerPhone}</p>}
            <div className="flex gap-1.5 mt-3 text-xs">
              <span className="inline-flex items-center gap-1 text-coffee-primary/70"><span className="w-3 h-3 rounded-full inline-block bg-red-500 border border-white shadow" /> Destination</span>
              <span className="inline-flex items-center gap-1 text-coffee-primary/70"><span className="text-sm">🛵</span> Delivery rider</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}