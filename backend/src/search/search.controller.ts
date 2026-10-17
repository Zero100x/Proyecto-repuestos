import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MeilisearchService } from './meilisearch.service';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private meilisearch: MeilisearchService) {}

  @Get('parts')
  @ApiOperation({ summary: 'Buscar repuestos por vehículo o número de parte (PDCIRA-8)' })
  @ApiQuery({ name: 'q', required: false, description: 'Texto libre o número de parte/OEM' })
  @ApiQuery({ name: 'make', required: false, description: 'Marca del vehículo' })
  @ApiQuery({ name: 'model', required: false, description: 'Modelo del vehículo' })
  @ApiQuery({ name: 'year', required: false, description: 'Año del modelo', type: Number })
  @ApiQuery({ name: 'version', required: false, description: 'Versión/trim del vehículo' })
  @ApiQuery({ name: 'category', required: false, description: 'Slug de categoría' })
  @ApiQuery({ name: 'condition', required: false, description: 'Condición: NEW, USED, REFURBISHED' })
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
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.meilisearch.searchParts({
      query, make, model, year, version,
      category, condition, minPrice, maxPrice,
      sortBy, sortOrder, page, limit,
    });
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
    return this.meilisearch.getAvailableFilters({ make, model, year });
  }

  @Get('health')
  @ApiOperation({ summary: 'Estado del motor de búsqueda' })
  async health() {
    return this.meilisearch.health();
  }
}
