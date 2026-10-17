import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { LocationsService } from './locations.service';
import { CreateStoreDto, CreateLocationDto, UpdateLocationDto } from './dto/locations.dto';

@ApiTags('Stores & Locations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class LocationsController {
  constructor(private locationsService: LocationsService) {}

  // ============ STORES ============

  @Get('stores')
  @Roles('PLATFORM_ADMIN', 'STORE_ADMIN')
  @ApiOperation({ summary: 'Listar almacenes' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAllStores(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.locationsService.findAllStores(page, limit);
  }

  @Get('stores/:id')
  @Roles('PLATFORM_ADMIN', 'STORE_ADMIN')
  @ApiOperation({ summary: 'Obtener un almacén' })
  findOneStore(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationsService.findOneStore(id);
  }

  @Post('stores')
  @Roles('PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Registrar almacén nuevo' })
  createStore(@Body() dto: CreateStoreDto) {
    return this.locationsService.createStore(dto);
  }

  @Put('stores/:id')
  @Roles('PLATFORM_ADMIN', 'STORE_ADMIN')
  @ApiOperation({ summary: 'Actualizar almacén' })
  updateStore(@Param('id', ParseUUIDPipe) id: string, @Body() dto: Partial<CreateStoreDto>) {
    return this.locationsService.updateStore(id, dto);
  }

  // ============ LOCATIONS (Sedes/Bodegas — PDCIRA-6) ============

  @Get('locations')
  @Roles('PLATFORM_ADMIN', 'STORE_ADMIN')
  @ApiOperation({ summary: 'Listar sedes/bodegas (PDCIRA-6)' })
  @ApiQuery({ name: 'storeId', required: false })
  findAllLocations(@Query('storeId') storeId?: string) {
    return this.locationsService.findAllLocations(storeId);
  }

  @Get('locations/:id')
  @Roles('PLATFORM_ADMIN', 'STORE_ADMIN')
  @ApiOperation({ summary: 'Obtener una sede' })
  findOneLocation(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationsService.findOneLocation(id);
  }

  @Post('locations')
  @Roles('PLATFORM_ADMIN', 'STORE_ADMIN')
  @ApiOperation({ summary: 'Registrar sede/bodega (PDCIRA-6)' })
  createLocation(@Body() dto: CreateLocationDto) {
    return this.locationsService.createLocation(dto);
  }

  @Put('locations/:id')
  @Roles('PLATFORM_ADMIN', 'STORE_ADMIN')
  @ApiOperation({ summary: 'Actualizar sede/bodega' })
  updateLocation(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLocationDto) {
    return this.locationsService.updateLocation(id, dto);
  }

  @Delete('locations/:id')
  @Roles('PLATFORM_ADMIN', 'STORE_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desactivar sede' })
  deactivateLocation(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationsService.deactivateLocation(id);
  }
}
