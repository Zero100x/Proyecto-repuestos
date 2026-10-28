'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCompare } from '../lib/compareContext';

interface CurrentUserSession {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  roleType?: string;
  role?: string;
  roles?: string[];
  storeId?: string | null;
  store?: { id?: string; name?: string };
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { comparedParts } = useCompare();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<CurrentUserSession | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    const checkAuth = () => {
      const token = localStorage.getItem('repuestos_token') || localStorage.getItem('token');
      const rawUser = localStorage.getItem('repuestos_user') || localStorage.getItem('user');
      if (token && rawUser) {
        try {
          setUser(JSON.parse(rawUser));
        } catch {
          setUser({ email: 'Usuario' });
        }
      } else {
        setUser(null);
      }
    };

    checkAuth();
    window.addEventListener('storage', checkAuth);
    window.addEventListener('auth-changed', checkAuth);

    // Close user dropdown when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('auth-changed', checkAuth);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('repuestos_token');
    localStorage.removeItem('repuestos_user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    window.dispatchEvent(new Event('auth-changed'));
    if (pathname === '/dashboard') {
      router.push('/login');
    }
  };

  const navLinks = [
    { label: 'Marketplace', href: '/search' },
    { label: 'Almacenes', href: '/stores' },
    {
      label: 'Comparador',
      href: '/compare',
      badge: mounted && comparedParts.length > 0 ? comparedParts.length : undefined,
    },
  ];

  const displayName = user
    ? user.firstName
      ? `${user.firstName} ${user.lastName || ''}`.trim()
      : user.name || user.email?.split('@')[0] || 'Mi Cuenta'
    : '';

  const storeName = user?.store?.name || (user?.roles?.includes('STORE_ADMIN') ? 'Almacén' : '');

  const isStoreUser = Boolean(
    user && (
      user.roles?.includes('STORE_ADMIN') ||
      user.roles?.includes('ADMIN') ||
      user.roleType === 'STORE' ||
      (user as any).role === 'STORE' ||
      user.storeId ||
      user.store
    )
  );

