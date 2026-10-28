'use client';

import React, { useState } from 'react';
import { ReservationItem } from '../lib/types';
import { formatPriceCOP, buildWhatsAppLink } from '../lib/api';

interface ReservationVoucherModalProps {
  reservation: ReservationItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReservationVoucherModal({
  reservation,
  isOpen,
  onClose,
}: ReservationVoucherModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !reservation) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(reservation.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const expirationDate = new Date(reservation.expiresAt).toLocaleDateString('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  const whatsappMessage = `¡Hola! Acabo de reservar en su sede de AutoPart Pro el repuesto: ${reservation.part.name} con código *${reservation.code}*. Paso a recoger en ${reservation.location.name}.`;
  const sedePhone = reservation.location.whatsapp || reservation.location.phone || '3002001000';
  const whatsappSedeUrl = buildWhatsAppLink(sedePhone, whatsappMessage);

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${reservation.location.name} ${reservation.location.address} ${reservation.location.city}`,
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200 print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-[var(--outline-variant)] overflow-hidden print:max-w-none print:shadow-none print:border-none">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 via-teal-700 to-[var(--primary)] text-white flex justify-between items-center print:bg-none print:text-black print:border-b">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">qr_code_2</span>
            </div>
            <div>
              <h2 className="font-heading text-base font-bold leading-tight">
                Voucher de Reserva en Mostrador
              </h2>
              <p className="font-sans text-[11px] text-teal-100 print:text-gray-600">
                Presenta este código al momento de retirar tu repuesto
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition print:hidden"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Voucher Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Reservation Code Badge */}
          <div className="p-5 bg-gradient-to-b from-slate-50 to-gray-100 rounded-2xl border border-dashed border-gray-300 text-center relative">
            <span className="font-mono text-[10px] text-[var(--secondary)] uppercase tracking-widest font-bold">
              CÓDIGO OFICIAL DE RESERVA
            </span>
            <div className="flex items-center justify-center gap-2 mt-1 mb-2">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-[var(--primary)] tracking-wider">
                {reservation.code}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                title="Copiar código"
                className="p-1.5 rounded-lg bg-white border border-gray-300 text-gray-700 hover:text-[var(--primary)] hover:border-[var(--primary)] transition shadow-sm print:hidden"
              >
                <span className="material-symbols-outlined text-base">
                  {copied ? 'check' : 'content_copy'}
                </span>
              </button>
            </div>

            {copied && (
              <span className="text-[10px] font-mono font-bold text-emerald-600 animate-in fade-in">
                ¡Código copiado al portapapeles!
              </span>
            )}

            {/* QR Code SVG Visual Representation */}
            <div className="mt-3 flex justify-center">
              <div className="p-2.5 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center">
                <svg
                  className="w-28 h-28 text-gray-900"
                  viewBox="0 0 100 100"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Outer corner 1 */}
                  <rect x="5" y="5" width="28" height="28" rx="4" fill="black" />
                  <rect x="9" y="9" width="20" height="20" rx="2" fill="white" />
                  <rect x="13" y="13" width="12" height="12" fill="black" />

                  {/* Outer corner 2 */}
                  <rect x="67" y="5" width="28" height="28" rx="4" fill="black" />
                  <rect x="71" y="9" width="20" height="20" rx="2" fill="white" />
                  <rect x="75" y="13" width="12" height="12" fill="black" />

                  {/* Outer corner 3 */}
                  <rect x="5" y="67" width="28" height="28" rx="4" fill="black" />
                  <rect x="9" y="71" width="20" height="20" rx="2" fill="white" />
                  <rect x="13" y="75" width="12" height="12" fill="black" />

                  {/* Barcode / QR pattern elements */}
                  <rect x="38" y="8" width="6" height="6" fill="black" />
                  <rect x="48" y="8" width="12" height="6" fill="black" />
                  <rect x="38" y="20" width="10" height="6" fill="black" />
                  <rect x="52" y="20" width="8" height="6" fill="black" />
                  <rect x="8" y="38" width="6" height="12" fill="black" />
                  <rect x="20" y="38" width="10" height="6" fill="black" />
                  <rect x="38" y="38" width="14" height="14" rx="2" fill="black" />
                  <rect x="58" y="38" width="8" height="8" fill="black" />
                  <rect x="72" y="38" width="20" height="6" fill="black" />
                  <rect x="78" y="48" width="14" height="6" fill="black" />
                  <rect x="8" y="56" width="18" height="6" fill="black" />
                  <rect x="38" y="58" width="8" height="14" fill="black" />
                  <rect x="52" y="56" width="14" height="6" fill="black" />
                  <rect x="72" y="60" width="8" height="18" fill="black" />
                  <rect x="86" y="60" width="6" height="12" fill="black" />
                  <rect x="38" y="78" width="16" height="8" fill="black" />
                  <rect x="60" y="82" width="18" height="6" fill="black" />
                  <rect x="84" y="78" width="8" height="14" fill="black" />
                </svg>
                <span className="font-mono text-[9px] text-gray-500 mt-1 uppercase font-semibold">
                  Escanear en Mostrador
                </span>
              </div>
            </div>

            {/* Expiration warning pill */}
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-mono text-[11px] font-bold border border-amber-200">
              <span className="material-symbols-outlined text-sm">hourglass_top</span>
              <span>Válido hasta: {expirationDate}</span>
            </div>
          </div>

          {/* Sede Retiro Info Card */}
          <div className="p-4 bg-[var(--surface-container-low)] rounded-xl border border-[var(--outline-variant)]">
            <h4 className="font-heading text-xs font-bold text-[var(--primary)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-[var(--on-tertiary-container)]">
                storefront
              </span>
              <span>Lugar de Retiro Físico</span>
            </h4>

            <div className="space-y-1.5 text-xs">
              <div className="font-heading font-bold text-[var(--primary)]">
                {reservation.location.name}
              </div>
              <div className="text-[var(--secondary)] flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">location_on</span>
                <span>{reservation.location.address}, {reservation.location.city}</span>
              </div>
              <div className="text-[var(--secondary)] flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">schedule</span>
                <span>Lunes a Sábado: 8:00 AM – 6:00 PM</span>
              </div>
            </div>

            <div className="flex gap-2 mt-3 pt-3 border-t border-[var(--outline-variant)] print:hidden">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-white border border-gray-300 text-[var(--primary)] font-heading text-[11px] font-bold text-center hover:bg-gray-50 flex items-center justify-center gap-1 transition shadow-sm"
              >
                <span className="material-symbols-outlined text-xs">near_me</span>
                <span>Ver en Google Maps</span>
              </a>
              <a
                href={whatsappSedeUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-heading text-[11px] font-bold text-center flex items-center justify-center gap-1 transition shadow-sm"
              >
                <span className="material-symbols-outlined text-xs">chat</span>
                <span>WhatsApp Sede</span>
              </a>
            </div>
          </div>

          {/* Product & Total Summary */}
          <div className="p-4 bg-white rounded-xl border border-[var(--outline-variant)] space-y-2">
            <div className="flex justify-between items-start gap-3">
              <div>
                <span className="font-mono text-[10px] text-[var(--secondary)] uppercase font-semibold">
                  {reservation.part.brand || 'OEM'}
                </span>
                <h4 className="font-heading font-bold text-xs text-[var(--primary)]">
                  {reservation.part.name}
                </h4>
                <span className="font-mono text-[11px] text-[var(--secondary)]">
                  Cantidad: {reservation.quantity} unidad(es) × {formatPriceCOP(reservation.unitPrice)}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--outline-variant)] flex justify-between items-center text-xs">
              <span className="font-medium text-[var(--secondary)]">Total a Pagar en Caja:</span>
              <strong className="font-heading font-extrabold text-base text-[var(--primary)]">
                {formatPriceCOP(reservation.totalPrice)}
              </strong>
            </div>

            <div className="pt-1 text-[11px] text-gray-500 font-mono">
              Titular: {reservation.customerName} | Tel: {reservation.customerPhone}
              {reservation.customerDocument && ` | Doc: ${reservation.customerDocument}`}
            </div>
          </div>

          {/* Print & Share actions */}
          <div className="flex items-center gap-3 pt-2 print:hidden">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 py-2.5 px-4 bg-white border border-[var(--outline-variant)] text-[var(--primary)] rounded-xl font-heading text-xs font-bold hover:bg-gray-50 flex items-center justify-center gap-1.5 transition shadow-sm"
            >
              <span className="material-symbols-outlined text-base">print</span>
              <span>Imprimir Voucher</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-[var(--primary)] text-white rounded-xl font-heading text-xs font-bold hover:bg-[#1a2333] flex items-center justify-center gap-1.5 transition shadow-sm"
            >
              <span className="material-symbols-outlined text-base">check</span>
              <span>Entendido / Cerrar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
