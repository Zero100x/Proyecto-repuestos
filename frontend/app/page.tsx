'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import VehicleCascadeSelector from '../components/VehicleCascadeSelector';
import PartCard from '../components/PartCard';
import { fetchParts, fetchCategories } from '../lib/api';
import { Part, PartCategory } from '../lib/types';
import {
  SearchIcon,
  CarIcon,
  TagIcon,
  ShieldCheckIcon,
  WhatsAppIcon,
  BuildingIcon,
  MapPinIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  SparklesIcon,
} from '../components/Icons';

export default function HomePage() {
  const router = useRouter();
  const [searchTab, setSearchTab] = useState<'vehicle' | 'text'>('vehicle');
  const [textQuery, setTextQuery] = useState('');
  const [featuredParts, setFeaturedParts] = useState<Part[]>([]);
  const [categories, setCategories] = useState<PartCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchParts({ limit: 6 }),
      fetchCategories(),
    ]).then(([partsRes, catsRes]) => {
      setFeaturedParts(partsRes.data);
      setCategories(catsRes);
      setLoading(false);
    });
  }, []);

  const handleTextSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textQuery.trim()) return;
    router.push(`/search?q=${encodeURIComponent(textQuery.trim())}`);
  };

  const popularMakes = [
    { name: 'Toyota', models: 'Corolla, Hilux, RAV4, Prado' },
    { name: 'Chevrolet', models: 'Onix, Spark GT, Tracker, D-Max' },
    { name: 'Renault', models: 'Duster, Sandero, Logan, Kwid' },
    { name: 'Mazda', models: 'Mazda 2, Mazda 3, CX-30, CX-5' },
    { name: 'Nissan', models: 'Versa, Frontier, Qashqai, Kicks' },
    { name: 'Kia', models: 'Picanto, Rio, Sportage, Cerato' },
  ];

  return (
    <div className="home-container">
      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="container hero-content">
          <div className="hero-badge animate-fade-in">
            <SparklesIcon size={16} />
            <span>Plataforma Centralizada de Inventario Automotriz en Colombia</span>
          </div>

          <h1 className="hero-title animate-fade-in">
            Encuentra el <span className="gradient-text">repuesto exacto</span> para tu vehículo
          </h1>
          <p className="hero-subtitle">
            Compara precios, disponibilidad y stock en tiempo real entre almacenes y bodegas aliadas.
            Contacta directo por WhatsApp sin pagos intermediarios ni comisiones.
          </p>

          {/* DUAL SEARCH BOX */}
          <div className="search-card glass animate-slide-up">
            <div className="search-tabs">
              <button
                type="button"
                className={`tab-btn ${searchTab === 'vehicle' ? 'active' : ''}`}
                onClick={() => setSearchTab('vehicle')}
              >
                <CarIcon size={18} />
                <span>Búsqueda por Vehículo</span>
              </button>
              <button
                type="button"
                className={`tab-btn ${searchTab === 'text' ? 'active' : ''}`}
                onClick={() => setSearchTab('text')}
              >
                <TagIcon size={18} />
                <span>Búsqueda por Código OEM o Nombre</span>
              </button>
            </div>

            <div className="tab-body">
              {searchTab === 'vehicle' ? (
                <div>
                  <p className="tab-hint">
                    Selecciona tu auto en 4 sencillos pasos para asegurar compatibilidad 100% garantizada:
                  </p>
                  <VehicleCascadeSelector />
                </div>
              ) : (
                <form onSubmit={handleTextSearch} className="text-search-form">
                  <div className="search-input-group">
                    <SearchIcon size={22} className="input-search-icon" />
                    <input
                      type="text"
                      className="form-input text-search-input"
                      placeholder="Escribe el nombre del repuesto o código OEM (ej. pastillas de freno, 04465-02220, amortiguador...)"
                      value={textQuery}
                      onChange={e => setTextQuery(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary btn-search-submit">
                      <span>Buscar Ahora</span>
                      <ArrowRightIcon size={18} />
                    </button>
                  </div>
                  <div className="quick-tags">
                    <span className="tags-label">Sugerencias rápidas:</span>
                    <button type="button" onClick={() => setTextQuery('pastillas de freno')} className="tag-btn">
                      Pastillas de freno
                    </button>
                    <button type="button" onClick={() => setTextQuery('filtro de aire')} className="tag-btn">
                      Filtro de aire
                    </button>
                    <button type="button" onClick={() => setTextQuery('bujias')} className="tag-btn">
                      Bujías Iridio
                    </button>
                    <button type="button" onClick={() => setTextQuery('embrague')} className="tag-btn">
                      Kit embrague
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* TRUST STATS */}
          <div className="trust-stats">
            <div className="stat-item">
              <ShieldCheckIcon size={20} className="stat-icon" />
              <div>
                <span className="stat-number">+15.000</span>
                <span className="stat-label">Repuestos Catalogados</span>
              </div>
            </div>
            <div className="stat-item">
              <BuildingIcon size={20} className="stat-icon" />
              <div>
                <span className="stat-number">Almacenes Físicos</span>
                <span className="stat-label">Bogotá y Medellín</span>
              </div>
            </div>
            <div className="stat-item">
              <WhatsAppIcon size={20} className="stat-icon text-wa" />
              <div>
                <span className="stat-number">WhatsApp Directo</span>
                <span className="stat-label">Sin comisiones ocultas</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES SECTION */}
      <section className="section-padding">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="section-eyebrow">Catálogo Maestro</span>
              <h2 className="section-title">Explora por Categoría</h2>
            </div>
            <Link href="/search" className="btn btn-ghost btn-sm link-all">
              <span>Ver todas</span>
              <ArrowRightIcon size={16} />
            </Link>
          </div>

          <div className="categories-grid">
            {categories.map(cat => (
              <Link
                key={cat.id}
                href={`/search?category=${cat.slug}`}
                className="category-card card"
              >
                <div className="cat-icon-box">
                  <TagIcon size={26} />
                </div>
                <h3 className="cat-title">{cat.name}</h3>
                <p className="cat-desc">{cat.description}</p>
                <span className="cat-action">
                  <span>Ver piezas</span>
                  <ArrowRightIcon size={14} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PARTS GRID */}
      <section className="section-padding section-featured">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="section-eyebrow">Inventario Verificado</span>
              <h2 className="section-title">Repuestos Más Cotizados</h2>
              <p className="section-subtitle">
                Piezas originales y aftermarket de alta rotación con stock listo para entrega inmediata.
              </p>
            </div>
            <Link href="/search" className="btn btn-primary btn-sm">
              <span>Explorar todo el catálogo</span>
              <ArrowRightIcon size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="loading-grid">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="skeleton" style={{ height: 320 }} />
              ))}
            </div>
          ) : (
            <div className="parts-grid">
              {featuredParts.map(part => (
                <PartCard key={part.id} part={part} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* POPULAR VEHICLE MAKES */}
      <section className="section-padding">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="section-eyebrow">Marcas Populares</span>
              <h2 className="section-title">Busca por la Marca de tu Carro</h2>
            </div>
          </div>

          <div className="makes-grid">
            {popularMakes.map(make => (
              <Link
                key={make.name}
                href={`/search?make=${make.name}`}
                className="make-card card"
              >
                <div className="make-icon-circle">
                  <CarIcon size={22} />
                </div>
                <div className="make-content">
                  <h3 className="make-name">{make.name}</h3>
                  <span className="make-models">{make.models}</span>
                </div>
                <ArrowRightIcon size={18} className="make-arrow" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section-padding section-how-it-works">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-eyebrow">Proceso Transparente</span>
            <h2 className="section-title">¿Cómo Funciona RepuestosYA?</h2>
            <p className="section-subtitle centered">
              Un modelo de lead generation pensado para que ahorres tiempo y dinero encontrando la pieza correcta.
            </p>
          </div>

          <div className="steps-grid">
            <div className="step-card card">
              <div className="step-num-badge">1</div>
              <h3 className="step-title">Consulta Centralizada</h3>
              <p className="step-desc">
                Ingresa los datos de tu carro o el código OEM. Nuestro motor Meilisearch filtra en milisegundos las piezas 100% compatibles.
              </p>
            </div>

            <div className="step-card card">
              <div className="step-num-badge">2</div>
              <h3 className="step-title">Compara Precios y Sedes</h3>
              <p className="step-desc">
                Revisa qué almacenes tienen la pieza en stock, compara los precios de cada sede y evalúa opciones Nuevas o Usadas.
              </p>
            </div>

            <div className="step-card card">
              <div className="step-num-badge">3</div>
              <h3 className="step-title">Contacto Directo por WhatsApp</h3>
              <p className="step-desc">
                Toca el botón WhatsApp para chatear con el almacén con el mensaje pre-armado. Acuerdas la entrega o pasas a recoger sin pagar de más.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* STORES CTA */}
      <section className="container section-padding">
        <div className="partner-banner glass">
          <div className="partner-banner-content">
            <span className="badge badge-primary">Para Almacenes y Distribuidores</span>
            <h2 className="partner-title">¿Vendes repuestos automotrices?</h2>
            <p className="partner-text">
              Publica tu catálogo maestro y stock multisede. Recibe clientes compradores calificados directo a tu línea de WhatsApp sin pagar comisiones por venta.
            </p>
            <div className="partner-actions">
              <Link href="/login" className="btn btn-primary btn-lg">
                <span>Registrar Mi Almacén</span>
                <ArrowRightIcon size={18} />
              </Link>
              <Link href="/stores" className="btn btn-secondary btn-lg">
                Conoce las sedes aliadas
              </Link>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .home-container {
          min-height: 100vh;
        }
        .hero-section {
          padding: 3.5rem 0 3rem;
          background: radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.15), transparent 70%);
          position: relative;
        }
        .hero-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(99, 102, 241, 0.12);
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: var(--radius-full);
          padding: 0.4rem 1rem;
          color: var(--accent-primary-light);
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
        }
        .hero-title {
          font-size: 2.5rem;
          font-weight: 900;
          line-height: 1.15;
          max-width: 820px;
          margin-bottom: 1.25rem;
          letter-spacing: -0.03em;
        }
        @media (min-width: 768px) {
          .hero-title {
            font-size: 3.5rem;
          }
        }
        .gradient-text {
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero-subtitle {
          font-size: 1.1rem;
          color: var(--text-secondary);
          max-width: 680px;
          line-height: 1.6;
          margin-bottom: 2.5rem;
        }
        .search-card {
          width: 100%;
          max-width: 960px;
          border-radius: var(--radius-xl);
          border: 1px solid var(--border-color-hover);
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(99, 102, 241, 0.15);
          text-align: left;
        }
        .search-tabs {
          display: flex;
          background: rgba(15, 21, 38, 0.9);
          border-bottom: 1px solid var(--border-color);
        }
        .tab-btn {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.65rem;
          padding: 1.1rem 1rem;
          font-family: inherit;
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-muted);
          background: transparent;
          border: none;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
        }
        .tab-btn:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.02);
        }
        .tab-btn.active {
          color: white;
          background: rgba(99, 102, 241, 0.1);
          border-bottom-color: var(--accent-primary);
        }
        .tab-body {
          padding: 1.75rem;
          background: #11172a;
        }
        .tab-hint {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-bottom: 1.25rem;
        }
        .text-search-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .search-input-group {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .input-search-icon {
          position: absolute;
          left: 1rem;
          color: var(--text-muted);
          pointer-events: none;
        }
        .text-search-input {
          flex: 1;
          min-width: 260px;
          padding: 1rem 1rem 1rem 3rem;
          font-size: 1.05rem;
          border-radius: var(--radius-md);
        }
        .btn-search-submit {
          padding: 1rem 1.75rem;
          font-size: 1rem;
        }
        .quick-tags {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .tags-label {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .tag-btn {
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          padding: 0.25rem 0.6rem;
          font-size: 0.8rem;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }
        .tag-btn:hover {
          background: rgba(99, 102, 241, 0.25);
          color: white;
        }
        .trust-stats {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2.5rem;
          margin-top: 3rem;
          flex-wrap: wrap;
        }
        .stat-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-align: left;
        }
        .stat-icon {
          color: var(--accent-secondary);
        }
        .text-wa {
          color: #25d366 !important;
        }
        .stat-number {
          display: block;
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--text-primary);
        }
        .stat-label {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .section-padding {
          padding: 4.5rem 0;
        }
        .section-featured {
          background: rgba(17, 24, 39, 0.4);
        }
        .section-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 2.5rem;
          gap: 1.5rem;
          flex-wrap: wrap;
        }
        .section-header.text-center {
          text-align: center;
          flex-direction: column;
          align-items: center;
        }
        .section-eyebrow {
          display: block;
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--accent-secondary);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 0.35rem;
        }
        .section-title {
          font-size: 2rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .section-subtitle {
          font-size: 0.95rem;
          color: var(--text-secondary);
          max-width: 580px;
          margin-top: 0.35rem;
        }
        .section-subtitle.centered {
          margin: 0.5rem auto 0;
        }
        .categories-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
        }
        @media (min-width: 640px) {
          .categories-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .categories-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        .category-card {
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          text-decoration: none;
        }
        .cat-icon-box {
          width: 50px;
          height: 50px;
          border-radius: var(--radius-md);
          background: rgba(99, 102, 241, 0.12);
          border: 1px solid rgba(99, 102, 241, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-primary-light);
          margin-bottom: 1.25rem;
        }
        .category-card:hover .cat-icon-box {
          background: var(--gradient-primary);
          color: white;
        }
        .cat-title {
          font-size: 1.25rem;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }
        .cat-desc {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.5;
          margin-bottom: 1.25rem;
          flex: 1;
        }
        .cat-action {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--accent-secondary);
        }
        .parts-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }
        @media (min-width: 640px) {
          .parts-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .parts-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        .loading-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }
        .makes-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        @media (min-width: 640px) {
          .makes-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .makes-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        .make-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem;
          text-decoration: none;
        }
        .make-icon-circle {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-primary-light);
        }
        .make-content {
          flex: 1;
        }
        .make-name {
          font-size: 1.1rem;
          color: var(--text-primary);
          margin-bottom: 0.2rem;
        }
        .make-models {
          font-size: 0.775rem;
          color: var(--text-muted);
          display: block;
        }
        .make-arrow {
          color: var(--text-muted);
          transition: transform 0.2s;
        }
        .make-card:hover .make-arrow {
          transform: translateX(4px);
          color: var(--accent-secondary);
        }
        .section-how-it-works {
          background: rgba(10, 14, 26, 0.6);
        }
        .steps-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
          margin-top: 3rem;
        }
        @media (min-width: 768px) {
          .steps-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        .step-card {
          padding: 2rem;
          position: relative;
        }
        .step-num-badge {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          background: var(--gradient-primary);
          color: white;
          font-size: 1.25rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
        }
        .step-title {
          font-size: 1.25rem;
          color: var(--text-primary);
          margin-bottom: 0.75rem;
        }
        .step-desc {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }
        .partner-banner {
          border-radius: var(--radius-xl);
          padding: 3.5rem 2rem;
          text-align: center;
          border: 1px solid var(--accent-primary);
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(6, 182, 212, 0.08));
        }
        .partner-banner-content {
          max-width: 680px;
          margin: 0 auto;
        }
        .partner-title {
          font-size: 2.25rem;
          margin: 1rem 0;
          color: var(--text-primary);
        }
        .partner-text {
          font-size: 1.05rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 2rem;
        }
        .partner-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }
      `}</style>
    </div>
  );
}
