'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchMakes, fetchVehicleCascade } from '../lib/api';
import { VehicleMake } from '../lib/types';
import { CarIcon, SearchIcon, SparklesIcon } from './Icons';

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
    const modelObj = models.find(m => m.name.toLowerCase() === selectedModel.toLowerCase());
    fetchVehicleCascade(undefined, modelObj?.id).then(cascade => {
      setYears(cascade.years || []);
    });
  }, [selectedModel, models]);

  // When year changes, fetch versions
  useEffect(() => {
    if (!selectedYear) {
      setVersions([]);
      setSelectedVersion('');
      return;
    }
    const yearObj = years.find(y => String(y.year) === selectedYear);
    fetchVehicleCascade(undefined, undefined, yearObj?.id).then(cascade => {
      setVersions(cascade.versions || []);
    });
  }, [selectedYear, years]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedMake) params.append('make', selectedMake);
    if (selectedModel) params.append('model', selectedModel);
    if (selectedYear) params.append('year', selectedYear);
    if (selectedVersion) params.append('version', selectedVersion);

    router.push(`/search?${params.toString()}`);
  };

  const handleReset = () => {
    setSelectedMake('');
    setSelectedModel('');
    setSelectedYear('');
    setSelectedVersion('');
  };

  return (
    <form onSubmit={handleSearch} className={`cascade-form ${compact ? 'compact' : ''}`}>
      <div className="selector-grid">
        {/* Marca */}
        <div className="form-group">
          <label className="form-label">
            <span className="step-num">1</span> Marca
          </label>
          <select
            className="form-select"
            value={selectedMake}
            onChange={e => {
              setSelectedMake(e.target.value);
              setSelectedModel('');
              setSelectedYear('');
              setSelectedVersion('');
            }}
          >
            <option value="">Selecciona Marca...</option>
            {makes.map(m => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Modelo */}
        <div className="form-group">
          <label className="form-label">
            <span className="step-num">2</span> Modelo
          </label>
          <select
            className="form-select"
            disabled={!selectedMake || models.length === 0}
            value={selectedModel}
            onChange={e => {
              setSelectedModel(e.target.value);
              setSelectedYear('');
              setSelectedVersion('');
            }}
          >
            <option value="">
              {!selectedMake ? 'Primero elige marca' : models.length === 0 ? 'Sin modelos' : 'Selecciona Modelo...'}
            </option>
            {models.map(m => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Año */}
        <div className="form-group">
          <label className="form-label">
            <span className="step-num">3</span> Año
          </label>
          <select
            className="form-select"
            disabled={!selectedModel || years.length === 0}
            value={selectedYear}
            onChange={e => {
              setSelectedYear(e.target.value);
              setSelectedVersion('');
            }}
          >
            <option value="">
              {!selectedModel ? 'Primero elige modelo' : 'Selecciona Año...'}
            </option>
            {years.map(y => (
              <option key={y.id} value={String(y.year)}>
                {y.year}
              </option>
            ))}
          </select>
        </div>

        {/* Versión / Motor */}
        <div className="form-group">
          <label className="form-label">
            <span className="step-num">4</span> Versión / Motor (Opcional)
          </label>
          <select
            className="form-select"
            disabled={!selectedYear || versions.length === 0}
            value={selectedVersion}
            onChange={e => setSelectedVersion(e.target.value)}
          >
            <option value="">
              {!selectedYear ? 'Primero elige año' : 'Todas las versiones'}
            </option>
            {versions.map(v => (
              <option key={v.id} value={v.name}>
                {v.name} {v.engine ? `(${v.engine})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="action-row">
        <button
          type="submit"
          className="btn btn-primary btn-search-cascade"
          disabled={!selectedMake}
        >
          <SearchIcon size={18} />
          <span>Buscar Repuestos Compatibles</span>
        </button>

        {selectedMake && (
          <button type="button" onClick={handleReset} className="btn btn-ghost btn-sm">
            Limpiar selección
          </button>
        )}
      </div>

      <style jsx>{`
        .cascade-form {
          width: 100%;
        }
        .selector-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.85rem;
          margin-bottom: 1.25rem;
        }
        @media (min-width: 640px) {
          .selector-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .selector-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        .step-num {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          background: var(--accent-primary);
          color: white;
          border-radius: 50%;
          font-size: 0.7rem;
          font-weight: 700;
          margin-right: 0.35rem;
        }
        .action-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .btn-search-cascade {
          flex: 1;
          min-width: 200px;
          padding: 0.85rem 1.75rem;
        }
        .cascade-form.compact .selector-grid {
          grid-template-columns: 1fr;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }
      `}</style>
    </form>
  );
}
