import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MeilisearchService } from '../search/meilisearch.service';
import {
  CreatePartCategoryDto, CreatePartDto, UpdatePartDto,
  AddPartNumberDto, AddCompatibilityDto, AddInventoryDto,
  BulkCompatibilityDto,
} from './dto/catalog.dto';

@Injectable()
export class CatalogService {
  constructor(
    private prisma: PrismaService,
    private meilisearch: MeilisearchService,
  ) {}

  // ============ CATEGORÍAS ============

  async findAllCategories() {
    return this.prisma.partCategory.findMany({
      include: {
        children: true,
        _count: { select: { parts: true } },
      },
      where: { parentId: null }, // Solo raíces, con hijos anidados
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(dto: CreatePartCategoryDto) {
    return this.prisma.partCategory.create({ data: dto });
  }

  // ============ REPUESTOS (PDCIRA-7) ============

  async findAllParts(page = 1, limit = 20, categoryId?: string) {
    const skip = (page - 1) * limit;
    const where: any = { isActive: true };
    if (categoryId) where.categoryId = categoryId;

    const [parts, total] = await Promise.all([
      this.prisma.part.findMany({
        skip,
        take: limit,
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          partNumbers: true,
          _count: { select: { compatibility: true, inventory: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.part.count({ where }),
    ]);

    return {
      data: parts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOnePart(id: string) {
    const part = await this.prisma.part.findUnique({
      where: { id },
      include: {
        category: true,
        partNumbers: true,
        compatibility: {
          include: {
            version: {
              include: {
                year: {
                  include: {
                    model: {
                      include: { make: true },
                    },
                  },
                },
              },
            },
          },
        },
        inventory: {
          where: { isAvailable: true, stock: { gt: 0 } },
          include: {
            location: {
              include: {
                store: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { price: 'asc' },
        },
      },
    });

    if (!part) throw new NotFoundException('Repuesto no encontrado');
    return part;
  }

  async createPart(dto: CreatePartDto) {
    const part = await this.prisma.part.create({
      data: dto,
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    // Indexar en Meilisearch
    await this.syncPartToSearch(part.id);

    return part;
  }

  async updatePart(id: string, dto: UpdatePartDto) {
    await this.findOnePart(id);

    const part = await this.prisma.part.update({
      where: { id },
      data: dto,
      include: { category: true, partNumbers: true },
    });

    // Re-indexar en Meilisearch
    await this.syncPartToSearch(id);

    return part;
  }

  // ============ NÚMEROS DE PARTE ============

  async addPartNumber(partId: string, dto: AddPartNumberDto) {
    await this.findOnePart(partId);

    const partNumber = await this.prisma.partNumber.create({
      data: { partId, ...dto },
    });

    await this.syncPartToSearch(partId);
    return partNumber;
  }

  async removePartNumber(partId: string, partNumberId: string) {
    await this.prisma.partNumber.delete({
      where: { id: partNumberId },
    });

    await this.syncPartToSearch(partId);
    return { message: 'Número de parte eliminado' };
  }

  // ============ COMPATIBILIDAD ============

  async addCompatibility(partId: string, dto: AddCompatibilityDto) {
    await this.findOnePart(partId);

    const existing = await this.prisma.partCompatibility.findUnique({
      where: { partId_versionId: { partId, versionId: dto.versionId } },
    });

    if (existing) throw new ConflictException('Esta compatibilidad ya existe');

    const compat = await this.prisma.partCompatibility.create({
      data: { partId, ...dto },
      include: {
        version: {
          include: {
            year: {
              include: {
                model: {
                  include: { make: true },
                },
              },
            },
          },
        },
      },
    });

    await this.syncPartToSearch(partId);
    return compat;
  }

  async addBulkCompatibility(partId: string, dto: BulkCompatibilityDto) {
    await this.findOnePart(partId);

    const data = dto.versionIds.map((versionId) => ({
      partId,
      versionId,
      notes: dto.notes,
    }));

    await this.prisma.partCompatibility.createMany({
      data,
      skipDuplicates: true,
    });

    await this.syncPartToSearch(partId);

    return { message: `${dto.versionIds.length} compatibilidades agregadas` };
  }

  async removeCompatibility(partId: string, compatibilityId: string) {
    await this.prisma.partCompatibility.delete({
      where: { id: compatibilityId },
    });

    await this.syncPartToSearch(partId);
    return { message: 'Compatibilidad eliminada' };
  }

  // ============ INVENTARIO ============

  async addInventory(partId: string, dto: AddInventoryDto) {
    await this.findOnePart(partId);

    const inventory = await this.prisma.inventory.create({
      data: {
        partId,
        ...dto,
      },
      include: {
        location: {
          include: {
            store: { select: { id: true, name: true } },
          },
        },
      },
    });

    await this.syncPartToSearch(partId);
    return inventory;
  }

  async updateInventory(inventoryId: string, data: { price?: number; stock?: number }) {
    const inventory = await this.prisma.inventory.update({
      where: { id: inventoryId },
      data: {
        ...data,
        isAvailable: data.stock !== undefined ? data.stock > 0 : undefined,
      },
    });

    await this.syncPartToSearch(inventory.partId);
    return inventory;
  }

  // ============ SYNC CON MEILISEARCH ============

  async syncPartToSearch(partId: string) {
    const part = await this.prisma.part.findUnique({
      where: { id: partId },
      include: {
        category: true,
        partNumbers: true,
        compatibility: {
          include: {
            version: {
              include: {
                year: {
                  include: {
                    model: {
                      include: { make: true },
                    },
                  },
                },
              },
            },
          },
        },
        inventory: {
          where: { isAvailable: true, stock: { gt: 0 } },
          include: {
            location: {
              include: {
                store: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    if (!part) return;

    // Construir documento denormalizado para Meilisearch
    const vehicles = part.compatibility.map((c) => ({
      make: c.version.year.model.make.name,
      model: c.version.year.model.name,
      year: c.version.year.year,
      version: c.version.name,
    }));

    const searchDocument = {
      id: part.id,
      name: part.name,
      slug: part.slug,
      description: part.description,
      brand: part.brand,
      category: part.category.name,
      categorySlug: part.category.slug,
      partNumbers: part.partNumbers.map((pn) => pn.number),
      partNumberTypes: part.partNumbers.map((pn) => pn.type),
      vehicles,
      makes: [...new Set(vehicles.map((v) => v.make))],
      models: [...new Set(vehicles.map((v) => v.model))],
      years: [...new Set(vehicles.map((v) => v.year))],
      versions: [...new Set(vehicles.map((v) => v.version))],
      minPrice: part.inventory.length > 0
        ? Math.min(...part.inventory.map((i) => i.price))
        : null,
      maxPrice: part.inventory.length > 0
        ? Math.max(...part.inventory.map((i) => i.price))
        : null,
      totalStock: part.inventory.reduce((sum, i) => sum + i.stock, 0),
      conditions: [...new Set(part.inventory.map((i) => i.condition))],
      locationCount: part.inventory.length,
      storeNames: [...new Set(part.inventory.map((i) => i.location.store.name))],
      isAvailable: part.inventory.length > 0,
      imageUrl: part.imageUrl,
      updatedAt: part.updatedAt.toISOString(),
    };

    await this.meilisearch.indexPart(searchDocument);
  }

  async syncAllPartsToSearch() {
    const parts = await this.prisma.part.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    for (const part of parts) {
      await this.syncPartToSearch(part.id);
    }

    return { message: `${parts.length} repuestos sincronizados con Meilisearch` };
  }
}
