import { Injectable, NotFoundException } from '@nestjs/common';
import { join, extname } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreDto, CreateLocationDto, UpdateLocationDto } from './dto/locations.dto';

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  saveStoreImage(file: Express.Multer.File): { imageUrl: string } {
    const uploadsDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }
    const ext = extname(file.originalname || '.jpg').toLowerCase() || '.jpg';
    const fileName = `store_${randomUUID()}${ext}`;
    const fullPath = join(uploadsDir, fileName);
    writeFileSync(fullPath, file.buffer);
    const baseUrl = process.env.API_PUBLIC_URL || 'http://localhost:3001';
    return { imageUrl: `${baseUrl}/uploads/${fileName}` };
  }

  // ============ STORES (Almacenes) ============

  async findAllStores(page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [stores, total] = await Promise.all([
      this.prisma.store.findMany({
        skip,
        take: limit,
        include: {
          locations: { where: { isActive: true } },
          _count: { select: { locations: true, users: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.store.count(),
    ]);

    return {
      data: stores,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOneStore(id: string) {
    const store = await this.prisma.store.findUnique({
      where: { id },
      include: {
        locations: true,
        users: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!store) throw new NotFoundException('Almacén no encontrado');
    return store;
  }

  async createStore(dto: CreateStoreDto) {
    return this.prisma.store.create({ data: dto });
  }

  async updateStore(id: string, dto: Partial<CreateStoreDto>) {
    await this.findOneStore(id);
    return this.prisma.store.update({ where: { id }, data: dto });
  }

  // ============ LOCATIONS (Sedes/Bodegas) ============

  async findAllLocations(storeId?: string) {
    const where = storeId ? { storeId, isActive: true } : { isActive: true };

    return this.prisma.location.findMany({
      where,
      include: {
        store: { select: { id: true, name: true, nit: true, phone: true, email: true, imageUrl: true } },
        _count: { select: { inventory: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneLocation(id: string) {
    const location = await this.prisma.location.findUnique({
      where: { id },
      include: {
        store: true,
        _count: { select: { inventory: true } },
      },
    });

    if (!location) throw new NotFoundException('Sede no encontrada');
    return location;
  }

  async createLocation(dto: CreateLocationDto) {
    // Verificar que el store existe
    const store = await this.prisma.store.findUnique({
      where: { id: dto.storeId },
    });
    if (!store) throw new NotFoundException('Almacén no encontrado');

    return this.prisma.location.create({
      data: dto,
      include: {
        store: { select: { id: true, name: true, imageUrl: true } },
      },
    });
  }

  async updateLocation(id: string, dto: UpdateLocationDto) {
    await this.findOneLocation(id);

    return this.prisma.location.update({
      where: { id },
      data: dto,
      include: {
        store: { select: { id: true, name: true, imageUrl: true } },
      },
    });
  }

  async deactivateLocation(id: string) {
    await this.findOneLocation(id);
    return this.prisma.location.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
