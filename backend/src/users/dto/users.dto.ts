import { IsEmail, IsEnum, IsOptional, IsString, IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleType } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'usuario@repuestos.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password: string;

  @ApiProperty({ example: 'Carlos' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Gómez' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ example: '+573001234567' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ enum: RoleType, example: 'STORE_ADMIN' })
  @IsEnum(RoleType)
  role: RoleType;

  @ApiPropertyOptional({ description: 'ID del almacén (solo para STORE_ADMIN)' })
  @IsUUID()
  @IsOptional()
  storeId?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class AssignRoleDto {
  @ApiProperty({ enum: RoleType })
  @IsEnum(RoleType)
  role: RoleType;
}
