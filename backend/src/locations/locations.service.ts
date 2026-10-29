import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { join, extname } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreDto, CreateLocationDto, UpdateLocationDto, OnboardStoreDto } from './dto/locations.dto';

@Injectable()
export class LocationsService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async onboardStoreForUser(userId: string, dto: OnboardStoreDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });

    if (!existingUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException('El nombre del almacén es obligatorio');
    }

    const storeName = dto.name.trim();
    const storeCity = dto.city?.trim() || 'Pasto';
    const storeAddress = dto.address?.trim() || 'Carrera 19 # 14-35, Barrio Julián Bucheli';
    const storePhone = dto.phone?.trim() || existingUser.phone || '+573158001122';
    const storeWhatsapp = dto.whatsapp?.trim() || storePhone;

    let cleanNit = dto.nit?.trim() || undefined;
    if (cleanNit) {
      const existingNit = await this.prisma.store.findUnique({ where: { nit: cleanNit } });
      if (existingNit) {
        cleanNit = `${cleanNit}-${Math.floor(100 + Math.random() * 900)}`;
      }
    }

    // Buscar o crear el rol STORE_ADMIN
    let storeAdminRole = await this.prisma.role.findUnique({
      where: { name: 'STORE_ADMIN' },
    });
    if (!storeAdminRole) {
      storeAdminRole = await this.prisma.role.create({
        data: { name: 'STORE_ADMIN', description: 'Administrador de almacén de repuestos' },
      });
    }

    const newStore = await this.prisma.store.create({
      data: {
        name: storeName,
        nit: cleanNit,
        phone: storePhone,
        email: existingUser.email,
        imageUrl: dto.imageUrl || undefined,
        operatingHours: dto.operatingHours || undefined,
        hasDelivery: dto.hasDelivery !== undefined ? dto.hasDelivery : undefined,
        deliveryDetails: dto.deliveryDetails || undefined,
        locations: {
          create: {
            name: `Sede Principal — ${storeCity}`,
            address: storeAddress,
            city: storeCity,
            state: 'Nariño',
            latitude: dto.latitude ?? 1.2084,
            longitude: dto.longitude ?? -77.2765,
            imageUrl: dto.imageUrl || undefined,
            phone: storePhone,
            whatsapp: storeWhatsapp,
            operatingHours: dto.operatingHours || undefined,
            hasDelivery: dto.hasDelivery !== undefined ? dto.hasDelivery : undefined,
            deliveryDetails: dto.deliveryDetails || undefined,
          },
        },
      },
      include: { locations: true },
    });

    // Asignar rol STORE_ADMIN si aún no lo tiene
    await this.prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: existingUser.id,
          roleId: storeAdminRole.id,
        },
      },
      update: {},
      create: {
        userId: existingUser.id,
        roleId: storeAdminRole.id,
      },
    });

    // Asociar el usuario al nuevo almacén
    const updatedUser = await this.prisma.user.update({
      where: { id: existingUser.id },
      data: {
        storeId: newStore.id,
        phone: existingUser.phone || storePhone,
      },
      include: {
        store: { include: { locations: true } },
        roles: { include: { role: true } },
      },
    });

    const roles = updatedUser.roles.map((ur) => ur.role.name);
    const payload = {
      sub: updatedUser.id,
      email: updatedUser.email,
      roles,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      store: newStore,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
        roles,
        storeId: updatedUser.storeId ?? null,
        store: updatedUser.store ?? null,
      },
    };
  }

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
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [stores, total] = await Promise.all([
      this.prisma.store.findMany({
        skip,
        take: limitNum,
        include: {
          locations: {
            where: { isActive: true },
            include: { _count: { select: { inventory: true } } },
          },
          _count: { select: { locations: true, users: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.store.count(),
    ]);

    return {
      data: stores,
      meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
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
    const loc = await this.findOneLocation(id);

    const updated = await this.prisma.location.update({
      where: { id },
      data: dto,
      include: {
        store: { select: { id: true, name: true, imageUrl: true } },
      },
    });

    if (loc.storeId && (dto.operatingHours || dto.hasDelivery !== undefined || dto.deliveryDetails !== undefined)) {
      await this.prisma.store.update({
        where: { id: loc.storeId },
        data: {
          operatingHours: dto.operatingHours,
          hasDelivery: dto.hasDelivery,
          deliveryDetails: dto.deliveryDetails,
        },
      }).catch(() => {});
    }

    return updated;
  }

  async deactivateLocation(id: string) {
    await this.findOneLocation(id);
    return this.prisma.location.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
