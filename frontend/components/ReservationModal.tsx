'use client';

import React, { useState, useEffect } from 'react';
import { Part, InventoryItem, ReservationItem } from '../lib/types';
import { createReservation, formatPriceCOP } from '../lib/api';

interface ReservationModalProps {
  part: Part;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (reservation: ReservationItem) => void;
  initialInventory?: InventoryItem;
}

export default function ReservationModal({
  part,
  isOpen,
  onClose,
  onSuccess,
  initialInventory,
}: ReservationModalProps) {
  const inventoryList = (part.inventory || []).filter(i => i.isAvailable && i.stock > 0);

  const [selectedInventoryId, setSelectedInventoryId] = useState<string>(
    initialInventory?.id || inventoryList[0]?.id || '',
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerDocument, setCustomerDocument] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-fill logged in user info
  useEffect(() => {
    const rawUser = localStorage.getItem('repuestos_user');
    if (rawUser) {
      try {
        const u = JSON.parse(rawUser);
        const fullName = u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : u.name || '';
        if (fullName) setCustomerName(fullName);
        if (u.email) setCustomerEmail(u.email);
        if (u.phone) setCustomerPhone(u.phone);
      } catch (e) {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (initialInventory?.id) {
      setSelectedInventoryId(initialInventory.id);
    } else if (inventoryList.length > 0 && !selectedInventoryId) {
      setSelectedInventoryId(inventoryList[0].id);
    }
  }, [initialInventory, inventoryList]);

  if (!isOpen) return null;

  const currentInv = inventoryList.find(i => i.id === selectedInventoryId) || inventoryList[0];
  const maxStock = currentInv?.stock || 1;
  const unitPrice = currentInv?.price || part.minPrice || 0;
  const totalPrice = unitPrice * quantity;

  const handleQuantityChange = (delta: number) => {
    setQuantity(prev => Math.max(1, Math.min(maxStock, prev + delta)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentInv?.location?.id) {
      setErrorMsg('Debes seleccionar una sede física con existencias disponibles.');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMsg('Por favor ingresa tu nombre y teléfono de contacto.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const reservation = await createReservation({
        partId: part.id,
        locationId: currentInv.location.id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        customerDocument: customerDocument.trim() || undefined,
        quantity,
        notes: notes.trim() || undefined,
      });

      onSuccess(reservation);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al procesar la reserva');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-[var(--outline-variant)] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[var(--primary)] to-[#1a2b49] text-white flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--on-tertiary-container)] text-white flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-lg">shopping_bag</span>
            </div>
            <div>
              <h2 className="font-heading text-base font-bold leading-tight">
                Reservar Repuesto en Sede Física
              </h2>
              <p className="font-sans text-[11px] text-gray-300">
                Click & Collect — Aparta por 48h y paga en mostrador al retirar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Part Summary Card */}
          <div className="flex items-center gap-3 p-3 bg-[var(--surface-container-low)] rounded-xl border border-[var(--outline-variant)]">
            <div className="w-16 h-16 bg-white rounded-lg p-1.5 flex items-center justify-center border border-gray-200 flex-shrink-0">
              <img
                src={part.imageUrl || '/assets/engine.svg'}
                alt={part.name}
                className="max-h-full max-w-full object-contain"
                onError={e => ((e.target as any).src = '/assets/engine.svg')}
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-mono text-[10px] text-[var(--secondary)] uppercase font-semibold">
                {part.brand || 'OEM'}
              </span>
              <h3 className="font-heading font-bold text-xs text-[var(--primary)] truncate">
                {part.name}
              </h3>
              <div className="flex items-center justify-between mt-1">
                <span className="font-heading font-extrabold text-sm text-[var(--primary)]">
                  {formatPriceCOP(unitPrice)}
                </span>
                <span className="text-[10px] font-mono text-[#059669] bg-[#ecfdf5] border border-[#a7f3d0] px-2 py-0.5 rounded-full font-bold">
                  En Stock Inmediato
                </span>
              </div>
            </div>
          </div>

          {/* Choose Location & Sede */}
          <div>
            <label className="block font-heading text-xs font-bold text-[var(--primary)] mb-1.5 flex items-center justify-between">
              <span>Sede de Retiro Físico *</span>
              <span className="text-[11px] text-[var(--secondary)] font-normal">
                {inventoryList.length} sedes disponibles
              </span>
            </label>

            <div className="space-y-2">
              {inventoryList.length > 0 ? (
                inventoryList.map(inv => {
                  const isSelected = inv.id === (currentInv?.id || '');
                  return (
                    <div
                      key={inv.id}
                      onClick={() => setSelectedInventoryId(inv.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-[var(--primary)] bg-blue-50/40 ring-1 ring-[var(--primary)]'
                          : 'border-[var(--outline-variant)] hover:bg-[var(--surface-container-low)]'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className={`material-symbols-outlined text-lg mt-0.5 ${isSelected ? 'text-[var(--primary)]' : 'text-gray-400'}`}>
                          {isSelected ? 'radio_button_checked' : 'radio_button_unchecked'}
                        </span>
                        <div>
                          <div className="font-heading font-bold text-xs text-[var(--primary)]">
                            {inv.location?.name || 'Sede Distribución'}
                          </div>
                          <div className="text-[11px] text-[var(--secondary)] flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-[13px]">location_on</span>
                            {inv.location?.address}, {inv.location?.city}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-heading font-bold text-xs text-[var(--primary)]">
                          {formatPriceCOP(inv.price)}
                        </div>
                        <div className="font-mono text-[10px] text-[#059669] font-bold">
                          {inv.stock} en stock
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-[var(--secondary)] italic">
                  Coordinación de despacho directo con el centro logístico principal.
                </p>
              )}
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center justify-between p-3 bg-[var(--surface-container-low)] rounded-xl border border-[var(--outline-variant)]">
            <div>
              <span className="font-heading text-xs font-bold text-[var(--primary)] block">
                Cantidad a Reservar
              </span>
              <span className="font-mono text-[10px] text-[var(--secondary)]">
                Máximo {maxStock} unidades disponibles en sede
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                className="w-8 h-8 rounded-lg bg-white border border-[var(--outline-variant)] text-[var(--primary)] font-bold flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 transition"
              >
                -
              </button>
              <span className="font-mono text-sm font-bold w-8 text-center text-[var(--primary)]">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= maxStock}
                className="w-8 h-8 rounded-lg bg-white border border-[var(--outline-variant)] text-[var(--primary)] font-bold flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 transition"
              >
                +
              </button>
            </div>
          </div>

          {/* Customer Form Info */}
          <div className="space-y-3 pt-1">
            <h4 className="font-heading text-xs font-bold text-[var(--primary)] uppercase tracking-wider">
              Datos para la Entrega en Mostrador
            </h4>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--primary)] mb-1">
                Nombre Completo o Taller Mecánico *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Taller Automotriz Gómez / Carlos Méndez"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--outline-variant)] bg-white focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--primary)] mb-1">
                  Teléfono Móvil / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ej: 3001234567"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--outline-variant)] bg-white focus:outline-none focus:ring-1 focus:ring-[var(--primary)] font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--primary)] mb-1">
                  Cédula o NIT <span className="text-[var(--secondary)] font-normal">(Recomendado)</span>
                </label>
                <input
                  type="text"
                  placeholder="Para validar al retirar"
                  value={customerDocument}
                  onChange={e => setCustomerDocument(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--outline-variant)] bg-white focus:outline-none focus:ring-1 focus:ring-[var(--primary)] font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--primary)] mb-1">
                Correo Electrónico <span className="text-[var(--secondary)] font-normal">(Para enviar voucher)</span>
              </label>
              <input
                type="email"
                placeholder="correo@ejemplo.com"
                value={customerEmail}
                onChange={e => setCustomerEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--outline-variant)] bg-white focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[var(--primary)] mb-1">
                Notas adicionales / Hora estimada de retiro (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: Retiro hoy a las 4:30 PM, vehículo placa XYZ-123"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--outline-variant)] bg-white focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>
          </div>

          {/* Value Summary Bar */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-amber-900 font-medium">Total a pagar al retirar:</span>
              <strong className="font-heading font-extrabold text-base text-[var(--primary)]">
                {formatPriceCOP(totalPrice)}
              </strong>
            </div>
            <p className="text-[10px] text-amber-800 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">schedule</span>
              <span>
                Reserva activa durante <strong>48 Horas</strong>. Pagas en mostrador en efectivo o datáfono.
              </span>
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-xs font-heading font-semibold text-[var(--secondary)] hover:text-[var(--primary)] rounded-xl border border-[var(--outline-variant)] hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-2 py-3 px-5 bg-[var(--on-tertiary-container)] hover:bg-[#c25100] text-white font-heading font-bold text-xs rounded-xl transition shadow-[0_4px_16px_rgba(227,95,0,0.3)] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="material-symbols-outlined text-base animate-spin">refresh</span>
              ) : (
                <span className="material-symbols-outlined text-base">check_circle</span>
              )}
              <span>Confirmar Reserva Gratuita</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
