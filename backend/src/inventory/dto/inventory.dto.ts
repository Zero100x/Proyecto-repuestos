import {
  IsString, IsOptional, IsNumber, IsUUID, IsEnum, IsArray, Min, MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartCondition } from '@prisma/client';

/** Alta rápida de un repuesto nuevo + número OEM + existencia inicial (Sprint 3) */
export class CreatePartWithStockDto {
  @ApiProperty({ example: 'Pastillas de freno delanteras cerámicas' })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({ description: 'ID de la categoría' })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ example: 'Brembo' })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiPropertyOptional({ example: 'Pastillas de alto rendimiento para uso urbano' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '/uploads/parts/1729.jpg' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ example: '04465-02220' })
  @IsString()
  @IsOptional()
  oemNumber?: string;

  @ApiPropertyOptional({ type: [String], description: 'IDs de versiones de vehículo compatibles' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  compatibleVersionIds?: string[];

  @ApiProperty({ description: 'Sede donde se registra la existencia inicial' })
  @IsUUID()
  locationId: string;

  @ApiProperty({ example: 85000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({ enum: PartCondition, default: 'NEW' })
  @IsEnum(PartCondition)
  @IsOptional()
  condition?: PartCondition;
}

export class UpdateStockDto {
  @ApiPropertyOptional({ example: 90000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ example: 8 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;
}

export interface BulkUploadRowError {
  row: number;
  message: string;
}

export interface BulkUploadReport {
  totalRows: number;
  inventoryCreated: number;
  inventoryUpdated: number;
  partsCreated: number;
  errors: BulkUploadRowError[];
  dryRun: boolean;
}
