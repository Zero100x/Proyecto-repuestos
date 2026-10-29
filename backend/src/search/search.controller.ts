import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MeilisearchService } from './meilisearch.service';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(
    private meilisearch: MeilisearchService,
    private prisma: PrismaService,
  ) {}

  @Get('parts')
  @ApiOperation({ summary: 'Buscar repuestos por vehículo o número de parte (PDCIRA-8)' })
  @ApiQuery({ name: 'q', required: false, description: 'Texto libre o número de parte/OEM' })
  @ApiQuery({ name: 'make', required: false, description: 'Marca del vehículo' })
  @ApiQuery({ name: 'model', required: false, description: 'Modelo del vehículo' })
  @ApiQuery({ name: 'year', required: false, description: 'Año del modelo', type: Number })
  @ApiQuery({ name: 'version', required: false, description: 'Versión/trim del vehículo' })
  @ApiQuery({ name: 'category', required: false, description: 'Slug de categoría' })
  @ApiQuery({ name: 'condition', required: false, description: 'Condición: NEW, USED, REFURBISHED' })
  @ApiQuery({ name: 'store', required: false, description: 'Nombre del almacén para filtrar su catálogo' })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Campo de ordenamiento: price, name, updatedAt' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async searchParts(
    @Query('q') query?: string,
    @Query('make') make?: string,
    @Query('model') model?: string,
    @Query('year') year?: number,
    @Query('version') version?: string,
    @Query('category') category?: string,
    @Query('condition') condition?: string,
    @Query('store') store?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    let result: any;
    try {
      result = await this.meilisearch.searchParts({
        query, make, model, year, version,
        category, condition, store, minPrice, maxPrice,
        sortBy, sortOrder, page, limit,
      });
    } catch {
      // Fallback directo a PostgreSQL cuando Meilisearch no está activo en la nube
      const currentPage = Math.max(1, Number(page) || 1);
      const pageSize = Math.max(1, Number(limit) || 20);
      const where: any = { isActive: true };

      if (query && query.trim()) {
        const q = query.trim();
        where.OR = [
          { name: { contains: q, mode: 'insensitive' } },
          { brand: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { partNumbers: { some: { number: { contains: q, mode: 'insensitive' } } } },
        ];
      }
      if (category) {
        where.category = { slug: category };
      }

      const parts = await this.prisma.part.findMany({
        where,
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
        orderBy: { createdAt: 'desc' },
      });

      const mapped = parts
        .map((part) => {
          const vehicles = part.compatibility.map((c) => ({
            make: c.version.year.model.make.name,
            model: c.version.year.model.name,
            year: c.version.year.year,
            version: c.version.name,
          }));

          const makes = [...new Set(vehicles.map((v) => v.make))];
          const models = [...new Set(vehicles.map((v) => v.model))];
          const years = [...new Set(vehicles.map((v) => v.year))];
          const versions = [...new Set(vehicles.map((v) => v.version))];
          const storeNames = [
            ...new Set(part.inventory.map((i) => i.location?.store?.name).filter(Boolean) as string[]),
          ];
          const addresses = [
            ...new Set(part.inventory.map((i) => i.location?.address).filter(Boolean) as string[]),
          ];
          const locationNames = [
            ...new Set(part.inventory.map((i) => i.location?.name).filter(Boolean) as string[]),
          ];
          const cities = [
            ...new Set(part.inventory.map((i) => i.location?.city).filter(Boolean) as string[]),
          ];
          const conditions = [...new Set(part.inventory.map((i) => i.condition))];
          const partMinPrice =
            part.inventory.length > 0 ? Math.min(...part.inventory.map((i) => i.price)) : null;
          const partMaxPrice =
            part.inventory.length > 0 ? Math.max(...part.inventory.map((i) => i.price)) : null;
          const totalStock = part.inventory.reduce((sum, i) => sum + i.stock, 0);

          return {
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
            makes,
            models,
            years,
            versions,
            minPrice: partMinPrice,
            maxPrice: partMaxPrice,
            totalStock,
            conditions,
            locationCount: part.inventory.length,
            storeNames,
            addresses,
            locationNames,
            cities,
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
        })
        .filter((item) => {
          if (make && !item.makes.some((m) => m.toLowerCase() === make.toLowerCase())) return false;
          if (model && !item.models.some((m) => m.toLowerCase() === model.toLowerCase())) return false;
          if (year && !item.years.includes(Number(year))) return false;
          if (condition && !item.conditions.includes(condition as any)) return false;
          if (store && !item.storeNames.some((s) => s.toLowerCase() === store.toLowerCase())) return false;
          if (minPrice !== undefined && (item.minPrice === null || item.minPrice < Number(minPrice))) return false;
          if (maxPrice !== undefined && (item.minPrice === null || item.minPrice > Number(maxPrice))) return false;
          return true;
        });

      const start = (currentPage - 1) * pageSize;
      const paginated = mapped.slice(start, start + pageSize);

      result = {
        data: paginated,
        meta: {
          total: mapped.length,
          page: currentPage,
          limit: pageSize,
          totalPages: Math.ceil(mapped.length / pageSize) || 1,
          processingTimeMs: 5,
        },
        facets: {},
      };
    }

    if (query && query.trim().length >= 2) {
      this.prisma.searchQuery.create({
        data: {
          query: query.trim().toLowerCase(),
          resultsCount: result.meta?.total || result.data?.length || 0,
        },
      }).catch((err) => console.warn('Error registrando searchQuery:', err));
    }

    return result;
  }

  @Get('filters')
  @ApiOperation({ summary: 'Obtener filtros disponibles dinámicamente (PDCIRA-11)' })
  @ApiQuery({ name: 'make', required: false })
  @ApiQuery({ name: 'model', required: false })
  @ApiQuery({ name: 'year', required: false, type: Number })
  async getFilters(
    @Query('make') make?: string,
    @Query('model') model?: string,
    @Query('year') year?: number,
  ) {
    try {
      return await this.meilisearch.getAvailableFilters({ make, model, year });
    } catch {
      const [makes, categories] = await Promise.all([
        this.prisma.vehicleMake.findMany({ include: { models: true } }),
        this.prisma.partCategory.findMany(),
      ]);
      return {
        makes: makes.map((m) => m.name).sort(),
        models: makes
          .filter((m) => !make || m.name.toLowerCase() === make.toLowerCase())
          .flatMap((m) => m.models.map((mod) => mod.name))
          .sort(),
        categories: categories.map((c) => ({ name: c.name, slug: c.slug })),
      };
    }
  }

  @Get('health')
  @ApiOperation({ summary: 'Estado del motor de búsqueda' })
  async health() {
    return this.meilisearch.health();
  }
}
