'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PartCard from '../../components/PartCard';
import VehicleCascadeSelector from '../../components/VehicleCascadeSelector';
import { fetchParts, fetchCategories, formatPriceCOP, calculateHaversineDistance } from '../../lib/api';
import { Part, PartCategory, PartCondition } from '../../lib/types';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Query parameters
  const queryParam = searchParams.get('q') || '';
  const makeParam = searchParams.get('make') || '';
  const modelParam = searchParams.get('model') || '';
  const yearParam = searchParams.get('year') ? Number(searchParams.get('year')) : undefined;
  const versionParam = searchParams.get('version') || '';
  const categoryParam = searchParams.get('category') || '';
  const conditionParam = (searchParams.get('condition') as PartCondition) || undefined;
  const minPriceParam = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPriceParam = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;

  // State
  const [searchInput, setSearchInput] = useState(queryParam);
  const [parts, setParts] = useState<Part[]>([]);
  const [categories, setCategories] = useState<PartCategory[]>([]);
  const [totalHits, setTotalHits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [vehicleDrawerOpen, setVehicleDrawerOpen] = useState(false);

  // Sprint 4: Geolocation & Distance Filtering
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [distanceFilter, setDistanceFilter] = useState<number | null>(null);
  const [gpsCityName, setGpsCityName] = useState<string | null>(null);

  const requestGps = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setUserCoords({ latitude: 4.7110, longitude: -74.0721 }); // Bogotá Centro
      setGpsCityName('Bogotá (Demo)');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setGpsCityName('Tu Ubicación');
        setGpsLoading(false);
      },
      err => {
        console.warn('Geolocation fallback:', err.message);
        setUserCoords({ latitude: 4.7110, longitude: -74.0721 });
        setGpsCityName('Bogotá Centro');
        setGpsLoading(false);
      },
      { timeout: 8000 }
    );
  };

  // Price range slider state
  const [priceRange, setPriceRange] = useState<number>(maxPriceParam || 800000);

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchParts({
      query: queryParam,
      make: makeParam,
      model: modelParam,
      year: yearParam,
      version: versionParam,
      category: categoryParam,
      condition: conditionParam,
      minPrice: minPriceParam,
      maxPrice: maxPriceParam,
      limit: 24,
    }).then(res => {
      setParts(res.data);
      setTotalHits(res.total || res.data.length);
      setLoading(false);
    });
  }, [
    queryParam,
    makeParam,
    modelParam,
    yearParam,
    versionParam,
    categoryParam,
    conditionParam,
    minPriceParam,
    maxPriceParam,
  ]);

  const updateFilters = (newParams: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    router.push(`/search?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: searchInput });
  };

  const clearFilter = (key: string) => {
    updateFilters({ [key]: undefined });
  };

  const clearAllFilters = () => {
    router.push('/search');
    setSearchInput('');
  };

  // Formatted active vehicle label
  const activeVehicleStr = [makeParam, modelParam, yearParam, versionParam].filter(Boolean).join(' ');

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col antialiased pt-[68px]">
      <div className="flex flex-1 max-w-container-max-width mx-auto w-full relative px-4 md:px-margin-desktop py-6">
        
        {/* Sidebar: Technical Filter (Precision Automotive Hub) */}
        <aside
          className={`w-72 flex-shrink-0 bg-[var(--surface-container-low)] border border-[var(--outline-variant)] rounded-2xl p-6 h-fit sticky top-24 hidden lg:flex flex-col gap-6 ${
            mobileFilterOpen ? '!flex fixed inset-y-0 left-0 z-50 w-80 bg-white overflow-y-auto rounded-none' : ''
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--outline-variant)] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded bg-[var(--primary-container)] text-[var(--on-primary-container)] flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">tune</span>
              </div>
              <div>
                <h2 className="font-heading text-sm font-bold text-[var(--primary)]">Filtro Técnico</h2>
                <p className="font-mono text-[10px] text-[var(--secondary)]">BÚSQUEDA PRECISA</p>
              </div>
            </div>
            {mobileFilterOpen && (
              <button onClick={() => setMobileFilterOpen(false)} className="lg:hidden text-gray-500">
                <span className="material-symbols-outlined">close</span>
              </button>
            )}
          </div>

          {/* Vehicle Cascade Quick Button */}
          <div className="bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] p-3.5 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] uppercase font-bold text-[var(--secondary)]">Vehículo Seleccionado</span>
              {activeVehicleStr && (
                <button
                  onClick={() => updateFilters({ make: '', model: '', year: '', version: '' })}
                  className="font-mono text-[10px] text-[var(--on-tertiary-container)] hover:underline"
                >
                  Quitar
                </button>
              )}
            </div>
            {activeVehicleStr ? (
              <div className="font-heading text-xs font-bold text-[var(--primary)] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#10b981]">check_circle</span>
                <span>{activeVehicleStr}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setVehicleDrawerOpen(!vehicleDrawerOpen)}
                className="w-full py-2 px-3 bg-[var(--primary)] text-white font-heading text-xs font-bold rounded-lg hover:bg-[var(--primary-container)] transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">directions_car</span>
                <span>Filtrar por Vehículo</span>
              </button>
            )}

            {/* Collapsible vehicle selector */}
            {vehicleDrawerOpen && (
              <div className="mt-3 pt-3 border-t border-[var(--outline-variant)]">
                <VehicleCascadeSelector
                  initialMake={makeParam}
                  initialModel={modelParam}
                  initialYear={yearParam}
                  initialVersion={versionParam}
                  compact={true}
                />
              </div>
            )}
          </div>

          {/* Sprint 4: GPS Proximity Filter */}
          <div className="bg-[var(--surface-container-low)]/50 border border-[var(--outline-variant)] rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-heading text-xs font-bold text-[var(--primary)] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-emerald-600">near_me</span>
                <span>Cercanía GPS</span>
              </h3>
              {userCoords && (
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  {gpsCityName || 'GPS Activo'}
                </span>
              )}
            </div>

            {!userCoords ? (
              <button
                type="button"
                onClick={requestGps}
                disabled={gpsLoading}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-gray-50 border border-[var(--outline-variant)] rounded-lg font-heading text-xs font-bold text-[var(--primary)] transition shadow-sm"
              >
                <span className={`material-symbols-outlined text-sm ${gpsLoading ? 'animate-spin' : 'text-emerald-600'}`}>
                  {gpsLoading ? 'sync' : 'my_location'}
                </span>
                <span>{gpsLoading ? 'Detectando GPS...' : 'Activar Cercanía GPS'}</span>
              </button>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Todos', value: null },
                    { label: '< 5 km', value: 5 },
                    { label: '< 15 km', value: 15 },
                    { label: '< 30 km', value: 30 },
                  ].map(dist => (
                    <button
                      key={dist.label}
                      type="button"
                      onClick={() => setDistanceFilter(dist.value)}
                      className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition ${
                        distanceFilter === dist.value
                          ? 'bg-[var(--primary)] text-white shadow-sm'
                          : 'bg-white border border-[var(--outline-variant)] text-[var(--on-surface-variant)] hover:bg-gray-100'
                      }`}
                    >
                      {dist.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUserCoords(null);
                    setDistanceFilter(null);
                  }}
                  className="text-[10px] text-[var(--secondary)] hover:text-red-600 underline block"
                >
                  Desactivar filtro de ubicación
                </button>
              </div>
            )}
          </div>

          {/* Categories Filter */}
          <div>
            <h3 className="font-heading text-xs font-bold text-[var(--primary)] uppercase tracking-wider mb-2.5">
              Categoría
            </h3>
            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
              <button
                onClick={() => updateFilters({ category: '' })}
                className={`text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors flex justify-between items-center ${
                  !categoryParam
                    ? 'bg-[var(--primary)] text-white font-bold'
                    : 'text-[var(--on-surface-variant)] hover:bg-[var(--surface-container)]'
                }`}
              >
                <span>Todas las categorías</span>
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => updateFilters({ category: cat.slug })}
                  className={`text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors flex justify-between items-center ${
                    categoryParam === cat.slug
                      ? 'bg-[var(--primary)] text-white font-bold'
                      : 'text-[var(--on-surface-variant)] hover:bg-[var(--surface-container)]'
                  }`}
                >
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Condition Filter */}
          <div className="bg-[var(--surface-container-lowest)] rounded-xl p-3 border border-[var(--outline-variant)]">
            <h3 className="font-heading text-xs font-bold text-[var(--primary)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[var(--on-tertiary-container)]">verified</span>
              Condición de la Pieza
            </h3>
            <div className="flex flex-col gap-2 font-sans text-xs">
              {[
                { value: '', label: 'Cualquier condición' },
                { value: 'NEW', label: 'Nuevo (OEM)' },
                { value: 'REFURBISHED', label: 'Remanufacturado' },
                { value: 'USED', label: 'Usado Certificado' },
              ].map(opt => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="condition"
                    checked={conditionParam === opt.value || (!conditionParam && opt.value === '')}
                    onChange={() => updateFilters({ condition: opt.value || undefined })}
                    className="accent-[var(--primary)] h-4 w-4"
                  />
                  <span className="group-hover:text-[var(--primary)] transition-colors">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-heading text-xs font-bold text-[var(--primary)] uppercase tracking-wider">
                Precio Máximo
              </h3>
              <span className="font-mono text-xs font-bold text-[var(--primary)]">
                {formatPriceCOP(priceRange)}
              </span>
            </div>
            <input
              type="range"
              min="20000"
              max="2000000"
              step="20000"
              value={priceRange}
              onChange={e => setPriceRange(Number(e.target.value))}
              onMouseUp={() => updateFilters({ maxPrice: priceRange })}
              onTouchEnd={() => updateFilters({ maxPrice: priceRange })}
              className="w-full accent-[var(--on-tertiary-container)] cursor-pointer"
            />
            <div className="flex justify-between font-mono text-[10px] text-[var(--secondary)] mt-1">
              <span>$20.000</span>
              <span>$2.000.000+</span>
            </div>
          </div>

          {/* Reset Filters */}
          <div className="mt-auto pt-4 border-t border-[var(--outline-variant)]">
            <button
              onClick={clearAllFilters}
              className="w-full py-2.5 border border-[var(--outline-variant)] font-heading text-xs font-bold text-[var(--primary)] rounded-lg hover:bg-[var(--surface-container-highest)] transition-colors"
            >
              Restablecer Filtros
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 w-full lg:pl-8 flex flex-col gap-6 overflow-x-hidden">
          
          {/* Search Bar Top */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--secondary)] text-xl">
                search
              </span>
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Buscar por nombre, código OEM, alternador, pastillas..."
                className="w-full pl-11 pr-24 py-3 bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] rounded-xl font-sans text-xs sm:text-sm text-[var(--on-surface)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none shadow-sm"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-[var(--primary)] text-white font-heading text-xs font-bold rounded-lg hover:bg-[var(--primary-container)] transition-colors"
              >
                Buscar
              </button>
            </form>

            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden w-full sm:w-auto px-4 py-3 border border-[var(--outline-variant)] rounded-xl bg-[var(--surface-container-lowest)] font-heading text-xs font-bold text-[var(--primary)] flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">tune</span>
              <span>Filtros</span>
            </button>
          </div>

          {/* Geo-Banner Header Widget (from mockup) */}
          <div className="w-full h-36 sm:h-44 bg-[var(--primary-container)] border border-[var(--outline-variant)] rounded-2xl overflow-hidden relative shadow-sm flex items-end p-4 sm:p-6 text-white">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDWYUWrZJd4R-L5LbsRfQn1SzosjvvLHfOeS_qXvVDZh8E6qtrtn0KMX9HeTH0zw8GHFOhdFaIYh733edMgY4JWVn9FpttXetmYYaFYvhw0lN5XCugBdIZCPDPd0vKTpHPNl_SnLX5UH9jChYs6B_yggmsAiIkpHN6TFwbAaWraEjof8cAEYukn97yia_9kfvX-79R6pl1KcnwZ4GVYapTBslbViCo_mifGDV9rMIaTQsEZAFwUPZpk"
              alt="Geolocalización de inventarios"
              className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-overlay"
            />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2">
              <div>
                <div className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full font-mono text-[10px] uppercase font-bold text-[var(--primary-fixed)] mb-1 border border-white/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                  RED CENTRALIZADA DE ALMACENES
                </div>
                <h1 className="font-heading text-lg sm:text-2xl font-bold tracking-tight">
                  {queryParam ? `Resultados para "${queryParam}"` : 'Catálogo de Repuestos y Autopartes'}
                </h1>
                <p className="font-sans text-xs text-gray-300 mt-0.5">
                  {loading ? 'Consultando almacenes...' : `${totalHits} repuestos disponibles con retiro presencial o despacho`}
                </p>
              </div>

              <div className="hidden sm:flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-lg text-xs font-mono">
                <span className="material-symbols-outlined text-sm text-[var(--on-tertiary-container)]">location_on</span>
                <span>Bogotá D.C. & Sede Medellín</span>
              </div>
            </div>
          </div>

          {/* Active Filters Row */}
          {(queryParam || makeParam || categoryParam || conditionParam) && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="font-mono text-xs text-[var(--secondary)] mr-1">Filtros activos:</span>
              {queryParam && (
                <span className="inline-flex items-center gap-1 bg-[var(--surface-container-high)] border border-[var(--outline-variant)] px-3 py-1 rounded-full font-mono text-xs text-[var(--on-surface)]">
                  Búsqueda: {queryParam}
                  <button onClick={() => clearFilter('q')} className="hover:text-red-500">
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </span>
              )}
              {makeParam && (
                <span className="inline-flex items-center gap-1 bg-[var(--surface-container-high)] border border-[var(--outline-variant)] px-3 py-1 rounded-full font-mono text-xs text-[var(--on-surface)]">
                  Vehículo: {activeVehicleStr}
                  <button onClick={() => updateFilters({ make: '', model: '', year: '', version: '' })} className="hover:text-red-500">
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </span>
              )}
              {categoryParam && (
                <span className="inline-flex items-center gap-1 bg-[var(--surface-container-high)] border border-[var(--outline-variant)] px-3 py-1 rounded-full font-mono text-xs text-[var(--on-surface)]">
                  Categoría: {categoryParam}
                  <button onClick={() => clearFilter('category')} className="hover:text-red-500">
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </span>
              )}
              {conditionParam && (
                <span className="inline-flex items-center gap-1 bg-[var(--surface-container-high)] border border-[var(--outline-variant)] px-3 py-1 rounded-full font-mono text-xs text-[var(--on-surface)]">
                  Condición: {conditionParam}
                  <button onClick={() => clearFilter('condition')} className="hover:text-red-500">
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </span>
              )}
              <button
                onClick={clearAllFilters}
                className="font-mono text-xs text-[var(--on-tertiary-container)] hover:underline ml-2"
              >
                Limpiar todo
              </button>
            </div>
          )}

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-80 bg-[var(--surface-container-low)] rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (() => {
            const displayedParts = parts.filter(part => {
              if (distanceFilter !== null && userCoords && part.inventory?.length) {
                const hasClose = part.inventory.some(inv => {
                  if (!inv.location?.latitude || !inv.location?.longitude) return false;
                  const d = calculateHaversineDistance(
                    userCoords.latitude,
                    userCoords.longitude,
                    inv.location.latitude,
                    inv.location.longitude,
                  );
                  return d <= distanceFilter;
                });
                if (!hasClose) return false;
              }
              return true;
            });

            return displayedParts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedParts.map(part => (
                  <PartCard
                    key={part.id}
                    part={part}
                    verifiedVehicle={activeVehicleStr}
                    userCoords={userCoords}
                  />
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] rounded-2xl flex flex-col items-center">
                <span className="material-symbols-outlined text-4xl text-[var(--secondary)] mb-3">
                  search_off
                </span>
                <h3 className="font-heading text-lg font-bold text-[var(--primary)] mb-1">
                  No encontramos piezas dentro del radio de distancia seleccionado
                </h3>
                <p className="font-sans text-xs text-[var(--secondary)] max-w-md mb-4">
                  Prueba ampliando el radio a 15 km o 30 km, o consulta todas las sedes disponibles a nivel nacional.
                </p>
                <button
                  type="button"
                  onClick={() => setDistanceFilter(null)}
                  className="px-4 py-2 bg-[var(--primary)] text-white rounded-xl font-heading text-xs font-bold"
                >
                  Ver todas las distancias
                </button>
              </div>
            );
          })()}

        </main>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center font-mono">Cargando catálogo técnico...</div>}>
      <SearchContent />
    </Suspense>
  );
}
