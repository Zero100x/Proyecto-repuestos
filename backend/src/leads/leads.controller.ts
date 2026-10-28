import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { CreateLeadDto, UpdateLeadStatusDto, LogSearchQueryDto } from './dto/leads.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../inventory/inventory.service';
import { LeadStatus } from '@prisma/client';

@ApiTags('Leads & WhatsApp Conversion (Sprint 4)')
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  /**
   * Registro público de un lead cuando un comprador pulsa "Cotizar por WhatsApp"
   */
  @Post()
  @ApiOperation({ summary: 'Registrar nuevo lead generado desde WhatsApp' })
  createLead(@Body() dto: CreateLeadDto) {
    return this.leadsService.createLead(dto);
  }

  /**
   * Listado de leads para el almacén autenticado
   */
  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STORE_ADMIN', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Consultar leads recibidos por el almacén' })
  @ApiQuery({ name: 'status', required: false, enum: LeadStatus })
  @ApiQuery({ name: 'locationId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'storeId', required: false, description: 'Solo para PLATFORM_ADMIN' })
  getStoreLeads(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: LeadStatus,
    @Query('locationId') locationId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('storeId') storeId?: string,
  ) {
    return this.leadsService.getStoreLeads(user, {
      status,
      locationId,
      page,
      limit,
      storeId,
    });
  }

  /**
   * Estadísticas y métricas de conversión de leads para el Dashboard
   */
  @Get('stats')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STORE_ADMIN', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Obtener métricas y KPIs de conversión de leads' })
  @ApiQuery({ name: 'storeId', required: false })
  getStoreLeadStats(
    @CurrentUser() user: AuthUser,
    @Query('storeId') storeId?: string,
  ) {
    return this.leadsService.getStoreLeadStats(user, storeId);
  }

  /**
   * Actualizar el estado de un lead (Contactado, Venta Cerrada, etc.)
   */
  @Patch(':id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STORE_ADMIN', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Actualizar el estado del lead' })
  updateLeadStatus(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeadStatusDto,
  ) {
    return this.leadsService.updateLeadStatus(user, id, dto.status);
  }

  /**
   * Registro de consultas de búsqueda (para métricas y detección de demanda insatisfecha)
   */
  @Post('search-query')
  @ApiOperation({ summary: 'Registrar consulta de búsqueda para análisis de mercado' })
  logSearchQuery(@Body() dto: LogSearchQueryDto) {
    return this.leadsService.logSearchQuery(dto);
  }

  /**
   * Demanda insatisfecha: búsquedas frecuentes con 0 resultados en la plataforma
   */
  @Get('unmet-demand')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STORE_ADMIN', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Reporte de piezas más buscadas sin inventario disponible' })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getUnmetDemand(
    @Query('city') city?: string,
    @Query('limit') limit?: number,
  ) {
    return this.leadsService.getUnmetDemand(Number(limit) || 10, city);
  }
}
