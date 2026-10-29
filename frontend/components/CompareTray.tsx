'use client';

import React from 'react';
import Link from 'next/link';
import { useCompare } from '../lib/compareContext';
import { resolveImageUrl } from '../lib/api';
import { CompareIcon, CloseIcon, ArrowRightIcon } from './Icons';

export default function CompareTray() {
  const { comparedParts, removeFromCompare, clearCompare } = useCompare();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || comparedParts.length === 0) return null;

  return (
    <div className="compare-tray-wrapper animate-slide-up">
      <div className="compare-tray glass">
        <div className="tray-left">
          <div className="tray-title-box">
            <CompareIcon size={20} className="tray-icon" />
            <div>
              <span className="tray-title">Comparador de Repuestos</span>
              <span className="tray-count">({comparedParts.length}/4 seleccionados)</span>
            </div>
          </div>

          <div className="tray-thumbnails">
            {comparedParts.map(part => (
              <div key={part.id} className="thumb-item" title={part.name}>
                {part.imageUrl ? (
                  <img src={resolveImageUrl(part.imageUrl)} alt={part.name} className="thumb-img" />
                ) : (
                  <div className="thumb-fallback">{part.name.substring(0, 2)}</div>
                )}
                <button
                  type="button"
                  className="btn-remove-thumb"
                  onClick={() => removeFromCompare(part.id)}
                  title="Eliminar de comparación"
                >
                  <CloseIcon size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="tray-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={clearCompare}>
            Limpiar
          </button>
          <Link href="/compare" className="btn btn-primary btn-sm btn-view-compare">
            <span>Ver Comparativa</span>
            <ArrowRightIcon size={16} />
          </Link>
        </div>
      </div>

      <style jsx>{`
        .compare-tray-wrapper {
          position: fixed;
          bottom: 1.25rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 900;
          width: calc(100% - 2rem);
          max-width: 820px;
        }
        .compare-tray {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1.25rem;
          border-radius: var(--radius-xl);
          border: 1px solid var(--accent-primary);
          background: rgba(17, 24, 39, 0.95);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(99, 102, 241, 0.3);
          gap: 1rem;
        }
        .tray-left {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          flex-wrap: wrap;
        }
        .tray-title-box {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .tray-icon {
          color: var(--accent-secondary);
        }
        .tray-title {
          font-weight: 700;
          font-size: 0.9rem;
          color: var(--text-primary);
          display: block;
        }
        .tray-count {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .tray-thumbnails {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .thumb-item {
          position: relative;
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          overflow: visible;
          border: 1px solid var(--border-color);
          background: var(--bg-card);
        }
        .thumb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: var(--radius-md);
        }
        .thumb-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--accent-primary-light);
        }
        .btn-remove-thumb {
          position: absolute;
          top: -5px;
          right: -5px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--accent-danger);
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
        }
        .tray-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .btn-view-compare {
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
        }
        @media (max-width: 640px) {
          .compare-tray {
            flex-direction: column;
            align-items: stretch;
            padding: 0.75rem;
          }
          .tray-left {
            justify-content: space-between;
          }
          .tray-actions {
            justify-content: flex-end;
          }
        }
      `}</style>
    </div>
  );
}
