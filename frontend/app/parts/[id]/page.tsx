'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { fetchPartById, fetchParts, formatPriceCOP } from '../../../lib/api';
import { Part, InventoryItem } from '../../../lib/types';
import { useCompare } from '../../../lib/compareContext';
import WhatsAppLeadModal from '../../../components/WhatsAppLeadModal';
import {
  CarIcon,
  ShieldCheckIcon,
  WhatsAppIcon,
  PhoneIcon,
  MapPinIcon,
  CompareIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  TagIcon,
  BuildingIcon,
  SparklesIcon,
} from '../../../components/Icons';

function PartDetailContent() {
  const params = useParams();
  const partId = params?.id as string;

  const [part, setPart] = useState<Part | null>(null);
  const [relatedParts, setRelatedParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedInvForModal, setSelectedInvForModal] = useState<InventoryItem | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);

  const { addToCompare, removeFromCompare, isCompared } = useCompare();

  useEffect(() => {
    if (!partId) return;
    setLoading(true);
    fetchPartById(partId).then(data => {
      setPart(data);
      setLoading(false);
      if (data?.category?.slug) {
        fetchParts({ category: data.category.slug, limit: 3 }).then(res => {
          setRelatedParts(res.data.filter(p => p.id !== data.id));
        });
      }
    });
  }, [partId]);

  if (loading) {
    return (
      <div className="container detail-container">
        <div className="skeleton" style={{ height: 40, width: 250, marginBottom: '2rem' }} />
        <div className="detail-grid">
          <div className="skeleton" style={{ height: 450 }} />
          <div className="skeleton" style={{ height: 450 }} />
        </div>
      </div>
    );
  }

  if (!part) {
    return (
      <div className="container detail-container text-center">
        <h2>Repuesto no encontrado</h2>
        <Link href="/search" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
          Volver al Catálogo
        </Link>
      </div>
    );
  }

  const compared = isCompared(part.id);
  const inventoryList = part.inventory || [];
  const minPrice = part.minPrice || (inventoryList.length ? Math.min(...inventoryList.map(i => i.price)) : 0);

  const openWhatsAppModal = (inv?: InventoryItem) => {
    setSelectedInvForModal(inv || inventoryList[0]);
    setModalOpen(true);
  };

  return (
    <div className="detail-container container">
      {/* Breadcrumb */}
      <nav className="breadcrumb-nav">
        <Link href="/" className="crumb-link">Inicio</Link>
        <span className="crumb-sep">/</span>
        <Link href="/search" className="crumb-link">Catálogo</Link>
        {part.category && (
          <>
            <span className="crumb-sep">/</span>
            <Link href={`/search?category=${part.category.slug}`} className="crumb-link">
              {part.category.name}
            </Link>
          </>
        )}
        <span className="crumb-sep">/</span>
        <span className="crumb-current">{part.name}</span>
      </nav>

      {/* Main Product Hero */}
      <div className="detail-grid">
        {/* Left: Gallery & Visuals */}
        <div className="gallery-card card">
          <div className="main-image-box">
            {part.imageUrl ? (
              <img src={part.imageUrl} alt={part.name} className="product-img" />
            ) : (
              <div className="img-fallback">
                <TagIcon size={64} />
              </div>
            )}
            <div className="image-badges">
              <span className="badge badge-success">Garantía Asegurada</span>
              <span className="badge badge-primary">Pieza Verificada</span>
            </div>
          </div>

          {/* Quick Specifications */}
          <div className="specs-list">
            <div className="spec-row">
              <span className="spec-label">Marca de la Pieza:</span>
              <span className="spec-value">{part.brand || 'Original OEM'}</span>
            </div>
            {part.category && (
              <div className="spec-row">
                <span className="spec-label">Categoría:</span>
                <span className="spec-value">{part.category.name}</span>
              </div>
            )}
            {part.weight && (
              <div className="spec-row">
                <span className="spec-label">Peso estimado:</span>
                <span className="spec-value">{part.weight} kg</span>
              </div>
            )}
            <div className="spec-row">
              <span className="spec-label">Modelo de consulta:</span>
              <span className="spec-value text-accent">Lead Directo WhatsApp</span>
            </div>
          </div>
        </div>

        {/* Right: Info & Pricing Summary */}
        <div className="info-card card glass">
          <div className="meta-top">
            <span className="badge badge-info">{part.category?.name || 'Repuesto'}</span>
            <span className="brand-chip">{part.brand}</span>
          </div>

          <h1 className="detail-title">{part.name}</h1>

          {/* OEM numbers list */}
          {part.partNumbers && part.partNumbers.length > 0 && (
            <div className="oem-section">
              <span className="oem-title">Números de Referencia / Códigos de Parte:</span>
              <div className="oem-tags">
                {part.partNumbers.map(pn => (
                  <span key={pn.id || pn.number} className="oem-tag">
                    <strong>{pn.type}:</strong> {pn.number}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Price Box */}
          <div className="price-overview-box">
            <div className="price-text-group">
              <span className="price-lead-label">Mejor precio disponible en almacén:</span>
              <span className="price-main">{formatPriceCOP(minPrice)}</span>
              <span className="tax-note">Precios cotizados en pesos colombianos (COP)</span>
            </div>

            <div className="hero-cta-buttons">
              <button
                type="button"
                className="btn btn-wa-large"
                onClick={() => openWhatsAppModal()}
              >
                <WhatsAppIcon size={22} />
                <span>Cotizar por WhatsApp</span>
              </button>

              <button
                type="button"
                className={`btn btn-secondary ${compared ? 'active-compared' : ''}`}
                onClick={() => (compared ? removeFromCompare(part.id) : addToCompare(part))}
              >
                <CompareIcon size={18} />
                <span>{compared ? 'En Comparativa' : 'Agregar a Comparador'}</span>
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="desc-box">
            <h3 className="desc-heading">Descripción del Repuesto</h3>
            <p className="desc-text">{part.description || 'Repuesto garantizado para ensamble automotriz de alta exigencia.'}</p>
          </div>
        </div>
      </div>

      {/* SPRINT 1-2 CORE: MÓDULO DE SEDES, STOCK Y DISPONIBILIDAD */}
      <section className="section-locations-module">
        <div className="module-header">
          <div>
            <span className="module-eyebrow">Disponibilidad en Tiempo Real</span>
            <h2 className="module-title">Sedes y Almacenes con Stock Disponible</h2>
            <p className="module-subtitle">
              Compara precios entre diferentes sedes y contacta directamente al almacén de tu conveniencia.
            </p>
          </div>
        </div>

        {inventoryList.length > 0 ? (
          <div className="locations-grid">
            {inventoryList.map(inv => {
              const loc = inv.location;
              const store = loc?.store;
              return (
                <div key={inv.id} className="location-item-card card">
                  <div className="loc-card-header">
                    <div className="loc-store-info">
                      <span className="loc-store-name">{store?.name || 'Almacén Aliado'}</span>
                      <h4 className="loc-name">{loc?.name}</h4>
                    </div>
                    <span className="badge badge-success">
                      {inv.condition === 'NEW' ? 'Nuevo' : inv.condition === 'USED' ? 'Usado' : 'Remanufacturado'}
                    </span>
                  </div>

                  <div className="loc-card-details">
                    <div className="detail-line">
                      <MapPinIcon size={16} className="loc-icon" />
                      <span>{loc?.address}, {loc?.city}</span>
                    </div>
                    <div className="detail-line">
                      <BuildingIcon size={16} className="loc-icon" />
                      <span>Stock disponible: <strong>{inv.stock} unidades</strong></span>
                    </div>
                    {loc?.phone && (
                      <div className="detail-line">
                        <PhoneIcon size={16} className="loc-icon" />
                        <span>Teléfono: {loc.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="loc-card-pricing">
                    <div className="loc-price-box">
                      <span className="loc-price-lbl">Precio en esta sede:</span>
                      <span className="loc-price-val">{formatPriceCOP(inv.price)}</span>
                    </div>

                    <div className="loc-action-buttons">
                      <button
                        type="button"
                        className="btn btn-wa-quick"
                        onClick={() => openWhatsAppModal(inv)}
                      >
                        <WhatsAppIcon size={18} />
                        <span>WhatsApp Sede</span>
                      </button>

                      {loc?.phone && (
                        <a
                          href={`tel:${loc.phone.replace(/[^0-9+]/g, '')}`}
                          className="btn btn-secondary btn-sm"
                          title="Llamar directamente"
                        >
                          <PhoneIcon size={16} />
                        </a>
                      )}

                      {loc?.address && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            `${loc.address}, ${loc.city}, Colombia`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                          title="Cómo llegar en Google Maps"
                        >
                          <MapPinIcon size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card glass text-center" style={{ padding: '2.5rem' }}>
            <p>Stock disponible bajo pedido en almacén central.</p>
            <button
              type="button"
              className="btn btn-wa-large"
              style={{ marginTop: '1rem' }}
              onClick={() => openWhatsAppModal()}
            >
              <WhatsAppIcon size={18} />
              <span>Consultar Disponibilidad por WhatsApp</span>
            </button>
          </div>
        )}
      </section>

      {/* COMPATIBILITY ACCORDION / VEHICLES */}
      <section className="compatibility-section card">
        <h3 className="compat-heading">
          <CarIcon size={22} className="compat-icon" />
          <span>Vehículos Compatibles (Modelo ACES/PIES)</span>
        </h3>
        <p className="compat-desc">
          Esta pieza ha sido verificada para los siguientes modelos y especificaciones de motor:
        </p>

        <div className="makes-list-box">
          {part.makes && part.makes.length > 0 ? (
            <div className="compat-chips">
              {part.makes.map((make, idx) => (
                <div key={make} className="compat-chip-block">
                  <span className="compat-make-title">{make}</span>
                  <span className="compat-models-sub">
                    {part.models?.[idx] || 'Modelos compatibles'} ({part.years?.join(', ') || 'Varios años'})
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="compat-universal-note">
              <CheckCircleIcon size={18} />
              <span>Compatible con los modelos más comunes. Verifica con tu número de chasis (VIN) por WhatsApp.</span>
            </div>
          )}
        </div>
      </section>

      {/* RELATED PARTS */}
      {relatedParts.length > 0 && (
        <section className="related-section">
          <h3 className="section-title" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>
            Repuestos Complementarios Recomendados
          </h3>
          <div className="related-grid">
            {relatedParts.map(p => (
              <div key={p.id} className="related-card-wrapper">
                <Link href={`/parts/${p.id}`} className="related-link card">
                  {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="rel-thumb" />}
                  <div className="rel-info">
                    <h4>{p.name}</h4>
                    <span className="rel-price">{formatPriceCOP(p.minPrice || 0)}</span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* WhatsApp Modal */}
      {modalOpen && (
        <WhatsAppLeadModal
          part={part}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          selectedInventory={selectedInvForModal}
        />
      )}

      <style jsx>{`
        .detail-container {
          padding-top: 2rem;
          padding-bottom: 5rem;
        }
        .breadcrumb-nav {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-bottom: 1.75rem;
          flex-wrap: wrap;
        }
        .crumb-link {
          color: var(--text-secondary);
        }
        .crumb-link:hover {
          color: var(--accent-secondary);
        }
        .crumb-sep {
          color: var(--border-color);
        }
        .crumb-current {
          color: var(--text-primary);
          font-weight: 600;
        }
        .detail-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
          margin-bottom: 3.5rem;
        }
        @media (min-width: 960px) {
          .detail-grid {
            grid-template-columns: 1fr 1.25fr;
          }
        }
        .gallery-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .main-image-box {
          position: relative;
          width: 100%;
          height: 380px;
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: #0d1222;
        }
        .product-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .img-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
        }
        .image-badges {
          position: absolute;
          top: 1rem;
          left: 1rem;
          display: flex;
          gap: 0.5rem;
        }
        .specs-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          background: rgba(0, 0, 0, 0.2);
          padding: 1.25rem;
          border-radius: var(--radius-md);
        }
        .spec-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 0.5rem;
        }
        .spec-label {
          color: var(--text-muted);
        }
        .spec-value {
          color: var(--text-primary);
          font-weight: 600;
        }
        .text-accent {
          color: var(--accent-secondary) !important;
        }
        .info-card {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .meta-top {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .brand-chip {
          font-weight: 700;
          color: var(--accent-primary-light);
          font-size: 0.9rem;
        }
        .detail-title {
          font-size: 2rem;
          font-weight: 800;
          line-height: 1.2;
        }
        .oem-section {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .oem-title {
          font-size: 0.8rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .oem-tags {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .oem-tag {
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.25);
          padding: 0.35rem 0.65rem;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          color: var(--text-primary);
        }
        .price-overview-box {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(6, 182, 212, 0.08));
          border: 1px solid var(--border-color-hover);
          padding: 1.5rem;
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .price-text-group {
          display: flex;
          flex-direction: column;
        }
        .price-lead-label {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .price-main {
          font-size: 2.5rem;
          font-weight: 900;
          color: #38bdf8;
          line-height: 1.1;
        }
        .tax-note {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .hero-cta-buttons {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .btn-wa-large {
          flex: 1;
          min-width: 220px;
          background: #25d366;
          color: #04250e;
          font-size: 1rem;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.65rem;
          padding: 0.95rem 1.5rem;
          border-radius: var(--radius-md);
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-wa-large:hover {
          background: #1ebe57;
          box-shadow: 0 6px 20px rgba(37, 211, 102, 0.4);
          transform: translateY(-2px);
        }
        .active-compared {
          background: var(--accent-primary) !important;
          color: white !important;
        }
        .desc-box {
          border-top: 1px solid var(--border-color);
          padding-top: 1.25rem;
        }
        .desc-heading {
          font-size: 1.1rem;
          margin-bottom: 0.5rem;
        }
        .desc-text {
          font-size: 0.95rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }
        .section-locations-module {
          margin-bottom: 3.5rem;
        }
        .module-header {
          margin-bottom: 1.75rem;
        }
        .module-eyebrow {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--accent-secondary);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          display: block;
        }
        .module-title {
          font-size: 1.75rem;
          font-weight: 800;
        }
        .module-subtitle {
          color: var(--text-secondary);
          font-size: 0.95rem;
        }
        .locations-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
        }
        @media (min-width: 768px) {
          .locations-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1200px) {
          .locations-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        .location-item-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .loc-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.85rem;
        }
        .loc-store-name {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--accent-primary-light);
          text-transform: uppercase;
        }
        .loc-name {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .loc-card-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
        .detail-line {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .loc-icon {
          color: var(--accent-secondary);
        }
        .loc-card-pricing {
          border-top: 1px solid var(--border-color);
          padding-top: 1rem;
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }
        .loc-price-box {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }
        .loc-price-lbl {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .loc-price-val {
          font-size: 1.35rem;
          font-weight: 800;
          color: #38bdf8;
        }
        .loc-action-buttons {
          display: flex;
          gap: 0.5rem;
        }
        .btn-wa-quick {
          flex: 1;
          background: #25d366;
          color: #03210d;
          font-weight: 700;
          font-size: 0.85rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          padding: 0.6rem 1rem;
          border-radius: var(--radius-md);
          border: none;
          cursor: pointer;
        }
        .btn-wa-quick:hover {
          background: #1ebe57;
        }
        .compatibility-section {
          padding: 2rem;
          margin-bottom: 3.5rem;
        }
        .compat-heading {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          font-size: 1.25rem;
          margin-bottom: 0.5rem;
        }
        .compat-icon {
          color: var(--accent-secondary);
        }
        .compat-desc {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
        }
        .compat-chips {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .compat-chip-block {
          background: rgba(99, 102, 241, 0.08);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: var(--radius-md);
          padding: 0.75rem 1.25rem;
          display: flex;
          flex-direction: column;
        }
        .compat-make-title {
          font-weight: 700;
          color: var(--text-primary);
        }
        .compat-models-sub {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .compat-universal-note {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--accent-success);
          font-size: 0.9rem;
        }
        .related-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 1.5rem;
        }
        .related-link {
          display: flex;
          gap: 1rem;
          align-items: center;
          text-decoration: none;
          padding: 1rem;
        }
        .rel-thumb {
          width: 70px;
          height: 70px;
          border-radius: var(--radius-md);
          object-fit: cover;
        }
        .rel-info h4 {
          font-size: 0.95rem;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }
        .rel-price {
          font-size: 1.05rem;
          font-weight: 800;
          color: var(--accent-secondary);
        }
      `}</style>
    </div>
  );
}

export default function PartDetailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="container detail-container" style={{ padding: '4rem 1rem' }}>
          <div className="skeleton" style={{ height: 400 }} />
        </div>
      }
    >
      <PartDetailContent />
    </React.Suspense>
  );
}
