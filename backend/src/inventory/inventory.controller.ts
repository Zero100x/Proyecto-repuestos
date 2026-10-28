import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Header,
  Res,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { InventoryService, AuthUser } from './inventory.service';
import { CreatePartWithStockDto, UpdateStockDto } from './dto/inventory.dto';

@ApiTags('Inventory Management (B2B)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STORE_ADMIN', 'PLATFORM_ADMIN')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Resumen KPI de inventario para el almacén autenticado' })
  @ApiQuery({ name: 'storeId', required: false, description: 'Solo para PLATFORM_ADMIN' })
  getSummary(
    @CurrentUser() user: AuthUser,
    @Query('storeId') storeId?: string,
  ) {
    return this.inventoryService.getSummary(user, storeId);
  }

  @Get('locations')
  @ApiOperation({ summary: 'Listar sedes del almacén autenticado' })
  @ApiQuery({ name: 'storeId', required: false })
  getMyLocations(
    @CurrentUser() user: AuthUser,
    @Query('storeId') storeId?: string,
  ) {
    return this.inventoryService.getMyLocations(user, storeId);
  }

  @Get('template')
  @ApiOperation({ summary: 'Descargar plantilla CSV de ejemplo para carga masiva' })
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="plantilla_inventario_autopartpro.csv"')
  getTemplate(@Res() res: Response) {
    const csv = this.inventoryService.getCsvTemplate();
    return res.send(csv);
  }

  @Get()
  @ApiOperation({ summary: 'Listar inventario del almacén con filtros y paginación' })
  @ApiQuery({ name: 'q', required: false, description: 'Búsqueda por nombre, marca o número OEM' })
  @ApiQuery({ name: 'locationId', required: false, description: 'Filtrar por sede específica' })
  @ApiQuery({ name: 'status', required: false, enum: ['ok', 'low', 'out'], description: 'Estado de stock' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 25 })
  @ApiQuery({ name: 'storeId', required: false })
  listInventory(
    @CurrentUser() user: AuthUser,
    @Query('q') q?: string,
    @Query('locationId') locationId?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('storeId') storeId?: string,
  ) {
    return this.inventoryService.listInventory(user, {
      q,
      locationId,
      status,
      page,
      limit,
      storeId,
    });
  }

  @Post('bulk-upload')
  @ApiOperation({ summary: 'Carga masiva de inventario mediante archivo CSV (PDCIRA-12)' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FileInterceptor('file'))
  async bulkUpload(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file?: Express.Multer.File,
    @Body('csvContent') bodyContent?: string,
    @Body('dryRun') dryRunField?: any,
    @Query('dryRun') dryRunQuery?: string,
    @Query('storeId') storeId?: string,
  ) {
    let content = '';

    if (file && file.buffer) {
      content = file.buffer.toString('utf-8');
    } else if (bodyContent && typeof bodyContent === 'string') {
      content = bodyContent;
    } else {
      throw new BadRequestException('Debes enviar un archivo CSV en el campo "file" o texto en "csvContent"');
    }

    const isDryRun =
      dryRunQuery === 'true' ||
      dryRunField === true ||
      dryRunField === 'true';

    return this.inventoryService.bulkUpload(user, content, {
      dryRun: isDryRun,
      storeId,
    });
  }

  @Post('upload-image')
  @ApiOperation({ summary: 'Subir imagen para ficha de repuesto' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|gif|avif)$/i)) {
        return cb(new BadRequestException('Solo se admiten formatos de imagen: JPG, PNG, WEBP, GIF, AVIF'), false);
      }
      cb(null, true);
    },
  }))
  async uploadImage(@UploadedFile() file?: Express.Multer.File) {
    if (!file || !file.buffer) {
      throw new BadRequestException('Debes enviar una imagen válida en el campo "image"');
    }
    return this.inventoryService.savePartImage(file);
  }

  @Post('parts')
  @ApiOperation({ summary: 'Crear nuevo repuesto con existencia inicial en sede (PDCIRA-13)' })
  @ApiQuery({ name: 'storeId', required: false })
  createPartWithStock(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreatePartWithStockDto,
    @Query('storeId') storeId?: string,
  ) {
    return this.inventoryService.createPartWithStock(user, dto, storeId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar precio o stock de una existencia' })
  @ApiQuery({ name: 'storeId', required: false })
  updateStock(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStockDto,
    @Query('storeId') storeId?: string,
  ) {
    return this.inventoryService.updateStock(user, id, dto, storeId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una existencia de inventario' })
  @ApiQuery({ name: 'storeId', required: false })
  removeInventory(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('storeId') storeId?: string,
  ) {
    return this.inventoryService.removeInventory(user, id, storeId);
  }
}
