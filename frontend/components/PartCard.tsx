'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Part } from '../lib/types';
import { formatPriceCOP, calculateHaversineDistance } from '../lib/api';
import { useCompare } from '../lib/compareContext';
import WhatsAppLeadModal from './WhatsAppLeadModal';
import {
  WhatsAppIcon,
  CompareIcon,
  CheckCircleIcon,
  MapPinIcon,
  TagIcon,
} from './Icons';

interface PartCardProps {
  part: Part;
  verifiedVehicle?: string;
  userCoords?: { latitude: number; longitude: number } | null;
}

export default function PartCard({ part, verifiedVehicle, userCoords }: PartCardProps) {
  const { addToCompare, removeFromCompare, isCompared } = useCompare();
  const [showLeadModal, setShowLeadModal] = useState(false);

  const compared = isCompared(part.id);

  const conditionLabels: Record<string, { label: string; bg: string; color: string }> = {
    NEW: { label: 'Nuevo (OEM)', bg: 'var(--surface-container-high)', color: 'var(--primary)' },
    USED: { label: 'Usado Certificado', bg: 'var(--surface-container)', color: 'var(--secondary)' },
    REFURBISHED: { label: 'Remanufacturado', bg: 'var(--secondary-container)', color: 'var(--on-secondary-container)' },
  };

  const primaryCondition = part.conditions?.[0] || 'NEW';
  const conditionInfo = conditionLabels[primaryCondition] || { label: 'Garantizado', bg: 'var(--surface-container)', color: 'var(--primary)' };

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
      <div className="product-card group">
        {/* Fitment badge overlay */}
        <div className="badge-overlay-left">
          {verifiedVehicle ? (
            <span className="fitment-badge">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              <span>Compatible</span>
            </span>
          ) : (
            <span className="oem-quality-badge">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              <span>OEM Spec</span>
            </span>
          )}
        </div>

        {/* Compare Button on Top Right */}
        <button
          type="button"
          className={`compare-btn ${compared ? 'active' : ''}`}
          onClick={handleCompareToggle}
          title={compared ? 'Quitar del comparador' : 'Agregar a comparación'}
        >
          <CompareIcon size={13} />
          <span>{compared ? 'En lista' : 'Comparar'}</span>
        </button>

        {/* Media */}
        <Link href={`/parts/${part.id}`} className="image-container">
          {part.imageUrl ? (
            <img src={part.imageUrl} alt={part.name} className="product-img" />
          ) : (
            <div className="placeholder-box">
              <TagIcon size={36} />
            </div>
          )}
        </Link>

        {/* Body */}
        <div className="card-body">
          <div className="meta-row">
            <span
              className="condition-pill"
              style={{ background: conditionInfo.bg, color: conditionInfo.color }}
            >
              {conditionInfo.label}
            </span>
            {part.brand && <span className="brand-label">{part.brand}</span>}
          </div>

          <Link href={`/parts/${part.id}`}>
            <h3 className="title-text">{part.name}</h3>
          </Link>

          {oemNumber && (
            <div className="oem-spec">
              <span className="oem-tag">REF OEM:</span>
              <code className="oem-code">{oemNumber}</code>
            </div>
          )}

          {/* Location & GPS Proximity */}
          {(() => {
            let nearestDist: number | null = null;
            let nearestName: string | null = null;

            if (userCoords && part.inventory?.length) {
              for (const inv of part.inventory) {
                if (inv.location?.latitude && inv.location?.longitude) {
                  const d = calculateHaversineDistance(
                    userCoords.latitude,
                    userCoords.longitude,
                    inv.location.latitude,
                    inv.location.longitude,
                  );
                  if (nearestDist === null || d < nearestDist) {
                    nearestDist = d;
                    nearestName = inv.location.name;
                  }
                }
              }
            }

            return (
              <div className="location-info">
                <MapPinIcon size={13} />
                {nearestDist !== null ? (
                  <span className="text-emerald-700 font-bold text-[11px]">
                    📍 A {nearestDist} km en {nearestName}
                  </span>
                ) : (
                  <span>
                    Disponible en <strong>{locationCount} {locationCount === 1 ? 'almacén' : 'almacenes'}</strong>
                    {part.cities && part.cities.length > 0 && ` (${part.cities.join(', ')})`}
                  </span>
                )}
              </div>
            );
          })()}

          {/* Pricing & CTA */}
          <div className="footer-row">
            <div className="price-stack">
              <span className="price-caption">Precio desde</span>
              <span className="price-value">{formatPriceCOP(bestPrice)}</span>
            </div>

            <div className="cta-group">
              <button
                type="button"
                className="btn-wa"
                onClick={() => setShowLeadModal(true)}
                title="Cotizar de inmediato por WhatsApp"
              >
                <WhatsAppIcon size={16} />
                <span>WhatsApp</span>
              </button>

              <Link href={`/parts/${part.id}`} className="btn-detail">
                Ficha
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
        .product-card {
          position: relative;
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--surface-container-lowest);
          border: 1px solid var(--outline-variant);
          border-radius: var(--radius-xl);
          overflow: hidden;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .product-card:hover {
          border-color: var(--primary);
          box-shadow: 0 8px 30px rgba(10, 31, 68, 0.08);
          transform: translateY(-3px);
        }
        .badge-overlay-left {
          position: absolute;
          top: 12px;
          left: 12px;
          z-index: 10;
        }
        .fitment-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(16, 185, 129, 0.35);
          color: #059669;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .oem-quality-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(4px);
          border: 1px solid var(--outline-variant);
          color: var(--primary);
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .compare-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 10;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: var(--surface-container-lowest);
          border: 1px solid var(--outline-variant);
          color: var(--secondary);
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 9999px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 6px rgba(0,0,0,0.03);
        }
        .compare-btn:hover, .compare-btn.active {
          background: var(--primary);
          color: #ffffff;
          border-color: var(--primary);
        }
        .image-container {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 190px;
          background: var(--surface-container-lowest);
          border-bottom: 1px solid var(--outline-variant);
          padding: 1.25rem;
          overflow: hidden;
        }
        .product-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          transition: transform 0.4s ease;
        }
        .product-card:hover .product-img {
          transform: scale(1.05);
        }
        .placeholder-box {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          color: var(--outline);
        }
        .card-body {
          display: flex;
          flex-direction: column;
          flex: 1;
          padding: 1rem 1.25rem 1.25rem;
          gap: 0.6rem;
        }
        .meta-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .condition-pill {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .brand-label {
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: var(--secondary);
        }
        .title-text {
          font-family: 'Hanken Grotesk', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: var(--primary);
          line-height: 1.35;
          margin: 0;
          transition: color 0.2s;
        }
        .title-text:hover {
          color: var(--on-tertiary-container);
        }
        .oem-spec {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
        }
        .oem-tag {
          color: var(--secondary);
          font-size: 10px;
        }
        .oem-code {
          background: var(--surface-container);
          padding: 2px 6px;
          border-radius: 3px;
          color: var(--primary);
          font-weight: 600;
        }
        .location-info {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          color: var(--secondary);
          margin-top: 2px;
        }
        .footer-row {
          margin-top: auto;
          padding-top: 0.85rem;
          border-top: 1px solid var(--outline-variant);
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 0.5rem;
        }
        .price-stack {
          display: flex;
          flex-direction: column;
        }
        .price-caption {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: var(--secondary);
          text-transform: uppercase;
        }
        .price-value {
          font-family: 'Hanken Grotesk', sans-serif;
          font-size: 18px;
          font-weight: 800;
          color: var(--primary);
          line-height: 1.1;
        }
        .cta-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .btn-wa {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #25d366;
          color: white;
          border: none;
          padding: 6px 10px;
          border-radius: 6px;
          font-family: 'Hanken Grotesk', sans-serif;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
        }
        .btn-wa:hover {
          background: #1da851;
        }
        .btn-wa:active {
          transform: scale(0.97);
        }
        .btn-detail {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px 10px;
          background: var(--surface-container-high);
          color: var(--primary);
          border: 1px solid var(--outline-variant);
          border-radius: 6px;
          font-family: 'Hanken Grotesk', sans-serif;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
        }
        .btn-detail:hover {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }
      `}</style>
    </>
  );
}
