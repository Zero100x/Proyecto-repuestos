import {
  Injectable, BadRequestException, ForbiddenException, NotFoundException, Logger,
} from '@nestjs/common';
import { PartCondition, Prisma } from '@prisma/client';
import { join, extname } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CatalogService } from '../catalog/catalog.service';
import { parseCsv, slugify } from './csv.util';
import {
  CreatePartWithStockDto, UpdateStockDto, BulkUploadReport, BulkUploadRowError,
} from './dto/inventory.dto';

export interface AuthUser {
  id: string;
  email: string;
  roles: string[];
  storeId: string | null;
}

const MAX_ROWS = 5000;
const LOW_STOCK_THRESHOLD = 5;

const CONDITION_MAP: Record<string, PartCondition> = {
  new: 'NEW', nuevo: 'NEW', nueva: 'NEW', oem: 'NEW',
  used: 'USED', usado: 'USED', usada: 'USED',
  refurbished: 'REFURBISHED', remanufacturado: 'REFURBISHED', remanufacturada: 'REFURBISHED',
  reconstruido: 'REFURBISHED',
};

export const CSV_TEMPLATE_HEADERS = [
  'codigo_oem', 'nombre', 'marca', 'categoria', 'precio', 'stock', 'condicion', 'sede',
];

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    private prisma: PrismaService,
    private catalog: CatalogService,
  ) {}

  // ============ SCOPING ============

  /**
   * STORE_ADMIN: siempre su propio almacén (ignora storeId enviado).
   * PLATFORM_ADMIN: puede indicar storeId; si no lo indica, se usa el suyo si tiene.
   */
  resolveStoreId(user: AuthUser, requestedStoreId?: string): string {
    const isPlatformAdmin = user.roles.includes('PLATFORM_ADMIN');
    if (isPlatformAdmin && requestedStoreId) return requestedStoreId;
    if (user.storeId) return user.storeId;
    throw new ForbiddenException(
      isPlatformAdmin
        ? 'Indica el parámetro storeId del almacén a gestionar'
        : 'Tu usuario no está asociado a ningún almacén',
    );
  }

  private async assertLocationInStore(locationId: string, storeId: string) {
    const location = await this.prisma.location.findUnique({ where: { id: locationId } });
    if (!location || !location.isActive) throw new NotFoundException('Sede no encontrada');
    if (location.storeId !== storeId) {
      throw new ForbiddenException('La sede no pertenece a tu almacén');
    }
    return location;
  }

  private async safeSync(partIds: Iterable<string>) {
    for (const id of partIds) {
      try {
        await this.catalog.syncPartToSearch(id);
      } catch (err) {
        // Meilisearch caído no debe romper la operación en PostgreSQL
        this.logger.warn(`No se pudo indexar el repuesto ${id}: ${(err as Error).message}`);
      }
    }
  }

  // ============ CONSULTAS ============

  async getMyLocations(user: AuthUser, storeId?: string) {
    const sid = this.resolveStoreId(user, storeId);
    return this.prisma.location.findMany({
      where: { storeId: sid, isActive: true },
      orderBy: { name: 'asc' },
      include: { _count: { select: { inventory: true } } },
    });
  }

  async listInventory(
    user: AuthUser,
    opts: { q?: string; locationId?: string; status?: string; page?: number; limit?: number; storeId?: string },
  ) {
    const sid = this.resolveStoreId(user, opts.storeId);
    const page = Math.max(1, Number(opts.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(opts.limit) || 25));

    const where: Prisma.InventoryWhereInput = { location: { storeId: sid, isActive: true } };
    if (opts.locationId) where.locationId = opts.locationId;
    if (opts.status === 'out') where.stock = 0;
    if (opts.status === 'low') where.stock = { gt: 0, lt: LOW_STOCK_THRESHOLD };
    if (opts.status === 'ok') where.stock = { gte: LOW_STOCK_THRESHOLD };
    if (opts.q) {
      where.part = {
        OR: [
          { name: { contains: opts.q, mode: 'insensitive' } },
          { brand: { contains: opts.q, mode: 'insensitive' } },
          { partNumbers: { some: { number: { contains: opts.q, mode: 'insensitive' } } } },
        ],
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.inventory.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          part: {
            select: {
              id: true, name: true, brand: true, imageUrl: true, images: true,
              category: { select: { name: true } },
              partNumbers: { select: { number: true, type: true } },
            },
          },
          location: { select: { id: true, name: true, city: true } },
        },
      }),
      this.prisma.inventory.count({ where }),
    ]);

    return { data: items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getSummary(user: AuthUser, storeId?: string) {
    const sid = this.resolveStoreId(user, storeId);
    const base: Prisma.InventoryWhereInput = { location: { storeId: sid, isActive: true } };

    const [totalItems, outOfStock, lowStock, units, locations, store] = await Promise.all([
      this.prisma.inventory.count({ where: base }),
      this.prisma.inventory.count({ where: { ...base, stock: 0 } }),
      this.prisma.inventory.count({ where: { ...base, stock: { gt: 0, lt: LOW_STOCK_THRESHOLD } } }),
      this.prisma.inventory.aggregate({ where: base, _sum: { stock: true } }),
      this.prisma.location.count({ where: { storeId: sid, isActive: true } }),
      this.prisma.store.findUnique({ where: { id: sid }, select: { id: true, name: true } }),
    ]);

    return {
      store,
      totalItems,
      totalUnits: units._sum.stock ?? 0,
      outOfStock,
      lowStock,
      locations,
      lowStockThreshold: LOW_STOCK_THRESHOLD,
    };
  }

  // ============ EDICIÓN ============

  async updateStock(user: AuthUser, inventoryId: string, dto: UpdateStockDto, storeId?: string) {
    const sid = this.resolveStoreId(user, storeId);
    const inv = await this.prisma.inventory.findUnique({
      where: { id: inventoryId },
      include: { location: { select: { storeId: true } } },
    });
    if (!inv) throw new NotFoundException('Registro de inventario no encontrado');
    if (inv.location.storeId !== sid) throw new ForbiddenException('No puedes editar inventario de otro almacén');

    const updated = await this.prisma.inventory.update({
      where: { id: inventoryId },
      data: {
        price: dto.price,
        stock: dto.stock,
        isAvailable: dto.stock !== undefined ? dto.stock > 0 : undefined,
      },
    });
    await this.safeSync([updated.partId]);
    return updated;
  }

  async removeInventory(user: AuthUser, inventoryId: string, storeId?: string) {
    const sid = this.resolveStoreId(user, storeId);
    const inv = await this.prisma.inventory.findUnique({
      where: { id: inventoryId },
      include: { location: { select: { storeId: true } } },
    });
    if (!inv) throw new NotFoundException('Registro de inventario no encontrado');
    if (inv.location.storeId !== sid) throw new ForbiddenException('No puedes eliminar inventario de otro almacén');

    await this.prisma.inventory.delete({ where: { id: inventoryId } });
    await this.safeSync([inv.partId]);
    return { message: 'Existencia eliminada' };
  }

  // ============ ALTA DE REPUESTO (PDCIRA-13) ============

  async createPartWithStock(user: AuthUser, dto: CreatePartWithStockDto, storeId?: string) {
    const sid = this.resolveStoreId(user, storeId);
    await this.assertLocationInStore(dto.locationId, sid);

    const category = await this.prisma.partCategory.findUnique({ where: { id: dto.categoryId } });
    if (!category) throw new BadRequestException('Categoría no válida');

    const cleanImages = (dto.images ?? [])
      .map((u) => u?.trim())
      .filter((u): u is string => Boolean(u))
      .slice(0, 5);
    const primaryImageUrl = dto.imageUrl?.trim() || cleanImages[0] || null;
    const galleryImages = cleanImages.length > 0
      ? cleanImages
      : primaryImageUrl
        ? [primaryImageUrl]
        : [];

    // Si el OEM ya existe en el catálogo maestro, reutilizamos el repuesto (normalización)
    if (dto.oemNumber) {
      const existing = await this.prisma.partNumber.findFirst({
        where: { number: { equals: dto.oemNumber.trim(), mode: 'insensitive' } },
        select: { partId: true },
      });
      if (existing) {
        if (primaryImageUrl || galleryImages.length > 0) {
          await this.prisma.part.update({
            where: { id: existing.partId },
            data: {
              ...(primaryImageUrl ? { imageUrl: primaryImageUrl } : {}),
              ...(galleryImages.length > 0 ? { images: galleryImages } : {}),
            },
          });
        }
        const inv = await this.upsertInventory(existing.partId, dto.locationId, dto.condition ?? 'NEW', dto.price, dto.stock);
        await this.safeSync([existing.partId]);
        return { reusedExistingPart: true, partId: existing.partId, inventory: inv.record };
      }
    }

    const slug = await this.uniqueSlug(dto.name, dto.oemNumber);

    const part = await this.prisma.$transaction(async (tx) => {
      const created = await tx.part.create({
        data: {
          name: dto.name.trim(),
          slug,
          categoryId: dto.categoryId,
          brand: dto.brand?.trim() || null,
          description: dto.description?.trim() || null,
          imageUrl: primaryImageUrl,
          images: galleryImages,
        },
      });

      if (dto.oemNumber) {
        await tx.partNumber.create({
          data: { partId: created.id, number: dto.oemNumber.trim(), type: 'OEM' },
        });
      }

      const versionIdsToLink: string[] = dto.compatibleVersionIds ? [...dto.compatibleVersionIds] : [];

      // Si el almacén envió compatibilidades estructuradas (Marca, Modelo, Rango de años, Versión)
      if (dto.compatibilities && dto.compatibilities.length > 0) {
        for (const comp of dto.compatibilities) {
          const makeName = comp.make?.trim();
          const modelName = comp.model?.trim();
          if (!makeName || !modelName) continue;

          // Buscar o crear Marca (case-insensitive para evitar duplicados como "renault" vs "Renault")
          let makeRecord = await tx.vehicleMake.findFirst({
            where: { name: { equals: makeName, mode: 'insensitive' } },
          });
          if (!makeRecord) {
            makeRecord = await tx.vehicleMake.create({
              data: { name: makeName },
            });
          }

          // Buscar o crear Modelo
          let modelRecord = await tx.vehicleModel.findFirst({
            where: {
              makeId: makeRecord.id,
              name: { equals: modelName, mode: 'insensitive' },
            },
          });
          if (!modelRecord) {
            modelRecord = await tx.vehicleModel.create({
              data: {
                makeId: makeRecord.id,
                name: modelName,
              },
            });
          }

          const rawStart = Number(comp.yearFrom) || new Date().getFullYear();
          const rawEnd = Number(comp.yearTo) || rawStart;
          const startYear = Math.max(1970, Math.min(2030, Math.min(rawStart, rawEnd)));
          const endYear = Math.max(startYear, Math.min(2030, Math.min(startYear + 30, Math.max(rawStart, rawEnd))));
          const versionName = comp.version?.trim() || 'Estándar / Todas';

          for (let yr = startYear; yr <= endYear; yr++) {
            const yearRecord = await tx.vehicleYear.upsert({
              where: {
                modelId_year: {
                  modelId: modelRecord.id,
                  year: yr,
                },
              },
              update: {},
              create: {
                modelId: modelRecord.id,
                year: yr,
              },
            });

            const versionRecord = await tx.vehicleVersion.upsert({
              where: {
                yearId_name: {
                  yearId: yearRecord.id,
                  name: versionName,
                },
              },
              update: {},
              create: {
                yearId: yearRecord.id,
                name: versionName,
              },
            });

            versionIdsToLink.push(versionRecord.id);
          }
        }
      }

      // Auto-detección inteligente por nombre de modelo si no se enviaron versiones manuales
      if (versionIdsToLink.length === 0) {
        const nameLower = dto.name.toLowerCase();
        const models = await tx.vehicleModel.findMany({
          select: {
            name: true,
            years: { select: { versions: { select: { id: true } } } },
          },
        });

        for (const m of models) {
          const modelName = m.name.toLowerCase();
          if (modelName.length >= 3 && nameLower.includes(modelName)) {
            const vIds = m.years.flatMap((y) => y.versions.map((v) => v.id));
            versionIdsToLink.push(...vIds);
          }
        }
      }

      if (versionIdsToLink.length) {
        const uniqueVersionIds = [...new Set(versionIdsToLink)];
        await tx.partCompatibility.createMany({
          data: uniqueVersionIds.map((versionId) => ({ partId: created.id, versionId })),
          skipDuplicates: true,
        });
      }

      await tx.inventory.create({
        data: {
          partId: created.id,
          locationId: dto.locationId,
          price: dto.price,
          stock: dto.stock,
          condition: dto.condition ?? 'NEW',
          isAvailable: dto.stock > 0,
        },
      });

      return created;
    });

    await this.safeSync([part.id]);
    return { reusedExistingPart: false, partId: part.id, slug: part.slug };
  }

  // ============ CARGA MASIVA CSV (PDCIRA-12) ============

  getCsvTemplate(): string {
    const example = [
      ['04465-02220', 'Pastillas de freno delanteras cerámicas', 'Akebono', 'frenos', '85000', '12', 'nuevo', 'Sede Norte'],
      ['17801-0T020', 'Filtro de aire motor', 'Mann', 'motor', '45000', '25', 'nuevo', 'Sede Norte'],
    ];
    return [CSV_TEMPLATE_HEADERS, ...example].map((r) => r.join(',')).join('\r\n') + '\r\n';
  }

  async bulkUpload(
    user: AuthUser,
    fileContent: string,
    opts: { dryRun?: boolean; storeId?: string },
  ): Promise<BulkUploadReport> {
    const sid = this.resolveStoreId(user, opts.storeId);
    const dryRun = !!opts.dryRun;
    const { headers, rows } = parseCsv(fileContent);

    const required = ['codigo_oem', 'precio', 'stock'];
    const missing = required.filter((h) => !headers.includes(h));
    if (missing.length) {
      throw new BadRequestException(
        `Faltan columnas obligatorias: ${missing.join(', ')}. Columnas esperadas: ${CSV_TEMPLATE_HEADERS.join(', ')}`,
      );
    }
    if (rows.length === 0) throw new BadRequestException('El archivo no contiene filas de datos');
    if (rows.length > MAX_ROWS) throw new BadRequestException(`Máximo ${MAX_ROWS} filas por archivo`);

    // Catálogos precargados en memoria para evitar N consultas por fila
    const [locations, categories] = await Promise.all([
      this.prisma.location.findMany({ where: { storeId: sid, isActive: true } }),
      this.prisma.partCategory.findMany(),
    ]);
    if (locations.length === 0) {
      throw new BadRequestException('Tu almacén no tiene sedes activas. Registra una sede antes de cargar inventario.');
    }

    const locById = new Map(locations.map((l) => [l.id, l]));
    const locByName = new Map(locations.map((l) => [l.name.trim().toLowerCase(), l]));
    const catByKey = new Map<string, string>();
    categories.forEach((c) => {
      catByKey.set(c.slug.toLowerCase(), c.id);
      catByKey.set(c.name.trim().toLowerCase(), c.id);
    });

    const report: BulkUploadReport = {
      totalRows: rows.length, inventoryCreated: 0, inventoryUpdated: 0, partsCreated: 0, errors: [], dryRun,
    };
    const errors: BulkUploadRowError[] = report.errors;
    const touchedParts = new Set<string>();
    const pendingNewParts = new Map<string, string>(); // oem(lower) -> partId (o 'dry-run')
    const seenKeys = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2; // +1 encabezado, +1 base 1
      const r = rows[i];

      try {
        const oem = r.codigo_oem?.trim();
        if (!oem) throw new Error('codigo_oem vacío');

        const price = parseNumber(r.precio);
        if (price === null || price < 0) throw new Error(`precio inválido: "${r.precio}"`);

        const stock = parseNumber(r.stock);
        if (stock === null || stock < 0 || !Number.isInteger(stock)) throw new Error(`stock inválido: "${r.stock}"`);

        const condRaw = (r.condicion || 'nuevo').trim().toLowerCase();
        const condition = CONDITION_MAP[condRaw];
        if (!condition) throw new Error(`condicion inválida: "${r.condicion}" (usa nuevo, usado o remanufacturado)`);

        // Sede: id, nombre, o la única sede del almacén
        let location = r.sede ? (locById.get(r.sede.trim()) ?? locByName.get(r.sede.trim().toLowerCase())) : undefined;
        if (!location && !r.sede && locations.length === 1) location = locations[0];
        if (!location) {
          throw new Error(
            r.sede
              ? `sede "${r.sede}" no existe en tu almacén`
              : 'columna sede vacía y tu almacén tiene varias sedes',
          );
        }

        const dedupeKey = `${oem.toLowerCase()}|${location.id}|${condition}`;
        if (seenKeys.has(dedupeKey)) throw new Error('fila duplicada (mismo OEM, sede y condición) en el archivo');
        seenKeys.add(dedupeKey);

        // Resolver repuesto por número OEM
        let partId: string | undefined = pendingNewParts.get(oem.toLowerCase());
        if (!partId) {
          const pn = await this.prisma.partNumber.findFirst({
            where: { number: { equals: oem, mode: 'insensitive' } },
            select: { partId: true },
          });
          partId = pn?.partId;
        }

        if (!partId) {
          const name = r.nombre?.trim();
          const catKey = r.categoria?.trim().toLowerCase();
          if (!name || !catKey) {
            throw new Error('el OEM no existe en el catálogo: indica nombre y categoria para crearlo');
          }
          const categoryId = catByKey.get(catKey);
          if (!categoryId) throw new Error(`categoria "${r.categoria}" no existe`);

          if (dryRun) {
            partId = `dry-run-${oem}`;
          } else {
            const slug = await this.uniqueSlug(name, oem);
            const created = await this.prisma.part.create({
              data: {
                name, slug, categoryId,
                brand: r.marca?.trim() || null,
                partNumbers: { create: { number: oem, type: 'OEM' } },
              },
            });
            partId = created.id;
          }
          pendingNewParts.set(oem.toLowerCase(), partId);
          report.partsCreated++;
        }

        if (dryRun) {
          const exists = partId.startsWith('dry-run-')
            ? null
            : await this.prisma.inventory.findUnique({
                where: { partId_locationId_condition: { partId, locationId: location.id, condition } },
                select: { id: true },
              });
          if (exists) report.inventoryUpdated++;
          else report.inventoryCreated++;
        } else {
          const result = await this.upsertInventory(partId, location.id, condition, price, stock);
          if (result.created) report.inventoryCreated++;
          else report.inventoryUpdated++;
          touchedParts.add(partId);
        }
      } catch (err) {
        errors.push({ row: rowNum, message: (err as Error).message });
      }
    }

    if (!dryRun) await this.safeSync(touchedParts);
    return report;
  }

  // ============ HELPERS ============

  private async upsertInventory(
    partId: string, locationId: string, condition: PartCondition, price: number, stock: number,
  ) {
    const key = { partId_locationId_condition: { partId, locationId, condition } };
    const existing = await this.prisma.inventory.findUnique({ where: key, select: { id: true } });
    const record = await this.prisma.inventory.upsert({
      where: key,
      create: { partId, locationId, condition, price, stock, isAvailable: stock > 0 },
      update: { price, stock, isAvailable: stock > 0 },
    });
    return { created: !existing, record };
  }

  private async uniqueSlug(name: string, oem?: string) {
    const base = slugify(oem ? `${name}-${oem}` : name) || 'repuesto';
    const taken = await this.prisma.part.findUnique({ where: { slug: base }, select: { id: true } });
    return taken ? `${base}-${Date.now().toString(36)}` : base;
  }

  /**
   * Guarda una imagen de repuesto en disco y devuelve la ruta relativa pública
   */
  async savePartImage(file: Express.Multer.File): Promise<{ url: string; filename: string }> {
    const ext = extname(file.originalname).toLowerCase() || '.jpg';
    const cleanExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'].includes(ext) ? ext : '.jpg';
    const filename = `part-${Date.now()}-${randomUUID().slice(0, 8)}${cleanExt}`;

    // Directorio de subida en backend
    const backendUploadDir = join(process.cwd(), 'uploads', 'parts');
    if (!existsSync(backendUploadDir)) {
      mkdirSync(backendUploadDir, { recursive: true });
    }
    writeFileSync(join(backendUploadDir, filename), file.buffer);

    // Si existe el frontend en desarrollo local, sincronizar copia en public/uploads/parts
    try {
      const frontendUploadDir = join(process.cwd(), '..', 'frontend', 'public', 'uploads', 'parts');
      if (!existsSync(frontendUploadDir)) {
        mkdirSync(frontendUploadDir, { recursive: true });
      }
      writeFileSync(join(frontendUploadDir, filename), file.buffer);
    } catch (e) {
      // Ignorar si no aplica
    }

    const publicUrl = `/uploads/parts/${filename}`;
    return { url: publicUrl, filename };
  }
}

/**
 * Acepta "85000", "85.000", "85,000", "$ 85.000", "1.250.000", "85000.50", "85000,50"
 */
export function parseNumber(raw?: string): number | null {
  if (raw === undefined || raw === null) return null;
  let s = String(raw).replace(/[^\d.,-]/g, '');
  if (!s) return null;
  if (/^-?\d{1,3}([.,]\d{3})+$/.test(s)) {
    s = s.replace(/[.,]/g, ''); // separadores de miles
  } else {
    s = s.replace(',', '.');
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
