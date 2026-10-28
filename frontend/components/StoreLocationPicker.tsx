'use client';

import React, { useState, useEffect, useRef } from 'react';

export interface StoreLocationValue {
  address: string;
  city: string;
  latitude: number;
  longitude: number;
}

interface StoreLocationPickerProps {
  value: StoreLocationValue;
  onChange: (next: StoreLocationValue) => void;
}

interface GeoSuggestion {
  displayName: string;
  address: string;
  city: string;
  lat: number;
  lon: number;
}

const QUICK_AUTO_HUBS: GeoSuggestion[] = [
  {
    displayName: 'Sector 7 de Agosto — Bogotá (Zona Repuestos)',
    address: 'Carrera 24 # 63F-15, 7 de Agosto',
    city: 'Bogotá',
    lat: 4.6542,
    lon: -74.0722,
  },
  {
    displayName: 'Paloquemao / Av. NQS — Bogotá',
    address: 'Av. Carrera 30 # 19-40, Paloquemao',
    city: 'Bogotá',
    lat: 4.6168,
    lon: -74.0885,
  },
  {
    displayName: 'Autopista Norte / Calle 134 — Bogotá',
    address: 'Calle 134 # 45-20, Prado / Norte',
    city: 'Bogotá',
    lat: 4.7212,
    lon: -74.0531,
  },
  {
    displayName: 'La Bayadera / Calle 30 — Medellín',
    address: 'Calle 30 # 65-45, Belén / Bayadera',
    city: 'Medellín',
    lat: 6.2314,
    lon: -75.5891,
  },
  {
    displayName: 'Corredor Industrial Barrio Triste — Medellín',
    address: 'Carrera 57 # 44-32, Jesús Nazareno',
    city: 'Medellín',
    lat: 6.2486,
    lon: -75.5742,
  },
  {
    displayName: 'Zona Industrial Calle 15 — Cali',
    address: 'Calle 15 # 10-45, San Nicolás',
    city: 'Cali',
    lat: 3.4516,
    lon: -76.5320,
  },
];

