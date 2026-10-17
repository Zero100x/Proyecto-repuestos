'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Part } from './types';

interface CompareContextType {
  comparedParts: Part[];
  addToCompare: (part: Part) => boolean;
  removeFromCompare: (partId: string) => void;
  clearCompare: () => void;
  isCompared: (partId: string) => boolean;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [comparedParts, setComparedParts] = useState<Part[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('repuestos_compare_list');
      if (saved) {
        setComparedParts(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Could not read compare state from storage:', e);
    }
  }, []);

  const saveToStorage = (parts: Part[]) => {
    try {
      localStorage.setItem('repuestos_compare_list', JSON.stringify(parts));
    } catch (e) {
      console.warn('Could not save compare state:', e);
    }
  };

  const addToCompare = (part: Part): boolean => {
    if (comparedParts.some(p => p.id === part.id)) {
      return false;
    }
    if (comparedParts.length >= 4) {
      alert('Puedes comparar un máximo de 4 repuestos al mismo tiempo.');
      return false;
    }
    const updated = [...comparedParts, part];
    setComparedParts(updated);
    saveToStorage(updated);
    return true;
  };

  const removeFromCompare = (partId: string) => {
    const updated = comparedParts.filter(p => p.id !== partId);
    setComparedParts(updated);
    saveToStorage(updated);
  };

  const clearCompare = () => {
    setComparedParts([]);
    saveToStorage([]);
  };

  const isCompared = (partId: string) => {
    return comparedParts.some(p => p.id === partId);
  };

  return (
    <CompareContext.Provider
      value={{ comparedParts, addToCompare, removeFromCompare, clearCompare, isCompared }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
}
