'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchMakes, fetchVehicleCascade } from '../lib/api';
import { VehicleMake } from '../lib/types';

interface VehicleCascadeSelectorProps {
  initialMake?: string;
  initialModel?: string;
  initialYear?: number;
  initialVersion?: string;
  compact?: boolean;
}

export default function VehicleCascadeSelector({
  initialMake = '',
  initialModel = '',
  initialYear,
  initialVersion = '',
  compact = false,
}: VehicleCascadeSelectorProps) {
  const router = useRouter();

  const [makes, setMakes] = useState<VehicleMake[]>([]);
  const [models, setModels] = useState<Array<{ id: string; name: string }>>([]);
  const [years, setYears] = useState<Array<{ id: string; year: number }>>([]);
  const [versions, setVersions] = useState<Array<{ id: string; name: string; engine?: string }>>([]);

  const [selectedMake, setSelectedMake] = useState<string>(initialMake);
  const [selectedModel, setSelectedModel] = useState<string>(initialModel);
  const [selectedYear, setSelectedYear] = useState<string>(initialYear ? String(initialYear) : '');
  const [selectedVersion, setSelectedVersion] = useState<string>(initialVersion);

  const [loading, setLoading] = useState(false);

  // Load makes on mount
  useEffect(() => {
    fetchMakes().then(res => setMakes(res));
  }, []);

  // When make changes, fetch models
  useEffect(() => {
    if (!selectedMake) {
      setModels([]);
      setSelectedModel('');
      setYears([]);
      setSelectedYear('');
      setVersions([]);
      setSelectedVersion('');
      return;
    }
    const makeObj = makes.find(m => m.name.toLowerCase() === selectedMake.toLowerCase());
    setLoading(true);
    fetchVehicleCascade(makeObj?.id).then(cascade => {
      setModels(cascade.models || []);
      setLoading(false);
    });
  }, [selectedMake, makes]);

  // When model changes, fetch years
  useEffect(() => {
    if (!selectedModel) {
      setYears([]);
      setSelectedYear('');
      setVersions([]);
      setSelectedVersion('');
      return;
    }
    const makeObj = makes.find(m => m.name.toLowerCase() === selectedMake.toLowerCase());
    const modelObj = models.find(m => m.name.toLowerCase() === selectedModel.toLowerCase());
    fetchVehicleCascade(makeObj?.id, modelObj?.id).then(cascade => {
      setYears(cascade.years || []);
    });
  }, [selectedModel, selectedMake, models, makes]);

  // When year changes, fetch versions
  useEffect(() => {
    if (!selectedYear) {
      setVersions([]);
      setSelectedVersion('');
      return;
    }
    const makeObj = makes.find(m => m.name.toLowerCase() === selectedMake.toLowerCase());
    const modelObj = models.find(m => m.name.toLowerCase() === selectedModel.toLowerCase());
    const yearObj = years.find(y => String(y.year) === selectedYear);
    fetchVehicleCascade(makeObj?.id, modelObj?.id, yearObj?.id || selectedYear).then(cascade => {
      setVersions(cascade.versions || []);
    });
  }, [selectedYear, selectedModel, selectedMake, models, makes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMake) return;

    const params = new URLSearchParams();
    params.set('make', selectedMake);
    if (selectedModel) params.set('model', selectedModel);
    if (selectedYear) params.set('year', selectedYear);
    if (selectedVersion) params.set('version', selectedVersion);

    router.push(`/search?${params.toString()}`);
  };

  const handleReset = () => {
    setSelectedMake('');
    setSelectedModel('');
    setSelectedYear('');
    setSelectedVersion('');
    setModels([]);
    setYears([]);
    setVersions([]);
  };

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="block font-mono text-[10px] text-secondary uppercase mb-1">Marca</label>
          <select
            value={selectedMake}
            onChange={e => setSelectedMake(e.target.value)}
            className="w-full border border-outline-variant bg-surface text-on-surface rounded px-3 py-2 text-xs focus:border-primary outline-none"
          >
            <option value="">Seleccionar Marca</option>
            {makes.map(m => (
              <option key={m.id} value={m.name}>{m.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-mono text-[10px] text-secondary uppercase mb-1">Modelo</label>
          <select
            value={selectedModel}
            onChange={e => setSelectedModel(e.target.value)}
            disabled={!selectedMake}
            className="w-full border border-outline-variant bg-surface text-on-surface rounded px-3 py-2 text-xs focus:border-primary outline-none disabled:opacity-50"
          >
            <option value="">{loading ? 'Cargando...' : 'Seleccionar Modelo'}</option>
            {models.map(m => (
              <option key={m.id} value={m.name}>{m.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block font-mono text-[10px] text-secondary uppercase mb-1">Año</label>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              disabled={!selectedModel}
              className="w-full border border-outline-variant bg-surface text-on-surface rounded px-2.5 py-2 text-xs focus:border-primary outline-none disabled:opacity-50"
            >
              <option value="">Año</option>
              {years.map(y => (
                <option key={y.id} value={String(y.year)}>{y.year}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-mono text-[10px] text-secondary uppercase mb-1">Versión</label>
            <select
              value={selectedVersion}
              onChange={e => setSelectedVersion(e.target.value)}
              disabled={!selectedYear}
              className="w-full border border-outline-variant bg-surface text-on-surface rounded px-2.5 py-2 text-xs focus:border-primary outline-none disabled:opacity-50"
            >
              <option value="">Versión</option>
              {versions.map(v => (
                <option key={v.id} value={v.name}>{v.name}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={!selectedMake}
          className="w-full mt-1 bg-primary text-on-primary font-heading text-xs font-bold py-2.5 rounded hover:bg-primary-container transition-colors disabled:opacity-50"
        >
          Aplicar Filtro
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
        {/* Step 1: Marca */}
        <div className="flex flex-col gap-1.5 text-left">
          <label className="font-mono text-xs uppercase text-on-surface-variant font-medium flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">1</span>
            <span>Marca</span>
          </label>
          <select
            value={selectedMake}
            onChange={e => setSelectedMake(e.target.value)}
            className="w-full border border-outline-variant bg-surface text-on-surface rounded px-4 py-3 font-body-md text-sm md:text-base focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
          >
            <option value="">Seleccionar Marca</option>
            {makes.map(m => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Step 2: Modelo */}
        <div className="flex flex-col gap-1.5 text-left">
          <label className="font-mono text-xs uppercase text-on-surface-variant font-medium flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">2</span>
            <span>Modelo</span>
          </label>
          <select
            value={selectedModel}
            onChange={e => setSelectedModel(e.target.value)}
            disabled={!selectedMake}
            className="w-full border border-outline-variant bg-surface text-on-surface rounded px-4 py-3 font-body-md text-sm md:text-base focus:border-primary focus:ring-1 focus:ring-primary outline-none disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <option value="">{loading ? 'Cargando modelos...' : 'Seleccionar Modelo'}</option>
            {models.map(m => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Step 3: Año */}
        <div className="flex flex-col gap-1.5 text-left">
          <label className="font-mono text-xs uppercase text-on-surface-variant font-medium flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">3</span>
            <span>Año</span>
          </label>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            disabled={!selectedModel}
            className="w-full border border-outline-variant bg-surface text-on-surface rounded px-4 py-3 font-body-md text-sm md:text-base focus:border-primary focus:ring-1 focus:ring-primary outline-none disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <option value="">Seleccionar Año</option>
            {years.map(y => (
              <option key={y.id} value={String(y.year)}>
                {y.year}
              </option>
            ))}
          </select>
        </div>

        {/* Step 4: Versión */}
        <div className="flex flex-col gap-1.5 text-left">
          <label className="font-mono text-xs uppercase text-on-surface-variant font-medium flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">4</span>
            <span>Versión / Motor</span>
          </label>
          <select
            value={selectedVersion}
            onChange={e => setSelectedVersion(e.target.value)}
            disabled={!selectedYear}
            className="w-full border border-outline-variant bg-surface text-on-surface rounded px-4 py-3 font-body-md text-sm md:text-base focus:border-primary focus:ring-1 focus:ring-primary outline-none disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <option value="">Seleccionar Versión</option>
            {versions.map(v => (
              <option key={v.id} value={v.name}>
                {v.name} {v.engine ? `(${v.engine})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Action Row */}
        <div className="md:col-span-4 mt-3 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="submit"
            disabled={!selectedMake}
            className="w-full flex-1 bg-primary text-on-primary font-button text-sm sm:text-base py-3.5 rounded-lg flex justify-center items-center gap-2 hover:bg-primary-container transition-all active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
          >
            <span className="material-symbols-outlined text-xl">search</span>
            <span>Buscar Repuestos Compatibles</span>
          </button>

          {selectedMake && (
            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto px-4 py-3 border border-outline-variant text-secondary hover:text-primary rounded-lg font-mono text-xs transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
