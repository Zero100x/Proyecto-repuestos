'use client';

import React, { useState, useRef } from 'react';
import { uploadStoreImage } from '../lib/api';

interface StoreImageUploaderProps {
  value: string;
  onChange: (imageUrl: string) => void;
  storeName?: string;
  compact?: boolean;
}

const PRESET_STORE_IMAGES = [
  {
    label: 'Centro Principal',
    url: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=900&q=80',
  },
  {
    label: 'Bodega Automotriz',
    url: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=900&q=80',
  },
  {
    label: 'Mostrador Repuestos',
    url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=900&q=80',
  },
  {
    label: 'Centro Logístico',
    url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=80',
  },
];

export default function StoreImageUploader({
  value,
  onChange,
  storeName,
  compact = false,
}: StoreImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [inputMode, setInputMode] = useState<'upload' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo supera el límite máximo de 5 MB.');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const result = await uploadStoreImage(file);
      onChange(result.imageUrl);
    } catch (err: any) {
      setError(err.message || 'Error al subir la imagen del almacén.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block font-mono text-[11px] uppercase tracking-wider font-bold text-gray-600">
          FOTO DE FACHADA / IMAGEN DE LA TIENDA
        </label>
        <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200">
          <button
            type="button"
            onClick={() => setInputMode('upload')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
              inputMode === 'upload'
                ? 'bg-white text-gray-900 shadow-2xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Subir Archivo
          </button>
          <button
            type="button"
            onClick={() => setInputMode('url')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
              inputMode === 'url'
                ? 'bg-white text-gray-900 shadow-2xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Pegar URL
          </button>
        </div>
      </div>

      {inputMode === 'upload' ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 hover:border-blue-500 bg-gray-50/70 hover:bg-blue-50/30 rounded-xl p-4 text-center cursor-pointer transition-all"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-blue-600 shadow-2xs">
              <span className="material-symbols-outlined text-lg">
                {uploading ? 'hourglass_top' : 'add_a_photo'}
              </span>
            </div>
            <div className="text-xs font-semibold text-gray-800">
              {uploading ? 'Subiendo imagen...' : 'Haz clic para subir la foto de tu almacén'}
            </div>
            <p className="text-[11px] text-gray-400">
              Formatos: JPG, PNG o WEBP (Máx. 5 MB)
            </p>
          </div>
        </div>
      ) : (
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">
            link
          </span>
          <input
            type="url"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="https://ejemplo.com/mi-almacen-fachada.jpg"
            className="w-full pl-9 pr-8 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white text-gray-900"
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </div>
      )}

      {/* Quick Presets */}
      <div>
        <span className="block text-[10px] font-mono uppercase text-gray-400 font-semibold mb-1.5">
          O elige una plantilla de fachada verificada:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PRESET_STORE_IMAGES.map(preset => {
            const active = value === preset.url;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => onChange(preset.url)}
                className={`group relative rounded-lg overflow-hidden border text-left transition-all cursor-pointer h-14 ${
                  active
                    ? 'border-blue-600 ring-2 ring-blue-600/20'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <img
                  src={preset.url}
                  alt={preset.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-1.5">
                  <span className="text-[10px] font-bold text-white leading-tight truncate">
                    {preset.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 font-medium flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">error</span>
          {error}
        </p>
      )}

      {/* Live Preview */}
      {value && !compact && (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-900 h-36 shadow-xs">
          <img
            src={value}
            alt="Vista previa de almacén"
            className="w-full h-full object-cover opacity-90"
            onError={e => {
              (e.currentTarget as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=900&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-3">
            <div className="flex items-center justify-between">
              <span className="bg-emerald-500/90 text-white text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">verified</span>
                VISTA PREVIA EN DIRECTORIO
              </span>
              <button
                type="button"
                onClick={() => onChange('')}
                className="bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors cursor-pointer"
                title="Quitar imagen"
              >
                <span className="material-symbols-outlined text-xs">delete</span>
              </button>
            </div>
            <div>
              <p className="text-white font-bold text-sm truncate">
                {storeName || 'Tu Almacén de Repuestos'}
              </p>
              <p className="text-gray-300 text-[11px]">
                Imagen de fachada visible para talleres y compradores
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
