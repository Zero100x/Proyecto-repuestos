'use client';

import React, { useEffect, useState } from 'react';
import { fetchPlatformStats } from '../lib/api';

interface PlatformMetricsProps {
  initialPartsCount?: number;
  initialStoresCount?: number;
}

export default function PlatformMetrics({
  initialPartsCount,
  initialStoresCount,
}: PlatformMetricsProps) {
  const [stats, setStats] = useState({
    partsCount: initialPartsCount ?? 0,
    storesCount: initialStoresCount ?? 0,
    loading: initialPartsCount === undefined && initialStoresCount === undefined,
  });

  useEffect(() => {
    let isMounted = true;
    fetchPlatformStats().then((data) => {
      if (isMounted) {
        setStats({
          partsCount: data.partsCount,
          storesCount: data.storesCount,
          loading: false,
        });
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-CO').format(num);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 w-full max-w-4xl">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 text-center shadow-sm">
        <div className="font-heading text-2xl font-bold text-primary">
          {stats.loading ? (
            <span className="inline-block w-12 h-6 bg-surface-container-high animate-pulse rounded"></span>
          ) : (
            stats.partsCount > 50
              ? `+${formatNumber(stats.partsCount)}`
              : formatNumber(stats.partsCount)
          )}
        </div>
        <div className="font-mono text-xs text-secondary mt-1">REPUESTOS ACTIVOS</div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 text-center shadow-sm">
        <div className="font-heading text-2xl font-bold text-primary">100%</div>
        <div className="font-mono text-xs text-secondary mt-1">COMPATIBILIDAD OEM</div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 text-center shadow-sm">
        <div className="font-heading text-2xl font-bold text-primary">
          {stats.loading ? (
            <span className="inline-block w-8 h-6 bg-surface-container-high animate-pulse rounded"></span>
          ) : (
            stats.storesCount > 20
              ? `+${formatNumber(stats.storesCount)}`
              : formatNumber(stats.storesCount)
          )}
        </div>
        <div className="font-mono text-xs text-secondary mt-1">ALMACENES ALIADOS</div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 text-center shadow-sm">
        <div className="font-heading text-2xl font-bold text-on-tertiary-container">&lt; 15 min</div>
        <div className="font-mono text-xs text-secondary mt-1">RESPUESTA WHATSAPP</div>
      </div>
    </div>
  );
}