  return (
    <header className="bg-surface fixed top-0 left-0 w-full z-50 border-b border-outline-variant shadow-sm backdrop-blur-md bg-surface/95">
      <div className="flex justify-between items-center px-4 md:px-margin-desktop py-3.5 max-w-container-max-width mx-auto">
        {/* Brand & Desktop Navigation */}
        <div className="flex items-center gap-6 md:gap-gutter">
          <Link
            href="/"
            className="font-heading text-xl md:text-2xl font-extrabold text-primary tracking-tight flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded bg-primary-container text-on-primary flex items-center justify-center border border-outline-variant">
              <span className="material-symbols-outlined text-lg text-primary-fixed">
                precision_manufacturing
              </span>
            </div>
            <span>AutoPart Pro</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 ml-6">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href || pathname?.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`font-label-sm text-label-sm transition-colors duration-200 relative pb-1 ${
                    isActive
                      ? 'text-primary border-b-2 border-primary font-bold'
                      : 'text-secondary hover:text-primary'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.badge ? (
                    <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-mono font-bold bg-on-tertiary-container text-white rounded-full">
                      {link.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 sm:gap-4">
          {mounted && isStoreUser && (
            <Link
              href="/dashboard"
              className="hidden sm:flex items-center gap-1.5 bg-primary text-on-primary font-button text-button px-4 py-2 rounded hover:bg-primary-container transition-all active:scale-95 shadow-sm animate-in fade-in"
            >
              <span className="material-symbols-outlined text-[18px]">add_business</span>
              <span>Publicar Repuesto</span>
            </Link>
          )}

          <Link
            href="/compare"
            className="text-secondary hover:text-primary transition-colors p-1 relative"
            title="Bandeja de Comparación"
          >
            <span className="material-symbols-outlined text-[22px]">balance</span>
            {comparedParts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-on-tertiary-container text-white font-mono text-[9px] font-bold rounded-full flex items-center justify-center">
                {comparedParts.length}
              </span>
            )}
          </Link>

          {/* User Session / Auth Controls */}
          {mounted && user ? (
            <div className="relative" ref={menuRef}>
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 pr-3 bg-surface-container-low hover:bg-surface-container rounded-full border border-outline-variant hover:border-primary transition-all text-left"
                  title="Cuenta de usuario"
                >
                  <div className="w-7 h-7 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center shadow-sm">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden lg:block text-xs leading-tight">
                    <div className="font-heading font-bold text-primary truncate max-w-[120px]">
                      {displayName}
                    </div>
                    {storeName && (
                      <div className="font-mono text-[9px] text-secondary truncate max-w-[120px]">
                        {storeName}
                      </div>
                    )}
                  </div>
                  <span className="material-symbols-outlined text-sm text-secondary">
                    {userMenuOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {/* Direct quick logout button for desktop */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200/80 rounded-lg transition-colors font-heading font-semibold"
                  title="Cerrar Sesión / Salir de la cuenta"
                >
                  <span className="material-symbols-outlined text-[17px]">logout</span>
                  <span className="hidden xl:inline">Salir</span>
                </button>
              </div>

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-outline-variant py-2 z-50 animate-in fade-in slide-in-from-top-1">
                  <div className="px-4 py-2.5 border-b border-outline-variant bg-surface-container-lowest">
                    <div className="font-heading font-bold text-xs text-primary truncate">
                      {displayName}
                    </div>
                    <div className="font-mono text-[10px] text-secondary truncate mt-0.5">
                      {user.email || ''}
                    </div>
                    {storeName && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary font-mono text-[9px] font-bold rounded">
                        {storeName}
                      </span>
                    )}
                  </div>

                  <Link
                    href="/dashboard"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-primary hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-base text-secondary">
                      dashboard
                    </span>
                    <span>Panel de Control B2B</span>
                  </Link>

                  <Link
                    href="/search"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-primary hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-base text-secondary">
                      storefront
                    </span>
                    <span>Explorar Catálogo</span>
                  </Link>

                  <div className="my-1 border-t border-outline-variant" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 transition-colors text-left font-bold"
                  >
                    <span className="material-symbols-outlined text-base">logout</span>
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="hidden md:inline-flex text-secondary hover:text-primary font-button text-button px-3 py-2 transition-colors duration-200"
              >
                Acceso B2B
              </Link>

              <Link
                href="/login"
                className="w-8 h-8 rounded-full bg-surface-variant overflow-hidden border border-outline-variant flex items-center justify-center hover:border-primary transition-colors"
                title="Iniciar Sesión"
              >
                <img
                  src="/assets/avatar.svg"
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </Link>
            </div>
          )}

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-primary p-1 focus:outline-none"
            aria-label="Abrir menú"
          >
            <span className="material-symbols-outlined text-2xl">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-surface-container-lowest border-t border-outline-variant px-4 py-4 flex flex-col gap-3 shadow-lg">
          {/* User info if logged in */}
          {user && (
            <div className="p-3 bg-surface-container rounded-xl flex items-center justify-between border border-outline-variant mb-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-heading font-bold text-xs text-primary">{displayName}</div>
                  <div className="font-mono text-[10px] text-secondary">{user.email}</div>
                </div>
              </div>
            </div>
          )}

          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="font-label-sm text-sm py-2 px-3 rounded hover:bg-surface-container text-on-surface flex justify-between items-center"
            >
              <span>{link.label}</span>
              {link.badge ? (
                <span className="px-2 py-0.5 text-xs font-mono font-bold bg-on-tertiary-container text-white rounded-full">
                  {link.badge}
                </span>
              ) : null}
            </Link>
          ))}

          <div className="pt-2 border-t border-outline-variant flex flex-col gap-2">
            {mounted && isStoreUser && (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 bg-primary text-white rounded font-button text-xs font-bold"
              >
                Portal Almacén / Publicar
              </Link>
            )}

            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded font-button text-xs font-bold hover:bg-red-100 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                <span>Cerrar Sesión</span>
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 border border-outline-variant rounded font-button text-xs text-primary"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
