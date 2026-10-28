import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsNumber,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeadStatus } from '@prisma/client';

export class CreateLeadDto {
  @ApiProperty({ description: 'ID de la tienda que vende el repuesto' })
  @IsUUID()
  @IsNotEmpty()
  storeId: string;

  @ApiProperty({ description: 'ID del repuesto cotizado' })
  @IsUUID()
  @IsNotEmpty()
  partId: string;

  @ApiPropertyOptional({ description: 'ID de la sede física consultada' })
  @IsUUID()
  @IsOptional()
  locationId?: string;

  @ApiPropertyOptional({ example: 'Carlos Rodríguez' })
  @IsString()
  @IsOptional()
  buyerName?: string;

  @ApiPropertyOptional({ example: '+573101234567' })
  @IsString()
  @IsOptional()
  buyerPhone?: string;

  @ApiPropertyOptional({ example: 'Bogotá' })
  @IsString()
  @IsOptional()
  buyerCity?: string;

  @ApiPropertyOptional({ example: '¿Tienen entrega inmediata en el norte?' })
  @IsString()
  @IsOptional()
  buyerMessage?: string;

  @ApiPropertyOptional({ example: 85000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  quotedPrice?: number;

  @ApiPropertyOptional({ example: '/parts/pastillas-freno-clio-2' })
  @IsString()
  @IsOptional()
  sourceUrl?: string;
}

export class UpdateLeadStatusDto {
  @ApiProperty({ enum: LeadStatus, example: 'CONTACTED' })
  @IsEnum(LeadStatus)
  status: LeadStatus;
}

export class LogSearchQueryDto {
  @ApiProperty({ example: 'bomba de agua mazda 3' })
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @Min(0)
  resultsCount: number;

  @ApiPropertyOptional({ example: 'Bogotá' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  makeId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  modelId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  categoryId?: string;
}
