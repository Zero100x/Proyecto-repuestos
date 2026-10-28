import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MeilisearchService } from '../search/meilisearch.service';
import { CreateReservationDto, UpdateReservationStatusDto } from './dto/reservations.dto';
import { ReservationStatus } from '@prisma/client';

@Injectable()
export class ReservationsService {
  constructor(
    private prisma: PrismaService,
    private meilisearch: MeilisearchService,
  ) {}

  /**
   * Generar código único de reserva (ej: RES-7291-BOG)
   */
  private generateReservationCode(city: string = 'COL'): string {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const cityPrefix = city.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'COL');
    return `RES-${randomNum}-${cityPrefix}`;
  }

  /**
   * 1. Crear una nueva reserva para retiro en sede física (Click & Collect)
   */
  async createReservation(dto: CreateReservationDto, buyerId?: string) {
    const quantity = dto.quantity && dto.quantity > 0 ? dto.quantity : 1;

    // Verificar repuesto
    const part = await this.prisma.part.findUnique({
      where: { id: dto.partId },
      include: {
        category: { select: { name: true } },
        partNumbers: true,
      },
    });
    if (!part) throw new NotFoundException('El repuesto seleccionado no existe');

    // Verificar sede física
    const location = await this.prisma.location.findUnique({
      where: { id: dto.locationId },
      include: { store: true },
    });
    if (!location) throw new NotFoundException('La sede física seleccionada no existe');

    // Verificar inventario en dicha sede
    const inventory = await this.prisma.inventory.findFirst({
      where: {
        partId: dto.partId,
        locationId: dto.locationId,
        isAvailable: true,
      },
    });

    if (!inventory || inventory.stock < quantity) {
      throw new BadRequestException(
        `Existencias insuficientes en la sede ${location.name}. Stock disponible: ${inventory?.stock || 0} unidades.`,
      );
    }

    // Generar código único no colisionante
    let code = this.generateReservationCode(location.city);
    let attempts = 0;
    while (attempts < 5) {
      const exists = await this.prisma.reservation.findUnique({ where: { code } });
      if (!exists) break;
      code = this.generateReservationCode(location.city);
      attempts++;
    }

    const unitPrice = inventory.price;
    const totalPrice = unitPrice * quantity;
    // Caducidad a las 48 horas
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const reservation = await this.prisma.$transaction(async (tx) => {
      const res = await tx.reservation.create({
        data: {
          code,
          storeId: location.storeId,
          locationId: location.id,
          partId: part.id,
          inventoryId: inventory.id,
          buyerId: buyerId || null,
          customerName: dto.customerName.trim(),
          customerPhone: dto.customerPhone.trim(),
          customerEmail: dto.customerEmail?.trim() || null,
          customerDocument: dto.customerDocument?.trim() || null,
          quantity,
          unitPrice,
          totalPrice,
          status: ReservationStatus.PENDING,
          notes: dto.notes?.trim() || null,
          expiresAt,
        },
        include: {
          part: {
            select: {
              id: true,
              name: true,
              slug: true,
              brand: true,
              imageUrl: true,
              partNumbers: true,
            },
          },
          location: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              phone: true,
              whatsapp: true,
            },
          },
          store: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
        },
      });

      // Crear también registro de lead para métricas comerciales globales
      await tx.lead.create({
        data: {
          storeId: location.storeId,
          locationId: location.id,
          partId: part.id,
          buyerId: buyerId || null,
          buyerName: dto.customerName.trim(),
          buyerPhone: dto.customerPhone.trim(),
          buyerCity: location.city,
          buyerMessage: `Reserva Click & Collect código ${code} (${quantity} unids a $${totalPrice.toLocaleString('es-CO')})`,
          quotedPrice: totalPrice,
          sourceUrl: `/parts/${part.id}`,
          status: 'CONTACTED',
        },
      });

      return res;
    });

    return reservation;
  }

  /**
   * 2. Consultar reserva por código (Público / Comprobante digital)
   */
  async getReservationByCode(code: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        part: {
          select: {
            id: true,
            name: true,
            slug: true,
            brand: true,
            imageUrl: true,
            partNumbers: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            phone: true,
            whatsapp: true,
            latitude: true,
            longitude: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    if (!reservation) {
      throw new NotFoundException(`No se encontró ninguna reserva con el código ${code}`);
    }

    // Auto-expirar si superó las 48h y sigue pendiente
    if (reservation.status === ReservationStatus.PENDING && new Date() > reservation.expiresAt) {
      const updated = await this.prisma.reservation.update({
        where: { id: reservation.id },
        data: { status: ReservationStatus.EXPIRED },
        include: {
          part: true,
          location: true,
          store: true,
        },
      });
      return updated;
    }

    return reservation;
  }

  /**
   * 3. Listado de reservas para el panel del almacén
   */
  async getStoreReservations(
    storeId: string,
    query: {
      status?: ReservationStatus;
      search?: string;
      locationId?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const pageNum = Math.max(1, Number(query.page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Expirar en masa reservas vencidas antes de listar
    await this.prisma.reservation.updateMany({
      where: {
        storeId,
        status: ReservationStatus.PENDING,
        expiresAt: { lt: new Date() },
      },
      data: { status: ReservationStatus.EXPIRED },
    });

    const where: any = { storeId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.locationId && query.locationId !== 'all') {
      where.locationId = query.locationId;
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { code: { contains: term, mode: 'insensitive' } },
        { customerName: { contains: term, mode: 'insensitive' } },
        { customerPhone: { contains: term, mode: 'insensitive' } },
        { customerDocument: { contains: term, mode: 'insensitive' } },
        { part: { name: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.reservation.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          part: {
            select: {
              id: true,
              name: true,
              brand: true,
              imageUrl: true,
              partNumbers: true,
            },
          },
          location: {
            select: {
              id: true,
              name: true,
              city: true,
              address: true,
            },
          },
        },
      }),
      this.prisma.reservation.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * 4. Estadísticas y KPIs de Reservas en Sede
   */
  async getStoreReservationStats(storeId: string) {
    const now = new Date();
    const twelveHoursFromNow = new Date(Date.now() + 12 * 60 * 60 * 1000);

    const [allReservations, pendingExpiringSoon] = await Promise.all([
      this.prisma.reservation.findMany({
        where: { storeId },
        select: {
          status: true,
          totalPrice: true,
          createdAt: true,
          deliveredAt: true,
        },
      }),
      this.prisma.reservation.count({
        where: {
          storeId,
          status: ReservationStatus.PENDING,
          expiresAt: { lte: twelveHoursFromNow, gt: now },
        },
      }),
    ]);

    const byStatus = {
      PENDING: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      EXPIRED: 0,
    };

    let totalValuePending = 0;
    let totalValueCompleted = 0;

    for (const r of allReservations) {
      if (byStatus[r.status] !== undefined) {
        byStatus[r.status]++;
      }
      if (r.status === ReservationStatus.PENDING) {
        totalValuePending += r.totalPrice;
      } else if (r.status === ReservationStatus.COMPLETED) {
        totalValueCompleted += r.totalPrice;
      }
    }

    const total = allReservations.length;
    const conversionRate = total > 0 ? Number(((byStatus.COMPLETED / total) * 100).toFixed(1)) : 0;

    return {
      total,
      pending: byStatus.PENDING,
      expiringSoon: pendingExpiringSoon,
      completed: byStatus.COMPLETED,
      cancelled: byStatus.CANCELLED,
      expired: byStatus.EXPIRED,
      conversionRate,
      totalValuePending,
      totalValueCompleted,
    };
  }

  /**
   * 5. Actualizar estado de la reserva (Entregar en mostrador / Cancelar)
   */
  async updateReservationStatus(
    reservationId: string,
    storeId: string,
    dto: UpdateReservationStatusDto,
  ) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { location: true },
    });

    if (!reservation) {
      throw new NotFoundException('Reserva no encontrada');
    }

    if (reservation.storeId !== storeId) {
      throw new ForbiddenException('No tienes permisos para modificar reservas de otro almacén');
    }

    if (reservation.status === ReservationStatus.COMPLETED) {
      throw new BadRequestException('Esta reserva ya fue entregada y finalizada');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.reservation.update({
        where: { id: reservationId },
        data: {
          status: dto.status,
          deliveredAt: dto.status === ReservationStatus.COMPLETED ? new Date() : null,
          deliveredBy: dto.status === ReservationStatus.COMPLETED ? (dto.deliveredBy || 'Asesor de Mostrador') : null,
          notes: dto.notes ? `${reservation.notes ? reservation.notes + ' | ' : ''}${dto.notes}` : reservation.notes,
        },
        include: {
          part: true,
          location: true,
        },
      });

      // Si se completó la entrega, descontar existencias físicas reales del inventario
      if (dto.status === ReservationStatus.COMPLETED && reservation.inventoryId) {
        await tx.inventory.update({
          where: { id: reservation.inventoryId },
          data: {
            stock: { decrement: reservation.quantity },
          },
        });
      }

      return res;
    });

    return updated;
  }
}
