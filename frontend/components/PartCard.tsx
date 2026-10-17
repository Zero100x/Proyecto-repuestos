'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Part } from '../lib/types';
import { formatPriceCOP } from '../lib/api';
import { useCompare } from '../lib/compareContext';
import WhatsAppLeadModal from './WhatsAppLeadModal';
import {
  WhatsAppIcon,
  CompareIcon,
  CheckCircleIcon,
  MapPinIcon,
  TagIcon,
  ShieldCheckIcon,
} from './Icons';

interface PartCardProps {
  part: Part;
  verifiedVehicle?: string; // Optional vehicle name to show fitment badge
}

export default function PartCard({ part, verifiedVehicle }: PartCardProps) {
  const { addToCompare, removeFromCompare, isCompared } = useCompare();
  const [showLeadModal, setShowLeadModal] = useState(false);

  const compared = isCompared(part.id);

  const conditionLabels: Record<string, { label: string; class: string }> = {
    NEW: { label: 'Nuevo', class: 'badge-success' },
    USED: { label: 'Usado', class: 'badge-warning' },
    REFURBISHED: { label: 'Remanufacturado', class: 'badge-info' },
  };

  const primaryCondition = part.conditions?.[0] || 'NEW';
  const conditionInfo = conditionLabels[primaryCondition] || { label: 'Garantizado', class: 'badge-primary' };

  const oemNumber = part.partNumbers?.[0]?.number;
  const bestPrice = part.minPrice || 0;
  const locationCount = part.locationCount || part.inventory?.length || 1;

  const handleCompareToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (compared) {
      removeFromCompare(part.id);
    } else {
      addToCompare(part);
    }
  };

  return (
    <>
      <div className="card part-card">
        {/* Card Header Media */}
        <div className="media-wrapper">
          <Link href={`/parts/${part.id}`} className="image-link">
            {part.imageUrl ? (
              <img src={part.imageUrl} alt={part.name} className="part-image" />
            ) : (
              <div className="image-placeholder">
                <TagIcon size={40} className="placeholder-icon" />
              </div>
            )}
          </Link>

          {/* Badges Overlay */}
          <div className="badge-row">
            <span className={`badge ${conditionInfo.class}`}>{conditionInfo.label}</span>
            {verifiedVehicle && (
              <span className="badge badge-primary fitment-badge">
                <CheckCircleIcon size={12} />
                <span>Compatible</span>
              </span>
            )}
          </div>

          {/* Compare Button on Top Right */}
          <button
            type="button"
            className={`btn-compare-pill ${compared ? 'active' : ''}`}
            onClick={handleCompareToggle}
            title={compared ? 'Quitar del comparador' : 'Agregar a comparación'}
          >
            <CompareIcon size={14} />
            <span>{compared ? 'Comparando' : 'Comparar'}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="card-body">
          <div className="category-meta">
            <span className="brand-tag">{part.brand || 'Original'}</span>
            {part.category && <span className="cat-bullet">•</span>}
            {part.category && <span className="cat-name">{part.category.name}</span>}
          </div>

          <Link href={`/parts/${part.id}`} className="title-link">
            <h3 className="part-title">{part.name}</h3>
          </Link>

          {oemNumber && (
            <div className="oem-ref">
              <span className="oem-label">Ref OEM:</span>
              <code className="oem-code">{oemNumber}</code>
            </div>
          )}

          {/* Availability Info */}
          <div className="stock-info">
            <MapPinIcon size={14} className="icon-pin" />
            <span>
              Disponible en <strong>{locationCount} {locationCount === 1 ? 'sede' : 'sedes'}</strong>
              {part.cities && part.cities.length > 0 && ` (${part.cities.join(', ')})`}
            </span>
          </div>

          {/* Pricing & Call to Action */}
          <div className="price-cta-block">
            <div className="price-box">
              <span className="price-label">Mejor precio</span>
              <span className="price-amount">{formatPriceCOP(bestPrice)}</span>
              {part.maxPrice && part.maxPrice > bestPrice && (
                <span className="price-range">hasta {formatPriceCOP(part.maxPrice)}</span>
              )}
            </div>

            <div className="cta-actions">
              <button
                type="button"
                className="btn btn-wa-quick"
                onClick={() => setShowLeadModal(true)}
                title="Cotizar directo por WhatsApp"
              >
                <WhatsAppIcon size={18} />
                <span>WhatsApp</span>
              </button>

              <Link href={`/parts/${part.id}`} className="btn btn-secondary btn-sm btn-details">
                Ver Sede
              </Link>
            </div>
          </div>
        </div>
      </div>

      {showLeadModal && (
        <WhatsAppLeadModal
          part={part}
          isOpen={showLeadModal}
          onClose={() => setShowLeadModal(false)}
        />
      )}

      <style jsx>{`
        .part-card {
          padding: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          transition: all 0.25s ease;
        }
        .part-card:hover {
          border-color: var(--accent-primary-light);
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg), var(--shadow-glow);
        }
        .media-wrapper {
          position: relative;
          width: 100%;
          height: 180px;
          background: #0f1526;
          overflow: hidden;
        }
        .image-link {
          display: block;
          width: 100%;
          height: 100%;
        }
        .part-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }
        .part-card:hover .part-image {
          transform: scale(1.05);
        }
        .image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
        }
        .badge-row {
          position: absolute;
          top: 0.75rem;
          left: 0.75rem;
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
        }
        .fitment-badge {
          background: rgba(16, 185, 129, 0.9);
          color: white;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }
        .btn-compare-pill {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.3rem 0.65rem;
          font-size: 0.75rem;
          font-weight: 600;
          background: rgba(10, 14, 26, 0.85);
          backdrop-filter: blur(8px);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-compare-pill:hover,
        .btn-compare-pill.active {
          background: var(--accent-primary);
          border-color: var(--accent-primary);
          color: white;
        }
        .card-body {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .category-meta {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-bottom: 0.35rem;
        }
        .brand-tag {
          color: var(--accent-primary-light);
          font-weight: 600;
        }
        .title-link {
          text-decoration: none;
          color: inherit;
        }
        .part-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.35;
          margin-bottom: 0.5rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          transition: color 0.15s;
        }
        .part-title:hover {
          color: var(--accent-secondary);
        }
        .oem-ref {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          margin-bottom: 0.75rem;
          font-size: 0.8rem;
        }
        .oem-label {
          color: var(--text-muted);
        }
        .oem-code {
          background: rgba(99, 102, 241, 0.1);
          color: var(--text-primary);
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          font-size: 0.775rem;
          border: 1px solid rgba(99, 102, 241, 0.2);
        }
        .stock-info {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-top: auto;
          margin-bottom: 1rem;
        }
        .icon-pin {
          color: var(--accent-secondary);
        }
        .price-cta-block {
          border-top: 1px solid var(--border-color);
          padding-top: 0.85rem;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 0.5rem;
        }
        .price-box {
          display: flex;
          flex-direction: column;
        }
        .price-label {
          font-size: 0.7rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .price-amount {
          font-size: 1.25rem;
          font-weight: 800;
          color: #38bdf8;
          line-height: 1.1;
        }
        .price-range {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .cta-actions {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .btn-wa-quick {
          background: #25d366;
          color: #052410;
          font-weight: 700;
          font-size: 0.8rem;
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius-md);
          border: none;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-wa-quick:hover {
          background: #1ebe57;
          box-shadow: 0 4px 10px rgba(37, 211, 102, 0.4);
          transform: translateY(-1px);
        }
        .btn-details {
          padding: 0.5rem 0.75rem;
          font-size: 0.8rem;
        }
      `}</style>
    </>
  );
}
