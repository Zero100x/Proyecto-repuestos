import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, UseInterceptors, UploadedFile, ParseUUIDPipe, HttpCode, HttpStatus, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { LocationsService } from './locations.service';
import { CreateStoreDto, CreateLocationDto, UpdateLocationDto, OnboardStoreDto } from './dto/locations.dto';

@ApiTags('Stores & Locations')
@Controller()
export class LocationsController {
  constructor(private locationsService: LocationsService) {}

  // ============ STORES ============

  @Get('stores')
  @ApiOperation({ summary: 'Listar almacenes (Público)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAllStores(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.locationsService.findAllStores(page, limit);
  }

  @Get('stores/:id')
  @ApiOperation({ summary: 'Obtener un almacén (Público)' })
  findOneStore(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationsService.findOneStore(id);
  }

  @Post('stores/onboarding')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Activar y registrar almacén para el usuario actual' })
  onboardStore(@CurrentUser('id') userId: string, @Body() dto: OnboardStoreDto) {
    return this.locationsService.onboardStoreForUser(userId, dto);
  }

  @Post('stores/upload-image')
  @ApiOperation({ summary: 'Subir imagen de fachada o logotipo de almacén' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|gif|avif)$/i)) {
          return cb(
            new BadRequestException('Solo se admiten formatos de imagen: JPG, PNG, WEBP, GIF, AVIF'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadStoreImage(@UploadedFile() file?: Express.Multer.File) {
    if (!file || !file.buffer) {
      throw new BadRequestException('Debes enviar una imagen válida en el campo "image"');
    }
    return this.locationsService.saveStoreImage(file);
  }

  @Post('stores')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN', 'STORE_ADMIN')
  @ApiOperation({ summary: 'Registrar almacén nuevo' })
  createStore(@Body() dto: CreateStoreDto) {
    return this.locationsService.createStore(dto);
  }

  @Put('stores/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN', 'STORE_ADMIN')
  @ApiOperation({ summary: 'Actualizar almacén' })
  updateStore(@Param('id', ParseUUIDPipe) id: string, @Body() dto: Partial<CreateStoreDto>) {
    return this.locationsService.updateStore(id, dto);
  }

  // ============ LOCATIONS (Sedes/Bodegas — PDCIRA-6) ============

  @Get('locations')
  @ApiOperation({ summary: 'Listar sedes/bodegas (Público)' })
  @ApiQuery({ name: 'storeId', required: false })
  findAllLocations(@Query('storeId') storeId?: string) {
    return this.locationsService.findAllLocations(storeId);
  }

  @Get('locations/:id')
  @ApiOperation({ summary: 'Obtener una sede (Público)' })
  findOneLocation(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationsService.findOneLocation(id);
  }

  @Post('locations')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN', 'STORE_ADMIN')
  @ApiOperation({ summary: 'Registrar sede/bodega (PDCIRA-6)' })
  createLocation(@Body() dto: CreateLocationDto) {
    return this.locationsService.createLocation(dto);
  }

  @Put('locations/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN', 'STORE_ADMIN')
  @ApiOperation({ summary: 'Actualizar sede/bodega' })
  updateLocation(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLocationDto) {
    return this.locationsService.updateLocation(id, dto);
  }

  @Delete('locations/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN', 'STORE_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desactivar sede' })
  deactivateLocation(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationsService.deactivateLocation(id);
  }
}
