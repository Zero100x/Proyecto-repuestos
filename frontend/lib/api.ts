import {
  Part,
  SearchFilters,
  VehicleMake,
  Location,
  Store,
  StoreInventoryItem,
  InventorySummary,
  BulkUploadReport,
  CreatePartWithStockDto,
  LeadItem,
  LeadStats,
  LeadStatus,
  UnmetDemandItem,
  PartQuestion,
  ReservationStatus,
  CreateReservationDto,
  ReservationItem,
  ReservationStats,
} from './types';
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
  try {
    const res = await fetch(`${API_BASE}/stores?limit=50`, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      const list = Array.isArray(json) ? json : json.data;
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
    }
  } catch (err) {
    console.warn('Backend stores API error, using mock:', err);
  }
  return MOCK_STORES;
}

export async function fetchLocations(storeId?: string): Promise<Location[]> {
  try {
    const url = storeId ? `${API_BASE}/locations?storeId=${storeId}` : `${API_BASE}/locations`;
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      const list = Array.isArray(json) ? json : json.data;
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
    }
  } catch (err) {
    console.warn('Backend locations API error, using mock:', err);
  }
  return storeId ? MOCK_LOCATIONS.filter(l => l.storeId === storeId) : MOCK_LOCATIONS;
}

export async function uploadStoreImage(file: File): Promise<{ imageUrl: string }> {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch(`${API_BASE}/stores/upload-image`, {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Upload store image API error, falling back to DataURL:', err);
  }

  // Fallback to base64 DataURL so preview and persistence work even offline
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ imageUrl: String(reader.result) });
    reader.onerror = () => reject(new Error('No se pudo procesar la imagen seleccionada'));
    reader.readAsDataURL(file);
  });
}

export async function onboardUserStore(
  token: string,
  data: {
    name: string;
    nit?: string;
    phone?: string;
    whatsapp?: string;
    address?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    imageUrl?: string;
  },
): Promise<{
  accessToken: string;
  store: Store;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    roles: string[];
    storeId: string | null;
    store?: Store | null;
  };
}> {
  const res = await fetch(`${API_BASE}/stores/onboarding`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'No se pudo registrar el almacén');
  }
  return res.json();
}

export async function updateStoreProfile(
  token: string,
  storeId: string,
  data: { name?: string; nit?: string; phone?: string; email?: string; imageUrl?: string },
): Promise<Store> {
  const res = await fetch(`${API_BASE}/stores/${storeId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Error al actualizar los datos del almacén');
  }
  return res.json();
}

export async function updateStoreLocation(
  token: string,
  locationId: string,
  data: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    latitude?: number;
    longitude?: number;
    imageUrl?: string;
    phone?: string;
    whatsapp?: string;
  },
): Promise<Location> {
  const res = await fetch(`${API_BASE}/locations/${locationId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Error al actualizar la ubicación de la sede');
  }
  return res.json();
}

export async function fetchCategories(token?: string) {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}/catalog/categories`, {
      headers,
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {
    console.warn('Backend categories API error, using mock:', err);
  }
  return MOCK_CATEGORIES;
}

/* ==========================================================================
   SPRINT 3: B2B INVENTORY MANAGEMENT & BULK UPLOAD
   ========================================================================== */

export async function fetchInventorySummary(
  token: string,
  storeId?: string,
): Promise<InventorySummary> {
  const url = storeId
    ? `${API_BASE}/inventory/summary?storeId=${storeId}`
    : `${API_BASE}/inventory/summary`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Error ${res.status}: Fallo al cargar el resumen del inventario`);
  }
  return res.json();
}

export async function fetchStoreInventory(
  token: string,
  options: {
    q?: string;
    locationId?: string;
    status?: 'all' | 'ok' | 'low' | 'out';
    page?: number;
    limit?: number;
    storeId?: string;
  } = {},
): Promise<{
  data: StoreInventoryItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}> {
  const params = new URLSearchParams();
  if (options.q) params.append('q', options.q);
  if (options.locationId) params.append('locationId', options.locationId);
  if (options.status && options.status !== 'all') params.append('status', options.status);
  if (options.page) params.append('page', String(options.page));
  if (options.limit) params.append('limit', String(options.limit));
  if (options.storeId) params.append('storeId', options.storeId);

  const res = await fetch(`${API_BASE}/inventory?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Error ${res.status}: Fallo al cargar la lista de inventario`);
  }
  return res.json();
}

