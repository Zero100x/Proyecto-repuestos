'use client';

import React, { useState } from 'react';
import { Part, InventoryItem } from '../lib/types';
import { formatPriceCOP, buildWhatsAppLink } from '../lib/api';
import { WhatsAppIcon, CloseIcon, MapPinIcon, PhoneIcon, CheckCircleIcon } from './Icons';

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
  if (!isOpen) return null;

  const inventoryList = part.inventory || [];
  const [selectedInv, setSelectedInv] = useState<InventoryItem>(
    selectedInventory || inventoryList[0] || ({} as InventoryItem)
  );
  const [buyerName, setBuyerName] = useState('');
  const [buyerCity, setBuyerCity] = useState(selectedInv.location?.city || 'Bogotá');
  const [userNote, setUserNote] = useState('');

  const targetLocation = selectedInv.location;
  const targetStore = targetLocation?.store;
  const phoneNumber = targetLocation?.whatsapp || targetLocation?.phone || '+573002001001';

  const oemText = part.partNumbers?.length ? ` (Ref OEM: ${part.partNumbers[0].number})` : '';
  const priceText = selectedInv.price ? formatPriceCOP(selectedInv.price) : 'Precio a convenir';

  const defaultMessage = `Hola ${targetStore?.name || 'amigos'} de ${targetLocation?.name || 'su sede'}. Vi en RepuestosYA su producto: "${part.name}"${oemText} con precio ${priceText}. ${
    buyerName ? `Mi nombre es ${buyerName}. ` : ''
  }${buyerCity ? `Me encuentro en ${buyerCity}. ` : ''}${
    userNote ? `Pregunta: ${userNote}` : '¿Tienen disponibilidad inmediata para recoger hoy o realizar envío?'
  }`;

  const handleLaunchWhatsApp = () => {
    const url = buildWhatsAppLink(phoneNumber, defaultMessage);
    window.open(url, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content glass" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title-box">
            <div className="badge-wa">
              <WhatsAppIcon size={18} />
              <span>Lead Directo Sin Comisiones</span>
            </div>
            <h3>Contactar al Almacén por WhatsApp</h3>
          </div>
          <button className="btn-close" onClick={onClose}>
            <CloseIcon size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Resumen del repuesto */}
          <div className="part-mini-preview">
            {part.imageUrl && (
              <img src={part.imageUrl} alt={part.name} className="mini-thumb" />
            )}
            <div className="mini-info">
              <h4>{part.name}</h4>
              <p className="mini-brand">{part.brand} • {part.category?.name}</p>
              <span className="mini-price">
                {selectedInv.price ? formatPriceCOP(selectedInv.price) : 'Consultar precio'}
              </span>
            </div>
          </div>

          {/* Selector de sede */}
          {inventoryList.length > 1 && (
            <div className="form-group">
              <label className="form-label">Selecciona la Sede / Almacén a contactar:</label>
              <select
                className="form-select"
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
            <div className="location-card-preview">
              <div className="loc-line">
                <MapPinIcon size={16} />
                <span>{targetLocation.address}, {targetLocation.city}</span>
              </div>
              <div className="loc-line">
                <PhoneIcon size={16} />
                <span>WhatsApp Directo: {phoneNumber}</span>
              </div>
              <div className="loc-badge">
                <CheckCircleIcon size={14} />
                <span>Almacén Aliado Verificado</span>
              </div>
            </div>
          )}

          {/* Formulario rápido */}
          <div className="fields-row">
            <div className="form-group">
              <label className="form-label">Tu Nombre (Opcional):</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej. Carlos Rodríguez"
                value={buyerName}
                onChange={e => setBuyerName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tu Ciudad:</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej. Bogotá, Medellín..."
                value={buyerCity}
                onChange={e => setBuyerCity(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Mensaje personalizado o consulta adicional:</label>
            <textarea
              className="form-input text-area"
              rows={2}
              placeholder="Ej. ¿Tienen el lado izquierdo? ¿Cuánto vale el envío al norte?"
              value={userNote}
              onChange={e => setUserNote(e.target.value)}
            />
          </div>

          {/* Vista previa del mensaje */}
          <div className="message-preview-box">
            <p className="preview-label">Mensaje que se enviará automáticamente:</p>
            <div className="chat-bubble">
              <p>{defaultMessage}</p>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-wa-action" onClick={handleLaunchWhatsApp}>
            <WhatsAppIcon size={20} />
            <span>Abrir WhatsApp Ahora</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 1rem;
        }
        .modal-content {
          width: 100%;
          max-width: 580px;
          border-radius: var(--radius-xl);
          background: #13192b;
          border: 1px solid var(--border-color-hover);
          box-shadow: var(--shadow-lg), var(--shadow-glow);
          display: flex;
          flex-direction: column;
          max-height: 90vh;
          overflow-y: auto;
        }
        .modal-header {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }
        .badge-wa {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          color: #25d366;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.25rem;
        }
        .modal-header h3 {
          font-size: 1.2rem;
          color: var(--text-primary);
        }
        .btn-close {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 50%;
          display: flex;
        }
        .btn-close:hover {
          color: white;
          background: rgba(255, 255, 255, 0.1);
        }
        .modal-body {
          padding: 1.25rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .part-mini-preview {
          display: flex;
          gap: 1rem;
          background: var(--bg-card);
          padding: 0.85rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
        }
        .mini-thumb {
          width: 60px;
          height: 60px;
          border-radius: var(--radius-sm);
          object-fit: cover;
        }
        .mini-info h4 {
          font-size: 0.95rem;
          line-height: 1.3;
        }
        .mini-brand {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        .mini-price {
          font-size: 1.05rem;
          font-weight: 800;
          color: var(--accent-secondary);
        }
        .location-card-preview {
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.25);
          padding: 0.85rem;
          border-radius: var(--radius-md);
          font-size: 0.85rem;
        }
        .loc-line {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-primary);
          margin-bottom: 0.35rem;
        }
        .loc-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          color: #10b981;
          font-weight: 600;
          font-size: 0.75rem;
        }
        .fields-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }
        .text-area {
          resize: none;
        }
        .message-preview-box {
          background: rgba(0, 0, 0, 0.25);
          padding: 0.75rem;
          border-radius: var(--radius-md);
        }
        .preview-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-bottom: 0.35rem;
        }
        .chat-bubble {
          background: #075e54;
          color: #e9fbf0;
          padding: 0.65rem 0.85rem;
          border-radius: 8px 8px 8px 0;
          font-size: 0.825rem;
          line-height: 1.4;
        }
        .modal-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.75rem;
        }
        .btn-wa-action {
          background: #25d366;
          color: #0b2212;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: var(--radius-md);
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-wa-action:hover {
          background: #1ebe57;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(37, 211, 102, 0.4);
        }
      `}</style>
    </div>
  );
}
