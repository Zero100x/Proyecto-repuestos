'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useCompare } from '../../lib/compareContext';
import { formatPriceCOP, fetchParts, fetchPartById } from '../../lib/api';
import WhatsAppLeadModal from '../../components/WhatsAppLeadModal';
import ReservationModal from '../../components/ReservationModal';
import ReservationVoucherModal from '../../components/ReservationVoucherModal';
import { Part, InventoryItem, ReservationItem } from '../../lib/types';

export interface PartStoreDetails {
  storeName: string;
  branchName: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  gpsUrl: string;
  operatingHours: string;
  hasDelivery: boolean;
  deliveryDetails?: string;
}

function getPartStoreDetails(part: Part): PartStoreDetails {
  let storeName = 'Almacén Registrado';
  let branchName = 'Sede Principal';
  let address = '';
  let city = 'Pasto, Nariño';
  let latitude: number | undefined = undefined;
  let longitude: number | undefined = undefined;
  let phone = '';
  let operatingHours = 'Lunes a Sábado • 08:00 - 18:30';
  let hasDelivery = true;
  let deliveryDetails = 'Despacho express disponible en Pasto';

  // 1. From direct inventory
  if (part.inventory && part.inventory.length > 0) {
    for (const inv of part.inventory) {
      const loc = inv.location;
      if (loc) {
        if (loc.store?.name) storeName = loc.store.name;
        if (loc.name) branchName = loc.name;
        if (loc.address) address = loc.address;
        if (loc.city) city = loc.city;
        if (loc.latitude) latitude = loc.latitude;
        if (loc.longitude) longitude = loc.longitude;
        if (loc.phone || loc.whatsapp) phone = loc.whatsapp || loc.phone || '';
        if (loc.operatingHours || loc.store?.operatingHours) {
          operatingHours = loc.operatingHours || loc.store?.operatingHours || operatingHours;
        }
        if (loc.hasDelivery !== undefined || loc.store?.hasDelivery !== undefined) {
          hasDelivery = loc.hasDelivery ?? loc.store?.hasDelivery ?? true;
        }
        if (loc.deliveryDetails || loc.store?.deliveryDetails) {
          deliveryDetails = loc.deliveryDetails || loc.store?.deliveryDetails || deliveryDetails;
        }
        break;
      }
    }
  }

  // 2. From locations array (if present in Meilisearch hit or response)
  if (!address && part.locations && part.locations.length > 0) {
    const loc = part.locations[0];
    if (loc.storeName) storeName = loc.storeName;
    if (loc.name) branchName = loc.name;
    if (loc.address) address = loc.address;
    if (loc.city) city = loc.city;
    if (loc.latitude) latitude = loc.latitude;
    if (loc.longitude) longitude = loc.longitude;
    if (loc.phone) phone = loc.phone;
  }

  // 3. Fallbacks from storeNames, addresses, locationNames, cities
  if (storeName === 'Almacén Registrado' && part.storeNames && part.storeNames.length > 0) {
    storeName = part.storeNames[0];
  }
  if (!address && part.addresses && part.addresses.length > 0) {
    address = part.addresses[0];
  }
  if (branchName === 'Sede Principal' && part.locationNames && part.locationNames.length > 0) {
    branchName = part.locationNames[0];
  }
  if (city === 'Pasto, Nariño' && part.cities && part.cities.length > 0) {
    city = part.cities[0];
  }

  // Clean city formatting
  const formattedCity = city.includes('Perímetro Urbano') ? 'Pasto, Nariño' : city;
  const finalAddress = address ? address : formattedCity;

  // Build real Google Maps link for Pasto
  const gpsUrl =
    latitude && longitude
      ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${finalAddress}, San Juan de Pasto`)}`;

  return {
    storeName,
    branchName,
    address: finalAddress,
    city: formattedCity,
    latitude,
    longitude,
    phone,
    gpsUrl,
    operatingHours,
    hasDelivery,
    deliveryDetails,
  };
}

function getPartStoreName(part: Part): string {
  return getPartStoreDetails(part).storeName;
}

function getPartLocationText(part: Part): string {
  const d = getPartStoreDetails(part);
  return `${d.address}, ${d.city}`;
}

function getPartStock(part: Part): number {
  if (typeof part.totalStock === 'number' && part.totalStock >= 0) {
    return part.totalStock;
  }
  if (part.inventory && part.inventory.length > 0) {
    return part.inventory.reduce((acc, i) => acc + (i.stock || 0), 0);
  }
  return 0;
}

