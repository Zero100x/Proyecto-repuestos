export type PartCondition = 'NEW' | 'USED' | 'REFURBISHED';

export interface PartNumber {
  id: string;
  partId?: string;
  number: string;
  type: string; // OEM, AFTERMARKET, UNIVERSAL
}

export interface VehicleMake {
  id: string;
  name: string;
}

export interface VehicleModel {
  id: string;
  makeId: string;
  name: string;
}

export interface VehicleYear {
  id: string;
  modelId: string;
  year: number;
}

export interface VehicleVersion {
  id: string;
  yearId: string;
  name: string;
  engine?: string;
}

export interface CompatibilityItem {
  id: string;
  version: {
    id: string;
    name: string;
    engine?: string;
    year: {
      id: string;
      year: number;
      model: {
        id: string;
        name: string;
        make: {
          id: string;
          name: string;
        };
      };
    };
  };
}

export interface Store {
  id: string;
  name: string;
  nit?: string;
  phone?: string;
  email?: string;
  imageUrl?: string;
  isActive: boolean;
  locations?: Location[];
}

export interface Location {
  id: string;
  storeId: string;
  name: string;
  address: string;
  city: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  imageUrl?: string;
  phone?: string;
  whatsapp?: string;
  isActive: boolean;
  store?: Store;
  _count?: {
    inventory?: number;
  };
}

export interface InventoryItem {
  id: string;
  partId: string;
  locationId: string;
  price: number;
  stock: number;
  condition: PartCondition;
  isAvailable: boolean;
  location: Location;
}

export interface PartCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

export interface Part {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  brand?: string;
  weight?: number;
  imageUrl?: string;
  isActive: boolean;
  category?: PartCategory;
  partNumbers?: PartNumber[];
  compatibility?: CompatibilityItem[];
  inventory?: InventoryItem[];
  // Calculated or search hit fields
  minPrice?: number;
  maxPrice?: number;
  totalStock?: number;
  conditions?: PartCondition[];
  makes?: string[];
  models?: string[];
  years?: number[];
  versions?: string[];
  storeNames?: string[];
  cities?: string[];
  locationCount?: number;
}

export interface SearchFilters {
  query?: string;
  make?: string;
  model?: string;
  year?: number;
  version?: string;
  category?: string;
  condition?: PartCondition;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'minPrice' | 'name' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roles: Array<{ role: { name: 'BUYER' | 'STORE_ADMIN' | 'PLATFORM_ADMIN' } }>;
  storeId?: string;
}

export interface InventorySummary {
  store: {
    id: string;
    name: string;
  };
  totalItems: number;
  totalUnits: number;
  outOfStock: number;
  lowStock: number;
  locations: number;
  lowStockThreshold: number;
}

export interface StoreInventoryItem {
  id: string;
  partId: string;
  locationId: string;
  price: number;
  stock: number;
  condition: PartCondition;
  isAvailable: boolean;
  updatedAt: string;
  createdAt: string;
  part: {
    id: string;
    name: string;
    brand?: string;
    imageUrl?: string;
    category?: { name: string; slug?: string };
    partNumbers?: Array<{ number: string; type: string }>;
  };
  location: {
    id: string;
    name: string;
    city: string;
    address?: string;
  };
}

export interface BulkUploadRowError {
  row: number;
  message: string;
}

export interface BulkUploadReport {
  totalRows: number;
  inventoryCreated: number;
  inventoryUpdated: number;
  partsCreated: number;
  errors: BulkUploadRowError[];
  dryRun: boolean;
}

export interface CreatePartWithStockDto {
  name: string;
  brand?: string;
  categoryId: string;
  description?: string;
  imageUrl?: string;
  oemNumber?: string;
  aftermarketNumbers?: string[];
  locationId: string;
  price: number;
  stock: number;
  condition?: PartCondition;
  versionIds?: string[];
}

/* ==========================================================================
   SPRINT 4: LEADS, METRICS, UNMET DEMAND & TECHNICAL Q&A
   ========================================================================== */

export type LeadStatus = 'NEW' | 'CONTACTED' | 'CONVERTED' | 'CANCELLED';

export interface LeadItem {
  id: string;
  storeId: string;
  locationId?: string | null;
  partId: string;
  buyerId?: string | null;
  buyerName?: string | null;
  buyerPhone?: string | null;
  buyerCity?: string | null;
  buyerMessage?: string | null;
  quotedPrice?: number | null;
  sourceUrl?: string | null;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
  part: {
    id: string;
    name: string;
    slug: string;
    brand?: string | null;
    imageUrl?: string | null;
    category?: { id: string; name: string };
    partNumbers?: Array<{ number: string; type: string }>;
  };
  location?: {
    id: string;
    name: string;
    address: string;
    city: string;
    phone?: string | null;
    whatsapp?: string | null;
  } | null;
}

export interface LeadStats {
  totalLeads: number;
  leads7d: number;
  leads30d: number;
  conversionRate: number;
  byStatus: {
    NEW: number;
    CONTACTED: number;
    CONVERTED: number;
    CANCELLED: number;
  };
  topParts: Array<{
    partId: string;
    count: number;
    name: string;
    brand: string | null;
    oem: string | null;
    imageUrl: string | null;
  }>;
  byLocation: Array<{
    locationId: string;
    name: string;
    city: string;
    count: number;
  }>;
}

export interface UnmetDemandItem {
  query: string;
  searchCount: number;
  recommendation: string;
}

export interface PartQuestion {
  id: string;
  partId: string;
  userId?: string | null;
  authorName: string;
  question: string;
  answer?: string | null;
  answeredBy?: string | null;
  answeredAt?: string | null;
  createdAt: string;
}

/* ==========================================================================
   SPRINT 5: SISTEMA DE RESERVAS CLICK & COLLECT EN SEDE
   ========================================================================== */

export const ReservationStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
} as const;
export type ReservationStatus = (typeof ReservationStatus)[keyof typeof ReservationStatus];

export interface CreateReservationDto {
  partId: string;
  locationId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerDocument?: string;
  quantity?: number;
  notes?: string;
}

export interface ReservationItem {
  id: string;
  code: string;
  storeId: string;
  locationId: string;
  partId: string;
  inventoryId?: string | null;
  buyerId?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  customerDocument?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: ReservationStatus;
  notes?: string | null;
  expiresAt: string;
  deliveredAt?: string | null;
  deliveredBy?: string | null;
  createdAt: string;
  updatedAt: string;
  part: {
    id: string;
    name: string;
    slug?: string;
    brand?: string | null;
    imageUrl?: string | null;
    oemNumber?: string | null;
    partNumbers?: Array<{ number: string; type: string }>;
  };
  location: {
    id: string;
    name: string;
    address: string;
    city: string;
    phone?: string | null;
    whatsapp?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };
  store?: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
  };
}

export interface ReservationStats {
  total: number;
  pending: number;
  expiringSoon: number;
  completed: number;
  cancelled: number;
  expired: number;
  conversionRate: number;
  totalValuePending: number;
  totalValueCompleted: number;
  // Conveniences:
  totalReservations?: number;
  pendingCount?: number;
  expiringSoonCount?: number;
  completedCount?: number;
  cancelledCount?: number;
  expiredCount?: number;
  pendingValueCOP?: number;
}



