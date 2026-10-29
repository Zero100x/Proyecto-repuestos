import { IsString, IsOptional, IsNumber, IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStoreDto {
  @ApiProperty({ example: 'Repuestos El Motor' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '900123456-7' })
  @IsString()
  @IsOptional()
  nit?: string;

  @ApiPropertyOptional({ example: '+573001234567' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'contacto@elmotor.com' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=800&q=80' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'Lunes a Sábado • 08:00 - 18:30' })
  @IsString()
  @IsOptional()
  operatingHours?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  hasDelivery?: boolean;

  @ApiPropertyOptional({ example: 'Despacho express disponible en Pasto' })
  @IsString()
  @IsOptional()
  deliveryDetails?: string;
}

export class OnboardStoreDto {
  @ApiProperty({ example: 'Autopartes Galeras Pasto' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '900123456-7' })
  @IsString()
  @IsOptional()
  nit?: string;

  @ApiPropertyOptional({ example: '+573158001122' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: '+573158001122' })
  @IsString()
  @IsOptional()
  whatsapp?: string;

  @ApiPropertyOptional({ example: 'Carrera 19 # 14-35, Barrio Julián Bucheli' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Pasto' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 1.2084 })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ example: -77.2765 })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'Lunes a Sábado • 08:00 - 18:30' })
  @IsString()
  @IsOptional()
  operatingHours?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  hasDelivery?: boolean;

  @ApiPropertyOptional({ example: 'Despacho express disponible en Pasto' })
  @IsString()
  @IsOptional()
  deliveryDetails?: string;
}

export class CreateLocationDto {
  @ApiProperty({ description: 'ID del almacén' })
  @IsUUID()
  storeId: string;

  @ApiProperty({ example: 'Sede Norte' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Calle 45 #12-34' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'Bogotá' })
  @IsString()
  city: string;

  @ApiPropertyOptional({ example: 'Cundinamarca' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: 4.6486 })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ example: -74.0633 })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  placeId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ example: '+573001234567' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: '+573001234567' })
  @IsString()
  @IsOptional()
  whatsapp?: string;

  @ApiPropertyOptional({ example: 'Lunes a Sábado • 08:00 - 18:30' })
  @IsString()
  @IsOptional()
  operatingHours?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  hasDelivery?: boolean;

  @ApiPropertyOptional({ example: 'Despacho express disponible en Pasto' })
  @IsString()
  @IsOptional()
  deliveryDetails?: string;
}

export class UpdateLocationDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  placeId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  whatsapp?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'Lunes a Sábado • 08:00 - 18:30' })
  @IsString()
  @IsOptional()
  operatingHours?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  hasDelivery?: boolean;

  @ApiPropertyOptional({ example: 'Despacho express disponible en Pasto' })
  @IsString()
  @IsOptional()
  deliveryDetails?: string;
}
