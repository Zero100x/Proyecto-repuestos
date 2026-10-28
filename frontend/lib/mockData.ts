import { Part, VehicleMake, Store, Location, PartCategory } from './types';

export const MOCK_CATEGORIES: PartCategory[] = [
  { id: '657335ec-1c68-4480-bf34-a0875ebef00f', name: 'Frenos', slug: 'frenos', description: 'Pastillas, discos, bandas y cilindros de freno', icon: 'Disc' },
  { id: 'e047873b-c655-4b3a-b72d-63a4b1a68674', name: 'Motor', slug: 'motor', description: 'Bujías, filtros, empaques, correas y distribución', icon: 'Wrench' },
  { id: 'ada5caf8-153a-4cf2-81a3-617855e51630', name: 'Suspensión', slug: 'suspension', description: 'Amortiguadores, espirales, terminales y rótulas', icon: 'Car' },
  { id: '2a767242-179f-4bb6-a8ce-78c413f07396', name: 'Transmisión', slug: 'transmision', description: 'Kits de embrague, crucetas y ejes de tracción', icon: 'Layers' },
  { id: 'df90734f-63b4-49cc-88e8-7a563a71642e', name: 'Eléctrico', slug: 'electrico', description: 'Baterías, alternadores, arrancadores y sensores', icon: 'Sparkles' },
  { id: '508227e3-2037-42ba-aa9c-4c6fdc48c391', name: 'Carrocería', slug: 'carroceria', description: 'Farolas, retrovisores, defensas y persianas', icon: 'Shield' },
  { id: '29fc8bf6-fb11-4954-a626-773fa6cf5659', name: 'Filtros', slug: 'filtros', description: 'Filtros de aire, aceite, combustible', icon: 'Filter' },
  { id: 'c7d4baa6-f09d-413f-b7ca-ca0fc62e778e', name: 'Refrigeración', slug: 'refrigeracion', description: 'Sistema de enfriamiento del motor', icon: 'Thermometer' },
];

export const MOCK_STORES: Store[] = [];

export const MOCK_LOCATIONS: Location[] = [];

export const MOCK_MAKES: VehicleMake[] = [
  { id: 'mk-1', name: 'Toyota' },
  { id: 'mk-2', name: 'Chevrolet' },
  { id: 'mk-3', name: 'Renault' },
  { id: 'mk-4', name: 'Mazda' },
  { id: 'mk-5', name: 'Kia' },
  { id: 'mk-6', name: 'Nissan' },
  { id: 'mk-7', name: 'Hyundai' },
  { id: 'mk-8', name: 'Ford' },
];

export const MOCK_PARTS: Part[] = [];
