'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PartCard from '../../components/PartCard';
import VehicleCascadeSelector from '../../components/VehicleCascadeSelector';
import { fetchParts, fetchCategories, formatPriceCOP } from '../../lib/api';
import { Part, PartCategory, PartCondition } from '../../lib/types';
import {
  SearchIcon,
  FilterIcon,
  CloseIcon,
  CarIcon,
  TagIcon,
  ChevronDownIcon,
  SparklesIcon,
} from '../../components/Icons';

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
  const sortByParam = (searchParams.get('sortBy') as 'minPrice' | 'name') || 'minPrice';
  const sortOrderParam = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc';

  // State
  const [searchInput, setSearchInput] = useState(queryParam);
  const [parts, setParts] = useState<Part[]>([]);
  const [categories, setCategories] = useState<PartCategory[]>([]);
  const [totalHits, setTotalHits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [vehicleDrawerOpen, setVehicleDrawerOpen] = useState(false);

  // Price range slider state
  const [priceRange, setPriceRange] = useState<number>(maxPriceParam || 600000);

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
      sortBy: sortByParam,
      sortOrder: sortOrderParam,
    }).then(res => {
      setParts(res.data);
      setTotalHits(res.total);
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
    sortByParam,
    sortOrderParam,
  ]);

  const updateParam = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === undefined || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/search?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('q', searchInput.trim() || undefined);
  };

  const clearAllFilters = () => {
    setSearchInput('');
    router.push('/search');
  };

  const vehicleSummary = [makeParam, modelParam, yearParam, versionParam].filter(Boolean).join(' ');

  return (
    <div className="search-page-container container">
      {/* Search Header Bar */}
      <div className="search-header-box glass">
        <form onSubmit={handleSearchSubmit} className="search-bar-form">
          <div className="search-input-wrapper">
            <SearchIcon size={20} className="search-icon" />
            <input
              type="text"
              className="form-input search-header-input"
              placeholder="Buscar por repuesto, marca o código OEM..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button
                type="button"
                className="btn-clear-input"
                onClick={() => {
                  setSearchInput('');
                  updateParam('q', undefined);
                }}
              >
                <CloseIcon size={16} />
              </button>
            )}
          </div>
          <button type="submit" className="btn btn-primary">
            Buscar
          </button>
        </form>

        {/* Selected Vehicle Fitment Banner */}
        <div className="vehicle-filter-banner">
          <div className="vehicle-banner-left">
            <CarIcon size={18} className="car-icon" />
            {vehicleSummary ? (
              <div className="vehicle-text">
                <span className="vehicle-label">Filtrando por vehículo:</span>
                <span className="vehicle-name">{vehicleSummary}</span>
              </div>
            ) : (
              <div className="vehicle-text">
                <span className="vehicle-label">¿Buscas para un vehículo específico?</span>
                <span className="vehicle-prompt">Selecciona tu carro para garantizar compatibilidad</span>
              </div>
            )}
          </div>

          <div className="vehicle-banner-actions">
            {vehicleSummary && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  const p = new URLSearchParams(searchParams.toString());
                  p.delete('make');
                  p.delete('model');
                  p.delete('year');
                  p.delete('version');
                  router.push(`/search?${p.toString()}`);
                }}
              >
                Quitar auto
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setVehicleDrawerOpen(!vehicleDrawerOpen)}
            >
              <span>{vehicleSummary ? 'Cambiar Vehículo' : 'Seleccionar Vehículo'}</span>
              <ChevronDownIcon size={16} />
            </button>
          </div>
        </div>

        {/* Collapsible Vehicle Cascade Drawer */}
        {vehicleDrawerOpen && (
          <div className="vehicle-cascade-panel animate-slide-up">
            <VehicleCascadeSelector
              initialMake={makeParam}
              initialModel={modelParam}
              initialYear={yearParam}
              initialVersion={versionParam}
            />
          </div>
        )}
      </div>

      {/* Main Layout: Filters Sidebar + Results Grid */}
      <div className="search-layout">
        {/* Desktop Sidebar / Mobile Drawer */}
        <aside className={`filters-sidebar ${mobileFilterOpen ? 'mobile-open' : ''}`}>
          <div className="sidebar-header">
            <div className="sidebar-title-box">
              <FilterIcon size={18} />
              <h3>Filtros de Búsqueda</h3>
            </div>
            <button
              type="button"
              className="btn-close-filter-mobile"
              onClick={() => setMobileFilterOpen(false)}
            >
              <CloseIcon size={20} />
            </button>
          </div>

          {/* Categoría */}
          <div className="filter-group">
            <h4 className="filter-group-title">Categoría</h4>
            <div className="filter-options">
              <button
                type="button"
                className={`filter-chip-btn ${!categoryParam ? 'active' : ''}`}
                onClick={() => updateParam('category', undefined)}
              >
                Todas las categorías
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  className={`filter-chip-btn ${categoryParam === cat.slug ? 'active' : ''}`}
                  onClick={() => updateParam('category', cat.slug)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Condición */}
          <div className="filter-group">
            <h4 className="filter-group-title">Condición del Repuesto</h4>
            <div className="filter-options">
              <button
                type="button"
                className={`filter-chip-btn ${!conditionParam ? 'active' : ''}`}
                onClick={() => updateParam('condition', undefined)}
              >
                Cualquiera
              </button>
              <button
                type="button"
                className={`filter-chip-btn ${conditionParam === 'NEW' ? 'active' : ''}`}
                onClick={() => updateParam('condition', 'NEW')}
              >
                Nuevo (Original / Aftermarket)
              </button>
              <button
                type="button"
                className={`filter-chip-btn ${conditionParam === 'USED' ? 'active' : ''}`}
                onClick={() => updateParam('condition', 'USED')}
              >
                Usado Garantizado
              </button>
              <button
                type="button"
                className={`filter-chip-btn ${conditionParam === 'REFURBISHED' ? 'active' : ''}`}
                onClick={() => updateParam('condition', 'REFURBISHED')}
              >
                Remanufacturado
              </button>
            </div>
          </div>

          {/* Rango de Precio */}
          <div className="filter-group">
            <div className="price-header">
              <h4 className="filter-group-title">Precio Máximo</h4>
              <span className="price-val">{formatPriceCOP(priceRange)}</span>
            </div>
            <input
              type="range"
              min={10000}
              max={600000}
              step={10000}
              value={priceRange}
              onChange={e => setPriceRange(Number(e.target.value))}
              onMouseUp={() => updateParam('maxPrice', String(priceRange))}
              onTouchEnd={() => updateParam('maxPrice', String(priceRange))}
              className="price-slider"
            />
            <div className="price-slider-labels">
              <span>$10.000</span>
              <span>$600.000+</span>
            </div>
          </div>

          <button type="button" className="btn btn-ghost btn-full btn-reset-all" onClick={clearAllFilters}>
            Limpiar todos los filtros
          </button>
        </aside>

        {/* Results Area */}
        <div className="results-area">
          {/* Active Filter Chips & Sorting Bar */}
          <div className="results-top-bar">
            <div className="results-count-box">
              <span className="results-count">
                <strong>{totalHits}</strong> {totalHits === 1 ? 'repuesto encontrado' : 'repuestos encontrados'}
              </span>
              {vehicleSummary && (
                <span className="active-tag">
                  Auto: {vehicleSummary}
                  <button onClick={() => updateParam('make', undefined)}>×</button>
                </span>
              )}
              {categoryParam && (
                <span className="active-tag">
                  Cat: {categoryParam}
                  <button onClick={() => updateParam('category', undefined)}>×</button>
                </span>
              )}
              {conditionParam && (
                <span className="active-tag">
                  Condición: {conditionParam}
                  <button onClick={() => updateParam('condition', undefined)}>×</button>
                </span>
              )}
            </div>

            <div className="sort-controls">
              <button
                type="button"
                className="btn btn-secondary btn-sm mobile-filter-trigger"
                onClick={() => setMobileFilterOpen(true)}
              >
                <FilterIcon size={16} />
                <span>Filtros</span>
              </button>

              <div className="sort-select-box">
                <label className="sort-label">Ordenar:</label>
                <select
                  className="form-select sort-select"
                  value={`${sortByParam}-${sortOrderParam}`}
                  onChange={e => {
                    const [field, order] = e.target.value.split('-');
                    const p = new URLSearchParams(searchParams.toString());
                    p.set('sortBy', field);
                    p.set('sortOrder', order);
                    router.push(`/search?${p.toString()}`);
                  }}
                >
                  <option value="minPrice-asc">Menor precio primero</option>
                  <option value="minPrice-desc">Mayor precio primero</option>
                  <option value="name-asc">Nombre (A - Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Parts Grid */}
          {loading ? (
            <div className="parts-results-grid">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="skeleton" style={{ height: 360 }} />
              ))}
            </div>
          ) : parts.length > 0 ? (
            <div className="parts-results-grid">
              {parts.map(part => (
                <PartCard
                  key={part.id}
                  part={part}
                  verifiedVehicle={vehicleSummary || undefined}
                />
              ))}
            </div>
          ) : (
            <div className="empty-results card glass text-center">
              <TagIcon size={48} className="empty-icon" />
              <h3>No encontramos repuestos con estos filtros</h3>
              <p>
                Prueba buscando con términos más generales, retirando el filtro de vehículo o ampliando el rango de precio.
              </p>
              <button type="button" className="btn btn-primary" onClick={clearAllFilters}>
                Restablecer Búsqueda
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .search-page-container {
          padding-top: 2rem;
          padding-bottom: 4rem;
        }
        .search-header-box {
          padding: 1.5rem;
          border-radius: var(--radius-xl);
          margin-bottom: 2rem;
          border: 1px solid var(--border-color);
        }
        .search-bar-form {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1.25rem;
        }
        .search-input-wrapper {
          position: relative;
          flex: 1;
          display: flex;
          align-items: center;
        }
        .search-icon {
          position: absolute;
          left: 1rem;
          color: var(--text-muted);
        }
        .search-header-input {
          padding-left: 2.75rem;
          padding-right: 2.5rem;
          font-size: 1rem;
        }
        .btn-clear-input {
          position: absolute;
          right: 0.75rem;
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
        }
        .vehicle-filter-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 0.85rem 1.25rem;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .vehicle-banner-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .car-icon {
          color: var(--accent-secondary);
        }
        .vehicle-text {
          display: flex;
          flex-direction: column;
        }
        .vehicle-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .vehicle-name {
          font-weight: 700;
          color: var(--text-primary);
          font-size: 0.95rem;
        }
        .vehicle-prompt {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
        .vehicle-banner-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .vehicle-cascade-panel {
          margin-top: 1.25rem;
          padding-top: 1.25rem;
          border-top: 1px solid var(--border-color);
        }
        .search-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }
        @media (min-width: 960px) {
          .search-layout {
            grid-template-columns: 280px 1fr;
          }
        }
        .filters-sidebar {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          height: fit-content;
        }
        @media (max-width: 959px) {
          .filters-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            width: 85%;
            max-width: 320px;
            height: 100vh;
            z-index: 9999;
            overflow-y: auto;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            box-shadow: 10px 0 30px rgba(0, 0, 0, 0.8);
          }
          .filters-sidebar.mobile-open {
            transform: translateX(0);
          }
        }
        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--border-color);
        }
        .sidebar-title-box {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--accent-primary-light);
        }
        .sidebar-title-box h3 {
          font-size: 1.05rem;
          color: var(--text-primary);
        }
        .btn-close-filter-mobile {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
        }
        @media (min-width: 960px) {
          .btn-close-filter-mobile {
            display: none;
          }
        }
        .filter-group {
          margin-bottom: 1.75rem;
        }
        .filter-group-title {
          font-size: 0.85rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.75rem;
        }
        .filter-options {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .filter-chip-btn {
          text-align: left;
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-secondary);
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.15s;
        }
        .filter-chip-btn:hover {
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-primary);
        }
        .filter-chip-btn.active {
          background: rgba(99, 102, 241, 0.15);
          color: var(--accent-primary-light);
          border-color: var(--accent-primary);
          font-weight: 600;
        }
        .price-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .price-val {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--accent-secondary);
        }
        .price-slider {
          width: 100%;
          accent-color: var(--accent-primary);
          margin-bottom: 0.35rem;
        }
        .price-slider-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.7rem;
          color: var(--text-muted);
        }
        .btn-reset-all {
          margin-top: 1rem;
          border: 1px dashed var(--border-color);
        }
        .results-area {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .results-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .results-count-box {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .results-count {
          font-size: 0.95rem;
          color: var(--text-secondary);
        }
        .active-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: rgba(99, 102, 241, 0.15);
          color: var(--accent-primary-light);
          padding: 0.2rem 0.5rem;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
        }
        .active-tag button {
          background: transparent;
          border: none;
          color: inherit;
          cursor: pointer;
          font-weight: 700;
        }
        .sort-controls {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .mobile-filter-trigger {
          display: inline-flex;
        }
        @media (min-width: 960px) {
          .mobile-filter-trigger {
            display: none;
          }
        }
        .sort-select-box {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .sort-label {
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .sort-select {
          padding: 0.4rem 2rem 0.4rem 0.75rem;
          font-size: 0.85rem;
          width: auto;
        }
        .parts-results-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
        }
        @media (min-width: 640px) {
          .parts-results-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1200px) {
          .parts-results-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        .empty-results {
          padding: 3.5rem 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        .empty-icon {
          color: var(--text-muted);
        }
        .empty-results h3 {
          font-size: 1.35rem;
        }
        .empty-results p {
          max-width: 480px;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '4rem 1rem' }}><div className="skeleton" style={{ height: 200 }} /></div>}>
      <SearchContent />
    </Suspense>
  );
}
