import {
  IsString, IsOptional, IsNumber, IsUUID, IsEnum, IsArray, Min, MinLength, ValidateNested, IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartCondition } from '@prisma/client';

export class PartCompatibilityItemDto {
  @ApiProperty({ example: 'Renault' })
  @IsString()
  make: string;

  @ApiProperty({ example: 'Clio' })
  @IsString()
  model: string;

  @ApiProperty({ example: 2012 })
  @IsNumber()
  yearFrom: number;

  @ApiPropertyOptional({ example: 2020 })
  @IsNumber()
  @IsOptional()
  yearTo?: number;

  @ApiPropertyOptional({ example: '1.6L 16V' })
  @IsString()
  @IsOptional()
  version?: string;
}

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

  @ApiPropertyOptional({ type: [String], description: 'Galería de URLs de fotos del repuesto (hasta 5)' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({ example: '04465-02220' })
  @IsString()
  @IsOptional()
  oemNumber?: string;

  @ApiPropertyOptional({ type: [String], description: 'IDs de versiones de vehículo compatibles' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  compatibleVersionIds?: string[];

  @ApiPropertyOptional({ type: [PartCompatibilityItemDto], description: 'Vehículos compatibles (Marca, Modelo, Años, Versión)' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartCompatibilityItemDto)
  @IsOptional()
  compatibilities?: PartCompatibilityItemDto[];

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

  @ApiPropertyOptional({ example: '12 Meses o 20.000 KM' })
  @IsString()
  @IsOptional()
  warranty?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  hasWarranty?: boolean;
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

export class UpdatePartAndStockDto {
  @ApiPropertyOptional({ example: 'Pastillas de freno delanteras cerámicas' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'ID de la categoría' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'Brembo' })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiPropertyOptional({ example: 'Pastillas de alto rendimiento' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '04465-02220' })
  @IsString()
  @IsOptional()
  oemNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({ type: [PartCompatibilityItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartCompatibilityItemDto)
  @IsOptional()
  compatibilities?: PartCompatibilityItemDto[];

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

  @ApiPropertyOptional({ enum: PartCondition })
  @IsEnum(PartCondition)
  @IsOptional()
  condition?: PartCondition;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  locationId?: string;

  @ApiPropertyOptional({ example: '12 Meses o 20.000 KM' })
  @IsString()
  @IsOptional()
  warranty?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  hasWarranty?: boolean;
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