export async function uploadInventoryCsv(
  token: string,
  file: File,
  dryRun: boolean = false,
  storeId?: string,
): Promise<BulkUploadReport> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('dryRun', String(dryRun));
  if (storeId) formData.append('storeId', storeId);

  const res = await fetch(`${API_BASE}/inventory/bulk-upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.message || `Error ${res.status}: Fallo en la carga masiva`);
  }
  return res.json();
}

export async function downloadCsvTemplate(token: string): Promise<string> {
  const res = await fetch(`${API_BASE}/inventory/template`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Error ${res.status}: Fallo al descargar plantilla`);
  }
  return res.text();
}

export async function createPartWithStock(
  token: string,
  dto: CreatePartWithStockDto,
  storeId?: string,
): Promise<StoreInventoryItem> {
  const url = storeId
    ? `${API_BASE}/inventory/parts?storeId=${storeId}`
    : `${API_BASE}/inventory/parts`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dto),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.message || `Error ${res.status}: No se pudo crear el repuesto`);
  }
  return res.json();
}

export async function updateInventoryStock(
  token: string,
  inventoryId: string,
  data: {
    price?: number;
    stock?: number;
    condition?: string;
    isAvailable?: boolean;
  },
): Promise<StoreInventoryItem> {
  const res = await fetch(`${API_BASE}/inventory/${inventoryId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.message || `Error ${res.status}: Fallo al actualizar stock`);
  }
  return res.json();
}

export async function deleteInventoryItem(
  token: string,
  inventoryId: string,
): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/inventory/${inventoryId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.message || `Error ${res.status}: No se pudo eliminar el registro`);
  }
  return res.json();
}

export async function fetchStoreLocations(
  token: string,
  storeId?: string,
): Promise<Location[]> {
  const url = storeId
    ? `${API_BASE}/inventory/locations?storeId=${storeId}`
    : `${API_BASE}/inventory/locations`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Error ${res.status}: Fallo al consultar sedes de la tienda`);
  }
  return res.json();
}

export async function createStoreLocation(
  token: string,
  data: {
    storeId?: string;
    name: string;
    address: string;
    city: string;
    state?: string;
    latitude?: number;
    longitude?: number;
    imageUrl?: string;
    phone?: string;
    whatsapp?: string;
  },
): Promise<Location> {
  const res = await fetch(`${API_BASE}/locations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.message || `Error ${res.status}: No se pudo crear la sede`);
  }
  return res.json();
}

export async function uploadPartImage(
  token: string,
  file: File,
): Promise<{ url: string; filename: string }> {
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`${API_BASE}/inventory/upload-image`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.message || `Error ${res.status}: Fallo al subir la imagen`);
  }
  return res.json();
}

/* ==========================================================================
   SPRINT 4: LEADS, METRICS, DEMAND ANALYSIS & Q&A
   ========================================================================== */

export async function createLead(dto: {
  storeId: string;
  partId: string;
  locationId?: string;
  buyerName?: string;
  buyerPhone?: string;
  buyerCity?: string;
  buyerMessage?: string;
  quotedPrice?: number;
  sourceUrl?: string;
}): Promise<LeadItem> {
  const res = await fetch(`${API_BASE}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Error al registrar lead');
  }
  return res.json();
}

export async function fetchStoreLeads(
  token: string,
  options: {
    status?: LeadStatus;
    locationId?: string;
    page?: number;
    limit?: number;
    storeId?: string;
  } = {},
): Promise<{ data: LeadItem[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
  const params = new URLSearchParams();
  if (options.status) params.append('status', options.status);
  if (options.locationId) params.append('locationId', options.locationId);
  if (options.page) params.append('page', String(options.page));
  if (options.limit) params.append('limit', String(options.limit));
  if (options.storeId) params.append('storeId', options.storeId);

  const res = await fetch(`${API_BASE}/leads?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Error ${res.status}: Fallo al cargar leads del almacén`);
  }
  return res.json();
}

