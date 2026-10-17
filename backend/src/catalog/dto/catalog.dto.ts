import { IsString, IsOptional, IsNumber, IsBoolean, IsUUID, IsEnum, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartCondition } from '@prisma/client';

export class CreatePartCategoryDto {
  @ApiProperty({ example: 'Frenos' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'frenos' })
  @IsString()
  slug: string;

  @ApiPropertyOptional({ example: 'Sistema de frenado del vehículo' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'ID de categoría padre para subcategorías' })
  @IsUUID()
  @IsOptional()
  parentId?: string;
}

export class CreatePartDto {
  @ApiProperty({ description: 'ID de la categoría' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: 'Pastillas de freno delanteras' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'pastillas-freno-delanteras' })
  @IsString()
  slug: string;

  @ApiPropertyOptional({ example: 'Pastillas cerámicas de alto rendimiento' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'Brembo' })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiPropertyOptional({ example: 0.5 })
  @IsNumber()
  @IsOptional()
  weight?: number;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}

export class UpdatePartDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  weight?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class AddPartNumberDto {
  @ApiProperty({ example: '04465-02220' })
  @IsString()
  number: string;

  @ApiPropertyOptional({ example: 'OEM', enum: ['OEM', 'AFTERMARKET', 'UNIVERSAL'] })
  @IsString()
  @IsOptional()
  type?: string;
}

export class AddCompatibilityDto {
  @ApiProperty({ description: 'ID de la versión del vehículo' })
  @IsUUID()
  versionId: string;

  @ApiPropertyOptional({ example: 'Compatible solo con versión con ABS' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class AddInventoryDto {
  @ApiProperty({ description: 'ID de la sede/bodega' })
  @IsUUID()
  locationId: string;

  @ApiProperty({ example: 45000 })
  @IsNumber()
  price: number;

  @ApiProperty({ example: 15 })
  @IsNumber()
  stock: number;

  @ApiPropertyOptional({ enum: PartCondition, default: 'NEW' })
  @IsEnum(PartCondition)
  @IsOptional()
  condition?: PartCondition;
}

export class BulkCompatibilityDto {
  @ApiProperty({ description: 'Lista de IDs de versiones de vehículos' })
  @IsArray()
  @IsUUID('4', { each: true })
  versionIds: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
