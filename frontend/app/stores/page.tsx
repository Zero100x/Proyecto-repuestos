'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchStores, fetchLocations, buildWhatsAppLink } from '../../lib/api';
import { Store, Location } from '../../lib/types';
import {
  BuildingIcon,
  MapPinIcon,
  PhoneIcon,
  WhatsAppIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
} from '../../components/Icons';

export default function StoresDirectoryPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('TODAS');

  useEffect(() => {
    Promise.all([fetchStores(), fetchLocations()]).then(([storesData, locsData]) => {
      setStores(storesData);
      setLocations(locsData);
    });
  }, []);

  const cities = ['TODAS', 'Bogotá', 'Medellín'];

  const filteredLocations = selectedCity === 'TODAS'
    ? locations
    : locations.filter(l => l.city.toLowerCase() === selectedCity.toLowerCase());

  return (
    <div className="stores-page-container container">
      {/* Header */}
      <div className="stores-header">
        <div>
          <span className="section-eyebrow">Red de Distribución Verificada</span>
          <h1 className="section-title">Almacenes y Sedes Aliadas</h1>
          <p className="section-subtitle">
            Bodegas físicas en Colombia con inventario de repuestos catalogado en tiempo real.
          </p>
        </div>

        {/* City Filter Tabs */}
        <div className="city-filter-tabs">
          {cities.map(c => (
            <button
              key={c}
              type="button"
              className={`city-tab-btn ${selectedCity === c ? 'active' : ''}`}
              onClick={() => setSelectedCity(c)}
            >
              <MapPinIcon size={14} />
              <span>{c === 'TODAS' ? 'Todas las Ciudades' : c}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stores List */}
      <div className="stores-list-wrapper">
        {stores.map(store => {
          const storeLocs = filteredLocations.filter(l => l.storeId === store.id);
          if (storeLocs.length === 0 && selectedCity !== 'TODAS') return null;

          return (
            <div key={store.id} className="store-card card glass">
              <div className="store-card-header">
                <div className="store-brand-box">
                  <div className="store-icon-box">
                    <BuildingIcon size={24} />
                  </div>
                  <div>
                    <h2 className="store-name">{store.name}</h2>
                    <span className="store-nit">NIT: {store.nit || 'Verificado'} • Afiliado Oficial</span>
                  </div>
                </div>

                <div className="store-badges">
                  <span className="badge badge-success">
                    <ShieldCheckIcon size={14} />
                    <span>Inventario Verificado</span>
                  </span>
                </div>
              </div>

              {/* Locations Grid for this store */}
              <div className="store-locations-grid">
                {storeLocs.map(loc => {
                  const waNumber = loc.whatsapp || loc.phone || '+573002001001';
                  const waUrl = buildWhatsAppLink(
                    waNumber,
                    `Hola ${store.name} de la sede ${loc.name}. Los contacto desde RepuestosYA para consultar disponibilidad de repuestos.`
                  );

                  return (
                    <div key={loc.id} className="loc-tile card">
                      <div className="loc-tile-top">
                        <h3 className="loc-tile-title">{loc.name}</h3>
                        <span className="badge badge-primary">{loc.city}</span>
                      </div>

                      <div className="loc-tile-details">
                        <div className="loc-line">
                          <MapPinIcon size={16} className="loc-icon" />
                          <span>{loc.address}</span>
                        </div>
                        {loc.phone && (
                          <div className="loc-line">
                            <PhoneIcon size={16} className="loc-icon" />
                            <span>Teléfono fijo / móvil: {loc.phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="loc-tile-actions">
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-wa-quick btn-full"
                        >
                          <WhatsAppIcon size={18} />
                          <span>Contactar por WhatsApp</span>
                        </a>

                        <div className="tile-sub-actions">
                          {loc.phone && (
                            <a
                              href={`tel:${loc.phone.replace(/[^0-9+]/g, '')}`}
                              className="btn btn-secondary btn-sm"
                            >
                              <PhoneIcon size={14} />
                              <span>Llamar</span>
                            </a>
                          )}
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              `${loc.address}, ${loc.city}, Colombia`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm"
                          >
                            <MapPinIcon size={14} />
                            <span>Cómo llegar</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA Box */}
      <div className="join-stores-banner card glass">
        <div className="join-content">
          <h3>¿Representas a un almacén de repuestos?</h3>
          <p>
            Publica tus referencias, sincroniza tus existencias y recibe leads directos por WhatsApp sin comisiones por transacción.
          </p>
        </div>
        <Link href="/login" className="btn btn-primary btn-lg">
          <span>Ingreso de Almacenes</span>
          <ArrowRightIcon size={18} />
        </Link>
      </div>

      <style jsx>{`
        .stores-page-container {
          padding-top: 2rem;
          padding-bottom: 5rem;
        }
        .stores-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 2.5rem;
          gap: 1.5rem;
          flex-wrap: wrap;
        }
        .city-filter-tabs {
          display: flex;
          gap: 0.5rem;
          background: rgba(15, 23, 42, 0.6);
          padding: 0.35rem;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
        }
        .city-tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 1rem;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.85rem;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s;
        }
        .city-tab-btn:hover {
          color: var(--text-primary);
        }
        .city-tab-btn.active {
          background: var(--accent-primary);
          color: white;
        }
        .stores-list-wrapper {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          margin-bottom: 3.5rem;
        }
        .store-card {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .store-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 1.25rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .store-brand-box {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .store-icon-box {
          width: 52px;
          height: 52px;
          border-radius: var(--radius-md);
          background: var(--gradient-primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .store-name {
          font-size: 1.45rem;
          font-weight: 800;
          color: var(--text-primary);
        }
        .store-nit {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .store-locations-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
        }
        @media (min-width: 640px) {
          .store-locations-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .store-locations-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        .loc-tile {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          background: #111728;
        }
        .loc-tile-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.5rem;
        }
        .loc-tile-title {
          font-size: 1.05rem;
          color: var(--text-primary);
        }
        .loc-tile-details {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
        .loc-line {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .loc-icon {
          color: var(--accent-secondary);
        }
        .loc-tile-actions {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
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
          padding: 0.65rem 1rem;
          border-radius: var(--radius-md);
          border: none;
          cursor: pointer;
        }
        .tile-sub-actions {
          display: flex;
          gap: 0.5rem;
        }
        .tile-sub-actions a {
          flex: 1;
        }
        .join-stores-banner {
          padding: 2.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 1px solid var(--accent-primary);
          gap: 2rem;
          flex-wrap: wrap;
        }
        .join-content h3 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .join-content p {
          color: var(--text-secondary);
          max-width: 580px;
        }
      `}</style>
    </div>
  );
}
