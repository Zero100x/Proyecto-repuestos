import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';

@ApiTags('Vehicles')
@Controller('vehicles')
export class VehiclesController {
  constructor(private vehiclesService: VehiclesService) {}

  @Get('makes')
  @ApiOperation({ summary: 'Listar marcas de vehículos' })
  findAllMakes() {
    return this.vehiclesService.findAllMakes();
  }

  @Get('makes/:id/models')
  @ApiOperation({ summary: 'Listar modelos por marca' })
  findModelsByMake(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehiclesService.findModelsByMake(id);
  }

  @Get('models/:id/years')
  @ApiOperation({ summary: 'Listar años por modelo' })
  findYearsByModel(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehiclesService.findYearsByModel(id);
  }

  @Get('years/:id/versions')
  @ApiOperation({ summary: 'Listar versiones por año' })
  findVersionsByYear(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehiclesService.findVersionsByYear(id);
  }

  @Get('cascade')
  @ApiOperation({ summary: 'Selector cascada de vehículos (para el frontend)' })
  @ApiQuery({ name: 'makeId', required: false })
  @ApiQuery({ name: 'modelId', required: false })
  @ApiQuery({ name: 'yearId', required: false })
  getCascade(
    @Query('makeId') makeId?: string,
    @Query('modelId') modelId?: string,
    @Query('yearId') yearId?: string,
  ) {
    return this.vehiclesService.getVehicleCascade(makeId, modelId, yearId);
  }
}
