import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@repuestos.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'admin@repuestos.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({ example: '+573001234567' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'STORE_ADMIN' })
  @IsString()
  @IsOptional()
  role?: string;

  @ApiPropertyOptional({ example: 'Repuestos El Motor' })
  @IsString()
  @IsOptional()
  storeName?: string;

  @ApiPropertyOptional({ example: '900123456-7' })
  @IsString()
  @IsOptional()
  storeNit?: string;

  @ApiPropertyOptional({ example: 'Calle 134 # 45-20' })
  @IsString()
  @IsOptional()
  storeAddress?: string;

  @ApiPropertyOptional({ example: 'Bogotá' })
  @IsString()
  @IsOptional()
  storeCity?: string;

  @ApiPropertyOptional({ example: 4.711 })
  @IsNumber()
  @IsOptional()
  storeLatitude?: number;

  @ApiPropertyOptional({ example: -74.0721 })
  @IsNumber()
  @IsOptional()
  storeLongitude?: number;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=800&q=80' })
  @IsString()
  @IsOptional()
  storeImageUrl?: string;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  };
}
