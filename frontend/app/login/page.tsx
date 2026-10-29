'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { requestPasswordReset, resetPasswordWithCode } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();

  // Mode: 'login' | 'register'
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Password Recovery 2-Step States
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotInfo, setForgotInfo] = useState('');
  const [devPreviewCode, setDevPreviewCode] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const url =
        mode === 'login'
          ? `${apiBase}/auth/login`
          : `${apiBase}/auth/register`;

      const payload =
        mode === 'login'
          ? { email: email.trim().toLowerCase(), password }
          : {
              email: email.trim().toLowerCase(),
              password,
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              phone: phone.trim() || undefined,
              role: 'BUYER',
            };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.message ||
            (mode === 'login'
              ? 'Credenciales incorrectas. Verifique su correo y contraseña.'
              : 'Error al registrar la cuenta. Verifique los datos ingresados.')
        );
      }

      const authData = await res.json();
      localStorage.setItem('repuestos_token', authData.accessToken || 'token');
      localStorage.setItem('repuestos_user', JSON.stringify(authData.user || { email }));
      window.dispatchEvent(new Event('auth-changed'));

      const hasActiveStore = Boolean(
        authData.user?.storeId ||
        authData.user?.store?.id ||
        authData.user?.roles?.includes('PLATFORM_ADMIN')
      );

      setSuccessMsg(
        mode === 'login'
          ? `¡Bienvenido${authData.user?.firstName ? `, ${authData.user.firstName}` : ''}! Redirigiendo...`
          : '¡Cuenta creada con éxito! Redirigiendo al catálogo...'
      );

      setTimeout(() => {
        if (hasActiveStore) {
          router.push('/dashboard');
        } else {
          router.push('/search');
        }
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión con el servidor de autenticación');
    } finally {
      setLoading(false);
    }
  };

  const openForgotModal = () => {
    setForgotEmail(email.trim());
    setResetStep(1);
    setResetCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setForgotError('');
    setForgotInfo('');
    setDevPreviewCode(null);
    setForgotModalOpen(true);
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = forgotEmail.trim().toLowerCase();
    if (!targetEmail) return;

    setForgotLoading(true);
    setForgotError('');
    setForgotInfo('');
    setDevPreviewCode(null);

    try {
      const res = await requestPasswordReset(targetEmail);
      setForgotInfo(res.message);
      if (res.devCode) {
        setDevPreviewCode(res.devCode);
      }
      setResetStep(2);
    } catch (err: any) {
      setForgotError(err.message || 'No se pudo enviar el código de recuperación');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');

    if (resetCode.trim().length !== 6) {
      setForgotError('Debes ingresar el código exacto de 6 dígitos.');
      return;
    }
    if (newPassword.length < 6) {
      setForgotError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setForgotError('Las contraseñas no coinciden. Verifícalas.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await resetPasswordWithCode({
        email: forgotEmail.trim().toLowerCase(),
        code: resetCode.trim(),
        newPassword,
      });

      // Pre-fill login form and close modal
      setEmail(forgotEmail.trim().toLowerCase());
      setPassword('');
      setMode('login');
      setForgotModalOpen(false);
      setSuccessMsg(
        res.message || '¡Contraseña restablecida con éxito! Ahora puedes iniciar sesión con tu nueva clave.',
      );
    } catch (err: any) {
      setForgotError(err.message || 'Código inválido o expirado.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col justify-between">
      {/* Top Header */}
      <header className="w-full bg-[var(--surface-container-lowest)] border-b border-[var(--outline-variant)] shadow-sm">
        <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded bg-[var(--primary)] flex items-center justify-center text-white shadow-sm border border-[var(--outline-variant)]">
              <span className="material-symbols-outlined text-white text-2xl">
                precision_manufacturing
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-lg font-bold text-[var(--primary)] tracking-tight">
                AutoPart Pro
              </span>
              <span className="font-mono text-[9px] text-[var(--secondary)] tracking-widest uppercase">
                PORTAL PROFESIONAL B2B
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/search"
              className="flex items-center gap-1.5 text-[var(--secondary)] hover:text-[var(--primary)] font-heading text-xs font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-base">storefront</span>
              <span className="hidden sm:inline">Explorar Catálogo</span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-1 text-[var(--secondary)] hover:text-[var(--primary)] font-heading text-xs font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span className="hidden sm:inline">Inicio</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Canvas */}
      <main className="flex-grow flex items-center justify-center py-8 md:py-12 px-4 md:px-8">
        <div className="w-full max-w-[1050px] mx-auto">
          {/* Dual Panel Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl overflow-hidden border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] shadow-[0_12px_40px_rgba(10,31,68,0.06)]">
            
            {/* Left Column: Form */}
            <section className="lg:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-center">
              {/* Header Badge & Title */}
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-slate-100 text-slate-800 font-mono text-[10px] mb-3 border border-slate-200">
                  <span className="material-symbols-outlined text-xs text-emerald-600">lock</span>
                  <span className="font-semibold uppercase tracking-wider">Acceso Seguro • SSL 256-Bit</span>
                </div>
                <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[var(--primary)] tracking-tight mb-2">
                  {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta Profesional'}
                </h1>
                <p className="font-sans text-xs sm:text-sm text-[var(--secondary)] leading-relaxed">
                  {mode === 'login'
                    ? 'Ingresa tus credenciales para acceder a la gestión de inventario, cotizaciones y pedidos.'
                    : 'Regístrate para comprar repuestos certificados o publicar el catálogo de tu almacén.'}
                </p>
              </div>

              {/* Mode switch (Login / Register) */}
              <div className="flex border-b border-[var(--outline-variant)] mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className={`pb-2.5 px-4 font-heading text-xs font-bold transition-all relative ${
                    mode === 'login'
                      ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                      : 'text-[var(--secondary)] hover:text-[var(--primary)]'
                  }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className={`pb-2.5 px-4 font-heading text-xs font-bold transition-all relative ${
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
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-sans text-xs flex items-center gap-2 animate-in fade-in">
                  <span className="material-symbols-outlined text-base text-red-600">error</span>
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-sans text-xs flex items-center gap-2 animate-in fade-in">
                  <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Main Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {mode === 'register' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-mono text-[11px] text-[var(--secondary)] mb-1 uppercase tracking-wider font-semibold">
                          Nombre *
                        </label>
                        <input
                          type="text"
                          required
                          value={firstName}
                          onChange={e => setFirstName(e.target.value)}
                          placeholder="Carlos"
                          className="w-full bg-[var(--surface-container-low)] border border-[var(--outline-variant)] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[var(--on-surface)] focus:border-[var(--primary)] focus:bg-white focus:ring-1 focus:ring-[var(--primary)] transition-all outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[11px] text-[var(--secondary)] mb-1 uppercase tracking-wider font-semibold">
                          Apellido *
                        </label>
                        <input
                          type="text"
                          required
                          value={lastName}
                          onChange={e => setLastName(e.target.value)}
                          placeholder="Mendoza"
                          className="w-full bg-[var(--surface-container-low)] border border-[var(--outline-variant)] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[var(--on-surface)] focus:border-[var(--primary)] focus:bg-white focus:ring-1 focus:ring-[var(--primary)] transition-all outline-none"
                        />
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-2.5 text-xs text-slate-700">
                      <span className="material-symbols-outlined text-base text-[var(--primary)] shrink-0 mt-0.5">
                        storefront
                      </span>
                      <div>
                        <span className="font-heading font-bold text-[var(--primary)]">
                          ¿Tienes un almacén de repuestos en Pasto?
                        </span>{' '}
                        Al crear tu cuenta única podrás registrar tu almacén desde el menú superior para desbloquear tu Panel de Inventario.
                      </div>
                    </div>
                  </>
                )}

                {/* Email Field */}
                <div>
                  <label className="block font-mono text-[11px] text-[var(--secondary)] mb-1 uppercase tracking-wider font-semibold">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--secondary)] text-lg pointer-events-none">
                      mail
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="nombre@empresa.com"
                      autoComplete="email"
                      className="w-full bg-[var(--surface-container-low)] border border-[var(--outline-variant)] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[var(--on-surface)] focus:border-[var(--primary)] focus:bg-white focus:ring-1 focus:ring-[var(--primary)] transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block font-mono text-[11px] text-[var(--secondary)] uppercase tracking-wider font-semibold">
                      Contraseña
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={openForgotModal}
                        className="font-mono text-[11px] text-[var(--primary)] hover:underline font-semibold"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--secondary)] text-lg pointer-events-none">
                      lock
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      className="w-full bg-[var(--surface-container-low)] border border-[var(--outline-variant)] rounded-xl pl-10 pr-11 py-2.5 text-xs sm:text-sm text-[var(--on-surface)] focus:border-[var(--primary)] focus:bg-white focus:ring-1 focus:ring-[var(--primary)] transition-all outline-none"
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

                {/* Phone field on register */}
                {mode === 'register' && (
                  <div>
                    <label className="block font-mono text-[11px] text-[var(--secondary)] mb-1 uppercase tracking-wider font-semibold">
                      Teléfono / WhatsApp de Contacto
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--secondary)] text-lg pointer-events-none">
                        phone
                      </span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+57 300 123 4567"
                        className="w-full bg-[var(--surface-container-low)] border border-[var(--outline-variant)] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[var(--on-surface)] focus:border-[var(--primary)] focus:bg-white focus:ring-1 focus:ring-[var(--primary)] transition-all outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Remember Me Checkbox on Login */}
                {mode === 'login' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-[var(--primary)] border-[var(--outline-variant)] focus:ring-[var(--primary)]"
                    />
                    <label htmlFor="rememberMe" className="font-sans text-xs text-[var(--secondary)] cursor-pointer select-none">
                      Recordar mi sesión en este dispositivo
                    </label>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 bg-[var(--primary)] text-white font-heading text-xs font-bold rounded-xl hover:bg-[var(--primary-container)] transition-all flex justify-center items-center gap-2 shadow-md active:scale-[0.99] disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                      <span>Verificando credenciales...</span>
                    </div>
                  ) : (
                    <>
                      <span>{mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta Profesional'}</span>
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>

              {/* Bottom Mode Switch Prompt */}
              <div className="mt-6 pt-5 border-t border-[var(--outline-variant)] text-center">
                {mode === 'login' ? (
                  <p className="font-sans text-xs text-[var(--secondary)]">
                    ¿No tienes una cuenta aún?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('register')}
                      className="font-heading font-bold text-[var(--primary)] hover:underline"
                    >
                      Regístrate gratis
                    </button>
                  </p>
                ) : (
                  <p className="font-sans text-xs text-[var(--secondary)]">
                    ¿Ya tienes una cuenta registrada?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="font-heading font-bold text-[var(--primary)] hover:underline"
                    >
                      Inicia sesión aquí
                    </button>
                  </p>
                )}
              </div>
            </section>

            {/* Right Column: Industrial Branding Panel */}
            <section className="lg:col-span-5 bg-[var(--primary)] text-white p-8 md:p-12 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-[var(--outline-variant)] relative overflow-hidden">
              <div className="absolute top-0 right-0 translate-x-12 -translate-y-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 font-mono text-[10px] font-bold border border-white/15 mb-6">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  ESTÁNDAR DE CALIDAD OEM &amp; ISO 9001
                </div>

                <h3 className="font-heading text-xl sm:text-2xl font-extrabold mb-4 leading-snug">
                  Gestión Unificada para la Cadena de Suministro Automotriz
                </h3>
                <p className="font-sans text-xs sm:text-sm text-slate-300 mb-8 leading-relaxed">
                  Conexión directa entre almacenes distribuidores y talleres automotrices con verificación de números de parte OEM, equivalencias técnicas y disponibilidad física inmediata.
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mt-0.5">
                      <span className="material-symbols-outlined text-sm">check</span>
                    </div>
                    <div>
                      <div className="font-heading text-xs font-bold text-white">Catálogo Técnico Universal</div>
                      <div className="font-sans text-[11px] text-slate-300">Filtro en cascada por Marca → Modelo → Año → Motor</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mt-0.5">
                      <span className="material-symbols-outlined text-sm">check</span>
                    </div>
                    <div>
                      <div className="font-heading text-xs font-bold text-white">Reservas Click &amp; Collect en Sede</div>
                      <div className="font-sans text-[11px] text-slate-300">Voucher digital con código QR para retiro en mostrador</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mt-0.5">
                      <span className="material-symbols-outlined text-sm">check</span>
                    </div>
                    <div>
                      <div className="font-heading text-xs font-bold text-white">Gestión B2B Multi-Sede</div>
                      <div className="font-sans text-[11px] text-slate-300">Control de inventario, stock bajo y sincronización en tiempo real</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/15 flex items-center justify-between font-mono text-[10px] text-slate-300 relative z-10">
                <span>SEGURIDAD JWT RBAC</span>
                <span>ISO 9001 COMPLIANT</span>
              </div>
            </section>

          </div>
        </div>
      </main>

      {/* 2-Step Password Reset Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[var(--outline-variant)] shadow-2xl max-w-md w-full p-6 sm:p-7 relative">
            <button
              type="button"
              onClick={() => setForgotModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1 rounded-lg transition"
              title="Cerrar"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-[var(--primary)] flex items-center justify-center border border-blue-200 shrink-0">
                <span className="material-symbols-outlined text-2xl">lock_reset</span>
              </div>
              <div>
                <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#e85d04]">
                  PASO {resetStep} DE 2 • SEGURIDAD DE CUENTA
                </div>
                <h3 className="font-heading text-lg font-extrabold text-[var(--primary)]">
                  {resetStep === 1 ? 'Recuperar Contraseña' : 'Verificar Código y Nueva Clave'}
                </h3>
              </div>
            </div>

            {/* Step Indicator Bar */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              <div className={`h-1.5 rounded-full transition-colors ${resetStep >= 1 ? 'bg-[var(--primary)]' : 'bg-gray-200'}`} />
              <div className={`h-1.5 rounded-full transition-colors ${resetStep >= 2 ? 'bg-[#e85d04]' : 'bg-gray-200'}`} />
            </div>

            {forgotError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-sans text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-red-600">error</span>
                <span>{forgotError}</span>
              </div>
            )}

            {forgotInfo && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-sans text-xs flex items-start gap-2">
                <span className="material-symbols-outlined text-base text-emerald-600 mt-0.5">mark_email_read</span>
                <span>{forgotInfo}</span>
              </div>
            )}

            {/* Developer Mode OTP Preview Banner (when SMTP credentials are not yet configured in .env) */}
            {devPreviewCode && resetStep === 2 && (
              <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">terminal</span>
                    <span>Modo Desarrollo Local (Sin SMTP)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setResetCode(devPreviewCode)}
                    className="text-[10px] font-mono font-bold underline text-[var(--primary)] hover:text-blue-800"
                  >
                    Autocompletar código
                  </button>
                </div>
                <p className="text-[11px] text-amber-800">
                  Tu código OTP generado es:{' '}
                  <strong className="font-mono text-sm tracking-widest bg-white px-2 py-0.5 rounded border border-amber-300">
                    {devPreviewCode}
                  </strong>
                </p>
              </div>
            )}

            {resetStep === 1 ? (
              <form onSubmit={handleRequestCode} className="space-y-4">
                <p className="font-sans text-xs text-[var(--secondary)] leading-relaxed">
                  Ingresa el correo electrónico con el que te registraste en AutoPart Pro. Te enviaremos un código de verificación de 6 dígitos para crear una nueva contraseña.
                </p>

                <div>
                  <label className="block font-mono text-[11px] text-[var(--secondary)] mb-1 uppercase font-semibold">
                    Correo Electrónico Registrado *
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--secondary)] text-base">
                      mail
                    </span>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      placeholder="ejemplo@correo.com"
                      className="w-full bg-[var(--surface-container-low)] border border-[var(--outline-variant)] rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-[var(--on-surface)] focus:border-[var(--primary)] focus:bg-white outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="px-4 py-2.5 border border-[var(--outline-variant)] rounded-xl font-heading text-xs font-semibold hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl font-heading text-xs font-bold hover:bg-[var(--primary-container)] transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {forgotLoading ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                        <span>Enviando código...</span>
                      </>
                    ) : (
                      <>
                        <span>Enviar código de recuperación</span>
                        <span className="material-symbols-outlined text-sm">send</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-mono text-[11px] text-[var(--secondary)] uppercase font-semibold">
                      Código de 6 Dígitos *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setResetStep(1);
                        setForgotError('');
                      }}
                      className="font-mono text-[10px] text-[var(--primary)] hover:underline font-semibold"
                    >
                      Cambiar correo ({forgotEmail})
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetCode}
                    onChange={e => setResetCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="000000"
                    className="w-full bg-[var(--surface-container-low)] border border-[var(--outline-variant)] rounded-xl px-4 py-2.5 text-center font-mono text-lg font-extrabold tracking-[0.4em] text-[var(--primary)] focus:border-[var(--primary)] focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[11px] text-[var(--secondary)] mb-1 uppercase font-semibold">
                    Nueva Contraseña (Mín. 6 caracteres) *
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--secondary)] text-base">
                      lock
                    </span>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Escribe tu nueva contraseña"
                      className="w-full bg-[var(--surface-container-low)] border border-[var(--outline-variant)] rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-[var(--on-surface)] focus:border-[var(--primary)] focus:bg-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--secondary)] hover:text-[var(--primary)]"
                    >
                      <span className="material-symbols-outlined text-base">
                        {showNewPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[11px] text-[var(--secondary)] mb-1 uppercase font-semibold">
                    Confirmar Nueva Contraseña *
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--secondary)] text-base">
                      verified_user
                    </span>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmNewPassword}
                      onChange={e => setConfirmNewPassword(e.target.value)}
                      placeholder="Repite la nueva contraseña"
                      className="w-full bg-[var(--surface-container-low)] border border-[var(--outline-variant)] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[var(--on-surface)] focus:border-[var(--primary)] focus:bg-white outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleRequestCode}
                    disabled={forgotLoading}
                    className="px-3 py-2 text-xs font-mono font-semibold text-[var(--secondary)] hover:text-[var(--primary)] transition"
                  >
                    Reenviar código
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setForgotModalOpen(false)}
                      className="px-4 py-2.5 border border-[var(--outline-variant)] rounded-xl font-heading text-xs font-semibold hover:bg-gray-50 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="px-5 py-2.5 bg-[#e85d04] text-white rounded-xl font-heading text-xs font-bold hover:bg-[#dc2f02] transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                    >
                      {forgotLoading ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                          <span>Actualizando...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                          <span>Actualizar Contraseña</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full py-4 text-center border-t border-[var(--outline-variant)] bg-[var(--surface-container-low)]">
        <p className="font-mono text-xs text-[var(--secondary)]">
          © 2026 AutoPart Pro. Plataforma Profesional de Gestión de Repuestos Automotrices.
        </p>
      </footer>
    </div>
  );
}
