import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto, LogSearchQueryDto } from './dto/leads.dto';
import { LeadStatus } from '@prisma/client';
import { AuthUser } from '../inventory/inventory.service';

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  private resolveStoreId(user: AuthUser, requestedStoreId?: string): string {
    const isPlatformAdmin = user.roles.includes('PLATFORM_ADMIN');
    if (isPlatformAdmin && requestedStoreId) return requestedStoreId;
    if (user.storeId) return user.storeId;
    throw new ForbiddenException('No tienes un almacén asociado');
  }

  /**
   * Registra un nuevo lead o intención de compra generado al hacer clic en WhatsApp
   */
  async createLead(dto: CreateLeadDto, buyerId?: string) {
    // Validar que la tienda y el repuesto existan
    const store = await this.prisma.store.findUnique({ where: { id: dto.storeId } });
    if (!store) throw new NotFoundException('Almacén no encontrado');

    const part = await this.prisma.part.findUnique({
      where: { id: dto.partId },
      include: { partNumbers: true },
    });
    if (!part) throw new NotFoundException('Repuesto no encontrado');

    if (dto.locationId) {
      const loc = await this.prisma.location.findFirst({
        where: { id: dto.locationId, storeId: dto.storeId },
      });
      if (!loc) throw new BadRequestException('La sede física no pertenece a este almacén');
    }

    return this.prisma.lead.create({
      data: {
        storeId: dto.storeId,
        partId: dto.partId,
        locationId: dto.locationId || null,
        buyerId: buyerId || null,
        buyerName: dto.buyerName?.trim() || null,
        buyerPhone: dto.buyerPhone?.trim() || null,
        buyerCity: dto.buyerCity?.trim() || null,
        buyerMessage: dto.buyerMessage?.trim() || null,
        quotedPrice: dto.quotedPrice || null,
        sourceUrl: dto.sourceUrl || null,
        status: LeadStatus.NEW,
      },
      include: {
        store: { select: { id: true, name: true, phone: true } },
        location: { select: { id: true, name: true, phone: true, whatsapp: true, address: true, city: true } },
        part: { select: { id: true, name: true, slug: true, brand: true, imageUrl: true } },
      },
    });
  }

  /**
   * Obtiene la lista paginada de leads para el almacén autenticado
   */
  async getStoreLeads(
    user: AuthUser,
    options: {
      status?: LeadStatus;
      locationId?: string;
      page?: number;
      limit?: number;
      storeId?: string;
    } = {},
  ) {
    const sid = this.resolveStoreId(user, options.storeId);
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = { storeId: sid };
    if (options.status) where.status = options.status;
    if (options.locationId) where.locationId = options.locationId;

    const [total, leads] = await Promise.all([
      this.prisma.lead.count({ where }),
      this.prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          part: {
            select: {
              id: true,
              name: true,
              slug: true,
              brand: true,
              imageUrl: true,
              category: { select: { id: true, name: true } },
              partNumbers: { select: { number: true, type: true } },
            },
          },
          location: {
            select: { id: true, name: true, address: true, city: true, phone: true, whatsapp: true },
          },
        },
      }),
    ]);

    return {
      data: leads,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Métricas y estadísticas de conversión de leads para el Dashboard
   */
  async getStoreLeadStats(user: AuthUser, storeId?: string) {
    const sid = this.resolveStoreId(user, storeId);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalLeads, leads7d, leads30d, leadsByStatus, topPartsRaw, leadsByLocationRaw] =
      await Promise.all([
        this.prisma.lead.count({ where: { storeId: sid } }),
        this.prisma.lead.count({ where: { storeId: sid, createdAt: { gte: sevenDaysAgo } } }),
        this.prisma.lead.count({ where: { storeId: sid, createdAt: { gte: thirtyDaysAgo } } }),
        this.prisma.lead.groupBy({
          by: ['status'],
          where: { storeId: sid },
          _count: { status: true },
        }),
        this.prisma.lead.groupBy({
          by: ['partId'],
          where: { storeId: sid },
          _count: { partId: true },
          orderBy: { _count: { partId: 'desc' } },
          take: 5,
        }),
        this.prisma.lead.groupBy({
          by: ['locationId'],
          where: { storeId: sid, locationId: { not: null } },
          _count: { locationId: true },
        }),
      ]);

    // Enriquecer los repuestos más consultados
    const partIds = topPartsRaw.map((p) => p.partId);
    const parts = await this.prisma.part.findMany({
      where: { id: { in: partIds } },
      select: {
        id: true,
        name: true,
        brand: true,
        imageUrl: true,
        partNumbers: { select: { number: true } },
      },
    });

    const topParts = topPartsRaw.map((tp) => {
      const part = parts.find((p) => p.id === tp.partId);
      return {
        partId: tp.partId,
        count: tp._count.partId,
        name: part?.name || 'Desconocido',
        brand: part?.brand || null,
        oem: part?.partNumbers?.[0]?.number || null,
        imageUrl: part?.imageUrl || null,
      };
    });

    // Enriquecer sedes
    const locationIds = leadsByLocationRaw.map((l) => l.locationId as string).filter(Boolean);
    const locations = await this.prisma.location.findMany({
      where: { id: { in: locationIds } },
      select: { id: true, name: true, city: true },
    });

    const byLocation = leadsByLocationRaw.map((lbl) => {
      const loc = locations.find((l) => l.id === lbl.locationId);
      return {
        locationId: lbl.locationId,
        name: loc?.name || 'Sede no especificada',
        city: loc?.city || 'Bogotá',
        count: lbl._count.locationId,
      };
    });

    const statusCounts: Record<string, number> = {
      NEW: 0,
      CONTACTED: 0,
      CONVERTED: 0,
      CANCELLED: 0,
    };
    leadsByStatus.forEach((s) => {
      statusCounts[s.status] = s._count.status;
    });

    const converted = statusCounts.CONVERTED || 0;
    const conversionRate = totalLeads > 0 ? Number(((converted / totalLeads) * 100).toFixed(1)) : 0;

    return {
      totalLeads,
      leads7d,
      leads30d,
      conversionRate,
      byStatus: statusCounts,
      topParts,
      byLocation,
    };
  }

  /**
   * Actualiza el estado de un lead (P. ej: marcar como CONTACTED o CONVERTED)
   */
  async updateLeadStatus(user: AuthUser, leadId: string, status: LeadStatus) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead no encontrado');

    const isPlatformAdmin = user.roles.includes('PLATFORM_ADMIN');
    if (!isPlatformAdmin && lead.storeId !== user.storeId) {
      throw new ForbiddenException('No tienes permiso para modificar leads de otra tienda');
    }

    return this.prisma.lead.update({
      where: { id: leadId },
      data: { status },
      include: {
        part: { select: { id: true, name: true, brand: true } },
        location: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Registra una búsqueda en la plataforma (PDCIRA-16: Análisis de Demanda)
   */
  async logSearchQuery(dto: LogSearchQueryDto) {
    if (!dto.query || dto.query.trim().length < 2) return null;

    return this.prisma.searchQuery.create({
      data: {
        query: dto.query.trim().toLowerCase(),
        resultsCount: dto.resultsCount || 0,
        city: dto.city?.trim() || null,
        makeId: dto.makeId || null,
        modelId: dto.modelId || null,
        categoryId: dto.categoryId || null,
      },
    });
  }

  /**
   * Obtiene la demanda insatisfecha (búsquedas con 0 resultados) para mostrar oportunidades a los almacenes
   */
  async getUnmetDemand(limit: number = 10, city?: string) {
    const where: any = { resultsCount: 0 };
    if (city) where.city = { equals: city, mode: 'insensitive' };

    const grouped = await this.prisma.searchQuery.groupBy({
      by: ['query'],
      where,
      _count: { query: true },
      orderBy: { _count: { query: 'desc' } },
      take: limit,
    });

    return grouped.map((item) => ({
      query: item.query,
      searchCount: item._count.query,
      recommendation: `Alta demanda sin existencias registradas (${item._count.query} búsquedas recientes)`,
    }));
  }
}
