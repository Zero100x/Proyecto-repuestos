import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CatalogService } from './catalog.service';
import {
  CreatePartCategoryDto, CreatePartDto, UpdatePartDto,
  AddPartNumberDto, AddCompatibilityDto, AddInventoryDto,
  BulkCompatibilityDto,
} from './dto/catalog.dto';

@ApiTags('Catalog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('catalog')
export class CatalogController {
  constructor(private catalogService: CatalogService) {}

  // ============ CATEGORÍAS ============

  @Get('categories')
  @ApiOperation({ summary: 'Listar categorías de repuestos' })
  findAllCategories() {
    return this.catalogService.findAllCategories();
  }

  @Post('categories')
  @Roles('PLATFORM_ADMIN', 'STORE_ADMIN')
  @ApiOperation({ summary: 'Crear categoría' })
  createCategory(@Body() dto: CreatePartCategoryDto) {
    return this.catalogService.createCategory(dto);
  }

  // ============ REPUESTOS (PDCIRA-7) ============

  @Get('parts')
  @ApiOperation({ summary: 'Listar repuestos del catálogo (PDCIRA-7)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  findAllParts(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.catalogService.findAllParts(page, limit, categoryId);
  }

  @Get('parts/:id')
  @ApiOperation({ summary: 'Obtener detalle de un repuesto (PDCIRA-10)' })
  findOnePart(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalogService.findOnePart(id);
  }

  @Post('parts')
  @Roles('PLATFORM_ADMIN', 'STORE_ADMIN')
  @ApiOperation({ summary: 'Crear repuesto (PDCIRA-7)' })
  createPart(@Body() dto: CreatePartDto) {
    return this.catalogService.createPart(dto);
  }

  @Put('parts/:id')
  @Roles('PLATFORM_ADMIN', 'STORE_ADMIN')
  @ApiOperation({ summary: 'Actualizar repuesto' })
  updatePart(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePartDto) {
    return this.catalogService.updatePart(id, dto);
  }

  // ============ NÚMEROS DE PARTE ============

  @Post('parts/:id/part-numbers')
  @Roles('PLATFORM_ADMIN', 'STORE_ADMIN')
  @ApiOperation({ summary: 'Agregar número de parte' })
  addPartNumber(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddPartNumberDto) {
    return this.catalogService.addPartNumber(id, dto);
  }

  @Delete('parts/:partId/part-numbers/:partNumberId')
  @Roles('PLATFORM_ADMIN', 'STORE_ADMIN')
  @ApiOperation({ summary: 'Eliminar número de parte' })
  removePartNumber(
    @Param('partId', ParseUUIDPipe) partId: string,
    @Param('partNumberId', ParseUUIDPipe) partNumberId: string,
  ) {
    return this.catalogService.removePartNumber(partId, partNumberId);
  }

  // ============ COMPATIBILIDAD ============

  @Post('parts/:id/compatibility')
  @Roles('PLATFORM_ADMIN', 'STORE_ADMIN')
  @ApiOperation({ summary: 'Agregar compatibilidad con vehículo (PDCIRA-7)' })
  addCompatibility(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddCompatibilityDto) {
    return this.catalogService.addCompatibility(id, dto);
  }

  @Post('parts/:id/compatibility/bulk')
  @Roles('PLATFORM_ADMIN', 'STORE_ADMIN')
  @ApiOperation({ summary: 'Agregar compatibilidad masiva' })
  addBulkCompatibility(@Param('id', ParseUUIDPipe) id: string, @Body() dto: BulkCompatibilityDto) {
    return this.catalogService.addBulkCompatibility(id, dto);
  }

  @Delete('parts/:partId/compatibility/:compatibilityId')
  @Roles('PLATFORM_ADMIN', 'STORE_ADMIN')
  @ApiOperation({ summary: 'Eliminar compatibilidad' })
  removeCompatibility(
    @Param('partId', ParseUUIDPipe) partId: string,
    @Param('compatibilityId', ParseUUIDPipe) compatibilityId: string,
  ) {
    return this.catalogService.removeCompatibility(partId, compatibilityId);
  }

  // ============ INVENTARIO ============

  @Post('parts/:id/inventory')
  @Roles('PLATFORM_ADMIN', 'STORE_ADMIN')
  @ApiOperation({ summary: 'Registrar existencias en una sede' })
  addInventory(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddInventoryDto) {
    return this.catalogService.addInventory(id, dto);
  }

  @Put('inventory/:id')
  @Roles('PLATFORM_ADMIN', 'STORE_ADMIN')
  @ApiOperation({ summary: 'Actualizar existencias (precio/stock)' })
  updateInventory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: { price?: number; stock?: number },
  ) {
    return this.catalogService.updateInventory(id, data);
  }

  // ============ SYNC ============

  @Post('sync-search')
  @Roles('PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Sincronizar todos los repuestos con Meilisearch' })
  syncAllParts() {
    return this.catalogService.syncAllPartsToSearch();
  }
}
