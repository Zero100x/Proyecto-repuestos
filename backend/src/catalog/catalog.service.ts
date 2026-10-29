import { Injectable, NotFoundException, ConflictException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MeilisearchService } from '../search/meilisearch.service';
import {
  CreatePartCategoryDto, CreatePartDto, UpdatePartDto,
  AddPartNumberDto, AddCompatibilityDto, AddInventoryDto,
  BulkCompatibilityDto, CreateQuestionDto, AnswerQuestionDto,
} from './dto/catalog.dto';

const DEFAULT_CATEGORIES = [
  { id: '657335ec-1c68-4480-bf34-a0875ebef00f', name: 'Frenos', slug: 'frenos', description: 'Pastillas, discos, bandas y cilindros de freno' },
  { id: 'e047873b-c655-4b3a-b72d-63a4b1a68674', name: 'Motor', slug: 'motor', description: 'Bujías, filtros, empaques, correas y distribución' },
  { id: 'ada5caf8-153a-4cf2-81a3-617855e51630', name: 'Suspensión', slug: 'suspension', description: 'Amortiguadores, espirales, terminales y rótulas' },
  { id: '2a767242-179f-4bb6-a8ce-78c413f07396', name: 'Transmisión', slug: 'transmision', description: 'Kits de embrague, crucetas y ejes de tracción' },
  { id: 'df90734f-63b4-49cc-88e8-7a563a71642e', name: 'Eléctrico', slug: 'electrico', description: 'Baterías, alternadores, arrancadores y sensores' },
  { id: '508227e3-2037-42ba-aa9c-4c6fdc48c391', name: 'Carrocería', slug: 'carroceria', description: 'Farolas, retrovisores, defensas y persianas' },
  { id: '29fc8bf6-fb11-4954-a626-773fa6cf5659', name: 'Filtros', slug: 'filtros', description: 'Filtros de aire, aceite, combustible' },
  { id: 'c7d4baa6-f09d-413f-b7ca-ca0fc62e778e', name: 'Refrigeración', slug: 'refrigeracion', description: 'Sistema de enfriamiento del motor' },
  { id: '8a11bc32-9b21-4d1a-8c19-123456789abc', name: 'Dirección', slug: 'direccion', description: 'Cremalleras y terminales de dirección' },
  { id: '9b22cd43-ac32-4e2b-9d2a-234567890bcd', name: 'Iluminación', slug: 'iluminacion', description: 'Farolas, stops y bombillos' },
];

