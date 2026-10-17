import React from 'react';
import Link from 'next/link';
import { CarIcon, WhatsAppIcon, ShieldCheckIcon, MapPinIcon } from './Icons';

export default function Footer() {
  return (
    <footer className="footer-wrapper">
      <div className="container footer-content">
        <div className="footer-grid">
          {/* Columna 1: Brand & Misión */}
          <div className="footer-col brand-col">
            <div className="footer-logo">
              <div className="footer-logo-icon">
                <CarIcon size={20} />
              </div>
              <span className="footer-brand-name">
                Repuestos<span className="brand-highlight">YA</span>
              </span>
            </div>
            <p className="footer-desc">
              Plataforma digital centralizada de consulta y comparación de inventario
              automotriz en Colombia. Conectamos compradores con almacenes y bodegas físicas verificadas.
            </p>
            <div className="disclaimer-badge">
              <ShieldCheckIcon size={16} />
              <span>Modelo de Lead Generation transparente — Sin intermediación de pagos</span>
            </div>
          </div>

          {/* Columna 2: Búsquedas Frecuentes */}
          <div className="footer-col">
            <h4 className="footer-heading">Búsquedas Populares</h4>
            <ul className="footer-list">
              <li><Link href="/search?category=frenos">Pastillas y Discos de Freno</Link></li>
              <li><Link href="/search?category=motor">Kits de Distribución y Bujías</Link></li>
              <li><Link href="/search?category=suspension">Amortiguadores a Gas</Link></li>
              <li><Link href="/search?category=transmision">Kits de Embrague</Link></li>
              <li><Link href="/search?category=electrico">Baterías y Alternadores</Link></li>
            </ul>
          </div>

          {/* Columna 3: Marcas y Ciudades */}
          <div className="footer-col">
            <h4 className="footer-heading">Marcas y Ciudades</h4>
            <ul className="footer-list">
              <li><Link href="/search?make=Toyota">Repuestos Toyota (Corolla, Hilux)</Link></li>
              <li><Link href="/search?make=Chevrolet">Repuestos Chevrolet (Onix, Spark)</Link></li>
              <li><Link href="/search?make=Renault">Repuestos Renault (Duster, Sandero)</Link></li>
              <li><Link href="/stores">Sedes en Bogotá (7 de Agosto, Prado)</Link></li>
              <li><Link href="/stores">Sedes en Medellín (Belén, Calle 30)</Link></li>
            </ul>
          </div>

          {/* Columna 4: Para Almacenes */}
          <div className="footer-col">
            <h4 className="footer-heading">Almacenes y Aliados</h4>
            <p className="partner-text">
              ¿Vendes repuestos automotrices? Sincroniza tu inventario y recibe cotizaciones directas a tu WhatsApp.
            </p>
            <Link href="/login" className="btn btn-secondary btn-sm btn-partner">
              Portal de Almacén
            </Link>
            <div className="support-link">
              <WhatsAppIcon size={16} />
              <span>Soporte: +57 300 200 1000</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright">
            © 2026 RepuestosYA Colombia. Todos los derechos reservados. Proyecto MVP Sprints 1 y 2.
          </p>
          <div className="bottom-links">
            <Link href="/search">Catálogo</Link>
            <Link href="/compare">Comparador</Link>
            <Link href="/stores">Almacenes</Link>
            <Link href="/login">Acceso RBAC</Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .footer-wrapper {
          background: #070a12;
          border-top: 1px solid var(--border-color);
          padding: 4rem 0 2rem;
          margin-top: 5rem;
          color: var(--text-secondary);
        }
        .footer-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2.5rem;
          margin-bottom: 3rem;
        }
        @media (min-width: 640px) {
          .footer-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .footer-grid {
            grid-template-columns: 1.5fr 1fr 1fr 1.2fr;
          }
        }
        .footer-logo {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          margin-bottom: 1rem;
        }
        .footer-logo-icon {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-sm);
          background: var(--gradient-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        .footer-brand-name {
          font-size: 1.25rem;
          font-weight: 900;
          color: #f1f5f9;
        }
        .brand-highlight {
          color: #38bdf8;
          font-style: italic;
        }
        .footer-desc {
          font-size: 0.85rem;
          line-height: 1.6;
          margin-bottom: 1.25rem;
          color: var(--text-muted);
        }
        .disclaimer-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(99, 102, 241, 0.08);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: var(--radius-md);
          padding: 0.6rem 0.85rem;
          font-size: 0.75rem;
          color: var(--accent-primary-light);
        }
        .footer-heading {
          font-size: 0.95rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 1.25rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .footer-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }
        .footer-list a {
          font-size: 0.85rem;
          color: var(--text-secondary);
          transition: color 0.15s;
        }
        .footer-list a:hover {
          color: var(--accent-secondary);
        }
        .partner-text {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.5;
          margin-bottom: 1rem;
        }
        .btn-partner {
          width: 100%;
          margin-bottom: 1rem;
        }
        .support-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: #25d366;
        }
        .footer-bottom {
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding-top: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: center;
          justify-content: space-between;
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        @media (min-width: 768px) {
          .footer-bottom {
            flex-direction: row;
          }
        }
        .bottom-links {
          display: flex;
          gap: 1.5rem;
        }
        .bottom-links a {
          color: var(--text-muted);
        }
        .bottom-links a:hover {
          color: var(--text-primary);
        }
      `}</style>
    </footer>
  );
}
