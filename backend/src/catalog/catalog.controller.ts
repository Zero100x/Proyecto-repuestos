import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../inventory/inventory.service';
import { CatalogService } from './catalog.service';
import {
  CreatePartCategoryDto, CreatePartDto, UpdatePartDto,
  AddPartNumberDto, AddCompatibilityDto, AddInventoryDto,
  BulkCompatibilityDto, CreateQuestionDto, AnswerQuestionDto,
} from './dto/catalog.dto';

@ApiTags('Catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private catalogService: CatalogService) {}

  // ============ CATEGORÍAS (PÚBLICAS) ============

  @Get('categories')
  @ApiOperation({ summary: 'Listar categorías de repuestos (Público)' })
  findAllCategories() {
    return this.catalogService.findAllCategories();
  }

  @Post('categories')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN', 'STORE_ADMIN')
  @ApiOperation({ summary: 'Crear categoría' })
  createCategory(@Body() dto: CreatePartCategoryDto) {
    return this.catalogService.createCategory(dto);
  }

  // ============ REPUESTOS (PDCIRA-7) ============

  @Get('parts')
  @ApiOperation({ summary: 'Listar repuestos del catálogo (Público)' })
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
  @ApiOperation({ summary: 'Obtener detalle de un repuesto (Público)' })
  findOnePart(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalogService.findOnePart(id);
  }

  @Post('parts')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN', 'STORE_ADMIN')
  @ApiOperation({ summary: 'Crear repuesto (PDCIRA-7)' })
  createPart(@Body() dto: CreatePartDto) {
    return this.catalogService.createPart(dto);
  }

  @Put('parts/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN', 'STORE_ADMIN')
  @ApiOperation({ summary: 'Actualizar repuesto' })
  updatePart(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePartDto) {
    return this.catalogService.updatePart(id, dto);
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sincronizar todo el catálogo con Meilisearch' })
  syncSearch() {
    return this.catalogService.syncAllPartsToSearch();
  }

  // ============ NÚMEROS DE PARTE ============

  @Post('parts/:id/part-numbers')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN', 'STORE_ADMIN')
  @ApiOperation({ summary: 'Agregar número de parte' })
  addPartNumber(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddPartNumberDto) {
    return this.catalogService.addPartNumber(id, dto);
  }

  @Delete('parts/:partId/part-numbers/:partNumberId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
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
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN', 'STORE_ADMIN')
  @ApiOperation({ summary: 'Agregar compatibilidad con vehículo (PDCIRA-7)' })
  addCompatibility(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddCompatibilityDto) {
    return this.catalogService.addCompatibility(id, dto);
  }

  @Post('parts/:id/compatibility/bulk')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN', 'STORE_ADMIN')
  @ApiOperation({ summary: 'Agregar compatibilidad masiva' })
  addBulkCompatibility(@Param('id', ParseUUIDPipe) id: string, @Body() dto: BulkCompatibilityDto) {
    return this.catalogService.addBulkCompatibility(id, dto);
  }

  @Delete('parts/:partId/compatibility/:compatibilityId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
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
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN', 'STORE_ADMIN')
  @ApiOperation({ summary: 'Registrar existencias en una sede' })
  addInventory(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddInventoryDto) {
    return this.catalogService.addInventory(id, dto);
  }

  @Put('inventory/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
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
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Sincronizar todos los repuestos con Meilisearch' })
  syncAllParts() {
    return this.catalogService.syncAllPartsToSearch();
  }

  // ============ PREGUNTAS TÉCNICAS (PDCIRA-17) ============

  @Get('parts/:id/questions')
  @ApiOperation({ summary: 'Consultar preguntas técnicas de un repuesto (Público)' })
  getPartQuestions(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalogService.getPartQuestions(id);
  }

  @Post('parts/:id/questions')
  @ApiOperation({ summary: 'Hacer una pregunta técnica sobre un repuesto' })
  createPartQuestion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.catalogService.createQuestion(id, dto);
  }

  @Post('questions/:id/answer')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STORE_ADMIN', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Responder pregunta técnica como almacén o asesor' })
  answerPartQuestion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AnswerQuestionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.catalogService.answerQuestion(id, dto, user?.email);
  }
}
