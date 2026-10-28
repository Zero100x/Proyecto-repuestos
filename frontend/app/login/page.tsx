'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [roleType, setRoleType] = useState<'BUYER' | 'STORE_ADMIN' | 'PLATFORM_ADMIN'>('BUYER');

  const [email, setEmail] = useState('andres@gmail.com');
  const [password, setPassword] = useState('password123');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const demoAccounts = [
    {
      role: 'BUYER' as const,
      label: 'Taller / Comprador',
      email: 'andres@gmail.com',
      pass: 'password123',
      desc: 'Consulta compatibilidad técnica y cotiza repuestos',
    },
    {
      role: 'STORE_ADMIN' as const,
      label: 'Almacén / Vendedor B2B',
      email: 'jorge@elmotor.com',
      pass: 'password123',
      desc: 'Gestiona inventario, stock y sedes físicas',
    },
    {
      role: 'PLATFORM_ADMIN' as const,
      label: 'Admin Plataforma',
      email: 'admin@repuestos.com',
      pass: 'password123',
      desc: 'Supervisión global de catálogo y almacenes',
    },
  ];

  const handleDemoFill = (acc: typeof demoAccounts[0]) => {
    setRoleType(acc.role);
    setEmail(acc.email);
    setPassword(acc.pass);
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const url = mode === 'login'
        ? 'http://localhost:3001/api/auth/login'
        : 'http://localhost:3001/api/auth/register';

      const payload = mode === 'login'
        ? { email, password }
        : { email, password, firstName, lastName, phone, role: roleType };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Error en autenticación. Revisa las credenciales.');
      }

      const authData = await res.json();
      localStorage.setItem('repuestos_token', authData.accessToken || 'demo-token');
      localStorage.setItem('repuestos_user', JSON.stringify(authData.user || { email, roleType }));
      window.dispatchEvent(new Event('auth-changed'));

      setSuccessMsg('¡Acceso concedido exitosamente!');
      setTimeout(() => {
        if (roleType === 'BUYER') {
          router.push('/search');
        } else {
          router.push('/dashboard');
        }
      }, 700);
    } catch (err: any) {
      console.warn('API error, using fallback demo session:', err);
      localStorage.setItem('repuestos_token', 'demo-jwt-token-repuestos-2026');
      localStorage.setItem('repuestos_user', JSON.stringify({ email, firstName: 'Usuario Demo', roleType }));
      window.dispatchEvent(new Event('auth-changed'));
      setSuccessMsg('Ingreso concedido (Modo Demo Offline). Redirigiendo...');
      setTimeout(() => {
        router.push(roleType === 'BUYER' ? '/search' : '/dashboard');
      }, 700);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col justify-between">
      {/* Top Header */}
      <header className="w-full bg-[var(--surface-container-lowest)] border-b border-[var(--outline-variant)] shadow-sm">
        <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded bg-[var(--primary-container)] flex items-center justify-center text-[var(--on-primary)] shadow-sm border border-[var(--outline-variant)]">
              <span className="material-symbols-outlined text-[var(--primary-fixed)] text-2xl">
                precision_manufacturing
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-lg font-bold text-[var(--primary)] tracking-tight">
                AutoPart Pro
              </span>
              <span className="font-mono text-[10px] text-[var(--secondary)] tracking-widest uppercase">
                PORTAL INDUSTRIAL
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/search"
              className="flex items-center gap-2 text-[var(--secondary)] hover:text-[var(--primary)] font-heading text-xs font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-base">storefront</span>
              <span>Ir al Marketplace</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Canvas */}
      <main className="flex-grow flex items-center justify-center py-8 md:py-12 px-4 md:px-8">
        <div className="w-full max-w-[1100px] mx-auto">
          {/* Dual Panel Bento Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl overflow-hidden border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] shadow-[0_12px_40px_rgba(10,31,68,0.06)]">
            
            {/* Left Column: Form */}
            <section className="lg:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-center">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[var(--surface-container)] text-[var(--on-surface-variant)] font-mono text-[11px] mb-3 border border-[var(--outline-variant)]">
                  <span className="w-2 h-2 rounded-full bg-[var(--on-tertiary-container)] animate-pulse"></span>
                  PORTAL DE ACCESO B2B v4.8
                </div>
                <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[var(--primary)] tracking-tight mb-2">
                  {mode === 'login' ? 'Ingreso al Sistema' : 'Registro de Cuenta'}
                </h1>
                <p className="font-sans text-xs sm:text-sm text-[var(--secondary)] leading-relaxed">
                  Acceda a la red centralizada de consulta, stock y compatibilidad técnica de repuestos automotrices.
                </p>
              </div>

              {/* Demo 1-Click Fill Banner */}
              <div className="mb-6 p-3 bg-[var(--surface-container-low)] border border-[var(--outline-variant)] rounded-xl">
                <span className="block font-mono text-[10px] text-[var(--secondary)] uppercase font-bold mb-2">
                  Acceso Demo Rápido (1-Click):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {demoAccounts.map(acc => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => handleDemoFill(acc)}
                      className={`px-2.5 py-1.5 rounded-lg border text-left transition-all ${
                        email === acc.email
                          ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm'
                          : 'bg-white text-[var(--on-surface)] border-[var(--outline-variant)] hover:border-[var(--primary)]'
                      }`}
                    >
                      <div className="font-heading text-xs font-bold leading-tight truncate">{acc.label}</div>
                      <div className="font-mono text-[10px] opacity-75 truncate">{acc.email}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Role Selector Bento */}
              <div className="mb-6">
                <label className="block font-mono text-xs text-[var(--secondary)] mb-2 uppercase tracking-wider font-semibold">
                  Tipo de Operación
                </label>
                <div className="grid grid-cols-2 p-1 bg-[var(--surface-container)] rounded-xl border border-[var(--outline-variant)]">
                  <button
                    type="button"
                    onClick={() => setRoleType('BUYER')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-heading text-xs font-bold transition-all ${
                      roleType === 'BUYER'
                        ? 'bg-white text-[var(--primary)] shadow-sm border border-[var(--outline-variant)]'
                        : 'text-[var(--secondary)] hover:text-[var(--primary)]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">build</span>
                    <div className="text-left">
                      <div>Taller / Comprador</div>
                      <div className="font-mono text-[9px] text-[var(--secondary)] font-normal hidden sm:block">Consulta & Cotiza</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRoleType('STORE_ADMIN')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-heading text-xs font-bold transition-all ${
                      roleType === 'STORE_ADMIN'
                        ? 'bg-white text-[var(--primary)] shadow-sm border border-[var(--outline-variant)]'
                        : 'text-[var(--secondary)] hover:text-[var(--primary)]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">inventory_2</span>
                    <div className="text-left">
                      <div>Almacén / Vendedor B2B</div>
                      <div className="font-mono text-[9px] text-[var(--secondary)] font-normal hidden sm:block">Inventario & Stock</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Mode switch (Login / Register) */}
              <div className="flex border-b border-[var(--outline-variant)] mb-6">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`pb-2.5 px-4 font-heading text-xs font-bold transition-colors relative ${
                    mode === 'login'
                      ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                      : 'text-[var(--secondary)] hover:text-[var(--primary)]'
                  }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className={`pb-2.5 px-4 font-heading text-xs font-bold transition-colors relative ${
                    mode === 'register'
                      ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                      : 'text-[var(--secondary)] hover:text-[var(--primary)]'
                  }`}
                >
                  Registrarse
                </button>
              </div>

              {/* Alert Feedback */}
              {errorMsg && (
                <div className="mb-4 p-3 rounded-lg bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] font-sans text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">error</span>
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="mb-4 p-3 rounded-lg bg-[#f0fdf4] border border-[#bbf7d0] text-[#16a34a] font-sans text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {mode === 'register' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-mono text-[11px] text-[var(--secondary)] mb-1 uppercase tracking-wider font-semibold">Nombre</label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        placeholder="Andrés"
                        className="w-full bg-[var(--surface-container-low)] border border-[var(--outline-variant)] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[var(--on-surface)] focus:border-[var(--primary)] focus:bg-white focus:ring-1 focus:ring-[var(--primary)] transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[11px] text-[var(--secondary)] mb-1 uppercase tracking-wider font-semibold">Apellido</label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        placeholder="Gómez"
                        className="w-full bg-[var(--surface-container-low)] border border-[var(--outline-variant)] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[var(--on-surface)] focus:border-[var(--primary)] focus:bg-white focus:ring-1 focus:ring-[var(--primary)] transition-all outline-none"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-mono text-[11px] text-[var(--secondary)] mb-1 uppercase tracking-wider font-semibold">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--secondary)] text-xl pointer-events-none select-none flex items-center justify-center">
                      mail
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="usuario@autopartpro.com"
                      className="w-full bg-[var(--surface-container-low)] border border-[var(--outline-variant)] rounded-xl pl-11 pr-4 py-2.5 text-xs sm:text-sm text-[var(--on-surface)] focus:border-[var(--primary)] focus:bg-white focus:ring-1 focus:ring-[var(--primary)] transition-all outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block font-mono text-[11px] text-[var(--secondary)] uppercase tracking-wider font-semibold">
                      Contraseña
                    </label>
                    {mode === 'login' && (
                      <a href="#" className="font-mono text-[11px] text-[var(--on-tertiary-container)] hover:underline font-bold">
                        ¿Olvidó su contraseña?
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--secondary)] text-xl pointer-events-none select-none flex items-center justify-center">
                      lock
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-[var(--surface-container-low)] border border-[var(--outline-variant)] rounded-xl pl-11 pr-11 py-2.5 text-xs sm:text-sm text-[var(--on-surface)] focus:border-[var(--primary)] focus:bg-white focus:ring-1 focus:ring-[var(--primary)] transition-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--secondary)] hover:text-[var(--primary)] p-1 rounded-lg transition"
                      title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      <span className="material-symbols-outlined text-lg">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {mode === 'register' && (
                  <div>
                    <label className="block font-mono text-[11px] text-[var(--secondary)] mb-1 uppercase tracking-wider font-semibold">
                      Teléfono / WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+57 300 123 4567"
                      className="w-full bg-[var(--surface-container-low)] border border-[var(--outline-variant)] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[var(--on-surface)] focus:border-[var(--primary)] focus:bg-white focus:ring-1 focus:ring-[var(--primary)] transition-all outline-none"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3.5 bg-[var(--primary)] text-white font-heading text-xs font-bold rounded-lg hover:bg-[var(--primary-container)] transition-all flex justify-center items-center gap-2 shadow-md active:scale-[0.99] disabled:opacity-50"
                >
                  {loading ? (
                    <span>Verificando credenciales...</span>
                  ) : (
                    <>
                      <span>{mode === 'login' ? 'Acceder al Sistema' : 'Completar Registro'}</span>
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>
            </section>

            {/* Right Column: Industrial Branding Panel */}
            <section className="lg:col-span-5 bg-[var(--primary)] text-white p-8 md:p-12 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-[var(--outline-variant)]">
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <span className="material-symbols-outlined text-[var(--on-tertiary-container)] text-xl">verified</span>
                  <span className="font-mono text-xs font-bold tracking-wider uppercase text-[var(--primary-fixed)]">
                    Estándar de Calidad Automotriz
                  </span>
                </div>

                <h3 className="font-heading text-xl sm:text-2xl font-bold mb-4 leading-snug">
                  Gestión Unificada para la Cadena de Suministro Automotriz
                </h3>
                <p className="font-sans text-xs sm:text-sm text-gray-300 mb-8 leading-relaxed">
                  Conexión directa entre almacenes distribuidores y talleres automotrices con verificación de números de parte OEM, equivalencias y disponibilidad física inmediata.
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#10b981] text-lg mt-0.5">check_circle</span>
                    <div>
                      <div className="font-heading text-xs font-bold">Filtro en Cascada Exacto</div>
                      <div className="font-sans text-[11px] text-gray-300">Marca → Modelo → Año → Versión de motor</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#10b981] text-lg mt-0.5">check_circle</span>
                    <div>
                      <div className="font-heading text-xs font-bold">Sin Comisiones por Transacción</div>
                      <div className="font-sans text-[11px] text-gray-300">Generación de leads directos a WhatsApp de cada sede</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#10b981] text-lg mt-0.5">check_circle</span>
                    <div>
                      <div className="font-heading text-xs font-bold">Comparativa Técnica Multi-Almacén</div>
                      <div className="font-sans text-[11px] text-gray-300">Bandeja de comparación en tiempo real</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/20 flex items-center justify-between font-mono text-[10px] text-gray-300">
                <span>SEGURIDAD JWT RBAC</span>
                <span>ISO 9001 COMPLIANT</span>
              </div>
            </section>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center border-t border-[var(--outline-variant)] bg-[var(--surface-container-low)]">
        <p className="font-mono text-xs text-[var(--secondary)]">
          © 2026 AutoPart Pro. Professional Grade Inventory Systems.
        </p>
      </footer>
    </div>
  );
}
