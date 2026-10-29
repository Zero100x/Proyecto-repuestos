'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import WhatsAppLeadModal from '../../../components/WhatsAppLeadModal';
import ProductTechnicalQA from '../../../components/ProductTechnicalQA';
import ReservationModal from '../../../components/ReservationModal';
import ReservationVoucherModal from '../../../components/ReservationVoucherModal';
import { fetchPartById, fetchParts, formatPriceCOP, resolveImageUrl } from '../../../lib/api';
import { Part, InventoryItem, ReservationItem } from '../../../lib/types';
import { useCompare } from '../../../lib/compareContext';

function ProductDetailContent() {
  const params = useParams();
  const partId = params?.id as string;

  const [part, setPart] = useState<Part | null>(null);
  const [relatedParts, setRelatedParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected inventory item for WhatsApp Modal
  const [selectedInvForModal, setSelectedInvForModal] = useState<InventoryItem | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);

  // Sprint 5: Click & Collect Reservation states
  const [reservationModalOpen, setReservationModalOpen] = useState(false);
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [activeReservation, setActiveReservation] = useState<ReservationItem | null>(null);
  const [selectedInvForReservation, setSelectedInvForReservation] = useState<InventoryItem | undefined>(undefined);

  // Gallery active thumbnail
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const { addToCompare, removeFromCompare, isCompared } = useCompare();

  useEffect(() => {
    if (!partId) return;
    setLoading(true);
    fetchPartById(partId).then(data => {
      setPart(data);
      setLoading(false);
      if (data?.category?.slug) {
        fetchParts({ category: data.category.slug, limit: 4 }).then(res => {
          setRelatedParts(res.data.filter(p => p.id !== data.id));
        });
      }
    });
  }, [partId]);

  if (loading) {
    return (
      <main className="max-w-[1240px] mx-auto px-4 md:px-8 py-12 pt-[90px]">
        <div className="h-6 w-48 bg-[var(--surface-container-high)] rounded mb-8 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 h-96 bg-[var(--surface-container-high)] rounded-2xl animate-pulse" />
          <div className="lg:col-span-5 h-96 bg-[var(--surface-container-high)] rounded-2xl animate-pulse" />
        </div>
      </main>
    );
  }

  if (!part) {
    return (
      <main className="max-w-[1240px] mx-auto px-4 md:px-8 py-20 pt-[90px] text-center">
        <span className="material-symbols-outlined text-5xl text-[var(--secondary)] mb-4">
          inventory_2
        </span>
        <h1 className="font-heading text-2xl font-bold text-[var(--primary)] mb-2">
          Repuesto no encontrado
        </h1>
        <p className="font-sans text-sm text-[var(--secondary)] mb-6">
          El componente solicitado no se encuentra disponible en la base de datos centralizada.
        </p>
        <Link href="/search" className="btn btn-primary px-6 py-2.5 text-xs">
          Volver al Marketplace
        </Link>
      </main>
    );
  }

  const compared = isCompared(part.id);
  const oemNumber = part.partNumbers?.[0]?.number || 'OEM-REF-VERIFIED';
  const inventoryList = part.inventory || [];
  const bestPrice =
    part.minPrice && part.minPrice > 0
      ? part.minPrice
      : inventoryList.length > 0
      ? Math.min(...inventoryList.map(i => i.price))
      : 0;

  const handleOpenLead = (inv?: InventoryItem) => {
    setSelectedInvForModal(inv);
    setModalOpen(true);
  };

  const handleOpenReservation = (inv?: InventoryItem) => {
    setSelectedInvForReservation(inv);
    setReservationModalOpen(true);
  };

  const handleReservationSuccess = (res: ReservationItem) => {
    setReservationModalOpen(false);
    setActiveReservation(res);
    setVoucherModalOpen(true);
  };

  const rawImages =
    part.images && part.images.length > 0
      ? part.images
      : part.imageUrl
      ? [part.imageUrl]
      : [
          'https://lh3.googleusercontent.com/aida-public/AB6AXuCtsicmR6RzUGPu9JMuOBUJpnvR-TCle5j7u0JZtSu4_k_hsuVuMYO-iVeGr0lqWApM4KmLhVuCcqE3g7U4HCb_-IfCHe5zL2N2q6C46dYbOAdzdo83kcqSeeEsdycFL8EZ5qWIqycDEovWh8Ad-l7KIvgDBUjkZi-6UBJ2mT6-wNz8G4CjyA0oaePh816PFQtVsd35c3nGr6mI8ut_VMEPc_LIbgzhnIyySUdhkfX8DGonpqeQeofy',
        ];
  const images = rawImages.map(img => resolveImageUrl(img));

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col antialiased">
      <main className="pt-[90px] pb-24 px-margin-mobile md:px-margin-desktop max-w-container-max-width mx-auto flex-1 w-full">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 font-mono text-xs text-[var(--secondary)]">
          <Link href="/search" className="hover:text-[var(--primary)]">
            Marketplace
          </Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          {part.category && (
            <>
              <Link href={`/search?category=${part.category.slug}`} className="hover:text-[var(--primary)]">
                {part.category.name}
              </Link>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </>
          )}
          <span className="text-[var(--primary)] font-bold truncate max-w-xs">{part.name}</span>
        </div>

        {/* 2-Column Product Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Gallery & Details (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Main Stage Image */}
            <div className="w-full bg-white rounded-2xl border border-[var(--outline-variant)] overflow-hidden relative group p-6 flex items-center justify-center min-h-[380px] shadow-sm">
              <img
                src={images[activeImageIndex] || images[0]}
                alt={part.name}
                className="max-h-[340px] w-auto object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
              />

              {/* Quality & Stock Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <span className="bg-[var(--surface-container-lowest)] text-[var(--primary)] font-mono text-[10px] font-bold px-2.5 py-1 rounded border border-[var(--outline-variant)] shadow-sm">
                  REPUESTO OEM CALIFICADO
                </span>
                <span className="bg-[#ecfdf5] text-[#059669] font-mono text-[10px] font-bold px-2.5 py-1 rounded border border-[#a7f3d0] shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                  EN STOCK ({inventoryList.length > 0 ? `${inventoryList.length} sedes` : 'Inmediato'})
                </span>
              </div>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`flex-shrink-0 w-20 h-20 rounded-xl border-2 overflow-hidden bg-white p-1 transition-all ${
                    activeImageIndex === idx
                      ? 'border-[var(--primary)] shadow-sm'
                      : 'border-[var(--outline-variant)] opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="thumbnail" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>

            {/* Warehouse Pickup & Location Card */}
            <div className="mt-4 bg-[var(--surface-container-low)] border border-[var(--outline-variant)] rounded-2xl p-6">
              <h3 className="font-heading text-sm font-bold text-[var(--primary)] uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--on-tertiary-container)] text-lg">
                  store
                </span>
                Sedes Físicas y Horarios de Retiro
              </h3>
              
              <div className="space-y-3 font-sans text-xs">
                {inventoryList.length > 0 ? (
                  inventoryList.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-white rounded-xl border border-[var(--outline-variant)] gap-3"
                    >
                      <div>
                        <div className="font-heading font-bold text-[var(--primary)] text-sm">
                          {item.location?.name || 'Sede Distribuidora'}
                        </div>
                        <div className="text-[var(--secondary)] text-xs mt-0.5 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">location_on</span>
                          {item.location?.address || 'Dirección de la sede'}, {item.location?.city || 'Pasto'}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-mono text-[10px] text-[var(--secondary)] uppercase">Precio Sede</div>
                          <div className="font-heading font-bold text-[var(--primary)] text-sm">
                            {formatPriceCOP(item.price)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenReservation(item)}
                            className="py-1.5 px-3 bg-[var(--on-tertiary-container)] hover:bg-[#c25100] text-white rounded-lg font-heading text-xs font-bold flex items-center gap-1 transition shadow-sm"
                          >
                            <span className="material-symbols-outlined text-sm">shopping_bag</span>
                            <span>Reservar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenLead(item)}
                            className="btn btn-secondary text-xs px-2.5 py-1.5 font-bold flex items-center gap-1"
                            title="Cotizar por WhatsApp"
                          >
                            <span className="material-symbols-outlined text-sm">chat</span>
                            <span>Cotizar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[var(--secondary)]">
                    Disponible para despacho directo coordinado con el centro de distribución principal.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Specs & Actions (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Header info */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-xs uppercase tracking-wider text-[var(--secondary)] bg-[var(--surface-container)] px-2.5 py-0.5 rounded">
                  {part.brand || 'Original Equipment Manufacturer'}
                </span>
                <span className="font-mono text-xs text-[var(--secondary)]">
                  SKU: {oemNumber}
                </span>
              </div>

              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[var(--primary)] leading-tight mb-3">
                {part.name}
              </h1>

              <div className="flex items-baseline gap-3 pb-4 border-b border-[var(--outline-variant)]">
                <span className="font-heading text-3xl font-extrabold text-[var(--primary)]">
                  {formatPriceCOP(bestPrice)}
                </span>
                {part.maxPrice && part.maxPrice > bestPrice && (
                  <span className="font-mono text-xs text-[var(--secondary)]">
                    hasta {formatPriceCOP(part.maxPrice)}
                  </span>
                )}
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleOpenReservation()}
                className="w-full py-4 bg-[var(--on-tertiary-container)] text-white font-heading text-sm font-bold rounded-xl hover:bg-[#c25100] transition-colors shadow-[0_4px_20px_rgba(227,95,0,0.25)] flex justify-center items-center gap-2 active:scale-[0.99]"
              >
                <span className="material-symbols-outlined text-xl">shopping_bag</span>
                <span>Reservar Repuesto en Sede (Click & Collect)</span>
              </button>

              <button
                onClick={() => handleOpenLead()}
                className="w-full py-3.5 bg-white border border-[var(--primary)] text-[var(--primary)] font-heading text-xs font-bold rounded-xl hover:bg-[var(--primary)] hover:text-white transition-all flex justify-center items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">chat</span>
                <span>Consultar por WhatsApp con Asesor Técnico</span>
              </button>

              <button
                onClick={() => (compared ? removeFromCompare(part.id) : addToCompare(part))}
                className={`w-full py-2.5 rounded-xl border font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                  compared
                    ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                    : 'bg-[var(--surface-container-low)] text-[var(--secondary)] border-[var(--outline-variant)] hover:text-[var(--primary)]'
                }`}
              >
                <span className="material-symbols-outlined text-base">balance</span>
                <span>{compared ? 'Pieza agregada a bandeja de comparación' : 'Comparar con otros repuestos'}</span>
              </button>
            </div>

            {/* Technical Specs Table (Precision Automotive Hub) */}
            <div className="mt-2">
              <h3 className="font-heading text-xs font-bold text-[var(--primary)] uppercase tracking-wider mb-3">
                Especificaciones Técnicas
              </h3>
              <div className="border border-[var(--outline-variant)] rounded-xl overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left font-mono text-xs">
                  <tbody className="divide-y divide-[var(--outline-variant)]">
                    <tr className="bg-[var(--surface-container-low)]">
                      <td className="py-2.5 px-4 text-[var(--secondary)] font-medium w-1/3 border-r border-[var(--outline-variant)]">
                        Número OEM
                      </td>
                      <td className="py-2.5 px-4 text-[var(--primary)] font-bold">{oemNumber}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 text-[var(--secondary)] font-medium w-1/3 border-r border-[var(--outline-variant)]">
                        Marca Fabricante
                      </td>
                      <td className="py-2.5 px-4 text-[var(--primary)]">{part.brand || 'Estándar OEM'}</td>
                    </tr>
                    <tr className="bg-[var(--surface-container-low)]">
                      <td className="py-2.5 px-4 text-[var(--secondary)] font-medium w-1/3 border-r border-[var(--outline-variant)]">
                        Categoría
                      </td>
                      <td className="py-2.5 px-4 text-[var(--primary)]">{part.category?.name || 'General'}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 text-[var(--secondary)] font-medium w-1/3 border-r border-[var(--outline-variant)]">
                        Garantía de Fábrica
                      </td>
                      <td className="py-2.5 px-4">
                        {part.hasWarranty === false || part.warranty === 'Sin garantía' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            Sin garantía de fábrica
                          </span>
                        ) : part.warranty ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            🛡️ {part.warranty}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-xs">No especificada por el almacén</span>
                        )}
                      </td>
                    </tr>
                    <tr className="bg-[var(--surface-container-low)]">
                      <td className="py-2.5 px-4 text-[var(--secondary)] font-medium w-1/3 border-r border-[var(--outline-variant)]">
                        Disponibilidad
                      </td>
                      <td className="py-2.5 px-4 text-[#059669] font-bold">Entrega Inmediata / En Mostrador</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Description */}
            {part.description && (
              <div className="bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] rounded-xl p-5">
                <h3 className="font-heading text-xs font-bold text-[var(--primary)] uppercase tracking-wider mb-2">
                  Descripción Técnica
                </h3>
                <p className="font-sans text-xs text-[var(--secondary)] leading-relaxed">
                  {part.description}
                </p>
              </div>
            )}

          </div>
        </div>

        {/* Technical Compatibility Q&A (PDCIRA-17) */}
        <ProductTechnicalQA partId={part.id} partName={part.name} />

        {/* Related Parts Row */}
        {relatedParts.length > 0 && (
          <div className="mt-20 border-t border-[var(--outline-variant)] pt-12">
            <h2 className="font-heading text-xl font-bold text-[var(--primary)] mb-6">
              Repuestos Relacionados o Compatibles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedParts.map(p => (
                <Link
                  key={p.id}
                  href={`/parts/${p.id}`}
                  className="bg-white border border-[var(--outline-variant)] rounded-xl p-4 hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div className="h-32 bg-[var(--surface-container)] rounded-lg p-2 mb-3 flex items-center justify-center">
                    <img
                      src={p.imageUrl || images[0]}
                      alt={p.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div>
                    <span className="font-mono text-[10px] text-[var(--secondary)] uppercase font-semibold">
                      {p.brand || 'OEM'}
                    </span>
                    <h4 className="font-heading text-xs font-bold text-[var(--primary)] line-clamp-2 mt-1">
                      {p.name}
                    </h4>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[var(--outline-variant)] font-heading text-sm font-extrabold text-[var(--primary)]">
                    {formatPriceCOP(p.minPrice || 0)}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* WhatsApp Lead Generation Modal */}
      {modalOpen && (
        <WhatsAppLeadModal
          part={part}
          selectedInventory={selectedInvForModal}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      )}

      {/* Sprint 5: Click & Collect Reservation Modal */}
      {reservationModalOpen && (
        <ReservationModal
          part={part}
          isOpen={reservationModalOpen}
          onClose={() => setReservationModalOpen(false)}
          onSuccess={handleReservationSuccess}
          initialInventory={selectedInvForReservation}
        />
      )}

      {/* Sprint 5: Digital Voucher Modal */}
      {voucherModalOpen && activeReservation && (
        <ReservationVoucherModal
          reservation={activeReservation}
          isOpen={voucherModalOpen}
          onClose={() => setVoucherModalOpen(false)}
        />
      )}
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense
      fallback={
        <main className="max-w-[1240px] mx-auto px-4 md:px-8 py-12 pt-[90px]">
          <div className="h-6 w-48 bg-[var(--surface-container-high)] rounded mb-8 animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 h-96 bg-[var(--surface-container-high)] rounded-2xl animate-pulse" />
            <div className="lg:col-span-5 h-96 bg-[var(--surface-container-high)] rounded-2xl animate-pulse" />
          </div>
        </main>
      }
    >
      <ProductDetailContent />
    </Suspense>
  );
}
