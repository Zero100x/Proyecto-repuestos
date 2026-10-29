'use client';

import React, { useState, useEffect } from 'react';
import { Part, InventoryItem } from '../lib/types';
import { formatPriceCOP, buildWhatsAppLink, createLead, fetchPartById, resolveImageUrl } from '../lib/api';
import { WhatsAppIcon } from './Icons';

interface WhatsAppLeadModalProps {
  part: Part;
  isOpen: boolean;
  onClose: () => void;
  selectedInventory?: InventoryItem;
}

export default function WhatsAppLeadModal({
  part,
  isOpen,
  onClose,
  selectedInventory,
}: WhatsAppLeadModalProps) {
  const [fetchedInventory, setFetchedInventory] = useState<InventoryItem[]>(part.inventory || []);

  useEffect(() => {
    if (isOpen) {
      if (!part.inventory || part.inventory.length === 0) {
        fetchPartById(part.id).then(full => {
          if (full?.inventory && full.inventory.length > 0) {
            setFetchedInventory(full.inventory);
            setSelectedInv(full.inventory[0]);
          }
        });
      } else {
        setFetchedInventory(part.inventory);
      }
    }
  }, [isOpen, part.id, part.inventory]);

  const inventoryList = fetchedInventory;
  const [selectedInv, setSelectedInv] = useState<InventoryItem>(
    selectedInventory || inventoryList[0] || ({} as InventoryItem)
  );
  const [buyerName, setBuyerName] = useState('');
  const [buyerCity, setBuyerCity] = useState(selectedInv.location?.city || 'Pasto');
  const [userNote, setUserNote] = useState('');

  const targetLocation = selectedInv.location;
  const targetStore = targetLocation?.store;
  const storeDisplayName = targetStore?.name || part.storeNames?.[0] || 'Almacén Aliado';
  const phoneNumber = targetLocation?.whatsapp || targetLocation?.phone || targetStore?.phone || '+573002001001';

  const oemText = part.partNumbers?.length ? ` (Ref OEM: ${part.partNumbers[0].number})` : '';
  const priceText = selectedInv.price ? formatPriceCOP(selectedInv.price) : 'Precio a convenir';

  const [submitting, setSubmitting] = useState(false);

  const defaultMessage = `Hola ${storeDisplayName} de ${targetLocation?.name || 'su sede en Pasto'}. Vi en AutoPart Pro su producto: "${part.name}"${oemText} con precio ${priceText}. ${
    buyerName ? `Mi nombre es ${buyerName}. ` : ''
  }${buyerCity ? `Me encuentro en ${buyerCity}. ` : ''}${
    userNote ? `Pregunta: ${userNote}` : '¿Tienen disponibilidad inmediata para recoger hoy o realizar envío?'
  }`;

  const handleLaunchWhatsApp = async () => {
    setSubmitting(true);
    try {
      const storeId = targetStore?.id || targetLocation?.storeId || '41c776f7-c502-496d-82b2-085997b8390c';
      await createLead({
        storeId,
        partId: part.id,
        locationId: targetLocation?.id,
        buyerName: buyerName.trim() || undefined,
        buyerCity: buyerCity.trim() || undefined,
        buyerMessage: userNote.trim() || undefined,
        quotedPrice: selectedInv.price || undefined,
        sourceUrl: typeof window !== 'undefined' ? window.location.pathname : undefined,
      }).catch(err => console.warn('Could not track lead:', err));
    } finally {
      const url = buildWhatsAppLink(phoneNumber, defaultMessage);
      window.open(url, '_blank', 'noopener,noreferrer');
      setSubmitting(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-[var(--outline-variant)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--outline-variant)] bg-white flex justify-between items-start">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Lead Directo Sin Comisiones</span>
            </div>
            <h3 className="font-heading text-lg sm:text-xl font-extrabold text-[var(--primary)]">
              Contactar al Almacén por WhatsApp
            </h3>
            <p className="font-sans text-xs text-[var(--secondary)] mt-0.5">
              Consulta disponibilidad y cotiza directamente con el asesor del almacén.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Resumen del repuesto */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[var(--surface-container-low)] border border-[var(--outline-variant)]">
            <div className="w-16 h-16 rounded-xl bg-white border border-[var(--outline-variant)] overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
              <img
                src={resolveImageUrl(part.imageUrl)}
                alt={part.name}
                className="w-full h-full object-contain"
                onError={e => ((e.target as any).src = '/assets/engine.svg')}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-heading text-xs sm:text-sm font-bold text-[var(--primary)] line-clamp-2">
                {part.name}
              </h4>
              <p className="font-sans text-[11px] text-[var(--secondary)] mt-0.5">
                {part.brand || 'Estándar OEM'} • {part.category?.name || 'Repuestos'}
              </p>
              <div className="font-mono text-sm font-extrabold text-[#059669] mt-1">
                {selectedInv.price ? formatPriceCOP(selectedInv.price) : 'Consultar precio'}
              </div>
            </div>
          </div>

          {/* Selector de sede (si hay más de una) */}
          {inventoryList.length > 1 && (
            <div>
              <label className="block font-heading text-xs font-bold text-[var(--primary)] mb-1">
                Selecciona la Sede / Almacén a contactar:
              </label>
              <select
                className="w-full px-3 py-2 bg-white border border-[var(--outline-variant)] rounded-xl font-sans text-xs focus:outline-none focus:border-[var(--primary)] text-gray-900"
                value={selectedInv.id}
                onChange={e => {
                  const found = inventoryList.find(i => i.id === e.target.value);
                  if (found) setSelectedInv(found);
                }}
              >
                {inventoryList.map(inv => (
                  <option key={inv.id} value={inv.id}>
                    {inv.location?.name} ({inv.location?.city}) — {formatPriceCOP(inv.price)} — Stock: {inv.stock}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Info de la sede */}
          {targetLocation && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2 text-xs text-[var(--primary)]">
                <span className="material-symbols-outlined text-base text-emerald-600 flex-shrink-0">store</span>
                <span className="font-bold">{storeDisplayName}</span>
                {targetLocation.name && (
                  <span className="text-[var(--secondary)] font-normal">({targetLocation.name})</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="material-symbols-outlined text-base text-gray-400 flex-shrink-0">location_on</span>
                <span>{targetLocation.address}, {targetLocation.city}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-emerald-200/60 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                  <span className="material-symbols-outlined text-sm text-emerald-600">verified</span>
                  <span>Almacén Aliado Verificado</span>
                </div>
                <div className="flex items-center gap-1 font-mono text-gray-600">
                  <span className="text-[11px]">WhatsApp:</span>
                  <span className="font-bold text-gray-900">{phoneNumber}</span>
                </div>
              </div>
            </div>
          )}

          {/* Formulario rápido */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-heading text-xs font-bold text-[var(--primary)] mb-1">
                Tu Nombre (Opcional)
              </label>
              <input
                type="text"
                className="w-full px-3.5 py-2.5 bg-white border border-[var(--outline-variant)] rounded-xl font-sans text-xs focus:outline-none focus:border-[var(--primary)] text-gray-900 placeholder:text-gray-400"
                placeholder="Ej: Carlos Rodríguez"
                value={buyerName}
                onChange={e => setBuyerName(e.target.value)}
              />
            </div>
            <div>
              <label className="block font-heading text-xs font-bold text-[var(--primary)] mb-1">
                Tu Ciudad / Barrio
              </label>
              <input
                type="text"
                className="w-full px-3.5 py-2.5 bg-white border border-[var(--outline-variant)] rounded-xl font-sans text-xs focus:outline-none focus:border-[var(--primary)] text-gray-900 placeholder:text-gray-400"
                placeholder="Ej: Pasto, Ipiales, Bucheli..."
                value={buyerCity}
                onChange={e => setBuyerCity(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block font-heading text-xs font-bold text-[var(--primary)] mb-1">
              Mensaje personalizado o consulta adicional
            </label>
            <textarea
              className="w-full px-3.5 py-2.5 bg-white border border-[var(--outline-variant)] rounded-xl font-sans text-xs focus:outline-none focus:border-[var(--primary)] text-gray-900 placeholder:text-gray-400 resize-none"
              rows={2}
              placeholder="Ej: ¿Tienen el lado izquierdo? ¿Cuánto cuesta el envío al norte?"
              value={userNote}
              onChange={e => setUserNote(e.target.value)}
            />
          </div>

          {/* Vista previa del mensaje de WhatsApp */}
          <div className="space-y-1.5">
            <label className="block font-heading text-[11px] font-bold text-[var(--secondary)]">
              Mensaje que se enviará automáticamente al chat:
            </label>
            <div className="p-3.5 rounded-2xl bg-[#efeae2] border border-[#d1d7db] relative">
              <div className="bg-[#d9fdd3] text-[#111b21] rounded-2xl rounded-tr-none p-3 shadow-sm text-xs font-sans leading-relaxed border border-[#c1e9be]">
                <p className="whitespace-pre-wrap">{defaultMessage}</p>
                <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-gray-500 font-mono">
                  <span>Ahora</span>
                  <span className="text-emerald-700 font-bold">✓✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--outline-variant)] bg-gray-50/70 flex items-center justify-end gap-3">
          <button
            type="button"
            className="px-4 py-2.5 rounded-xl border border-[var(--outline-variant)] font-heading text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="px-5 py-2.5 bg-[#25D366] hover:bg-[#1ebe57] text-white font-heading text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition hover:shadow-md disabled:opacity-50"
            onClick={handleLaunchWhatsApp}
            disabled={submitting}
          >
            <WhatsAppIcon size={18} />
            <span>{submitting ? 'Registrando consulta...' : 'Abrir WhatsApp Ahora'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