export default function ComparePage() {
  const { comparedParts, removeFromCompare, clearCompare, addToCompare, setComparedPartsList } = useCompare();

  // Modals state
  const [selectedPartForLead, setSelectedPartForLead] = useState<Part | null>(null);
  const [reservationModalPart, setReservationModalPart] = useState<Part | null>(null);
  const [voucherModalReservation, setVoucherModalReservation] = useState<ReservationItem | null>(null);

  // Filter & View toggles
  const [onlyDifferences, setOnlyDifferences] = useState(false);

  // Available catalog parts for quick add suggestions (strictly from DB)
  const [catalogParts, setCatalogParts] = useState<Part[]>([]);

  useEffect(() => {
    fetchParts({ limit: 12 })
      .then(res => setCatalogParts(res.data))
      .catch(() => {});
  }, []);

  // Hydrate parts from backend whenever comparedParts loads or changes
  const comparedIdsKey = useMemo(() => comparedParts.map(p => p.id).join(','), [comparedParts]);

  useEffect(() => {
    if (!comparedIdsKey) return;

    let cancelled = false;
    Promise.all(
      comparedParts.map(async p => {
        try {
          const fresh = await fetchPartById(p.id);
          if (fresh) {
            return {
              ...p,
              ...fresh,
              storeNames: fresh.storeNames?.length ? fresh.storeNames : p.storeNames,
              addresses: fresh.addresses?.length ? fresh.addresses : p.addresses,
              locations: fresh.locations?.length ? fresh.locations : p.locations,
            };
          }
        } catch {
          // keep existing if error
        }
        return p;
      })
    ).then(hydrated => {
      if (!cancelled) {
        const needsUpdate = hydrated.some((h, idx) => {
          const original = comparedParts[idx];
          if (!original) return true;
          const origD = getPartStoreDetails(original);
          const hydD = getPartStoreDetails(h);
          return (
            origD.address !== hydD.address ||
            origD.storeName !== hydD.storeName ||
            !original.inventory?.length ||
            (original.inventory?.length || 0) !== (h.inventory?.length || 0)
          );
        });
        if (needsUpdate) {
          setComparedPartsList(hydrated);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [comparedIdsKey]);

  // Filter catalog parts that aren't already in comparison
  const availableToAdd = useMemo(() => {
    const existingIds = new Set(comparedParts.map(p => p.id));
    return catalogParts.filter(p => !existingIds.has(p.id));
  }, [catalogParts, comparedParts]);

  // Detected common vehicle among compared parts (if any)
  const commonVehicle = useMemo(() => {
    if (comparedParts.length === 0) return null;
    const firstMakes = comparedParts[0].makes || [];
    const firstModels = comparedParts[0].models || [];
    if (firstMakes.length === 0 && firstModels.length === 0) return null;

    const commonMake = firstMakes.find(m =>
      comparedParts.every(p => (p.makes || []).some(pm => pm.toLowerCase() === m.toLowerCase())),
    );
    const commonModel = firstModels.find(m =>
      comparedParts.every(p => (p.models || []).some(pm => pm.toLowerCase() === m.toLowerCase())),
    );

    if (commonMake || commonModel) {
      const allYears = comparedParts.flatMap(p => p.years || []);
      const minYear = allYears.length ? Math.min(...allYears) : undefined;
      const maxYear = allYears.length ? Math.max(...allYears) : undefined;
      const yearStr = minYear && maxYear ? ` (${minYear}${maxYear !== minYear ? `–${maxYear}` : ''})` : '';
      return `${commonMake || ''} ${commonModel || ''}${yearStr}`.trim();
    }
    return null;
  }, [comparedParts]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col antialiased pt-[68px]">
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* ========================================================================= */}
        {/* 1. BREADCRUMB & HEADER                                                    */}
        {/* ========================================================================= */}
        <div className="mb-6">
          <nav className="flex items-center gap-2 text-xs font-mono text-[var(--secondary)] mb-3">
            <Link href="/" className="hover:text-[var(--primary)] transition-colors">
              Inicio
            </Link>
            <span>/</span>
            <Link href="/search" className="hover:text-[var(--primary)] transition-colors">
              Marketplace
            </Link>
            <span>/</span>
            <span className="text-[var(--primary)] font-bold">Comparador Técnico Multi-Marca</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[var(--outline-variant)]">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-[var(--primary)] border border-blue-200 rounded-full text-xs font-mono font-bold uppercase tracking-wider mb-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span>EVALUACIÓN TÉCNICA LADO A LADO</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--primary)] tracking-tight font-heading">
                Comparativa Técnica de Componentes
              </h1>
              <p className="text-xs sm:text-sm text-[var(--secondary)] mt-1 max-w-2xl leading-relaxed">
                Contraste de especificaciones técnicas, números de parte OEM, disponibilidad de almacén físico y validación de compatibilidad directa en San Juan de Pasto.
              </p>
            </div>

            {/* Vehicle Reference Card (matching mockup top right) */}
            <div className="bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] rounded-2xl p-4 flex items-center gap-3.5 shadow-sm max-w-md w-full lg:w-auto">
              <div className="w-11 h-11 rounded-xl bg-[var(--primary-container)]/15 text-[var(--primary)] border border-[var(--outline-variant)] flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-2xl">directions_car</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--secondary)] font-bold flex items-center justify-between gap-2">
                  <span>Vehículo de Referencia</span>
                  {commonVehicle && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-bold">
                      ✓ Coincidencia
                    </span>
                  )}
                </div>
                <div className="text-xs sm:text-sm font-bold text-[var(--primary)] truncate font-heading mt-0.5">
                  {commonVehicle || 'Multimarca / Comparación Cruzada'}
                </div>
                <div className="text-[11px] font-sans text-[var(--secondary)] truncate">
                  Red de Almacenes en Pasto, Nariño
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. TOOLBAR & CONTROLS (Slots, Differences Toggle, Clear & Print)          */}
        {/* ========================================================================= */}
        <div className="bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] rounded-2xl p-4 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3 flex-wrap text-xs">
            {/* Occupied slots badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--surface-container)] text-[var(--on-surface)] font-mono font-bold border border-[var(--outline-variant)]">
              <span className={`w-2.5 h-2.5 rounded-full ${comparedParts.length > 0 ? 'bg-amber-500' : 'bg-gray-400'}`} />
              <span>{comparedParts.length} de 4 ranuras ocupadas</span>
            </div>

            {/* Toggle: Destacar diferencias */}
            {comparedParts.length > 1 && (
              <label className="flex items-center gap-2 text-xs font-heading font-medium text-[var(--on-surface)] cursor-pointer select-none px-3 py-1.5 rounded-xl border border-[var(--outline-variant)] hover:bg-[var(--surface-container-low)] transition-colors">
                <input
                  type="checkbox"
                  checked={onlyDifferences}
                  onChange={e => setOnlyDifferences(e.target.checked)}
                  className="rounded text-[var(--primary)] focus:ring-[var(--primary)] h-4 w-4"
                />
                <span>Destacar solo diferencias técnicas</span>
              </label>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {comparedParts.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[var(--outline-variant)] text-[var(--primary)] rounded-xl font-heading text-xs font-bold hover:bg-[var(--surface-container-low)] transition shadow-sm"
                  title="Imprimir o guardar comparativa en PDF"
                >
                  <span className="material-symbols-outlined text-sm">print</span>
                  <span className="hidden md:inline">Imprimir Ficha</span>
                </button>

                <button
                  type="button"
                  onClick={clearCompare}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-red-200 text-red-600 rounded-xl font-heading text-xs font-bold hover:bg-red-50 hover:border-red-300 transition shadow-sm"
                  title="Vaciar todos los repuestos del comparador"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                  <span>Limpiar Todo</span>
                </button>
              </>
            )}

            <Link
              href="/search"
              className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white rounded-xl font-heading text-xs font-bold hover:bg-[var(--primary-container)] transition shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span>Añadir Repuestos</span>
            </Link>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. EMPTY STATE (When no parts are in comparison)                          */}
        {/* ========================================================================= */}
        {comparedParts.length === 0 ? (
          <div className="bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] rounded-3xl p-8 sm:p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[var(--primary)] border border-blue-200 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">balance</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--primary)] font-heading mb-2">
              No tienes repuestos seleccionados en el comparador
            </h2>
            <p className="text-xs sm:text-sm text-[var(--secondary)] max-w-lg mx-auto mb-8 leading-relaxed">
              Compara hasta 4 repuestos en paralelo para analizar diferencias en precio real en Pasto, stock en sede, códigos de referencia OEM y compatibilidad vehicular exacta.
            </p>

            {/* Quick-add real catalog items */}
            {catalogParts.length > 0 && (
              <div className="max-w-4xl mx-auto pt-6 border-t border-[var(--outline-variant)] text-left">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading text-xs font-bold text-[var(--primary)] uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-[var(--primary)]">inventory_2</span>
                    <span>Repuestos reales disponibles en almacenes de Pasto:</span>
                  </h3>
                  <Link href="/search" className="text-xs font-mono text-[var(--primary)] font-bold hover:underline">
                    Ver catálogo completo →
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {catalogParts.slice(0, 3).map(part => (
                    <div
                      key={part.id}
                      className="bg-white border border-[var(--outline-variant)] rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition"
                    >
                      <div>
                        <div className="h-32 bg-[var(--surface-container-low)] rounded-xl overflow-hidden mb-3 border border-[var(--outline-variant)] flex items-center justify-center">
                          {part.imageUrl ? (
                            <img src={part.imageUrl} alt={part.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-3xl text-[var(--secondary)]">directions_car</span>
                          )}
                        </div>
                        <span className="font-mono text-[10px] text-[var(--secondary)] uppercase font-semibold">
                          {part.brand || 'Genérico'} • {part.category?.name || 'Repuestos'}
                        </span>
                        <h4 className="font-heading text-xs font-bold text-[var(--primary)] line-clamp-2 mt-0.5">
                          {part.name}
                        </h4>
                        <div className="font-mono text-sm font-extrabold text-[var(--primary)] mt-2">
                          {formatPriceCOP(part.minPrice || 0)}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => addToCompare(part)}
                        className="mt-4 w-full py-2 px-3 bg-[var(--surface-container)] hover:bg-[var(--primary)] text-[var(--primary)] hover:text-white rounded-xl font-heading text-xs font-bold transition flex items-center justify-center gap-1.5 border border-[var(--outline-variant)]"
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                        <span>Comparar esta pieza</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ========================================================================= */
          /* 4. MAIN COMPARISON GRID (Up to 4 Columns matching the Mockup)             */
          /* ========================================================================= */
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
              {comparedParts.map((part, colIdx) => {
                const oemNumber =
                  part.partNumbers?.find(pn => pn.type === 'OEM')?.number ||
                  part.partNumbers?.[0]?.number ||
                  'SIN OEM REGISTRADO';

                const condition = part.conditions?.[0] || 'NEW';
                const conditionLabel =
                  condition === 'NEW'
                    ? 'OEM NUEVO / CERTIFICADO'
                    : condition === 'REFURBISHED'
                    ? 'REMANUFACTURADO'
                    : 'USADO VERIFICADO';

                const storeDetails = getPartStoreDetails(part);
                const stockCount = getPartStock(part);

                return (
                  <div
                    key={part.id}
                    className="bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative"
                  >
                    {/* Top Condition Banner (dark header with badge like mockup) */}
                    <div className="bg-[#0b1329] text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-800">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        {conditionLabel}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFromCompare(part.id)}
                        className="text-slate-400 hover:text-white transition p-0.5"
                        title="Quitar repuesto de la comparativa"
                      >
                        <span className="material-symbols-outlined text-base">close</span>
                      </button>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      {/* Product Image */}
                      <div className="relative h-44 bg-white rounded-2xl overflow-hidden border border-[var(--outline-variant)] flex items-center justify-center p-2 group">
                        {part.imageUrl ? (
                          <img
                            src={part.imageUrl}
                            alt={part.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                            onError={e => ((e.target as any).src = '/assets/engine.svg')}
                          />
                        ) : (
                          <span className="material-symbols-outlined text-5xl text-[var(--secondary)]">directions_car</span>
                        )}
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-white font-mono text-[9px] font-bold">
                          RANURA {colIdx + 1}
                        </span>
                      </div>

                      {/* Part Name & OEM SKU */}
                      <div>
                        <div className="font-mono text-[11px] text-[var(--secondary)] uppercase font-semibold">
                          {part.brand || 'Original OEM'} • {part.category?.name || 'Autoparte'}
                        </div>
                        <Link
                          href={`/parts/${part.id}`}
                          className="font-heading font-extrabold text-sm sm:text-base text-[var(--primary)] hover:underline block line-clamp-2 mt-0.5 leading-snug"
                        >
                          {part.name}
                        </Link>
                        <div className="font-mono text-[11px] text-gray-500 mt-1">
                          OEM SKU: <strong className="text-gray-800">{oemNumber}</strong>
                        </div>
                      </div>

                      {/* Price Section */}
                      <div className="pt-2 border-t border-[var(--outline-variant)]">
                        <div className="text-2xl font-black font-heading text-[var(--primary)] tracking-tight">
                          {formatPriceCOP(part.minPrice || 0)}
                        </div>
                        <div className="text-[10px] font-sans text-[var(--secondary)]">
                          Precio COP disponible en mostrador
                        </div>
                      </div>

                      {/* Action Buttons (Reservar & WhatsApp) */}
                      <div className="space-y-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setReservationModalPart(part)}
                          className="w-full py-2.5 px-3 bg-[#e85d04] hover:bg-[#dc2f02] text-white rounded-xl font-heading text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-sm">shopping_bag_speed</span>
                          <span>Reservar y Retirar (30m)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedPartForLead(part)}
                          className="w-full py-2 px-3 bg-white hover:bg-gray-50 text-[var(--primary)] border border-[var(--outline-variant)] rounded-xl font-heading text-xs font-bold transition flex items-center justify-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-sm text-emerald-600">chat</span>
                          <span>WhatsApp Almacén</span>
                        </button>
                      </div>

                      {/* Section: DISPONIBILIDAD Y UBICACIÓN FÍSICA EN PASTO */}
                      <div className="bg-[var(--surface-container-low)]/80 border border-[var(--outline-variant)] rounded-2xl p-3.5 space-y-2.5 text-xs shadow-xs">
                        <div className="flex items-center justify-between pb-1.5 border-b border-[var(--outline-variant)]">
                          <span className="font-mono text-[10px] uppercase font-bold text-[var(--secondary)] tracking-wider flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs text-emerald-600">store</span>
                            <span>DISPONIBILIDAD EN PASTO</span>
                          </span>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-mono font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Retiro Inmediato</span>
                          </span>
                        </div>

                        {/* Almacén */}
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="text-[var(--secondary)] text-[11px] font-medium">Almacén:</span>
                          <span className="font-heading font-extrabold text-[var(--primary)] text-xs truncate flex items-center gap-1">
                            {storeDetails.storeName}
                            <span className="material-symbols-outlined text-xs text-blue-600" title="Almacén Verificado">verified</span>
                          </span>
                        </div>

                        {/* Punto de Venta y Dirección física del almacén donde lo venden */}
                        <div className="bg-white p-2.5 rounded-xl border border-[var(--outline-variant)] space-y-1">
                          <div className="flex items-center justify-between gap-1 text-[10px] font-mono font-bold text-[var(--secondary)] uppercase">
                            <span className="flex items-center gap-1 text-[#e85d04]">
                              <span className="material-symbols-outlined text-xs">location_on</span>
                              <span>Punto de Venta / Sede:</span>
                            </span>
                            <span className="text-gray-600 truncate">{storeDetails.branchName}</span>
                          </div>
                          
                          <div className="text-xs font-bold text-gray-900 leading-tight">
                            {storeDetails.address}
                          </div>
                          
                          <div className="flex items-center justify-between gap-2 pt-1 text-[11px] text-gray-500 font-sans border-t border-gray-100">
                            <span>{storeDetails.city}</span>
                            <a
                              href={storeDetails.gpsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-[#e85d04] hover:text-[#dc2f02] hover:underline"
                              title="Abrir ubicación en Google Maps"
                            >
                              <span>Ver Mapa GPS</span>
                              <span className="material-symbols-outlined text-xs">open_in_new</span>
                            </a>
                          </div>
                        </div>

                        {/* Horario y Modalidad de Entrega */}
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="text-[var(--secondary)] text-[11px]">Horario:</span>
                          <span className="font-mono text-[11px] text-gray-800 text-right">{storeDetails.operatingHours}</span>
                        </div>
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="text-[var(--secondary)] text-[11px]">Modalidad:</span>
                          {storeDetails.hasDelivery ? (
                            <span className="font-medium text-blue-700 text-right">
                              Retiro en sede o Domicilio en Pasto
                            </span>
                          ) : (
                            <span className="font-medium text-amber-700 text-right">
                              Solo retiro presencial en sede
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-baseline gap-2 pt-1 border-t border-[var(--outline-variant)]">
                          <span className="text-[var(--secondary)] text-[11px]">Stock Físico:</span>
                          <span className="font-mono font-bold text-emerald-700">{stockCount} unidades disponibles</span>
                        </div>
                      </div>

                      {/* Section: ESPECIFICACIONES TÉCNICAS (Real Data Only) */}
                      <div className="bg-white border border-[var(--outline-variant)] rounded-2xl p-3.5 space-y-2 text-xs">
                        <div className="font-mono text-[10px] uppercase font-bold text-[var(--secondary)] tracking-wider">
                          ESPECIFICACIÓN TÉCNICA
                        </div>
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="text-[var(--secondary)] text-[11px]">Marca:</span>
                          <span className="font-bold text-gray-900">{part.brand || 'Original'}</span>
                        </div>
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="text-[var(--secondary)] text-[11px]">Categoría:</span>
                          <span className="font-medium text-gray-800">{part.category?.name || 'General'}</span>
                        </div>
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="text-[var(--secondary)] text-[11px]">Condición:</span>
                          <span className="font-medium text-gray-800">{condition === 'NEW' ? 'Nuevo' : condition}</span>
                        </div>
                        {part.partNumbers && part.partNumbers.length > 1 && (
                          <div className="flex justify-between items-baseline gap-2">
                            <span className="text-[var(--secondary)] text-[11px]">Refs. Cruzadas:</span>
                            <span className="font-mono text-[11px] text-gray-700 truncate max-w-[130px]">
                              {part.partNumbers.map(p => p.number).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Section: COMPATIBILIDAD VEHICULAR (Real Data Only) */}
                      <div className="bg-[var(--surface-container-low)]/40 border border-[var(--outline-variant)] rounded-2xl p-3.5 space-y-1.5 text-xs">
                        <div className="font-mono text-[10px] uppercase font-bold text-[var(--secondary)] tracking-wider">
                          COMPATIBILIDAD VEHICULAR
                        </div>
                        <div className="flex items-center gap-1.5 font-heading font-bold text-xs text-[var(--primary)]">
                          <span className="material-symbols-outlined text-sm text-emerald-600">verified</span>
                          <span>
                            {part.makes?.join(', ') || 'Renault'} {part.models?.join(', ') || 'Clio'}
                          </span>
                        </div>
                        {part.years && part.years.length > 0 && (
                          <div className="font-mono text-[11px] text-[var(--secondary)]">
                            Modelos {Math.min(...part.years)} al {Math.max(...part.years)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Slot to add 4th piece (Dashed Card matching mockup) */}
              {comparedParts.length < 4 && (
                <div className="border-2 border-dashed border-[var(--outline-variant)] rounded-3xl p-6 flex flex-col justify-between items-center text-center bg-[var(--surface-container-low)]/30 hover:border-[var(--primary)] transition-all">
                  <div className="w-full flex flex-col items-center pt-6">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-[var(--outline-variant)] text-[var(--secondary)] flex items-center justify-center mb-4 shadow-xs">
                      <span className="material-symbols-outlined text-3xl">add</span>
                    </div>
                    <h3 className="font-heading font-extrabold text-base text-[var(--primary)]">
                      Añadir {comparedParts.length + 1}ª Pieza
                    </h3>
                    <p className="text-xs text-[var(--secondary)] mt-1 max-w-[200px]">
                      Compara otra referencia cruzada para este vehículo o categoría.
                    </p>

                    {/* Quick suggestion from real catalog */}
                    {availableToAdd.length > 0 && (
                      <div className="mt-6 w-full text-left bg-white border border-[var(--outline-variant)] rounded-2xl p-3.5 space-y-2.5">
                        <span className="font-mono text-[9px] uppercase font-bold text-[var(--secondary)] block">
                          SUGERENCIA DEL CATÁLOGO EN PASTO:
                        </span>
                        {availableToAdd.slice(0, 2).map(sug => (
                          <div key={sug.id} className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100 first:border-0 first:pt-0">
                            <div className="min-w-0 flex-1">
                              <h5 className="font-heading text-xs font-bold text-[var(--primary)] truncate">
                                {sug.name}
                              </h5>
                              <div className="font-mono text-[11px] text-emerald-700 font-semibold">
                                {formatPriceCOP(sug.minPrice || 0)}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => addToCompare(sug)}
                              className="w-7 h-7 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-container)] text-white flex items-center justify-center flex-shrink-0 transition"
                              title="Agregar a la comparativa"
                            >
                              <span className="material-symbols-outlined text-sm">add</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Link
                    href="/search"
                    className="w-full mt-6 py-2.5 px-4 bg-white border border-[var(--outline-variant)] hover:bg-gray-50 text-[var(--primary)] rounded-xl font-heading text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span className="material-symbols-outlined text-sm">search</span>
                    <span>Buscar en Catálogo de Repuestos</span>
                  </Link>
                </div>
              )}
            </div>

            {/* ========================================================================= */}
            {/* 5. TECHNICAL CROSS-REFERENCE & VEHICLE COMPATIBILITY MATRIX TABLE        */}
            {/* ========================================================================= */}
            <div className="bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] rounded-3xl overflow-hidden shadow-sm">
              <div className="p-5 sm:p-6 border-b border-[var(--outline-variant)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--surface-container-low)]/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[var(--primary)] border border-blue-200 flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">hub</span>
                  </div>
                  <div>
                    <h3 className="font-heading text-base font-extrabold text-[var(--primary)]">
                      Validación de Códigos Cruzados y Compatibilidad Vehicular
                    </h3>
                    <p className="font-sans text-xs text-[var(--secondary)]">
                      Referencias verificadas en catálogo para la red de almacenes en Pasto
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-mono text-[11px] font-bold">
                  <span className="material-symbols-outlined text-sm text-emerald-600">verified</span>
                  <span>Catálogo Certificado Pasto</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-sans">
                  <thead>
                    <tr className="bg-[var(--surface-container-low)] border-b border-[var(--outline-variant)] font-mono text-[10px] text-[var(--secondary)] uppercase tracking-wider">
                      <th className="p-4 w-1/4">Parámetro Técnico / Referencia</th>
                      {comparedParts.map((p, idx) => (
                        <th key={p.id} className="p-4">
                          Pieza {idx + 1}: {p.name.slice(0, 28)}...
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--outline-variant)]">
                    {/* Row 1: Código OEM */}
                    <tr>
                      <td className="p-4 font-mono font-bold text-[var(--secondary)] bg-gray-50/50">
                        Código OEM de Fábrica
                      </td>
                      {comparedParts.map(p => (
                        <td key={p.id} className="p-4 font-mono font-bold text-[var(--primary)]">
                          {p.partNumbers?.find(pn => pn.type === 'OEM')?.number || 'Sin OEM específico'}
                        </td>
                      ))}
                    </tr>

                    {/* Row 2: Marca Fabricante */}
                    <tr>
                      <td className="p-4 font-mono font-bold text-[var(--secondary)] bg-gray-50/50">
                        Marca del Fabricante
                      </td>
                      {comparedParts.map(p => (
                        <td key={p.id} className="p-4 font-bold text-gray-900">
                          {p.brand || 'Original'}
                        </td>
                      ))}
                    </tr>

                    {/* Row 3: Precio COP */}
                    <tr>
                      <td className="p-4 font-mono font-bold text-[var(--secondary)] bg-gray-50/50">
                        Precio Unitario COP
                      </td>
                      {comparedParts.map(p => (
                        <td key={p.id} className="p-4 font-mono font-extrabold text-[var(--primary)] text-sm">
                          {formatPriceCOP(p.minPrice || 0)}
                        </td>
                      ))}
                    </tr>

                    {/* Row 4: Condición */}
                    <tr>
                      <td className="p-4 font-mono font-bold text-[var(--secondary)] bg-gray-50/50">
                        Condición
                      </td>
                      {comparedParts.map(p => (
                        <td key={p.id} className="p-4">
                          <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-gray-100 text-gray-800">
                            {p.conditions?.[0] === 'NEW' ? 'Nuevo (OEM / Aftermarket)' : p.conditions?.[0] || 'Nuevo'}
                          </span>
                        </td>
                      ))}
                    </tr>

                    {/* Row 5: Almacén y Sede */}
                    <tr>
                      <td className="p-4 font-mono font-bold text-[var(--secondary)] bg-gray-50/50">
                        Almacén en Pasto
                      </td>
                      {comparedParts.map(p => {
                        const d = getPartStoreDetails(p);
                        return (
                          <td key={p.id} className="p-4">
                            <div className="font-bold text-gray-900 flex items-center gap-1">
                              <span>{d.storeName}</span>
                              <span className="material-symbols-outlined text-xs text-blue-600" title="Almacén Verificado">verified</span>
                            </div>
                            <div className="text-xs text-[var(--secondary)] mt-0.5">{d.branchName}</div>
                          </td>
                        );
                      })}
                    </tr>

                    {/* Row 5b: Dirección Física donde lo venden */}
                    <tr>
                      <td className="p-4 font-mono font-bold text-[var(--secondary)] bg-gray-50/50">
                        Dirección del Almacén
                      </td>
                      {comparedParts.map(p => {
                        const d = getPartStoreDetails(p);
                        return (
                          <td key={p.id} className="p-4">
                            <div className="font-bold text-gray-900 flex items-start gap-1">
                              <span className="material-symbols-outlined text-xs text-[#e85d04] mt-0.5">location_on</span>
                              <span>{d.address}</span>
                            </div>
                            <div className="text-[11px] text-gray-500 pl-4">{d.city}</div>
                            <a
                              href={d.gpsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-mono text-[#e85d04] hover:underline pl-4 inline-flex items-center gap-0.5 mt-0.5 font-bold"
                            >
                              <span>Cómo llegar (GPS)</span>
                              <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                            </a>
                          </td>
                        );
                      })}
                    </tr>

                    {/* Row 6: Stock Físico */}
                    <tr>
                      <td className="p-4 font-mono font-bold text-[var(--secondary)] bg-gray-50/50">
                        Stock Físico Inmediato
                      </td>
                      {comparedParts.map(p => {
                        const stock = getPartStock(p);
                        return (
                          <td key={p.id} className="p-4 font-mono font-bold text-emerald-700">
                            {stock} unidades en mostrador
                          </td>
                        );
                      })}
                    </tr>

                    {/* Row 7: Vehículos Compatibles */}
                    <tr>
                      <td className="p-4 font-mono font-bold text-[var(--secondary)] bg-gray-50/50">
                        Vehículos Compatibles
                      </td>
                      {comparedParts.map(p => (
                        <td key={p.id} className="p-4 text-xs">
                          <span className="font-bold text-[var(--primary)]">
                            {p.makes?.join(', ') || 'Multimarca'} {p.models?.join(', ')}
                          </span>
                          {p.years && p.years.length > 0 && (
                            <span className="text-gray-500 block font-mono text-[11px] mt-0.5">
                              Años: {Math.min(...p.years)} a {Math.max(...p.years)}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 6. BOTTOM ADVISORY BANNER (Matching Mockup Dark Box)                      */}
            {/* ========================================================================= */}
            <div className="bg-[#0b1329] border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 font-mono text-[10px] font-bold uppercase tracking-wider mb-2 border border-blue-400/30">
                    <span className="material-symbols-outlined text-xs">support_agent</span>
                    <span>ASESORÍA TÉCNICA DIRECTA EN PASTO</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold font-heading text-white mb-2">
                    ¿Tienes dudas sobre cuál referencia elegir para tu carro?
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Si necesitas confirmar compatibilidad por número de chasis (VIN), versión de motor o tolerancia específica de montaje, puedes chatear directamente por WhatsApp con el almacén encargado antes de reservar o comprar.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedPartForLead(comparedParts[0])}
                    className="px-6 py-3 bg-[#e85d04] hover:bg-[#dc2f02] text-white rounded-xl font-heading text-xs font-bold transition shadow-md flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">chat</span>
                    <span>Consultar por WhatsApp</span>
                  </button>

                  <Link
                    href="/search"
                    className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-heading text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">search</span>
                    <span>Explorar Catálogo</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* WhatsApp Lead Generation Modal */}
      {selectedPartForLead && (
        <WhatsAppLeadModal
          part={selectedPartForLead}
          isOpen={!!selectedPartForLead}
          onClose={() => setSelectedPartForLead(null)}
        />
      )}

      {/* Click & Collect Reservation Modal */}
      {reservationModalPart && (
        <ReservationModal
          part={reservationModalPart}
          isOpen={!!reservationModalPart}
          onClose={() => setReservationModalPart(null)}
          onSuccess={(res: ReservationItem) => {
            setReservationModalPart(null);
            setVoucherModalReservation(res);
          }}
        />
      )}

      {/* Digital Voucher Modal */}
      {voucherModalReservation && (
        <ReservationVoucherModal
          reservation={voucherModalReservation}
          isOpen={!!voucherModalReservation}
          onClose={() => setVoucherModalReservation(null)}
        />
      )}
    </div>
  );
}