export default function StoreLocationPicker({ value, onChange }: StoreLocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeoSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  // Load Leaflet CSS & JS from CDN once
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initLeaflet = () => {
      const L = (window as any).L;
      if (!L || !mapContainerRef.current) return;
      if (leafletMapRef.current) return;

      const initialLat = Number.isFinite(valueRef.current.latitude)
        ? valueRef.current.latitude
        : 4.6542;
      const initialLon = Number.isFinite(valueRef.current.longitude)
        ? valueRef.current.longitude
        : -74.0722;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLon],
        zoom: 14,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const customIcon = L.divIcon({
        className: 'custom-store-pin',
        html: `<div style="width:34px;height:34px;background:#0a1f44;border:3px solid #10b981;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.35);color:#fff;font-size:16px;">📍</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const marker = L.marker([initialLat, initialLon], {
        draggable: true,
        icon: customIcon,
      }).addTo(map);

      const updateFromCoords = async (lat: number, lon: number) => {
        const roundedLat = parseFloat(lat.toFixed(6));
        const roundedLon = parseFloat(lon.toFixed(6));

        // Update coordinates immediately
        onChange({
          ...valueRef.current,
          latitude: roundedLat,
          longitude: roundedLon,
        });

        // Reverse geocode via Nominatim
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${roundedLat}&lon=${roundedLon}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'es' } }
          );
          if (res.ok) {
            const data = await res.json();
            const addrObj = data.address || {};
            const road = addrObj.road || addrObj.pedestrian || addrObj.suburb || '';
            const houseNumber = addrObj.house_number ? ` # ${addrObj.house_number}` : '';
            const neighbourhood = addrObj.neighbourhood || addrObj.quarter || '';
            const detectedCity =
              addrObj.city ||
              addrObj.town ||
              addrObj.municipality ||
              addrObj.state ||
              valueRef.current.city ||
              'Bogotá';
            const formattedAddress =
              [road + houseNumber, neighbourhood].filter(Boolean).join(', ') ||
              data.display_name?.split(',').slice(0, 2).join(',') ||
              valueRef.current.address;

            onChange({
              address: formattedAddress,
              city: detectedCity,
              latitude: roundedLat,
              longitude: roundedLon,
            });
          }
        } catch {
          // Keep manual address if reverse geocoding fails
        }
      };

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        updateFromCoords(pos.lat, pos.lng);
      });

      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        updateFromCoords(lat, lng);
      });

      leafletMapRef.current = map;
      markerRef.current = marker;
      setMapReady(true);

      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    };

    if ((window as any).L) {
      initLeaflet();
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
      existingScript.addEventListener('load', initLeaflet);
      return;
    }

    const script = document.createElement('script');
    script.id = 'leaflet-js-cdn';
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = initLeaflet;
    document.body.appendChild(script);

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Keep marker & map synced when parent value changes externally
  useEffect(() => {
    if (!mapReady || !leafletMapRef.current || !markerRef.current) return;
    if (!Number.isFinite(value.latitude) || !Number.isFinite(value.longitude)) return;

    const currentPos = markerRef.current.getLatLng();
    const diff =
      Math.abs(currentPos.lat - value.latitude) + Math.abs(currentPos.lng - value.longitude);
    if (diff > 0.0001) {
      markerRef.current.setLatLng([value.latitude, value.longitude]);
      leafletMapRef.current.setView([value.latitude, value.longitude], 15, { animate: true });
    }
  }, [value.latitude, value.longitude, mapReady]);

  // Search address via Nominatim API
  const handleSearchAddress = async () => {
    const q = searchQuery.trim();
    if (!q) return;

    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          q
        )}&addressdetails=1&limit=5`,
        { headers: { 'Accept-Language': 'es' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mapped: GeoSuggestion[] = data.map((item: any) => {
            const addr = item.address || {};
            const city =
              addr.city || addr.town || addr.municipality || addr.state || 'Bogotá';
            const shortAddr = item.display_name.split(',').slice(0, 2).join(', ');
            return {
              displayName: item.display_name,
              address: shortAddr,
              city,
              lat: parseFloat(parseFloat(item.lat).toFixed(6)),
              lon: parseFloat(parseFloat(item.lon).toFixed(6)),
            };
          });
          setSuggestions(mapped);
          return;
        }
      }
    } catch {
      // Fallback to local hub matching
    } finally {
      setSearching(false);
    }

    // Fallback filter on quick hubs
    const filtered = QUICK_AUTO_HUBS.filter(
      h =>
        h.displayName.toLowerCase().includes(q.toLowerCase()) ||
        h.city.toLowerCase().includes(q.toLowerCase())
    );
    setSuggestions(filtered.length > 0 ? filtered : QUICK_AUTO_HUBS.slice(0, 3));
  };

  const handleSelectSuggestion = (s: GeoSuggestion) => {
    onChange({
      address: s.address,
      city: s.city,
      latitude: s.lat,
      longitude: s.lon,
    });
    setSuggestions([]);
    setSearchQuery('');
  };

  const handleUseMyGps = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lon = parseFloat(pos.coords.longitude.toFixed(6));
        onChange({
          ...value,
          latitude: lat,
          longitude: lon,
        });
        setGpsLoading(false);
      },
      () => {
        setGpsLoading(false);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="space-y-3 bg-gray-50/80 border border-gray-200 rounded-xl p-3.5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-emerald-600 text-lg">pin_drop</span>
          <span className="font-mono text-[11px] uppercase tracking-wider font-bold text-gray-700">
            UBICACIÓN EN MAPA Y COORDENADAS GPS
          </span>
        </div>
        <button
          type="button"
          onClick={handleUseMyGps}
          disabled={gpsLoading}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-xs">my_location</span>
          <span>{gpsLoading ? 'Detectando GPS...' : 'Usar mi ubicación actual'}</span>
        </button>
      </div>

      {/* Address Search Bar */}
      <div className="relative">
        <div className="flex gap-1.5">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearchAddress();
                }
              }}
              placeholder="Buscar calle, barrio o ciudad (Ej: Calle 134 # 45-20, Bogotá)..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-600 text-gray-900"
            />
          </div>
          <button
            type="button"
            onClick={handleSearchAddress}
            disabled={searching}
            className="px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">travel_explore</span>
            <span>{searching ? '...' : 'Ubicar'}</span>
          </button>
        </div>

        {/* Autocomplete Dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
            {suggestions.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSuggestion(item)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 border-b border-gray-100 last:border-none flex items-start gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-blue-600 text-base mt-0.5">
                  location_on
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-gray-900 truncate">{item.address}</div>
                  <div className="text-[11px] text-gray-500 truncate">{item.displayName}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Zone Chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] font-mono text-gray-400 uppercase font-semibold">
          Zonas Rápidas:
        </span>
        {QUICK_AUTO_HUBS.slice(0, 4).map(hub => (
          <button
            key={hub.displayName}
            type="button"
            onClick={() => handleSelectSuggestion(hub)}
            className="px-2 py-0.5 bg-white hover:bg-blue-50 text-gray-600 hover:text-blue-700 border border-gray-200 rounded text-[10px] font-medium transition-colors cursor-pointer"
          >
            {hub.city} ({hub.address.split(',')[0]})
          </button>
        ))}
      </div>

      {/* Interactive Map Box */}
      <div className="relative rounded-xl overflow-hidden border border-gray-300 h-48 bg-slate-900 shadow-inner">
        <div ref={mapContainerRef} className="w-full h-full z-10" />
        <div className="absolute bottom-2 left-2 z-20 bg-gray-900/85 backdrop-blur-xs text-white px-2.5 py-1 rounded-md text-[10px] font-mono pointer-events-none flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Haz clic en el mapa o arrastra el pin 📍 para ajustar tu fachada</span>
        </div>
      </div>

      {/* Address, City & Coordinates Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label className="block font-mono text-[10px] uppercase font-bold text-gray-500 mb-1">
            DIRECCIÓN FÍSICA DEL MOSTRADOR *
          </label>
          <input
            type="text"
            required
            value={value.address}
            onChange={e => onChange({ ...value, address: e.target.value })}
            placeholder="Ej: Carrera 24 # 63F-15"
            className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-600 text-gray-900 font-medium"
          />
        </div>
        <div>
          <label className="block font-mono text-[10px] uppercase font-bold text-gray-500 mb-1">
            CIUDAD / MUNICIPIO *
          </label>
          <input
            type="text"
            required
            value={value.city}
            onChange={e => onChange({ ...value, city: e.target.value })}
            placeholder="Ej: Bogotá"
            className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-600 text-gray-900 font-medium"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="block font-mono text-[10px] uppercase font-bold text-gray-400 mb-1">
            LATITUD GPS
          </label>
          <input
            type="number"
            step="any"
            value={value.latitude}
            onChange={e =>
              onChange({ ...value, latitude: parseFloat(e.target.value) || 4.6542 })
            }
            className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-gray-200 rounded-lg text-gray-700"
          />
        </div>
        <div>
          <label className="block font-mono text-[10px] uppercase font-bold text-gray-400 mb-1">
            LONGITUD GPS
          </label>
          <input
            type="number"
            step="any"
            value={value.longitude}
            onChange={e =>
              onChange({ ...value, longitude: parseFloat(e.target.value) || -74.0722 })
            }
            className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-gray-200 rounded-lg text-gray-700"
          />
        </div>
      </div>
    </div>
  );
}
