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
  isActive: boolean;
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
  phone?: string;
  whatsapp?: string;
  isActive: boolean;
  store?: Store;
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
