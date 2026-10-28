import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto, UpdateReservationStatusDto } from './dto/reservations.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ReservationStatus } from '@prisma/client';

@ApiTags('Reservations')
@Controller('reservations')
export class ReservationsController {
  constructor(private reservationsService: ReservationsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear reserva para retiro en sede física (Click & Collect - Público)' })
  createReservation(@Body() dto: CreateReservationDto, @Request() req: any) {
    const buyerId = req.user?.id || req.user?.sub;
    return this.reservationsService.createReservation(dto, buyerId);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Consultar reserva por código único (Comprobante digital / Código QR)' })
  getReservationByCode(@Param('code') code: string) {
    return this.reservationsService.getReservationByCode(code);
  }

  @Get('stats')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener métricas y KPIs de reservas en mostrador (Almacén)' })
  getReservationStats(@Request() req: any, @Query('storeId') queryStoreId?: string) {
    const storeId = req.user?.storeId || queryStoreId;
    if (!storeId) {
      throw new BadRequestException('Usuario no tiene un almacén asignado');
    }
    return this.reservationsService.getStoreReservationStats(storeId);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Listar reservas del almacén (Protegido)' })
  @ApiQuery({ name: 'status', required: false, enum: ReservationStatus })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por código, cliente o repuesto' })
  @ApiQuery({ name: 'locationId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getStoreReservations(
    @Request() req: any,
    @Query('status') status?: ReservationStatus,
    @Query('search') search?: string,
    @Query('locationId') locationId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('storeId') queryStoreId?: string,
  ) {
    const storeId = req.user?.storeId || queryStoreId;
    if (!storeId) {
      throw new BadRequestException('Usuario no tiene un almacén asignado');
    }
    return this.reservationsService.getStoreReservations(storeId, {
      status,
      search,
      locationId,
      page,
      limit,
    });
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Registrar entrega en mostrador o cancelar reserva (Almacén)' })
  updateReservationStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReservationStatusDto,
    @Request() req: any,
    @Query('storeId') queryStoreId?: string,
  ) {
    const storeId = req.user?.storeId || queryStoreId;
    if (!storeId) {
      throw new BadRequestException('Usuario no tiene un almacén asignado');
    }
    return this.reservationsService.updateReservationStatus(id, storeId, dto);
  }
}
