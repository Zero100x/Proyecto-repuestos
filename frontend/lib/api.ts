import { Part, SearchFilters, VehicleMake, Location, Store } from './types';
import { MOCK_PARTS, MOCK_MAKES, MOCK_LOCATIONS, MOCK_STORES, MOCK_CATEGORIES } from './mockData';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export function formatPriceCOP(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '$ 0';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedMsg = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
}

export async function fetchParts(filters: SearchFilters = {}): Promise<{ data: Part[]; total: number }> {
  try {
    const params = new URLSearchParams();
    if (filters.query) params.append('q', filters.query);
    if (filters.make) params.append('make', filters.make);
    if (filters.model) params.append('model', filters.model);
    if (filters.year && Number.isFinite(filters.year)) params.append('year', String(filters.year));
    if (filters.version) params.append('version', filters.version);
    if (filters.category) params.append('category', filters.category);
    if (filters.condition) params.append('condition', filters.condition);
    if (filters.minPrice !== undefined && Number.isFinite(filters.minPrice)) params.append('minPrice', String(filters.minPrice));
    if (filters.maxPrice !== undefined && Number.isFinite(filters.maxPrice)) params.append('maxPrice', String(filters.maxPrice));
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));

    const res = await fetch(`${API_BASE}/search/parts?${params.toString()}`, {
      cache: 'no-store',
    });

    if (res.ok) {
      const json = await res.json();
      if (json.data && Array.isArray(json.data) && json.data.length > 0) {
        return {
          data: json.data,
          total: json.meta?.total || json.data.length,
        };
      }
    }
  } catch (err) {
    console.warn('API backend not reachable, using fallback data:', err);
  }

  // Fallback to client-side filtered mock data
  let filtered = [...MOCK_PARTS];

  if (filters.query) {
    const q = filters.query.toLowerCase();
    filtered = filtered.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.partNumbers?.some(pn => pn.number.toLowerCase().includes(q))
    );
  }

  if (filters.make) {
    filtered = filtered.filter(p => p.makes?.includes(filters.make!));
  }

  if (filters.model) {
    filtered = filtered.filter(p => p.models?.includes(filters.model!));
  }

  if (filters.year) {
    filtered = filtered.filter(p => p.years?.includes(Number(filters.year)));
  }

  if (filters.category) {
    filtered = filtered.filter(
      p => p.category?.slug === filters.category || p.categoryId === filters.category
    );
  }

  if (filters.condition) {
    filtered = filtered.filter(p => p.conditions?.includes(filters.condition!));
  }

  if (filters.minPrice) {
    filtered = filtered.filter(p => (p.minPrice || 0) >= filters.minPrice!);
  }

  if (filters.maxPrice) {
    filtered = filtered.filter(p => (p.minPrice || 0) <= filters.maxPrice!);
  }

  if (filters.sortBy === 'minPrice') {
    filtered.sort((a, b) =>
      filters.sortOrder === 'desc'
        ? (b.minPrice || 0) - (a.minPrice || 0)
        : (a.minPrice || 0) - (b.minPrice || 0)
    );
  } else if (filters.sortBy === 'name') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  return {
    data: filtered,
    total: filtered.length,
  };
}

export async function fetchPartById(id: string): Promise<Part | null> {
  try {
    const res = await fetch(`${API_BASE}/catalog/parts/${id}`, { cache: 'no-store' });
    if (res.ok) {
      const part = await res.json();
      return part;
    }
  } catch (err) {
    console.warn('API backend error fetching part, checking mock data:', err);
  }

  const found = MOCK_PARTS.find(p => p.id === id || p.slug === id);
  return found || MOCK_PARTS[0];
}

export async function fetchMakes(): Promise<VehicleMake[]> {
  try {
    const res = await fetch(`${API_BASE}/vehicles/makes`, { cache: 'no-store' });
    if (res.ok) {
      const makes = await res.json();
      if (Array.isArray(makes) && makes.length > 0) return makes;
    }
  } catch (err) {
    console.warn('Backend makes API error, using mock:', err);
  }
  return MOCK_MAKES;
}

export async function fetchVehicleCascade(makeId?: string, modelId?: string, yearId?: string) {
  try {
    const params = new URLSearchParams();
    if (makeId) params.append('makeId', makeId);
    if (modelId) params.append('modelId', modelId);
    if (yearId) params.append('yearId', yearId);

    const res = await fetch(`${API_BASE}/vehicles/cascade?${params.toString()}`, { cache: 'no-store' });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend cascade API error:', err);
  }

  return {
    makes: MOCK_MAKES,
    models: makeId ? [{ id: 'm-1', name: 'Corolla' }, { id: 'm-2', name: 'Hilux' }, { id: 'm-3', name: 'RAV4' }] : [],
    years: modelId ? [2019, 2020, 2021, 2022, 2023].map(y => ({ id: `y-${y}`, year: y })) : [],
    versions: yearId ? [{ id: 'v-1', name: 'LE 1.8L', engine: '1.8L 4-cyl' }, { id: 'v-2', name: 'SE 2.0L', engine: '2.0L 4-cyl' }] : [],
  };
}

export async function fetchStores(): Promise<Store[]> {
  return MOCK_STORES;
}

export async function fetchLocations(): Promise<Location[]> {
  return MOCK_LOCATIONS;
}

export async function fetchCategories() {
  return MOCK_CATEGORIES;
}
