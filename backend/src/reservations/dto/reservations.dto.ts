import { IsString, IsNotEmpty, IsOptional, IsEmail, IsNumber, Min, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReservationStatus } from '@prisma/client';

export class CreateReservationDto {
  @ApiProperty({ description: 'ID del repuesto' })
  @IsString()
  @IsNotEmpty()
  partId: string;

  @ApiProperty({ description: 'ID de la sede física donde retirará el repuesto' })
  @IsString()
  @IsNotEmpty()
  locationId: string;

  @ApiProperty({ description: 'Nombre completo del comprador o taller', example: 'Carlos Gómez (Taller El Rayo)' })
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiProperty({ description: 'Teléfono o WhatsApp de contacto', example: '3001234567' })
  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @ApiPropertyOptional({ description: 'Correo electrónico de contacto', example: 'carlos@tallerelrayo.com' })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiPropertyOptional({ description: 'Cédula de ciudadanía o NIT para verificación al retirar', example: '1018273645' })
  @IsOptional()
  @IsString()
  customerDocument?: string;

  @ApiPropertyOptional({ description: 'Cantidad de unidades a reservar', default: 1, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Notas adicionales o placas del vehículo', example: 'Paso a recoger hoy a las 4:00 PM' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateReservationStatusDto {
  @ApiProperty({ enum: ReservationStatus, description: 'Nuevo estado de la reserva' })
  @IsEnum(ReservationStatus)
  status: ReservationStatus;

  @ApiPropertyOptional({ description: 'Nombre del asesor o encargado de mostrador que entregó' })
  @IsOptional()
  @IsString()
  deliveredBy?: string;

  @ApiPropertyOptional({ description: 'Notas de entrega o motivo de cancelación' })
  @IsOptional()
  @IsString()
  notes?: string;
}