export async function fetchStoreLeadStats(token: string, storeId?: string): Promise<LeadStats> {
  const url = storeId ? `${API_BASE}/leads/stats?storeId=${storeId}` : `${API_BASE}/leads/stats`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Error ${res.status}: Fallo al cargar estadísticas de leads`);
  }
  return res.json();
}

export async function updateLeadStatus(
  token: string,
  leadId: string,
  status: LeadStatus,
): Promise<LeadItem> {
  const res = await fetch(`${API_BASE}/leads/${leadId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    throw new Error(`Error ${res.status}: Fallo al actualizar estado del lead`);
  }
  return res.json();
}

export async function fetchUnmetDemand(token: string, city?: string): Promise<UnmetDemandItem[]> {
  const url = city ? `${API_BASE}/leads/unmet-demand?city=${encodeURIComponent(city)}` : `${API_BASE}/leads/unmet-demand`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Error ${res.status}: Fallo al cargar demanda insatisfecha`);
  }
  return res.json();
}

export async function fetchPartQuestions(partId: string): Promise<PartQuestion[]> {
  const res = await fetch(`${API_BASE}/catalog/parts/${partId}/questions`, { cache: 'no-store' });
  if (!res.ok) {
    return [];
  }
  return res.json();
}

export async function createPartQuestion(
  partId: string,
  data: { authorName: string; question: string },
): Promise<PartQuestion> {
  const res = await fetch(`${API_BASE}/catalog/parts/${partId}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Error al enviar pregunta');
  }
  return res.json();
}

export async function answerPartQuestion(
  token: string,
  questionId: string,
  data: { answer: string; answeredBy?: string },
): Promise<PartQuestion> {
  const res = await fetch(`${API_BASE}/catalog/questions/${questionId}/answer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Error al responder pregunta');
  }
  return res.json();
}

/**
 * Fórmula de Haversine para calcular distancia en kilómetros entre dos coordenadas GPS
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

/* ==========================================================================
   SPRINT 5: RESERVACIONES EN SEDE FÍSICA (CLICK & COLLECT)
   ========================================================================== */

export async function createReservation(dto: CreateReservationDto): Promise<ReservationItem> {
  const res = await fetch(`${API_BASE}/reservations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Error al procesar la reserva en sede');
  }
  return res.json();
}

export async function fetchReservationByCode(code: string): Promise<ReservationItem> {
  const res = await fetch(`${API_BASE}/reservations/code/${encodeURIComponent(code)}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Reserva no encontrada');
  }
  return res.json();
}

export async function fetchStoreReservations(
  token: string,
  options: {
    status?: string;
    search?: string;
    q?: string;
    locationId?: string;
    page?: number;
    limit?: number;
    storeId?: string;
  } = {},
): Promise<{
  data: ReservationItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}> {
  const params = new URLSearchParams();
  if (options.status && options.status !== 'all') params.append('status', options.status);
  const searchVal = options.search || options.q;
  if (searchVal) params.append('search', searchVal);
  if (options.locationId && options.locationId !== 'all') params.append('locationId', options.locationId);
  if (options.page) params.append('page', String(options.page));
  if (options.limit) params.append('limit', String(options.limit));
  if (options.storeId) params.append('storeId', options.storeId);

  const res = await fetch(`${API_BASE}/reservations?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Error ${res.status}: Fallo al cargar reservas`);
  }
  return res.json();
}

export async function fetchStoreReservationStats(
  token: string,
  storeId?: string,
): Promise<ReservationStats> {
  const url = storeId
    ? `${API_BASE}/reservations/stats?storeId=${encodeURIComponent(storeId)}`
    : `${API_BASE}/reservations/stats`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Error ${res.status}: Fallo al cargar estadísticas de reservas`);
  }
  return res.json();
}

export async function updateReservationStatus(
  token: string,
  reservationId: string,
  dto: {
    status: ReservationStatus;
    deliveredBy?: string;
    notes?: string;
  },
  storeId?: string,
): Promise<ReservationItem> {
  const url = storeId
    ? `${API_BASE}/reservations/${reservationId}/status?storeId=${encodeURIComponent(storeId)}`
    : `${API_BASE}/reservations/${reservationId}/status`;

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Error al actualizar estado de la reserva');
  }
  return res.json();
}