@Injectable()
export class CatalogService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private meilisearch: MeilisearchService,
  ) {}

  async onModuleInit() {
    await this.ensureDefaultCategories();
    setTimeout(() => {
      this.syncAllPartsToSearch().catch(() => {});
    }, 1500);
  }

  async ensureDefaultCategories() {
    try {
      for (const cat of DEFAULT_CATEGORIES) {
        await this.prisma.partCategory.upsert({
          where: { id: cat.id },
          update: {},
          create: cat,
        }).catch(async () => {
          await this.prisma.partCategory.upsert({
            where: { slug: cat.slug },
            update: {},
            create: cat,
          }).catch(() => {});
        });
      }
    } catch (err) {
      console.warn('Error inicializando categorías por defecto:', err);
    }
  }

  // ============ CATEGORÍAS ============

  async findAllCategories() {
    const count = await this.prisma.partCategory.count();
    if (count === 0) {
      await this.ensureDefaultCategories();
    }

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
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;
    const where: any = { isActive: true };
    if (categoryId) where.categoryId = categoryId;

    const [parts, total] = await Promise.all([
      this.prisma.part.findMany({
        skip,
        take: limitNum,
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
                store: { select: { id: true, name: true, phone: true, nit: true, imageUrl: true } },
              },
            },
          },
          orderBy: { price: 'asc' },
        },
      },
    });

    if (!part) throw new NotFoundException('Repuesto no encontrado');
    const minPrice = part.inventory.length > 0 ? part.inventory[0].price : null;
    const maxPrice = part.inventory.length > 0 ? Math.max(...part.inventory.map(i => i.price)) : null;
    const storeNames = Array.from(new Set(part.inventory.map(i => i.location?.store?.name).filter(Boolean)));
    const addresses = Array.from(new Set(part.inventory.map(i => i.location?.address).filter(Boolean)));
    const locationNames = Array.from(new Set(part.inventory.map(i => i.location?.name).filter(Boolean)));
    const cities = Array.from(new Set(part.inventory.map(i => i.location?.city).filter(Boolean)));
    const locations = part.inventory.map((i) => ({
      id: i.location?.id,
      storeId: i.location?.storeId,
      storeName: i.location?.store?.name,
      name: i.location?.name,
      address: i.location?.address,
      city: i.location?.city,
      latitude: i.location?.latitude,
      longitude: i.location?.longitude,
      phone: i.location?.phone || i.location?.whatsapp,
    }));
    const makes = Array.from(new Set(part.compatibility.map(c => c.version?.year?.model?.make?.name).filter(Boolean)));
    const models = Array.from(new Set(part.compatibility.map(c => c.version?.year?.model?.name).filter(Boolean)));
    const years = Array.from(new Set(part.compatibility.map(c => c.version?.year?.year).filter(Boolean)));
    const versions = Array.from(new Set(part.compatibility.map(c => c.version?.name).filter(Boolean)));
    const conditions = Array.from(new Set(part.inventory.map(i => i.condition)));
    const totalStock = part.inventory.reduce((sum, i) => sum + i.stock, 0);

    return {
      ...part,
      minPrice,
      maxPrice,
      totalStock,
      storeNames,
      addresses,
      locationNames,
      cities,
      locations,
      makes,
      models,
      years,
      versions,
      conditions,
      locationCount: part.inventory.length,
    };
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
      warranty: part.warranty,
      hasWarranty: part.hasWarranty,
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
      storeNames: [...new Set(part.inventory.map((i) => i.location?.store?.name).filter(Boolean))],
      addresses: [...new Set(part.inventory.map((i) => i.location?.address).filter(Boolean))],
      locationNames: [...new Set(part.inventory.map((i) => i.location?.name).filter(Boolean))],
      cities: [...new Set(part.inventory.map((i) => i.location?.city).filter(Boolean))],
      locations: part.inventory.map((i) => ({
        id: i.location?.id,
        storeId: i.location?.storeId,
        storeName: i.location?.store?.name,
        name: i.location?.name,
        address: i.location?.address,
        city: i.location?.city,
        latitude: i.location?.latitude,
        longitude: i.location?.longitude,
        phone: i.location?.phone || i.location?.whatsapp,
      })),
      isAvailable: part.inventory.length > 0,
      imageUrl: part.imageUrl,
      images: part.images ?? (part.imageUrl ? [part.imageUrl] : []),
      updatedAt: part.updatedAt.toISOString(),
    };

    await this.meilisearch.indexPart(searchDocument);
  }

  async syncAllPartsToSearch() {
    await this.meilisearch.clearAllParts();

    const parts = await this.prisma.part.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    for (const part of parts) {
      await this.syncPartToSearch(part.id);
    }

    return { message: `${parts.length} repuestos sincronizados con Meilisearch` };
  }

  // ============ PREGUNTAS TÉCNICAS (PDCIRA-17) ============

  async getPartQuestions(partId: string) {
    await this.findOnePart(partId);
    return this.prisma.partQuestion.findMany({
      where: { partId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createQuestion(partId: string, dto: CreateQuestionDto, userId?: string) {
    await this.findOnePart(partId);
    return this.prisma.partQuestion.create({
      data: {
        partId,
        authorName: dto.authorName.trim(),
        question: dto.question.trim(),
        userId: userId || null,
      },
    });
  }

  async answerQuestion(questionId: string, dto: AnswerQuestionDto, userEmail?: string) {
    const question = await this.prisma.partQuestion.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundException('Pregunta no encontrada');

    return this.prisma.partQuestion.update({
      where: { id: questionId },
      data: {
        answer: dto.answer.trim(),
        answeredBy: dto.answeredBy?.trim() || userEmail || 'Asesor Técnico',
        answeredAt: new Date(),
      },
    });
  }
}
