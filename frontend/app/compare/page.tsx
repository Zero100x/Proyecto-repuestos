'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCompare } from '../../lib/compareContext';
import { formatPriceCOP } from '../../lib/api';
import WhatsAppLeadModal from '../../components/WhatsAppLeadModal';
import { Part } from '../../lib/types';
import { MOCK_PARTS } from '../../lib/mockData';
import {
  CompareIcon,
  CloseIcon,
  WhatsAppIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  BuildingIcon,
  MapPinIcon,
  ArrowRightIcon,
  TagIcon,
} from '../../components/Icons';

export default function ComparePage() {
  const { comparedParts, removeFromCompare, clearCompare, addToCompare } = useCompare();

  const [selectedPartForLead, setSelectedPartForLead] = useState<Part | null>(null);

  // If user enters with 0 or 1 item, offer demo comparison
  const loadDemoComparison = () => {
    clearCompare();
    addToCompare(MOCK_PARTS[0]); // Pastillas cerámicas
    addToCompare(MOCK_PARTS[1]); // Discos ventilados
    addToCompare(MOCK_PARTS[3]); // Bujías
  };

  return (
    <div className="compare-page-container container">
      <div className="compare-header">
        <div>
          <span className="section-eyebrow">Evaluación Lado a Lado</span>
          <h1 className="section-title">Comparador de Repuestos</h1>
          <p className="section-subtitle">
            Analiza diferencias en precio, condición, referencias OEM y disponibilidad inmediata en sedes.
          </p>
        </div>

        {comparedParts.length > 0 && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={clearCompare}>
            Vaciar Comparador
          </button>
        )}
      </div>

      {comparedParts.length === 0 ? (
        <div className="empty-compare card glass text-center">
          <CompareIcon size={56} className="empty-compare-icon" />
          <h2>No has seleccionado repuestos para comparar</h2>
          <p>
            Navega por nuestro catálogo o busca piezas para tu carro y haz clic en &quot;Comparar&quot; en cualquier repuesto.
          </p>
          <div className="empty-actions">
            <Link href="/search" className="btn btn-primary">
              <span>Explorar Catálogo</span>
              <ArrowRightIcon size={16} />
            </Link>
            <button type="button" className="btn btn-secondary" onClick={loadDemoComparison}>
              Cargar Ejemplo de Comparación
            </button>
          </div>
        </div>
      ) : (
        <div className="table-responsive-wrapper">
          <div className="compare-grid">
            {/* Headers Column */}
            <div className="features-column">
              <div className="feature-cell header-cell">Criterio</div>
              <div className="feature-cell">Imagen & Nombre</div>
              <div className="feature-cell">Mejor Precio (COP)</div>
              <div className="feature-cell">Marca del Repuesto</div>
              <div className="feature-cell">Condición</div>
              <div className="feature-cell">Sedes con Stock</div>
              <div className="feature-cell">Referencia OEM</div>
              <div className="feature-cell">Garantía / Soporte</div>
              <div className="feature-cell action-cell">Acción Recomendada</div>
            </div>

            {/* Products Columns */}
            <div className="products-columns-track">
              {comparedParts.map(part => {
                const oem = part.partNumbers?.[0]?.number || 'N/A';
                const condition = part.conditions?.[0] || 'NEW';
                const conditionText = condition === 'NEW' ? 'Nuevo' : condition === 'USED' ? 'Usado' : 'Remanufacturado';

                return (
                  <div key={part.id} className="product-compare-col card">
                    <div className="prod-cell col-top-bar">
                      <button
                        type="button"
                        className="btn-remove-col"
                        onClick={() => removeFromCompare(part.id)}
                        title="Eliminar de la comparativa"
                      >
                        <CloseIcon size={16} />
                        <span>Quitar</span>
                      </button>
                    </div>

                    <div className="prod-cell main-prod-info">
                      <Link href={`/parts/${part.id}`} className="prod-img-wrap">
                        {part.imageUrl ? (
                          <img src={part.imageUrl} alt={part.name} className="prod-compare-img" />
                        ) : (
                          <TagIcon size={40} />
                        )}
                      </Link>
                      <Link href={`/parts/${part.id}`} className="prod-title-link">
                        <h4>{part.name}</h4>
                      </Link>
                    </div>

                    <div className="prod-cell price-cell">
                      <span className="price-big">{formatPriceCOP(part.minPrice || 0)}</span>
                    </div>

                    <div className="prod-cell">
                      <span className="brand-badge">{part.brand || 'Original'}</span>
                    </div>

                    <div className="prod-cell">
                      <span className={`badge ${condition === 'NEW' ? 'badge-success' : 'badge-warning'}`}>
                        {conditionText}
                      </span>
                    </div>

                    <div className="prod-cell">
                      <div className="locations-inline">
                        <MapPinIcon size={14} className="pin-icon" />
                        <span>{part.locationCount || part.inventory?.length || 1} sedes activas</span>
                      </div>
                    </div>

                    <div className="prod-cell">
                      <code className="oem-code-cell">{oem}</code>
                    </div>

                    <div className="prod-cell">
                      <div className="warranty-tag">
                        <ShieldCheckIcon size={16} />
                        <span>Verificado</span>
                      </div>
                    </div>

                    <div className="prod-cell action-cell">
                      <button
                        type="button"
                        className="btn btn-wa-quick btn-full"
                        onClick={() => setSelectedPartForLead(part)}
                      >
                        <WhatsAppIcon size={18} />
                        <span>Cotizar WhatsApp</span>
                      </button>
                      <Link href={`/parts/${part.id}`} className="btn btn-secondary btn-sm btn-full" style={{ marginTop: '0.4rem' }}>
                        Ver Detalle
                      </Link>
                    </div>
                  </div>
                );
              })}

              {/* Slot to add more parts */}
              {comparedParts.length < 4 && (
                <div className="add-more-slot card">
                  <TagIcon size={32} className="add-slot-icon" />
                  <h4>Comparar otro repuesto</h4>
                  <p>Puedes agregar hasta {4 - comparedParts.length} repuestos más.</p>
                  <Link href="/search" className="btn btn-secondary btn-sm">
                    Ir al Catálogo
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedPartForLead && (
        <WhatsAppLeadModal
          part={selectedPartForLead}
          isOpen={!!selectedPartForLead}
          onClose={() => setSelectedPartForLead(null)}
        />
      )}

      <style jsx>{`
        .compare-page-container {
          padding-top: 2rem;
          padding-bottom: 5rem;
        }
        .compare-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 2.5rem;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .empty-compare {
          padding: 4rem 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
        }
        .empty-compare-icon {
          color: var(--accent-secondary);
        }
        .empty-compare h2 {
          font-size: 1.75rem;
        }
        .empty-compare p {
          color: var(--text-secondary);
          max-width: 520px;
        }
        .empty-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
          flex-wrap: wrap;
          justify-content: center;
        }
        .table-responsive-wrapper {
          overflow-x: auto;
          padding-bottom: 1rem;
        }
        .compare-grid {
          display: flex;
          gap: 1.25rem;
          min-width: 800px;
        }
        .features-column {
          width: 200px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
        }
        .feature-cell {
          height: 60px;
          display: flex;
          align-items: center;
          padding: 0 1rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-muted);
          border-bottom: 1px solid var(--border-color);
        }
        .feature-cell.header-cell {
          height: 40px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .features-column .feature-cell:nth-child(2) {
          height: 190px;
        }
        .features-column .feature-cell.action-cell {
          height: 110px;
          border-bottom: none;
        }
        .products-columns-track {
          display: flex;
          gap: 1.25rem;
          flex: 1;
        }
        .product-compare-col {
          flex: 1;
          min-width: 240px;
          max-width: 320px;
          padding: 0;
          display: flex;
          flex-direction: column;
          background: var(--bg-card);
        }
        .prod-cell {
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 1rem;
          border-bottom: 1px solid var(--border-color);
          text-align: center;
        }
        .col-top-bar {
          height: 40px;
          justify-content: flex-end;
          padding: 0 0.75rem;
        }
        .btn-remove-col {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 0.75rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        .btn-remove-col:hover {
          color: var(--accent-danger);
        }
        .main-prod-info {
          height: 190px;
          flex-direction: column;
          justify-content: center;
          gap: 0.75rem;
          padding: 1rem;
        }
        .prod-img-wrap {
          width: 80px;
          height: 80px;
          border-radius: var(--radius-md);
          overflow: hidden;
          background: #0d1222;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .prod-compare-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .prod-title-link {
          text-decoration: none;
          color: var(--text-primary);
        }
        .prod-title-link h4 {
          font-size: 0.9rem;
          line-height: 1.3;
        }
        .price-cell {
          background: rgba(99, 102, 241, 0.05);
        }
        .price-big {
          font-size: 1.35rem;
          font-weight: 800;
          color: #38bdf8;
        }
        .brand-badge {
          font-weight: 700;
          color: var(--accent-primary-light);
          font-size: 0.85rem;
        }
        .locations-inline {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
        .pin-icon {
          color: var(--accent-secondary);
        }
        .oem-code-cell {
          background: rgba(255, 255, 255, 0.05);
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
        }
        .warranty-tag {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          color: var(--accent-success);
          font-size: 0.85rem;
          font-weight: 600;
        }
        .product-compare-col .action-cell {
          height: 110px;
          flex-direction: column;
          justify-content: center;
          padding: 1rem;
          border-bottom: none;
        }
        .btn-wa-quick {
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
        .add-more-slot {
          flex: 1;
          min-width: 240px;
          max-width: 280px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 2rem 1.5rem;
          gap: 0.75rem;
          border: 2px dashed var(--border-color);
          background: transparent;
        }
        .add-slot-icon {
          color: var(--text-muted);
        }
        .add-more-slot h4 {
          font-size: 1.05rem;
        }
        .add-more-slot p {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
