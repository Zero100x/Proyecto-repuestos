'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCompare } from '../lib/compareContext';
import {
  CarIcon,
  SearchIcon,
  CompareIcon,
  BuildingIcon,
  UserIcon,
  MapPinIcon,
  WhatsAppIcon,
  CloseIcon,
} from './Icons';

export default function Navbar() {
  const pathname = usePathname();
  const { comparedParts } = useCompare();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Buscar Repuestos', href: '/search', icon: SearchIcon },
    { label: 'Almacenes y Sedes', href: '/stores', icon: BuildingIcon },
    {
      label: 'Comparador',
      href: '/compare',
      icon: CompareIcon,
      badge: comparedParts.length > 0 ? comparedParts.length : undefined,
    },
  ];

  return (
    <header className="navbar-wrapper glass">
      <div className="container nav-container">
        {/* Logo */}
        <Link href="/" className="logo-box">
          <div className="logo-icon-bg">
            <CarIcon size={22} className="logo-car" />
          </div>
          <div className="logo-text">
            <span className="brand-name">
              Repuestos<span className="brand-highlight">YA</span>
            </span>
            <span className="brand-tagline">Inventario Automotriz Colombia</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          {navLinks.map(link => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} />
                <span>{link.label}</span>
                {link.badge !== undefined && (
                  <span className="nav-badge">{link.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA / User controls */}
        <div className="nav-right">
          <div className="city-pill">
            <MapPinIcon size={14} className="city-pin" />
            <span>Colombia</span>
          </div>

          <Link href="/login" className="btn btn-secondary btn-sm btn-login">
            <UserIcon size={16} />
            <span>Portal Almacén</span>
          </Link>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className="btn-hamburger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <CloseIcon size={24} /> : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer animate-fade-in">
          <div className="container mobile-drawer-content">
            {navLinks.map(link => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`mobile-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon size={20} />
                  <span>{link.label}</span>
                  {link.badge !== undefined && (
                    <span className="nav-badge">{link.badge}</span>
                  )}
                </Link>
              );
            })}

            <div className="mobile-divider" />

            <Link
              href="/login"
              className="btn btn-primary btn-full"
              onClick={() => setMobileMenuOpen(false)}
            >
              <UserIcon size={18} />
              <span>Ingreso Almacenes y Administradores</span>
            </Link>

            <div className="mobile-lead-note">
              <WhatsAppIcon size={16} />
              <span>Cotizaciones y consultas directas sin intermediarios</span>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .navbar-wrapper {
          position: sticky;
          top: 0;
          z-index: 1000;
          border-bottom: 1px solid var(--border-color);
          background: rgba(10, 14, 26, 0.88);
          backdrop-filter: blur(16px);
        }
        .nav-container {
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
        }
        .logo-box {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
        }
        .logo-icon-bg {
          width: 42px;
          height: 42px;
          border-radius: var(--radius-md);
          background: var(--gradient-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        }
        .logo-car {
          color: white;
        }
        .logo-text {
          display: flex;
          flex-direction: column;
        }
        .brand-name {
          font-size: 1.35rem;
          font-weight: 900;
          letter-spacing: -0.03em;
          color: #f1f5f9;
          line-height: 1.1;
        }
        .brand-highlight {
          color: #38bdf8;
          font-style: italic;
        }
        .brand-tagline {
          font-size: 0.65rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .desktop-nav {
          display: none;
          align-items: center;
          gap: 0.5rem;
        }
        @media (min-width: 820px) {
          .desktop-nav {
            display: flex;
          }
        }
        .nav-link {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.5rem 0.85rem;
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-secondary);
          border-radius: var(--radius-md);
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .nav-link:hover,
        .nav-link.active {
          color: #ffffff;
          background: rgba(99, 102, 241, 0.12);
        }
        .nav-badge {
          background: var(--accent-primary);
          color: white;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0.15rem 0.45rem;
          border-radius: var(--radius-full);
          margin-left: 0.2rem;
        }
        .nav-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .city-pill {
          display: none;
          align-items: center;
          gap: 0.35rem;
          padding: 0.35rem 0.75rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        @media (min-width: 640px) {
          .city-pill {
            display: inline-flex;
          }
        }
        .city-pin {
          color: var(--accent-secondary);
        }
        .btn-login {
          display: none;
        }
        @media (min-width: 640px) {
          .btn-login {
            display: inline-flex;
          }
        }
        .btn-hamburger {
          display: flex;
          background: transparent;
          border: none;
          color: var(--text-primary);
          cursor: pointer;
          padding: 0.5rem;
        }
        @media (min-width: 820px) {
          .btn-hamburger {
            display: none;
          }
        }
        .mobile-drawer {
          position: absolute;
          top: 72px;
          left: 0;
          right: 0;
          background: #0d1222;
          border-bottom: 1px solid var(--border-color-hover);
          padding: 1.5rem 0;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
        }
        .mobile-drawer-content {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .mobile-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.85rem 1rem;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          font-weight: 600;
          color: var(--text-primary);
          text-decoration: none;
        }
        .mobile-link.active {
          border-color: var(--accent-primary);
          background: rgba(99, 102, 241, 0.15);
        }
        .mobile-divider {
          height: 1px;
          background: var(--border-color);
          margin: 0.5rem 0;
        }
        .mobile-lead-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          font-size: 0.75rem;
          color: #25d366;
          text-align: center;
        }
      `}</style>
    </header>
  );
}
