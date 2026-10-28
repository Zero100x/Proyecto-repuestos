'use client';

import React, { useEffect, useRef, useState } from 'react';

export interface MapStoreItem {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  stockCount: number;
  imageUrl?: string;
  openStatus: string;
}

interface InteractiveStoresMapProps {
  stores: MapStoreItem[];
  selectedStoreId: string;
  onSelectStore: (id: string) => void;
}

export default function InteractiveStoresMap({
  stores,
  selectedStoreId,
  onSelectStore,
}: InteractiveStoresMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersMapRef = useRef<{ [id: string]: any }>({});
  const [mapLoaded, setMapLoaded] = useState(false);

  // Load Leaflet CDN once
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initMap = () => {
      const L = (window as any).L;
      if (!L || !mapContainerRef.current) return;
      if (leafletMapRef.current) return;

      const selected = stores.find(s => s.id === selectedStoreId) || stores[0];
      const centerLat = selected?.latitude || 1.2136;
      const centerLon = selected?.longitude || -77.2811;

      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLon],
        zoom: 14,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      leafletMapRef.current = map;
      setMapLoaded(true);

      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    };

    if ((window as any).L) {
      initMap();
      return;
    }

    if (!document.getElementById('leaflet-css-cdn')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css-cdn';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const existingScript = document.getElementById('leaflet-js-cdn') as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', initMap);
      return;
    }

    const script = document.createElement('script');
    script.id = 'leaflet-js-cdn';
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = initMap;
    document.body.appendChild(script);

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Render / update store markers whenever stores or selectedStoreId change
  useEffect(() => {
    if (!mapLoaded || !leafletMapRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const map = leafletMapRef.current;

    // Clear old markers
    Object.values(markersMapRef.current).forEach((m: any) => m.remove());
    markersMapRef.current = {};

    stores.forEach(st => {
      const isSelected = st.id === selectedStoreId;
      const bg = isSelected ? '#10b981' : '#0a1f44';
      const border = isSelected ? '#ffffff' : '#38bdf8';
      const scale = isSelected ? 'scale(1.12)' : 'scale(1)';

      const iconHtml = `
        <div style="transform:${scale};transition:all 0.2s;display:flex;align-items:center;gap:4px;background:${bg};color:#fff;border:2px solid ${border};border-radius:999px;padding:3px 8px;font-family:monospace;font-size:10px;font-weight:700;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.4);">
          <span>📍</span>
          <span>${st.name.slice(0, 16)} (${st.distanceKm}km)</span>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'store-map-marker',
        html: iconHtml,
        iconSize: [140, 28],
        iconAnchor: [70, 14],
      });

      const marker = L.marker([st.latitude, st.longitude], { icon: customIcon }).addTo(map);
      marker.on('click', () => {
        onSelectStore(st.id);
      });

      markersMapRef.current[st.id] = marker;
    });

    const activeStore = stores.find(s => s.id === selectedStoreId);
    if (activeStore && Number.isFinite(activeStore.latitude) && Number.isFinite(activeStore.longitude)) {
      map.flyTo([activeStore.latitude, activeStore.longitude], 14, { duration: 0.7 });
    }
  }, [stores, selectedStoreId, mapLoaded]);

  return (
    <div className="relative w-full h-[280px] bg-slate-900 overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full z-10" />
    </div>
  );
}

