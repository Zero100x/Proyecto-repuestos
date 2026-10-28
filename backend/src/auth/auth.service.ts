import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        store: {
          include: { locations: true },
        },
        roles: {
          include: { role: true },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const roles = user.roles.map((ur) => ur.role.name);
    const payload = {
      sub: user.id,
      email: user.email,
      roles,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        roles,
        storeId: user.storeId ?? null,
        store: user.store ?? null,
      },
    };
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new UnauthorizedException('El email ya está registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const isStoreRegistration = dto.role === 'STORE_ADMIN' || Boolean(dto.storeName?.trim());

    // Buscar el rol correspondiente
    const targetRoleName = isStoreRegistration ? 'STORE_ADMIN' : 'BUYER';
    const targetRole = await this.prisma.role.findUnique({
      where: { name: targetRoleName },
    });

    let createdStoreId: string | undefined = undefined;

    if (isStoreRegistration) {
      const storeName = dto.storeName?.trim() || `Almacén ${dto.firstName} ${dto.lastName}`.trim();
      const storeCity = dto.storeCity?.trim() || 'Bogotá';
      const storeAddress = dto.storeAddress?.trim() || 'Zona Industrial / Principal';

      // Verificar si el NIT ya existe para evitar error de unique constraint
      let cleanNit = dto.storeNit?.trim() || undefined;
      if (cleanNit) {
        const existingNit = await this.prisma.store.findUnique({ where: { nit: cleanNit } });
        if (existingNit) {
          cleanNit = `${cleanNit}-${Math.floor(100 + Math.random() * 900)}`;
        }
      }

      const newStore = await this.prisma.store.create({
        data: {
          name: storeName,
          nit: cleanNit,
          phone: dto.phone,
          email: dto.email,
          imageUrl: dto.storeImageUrl || undefined,
          locations: {
            create: {
              name: `Sede Principal — ${storeCity}`,
              address: storeAddress,
              city: storeCity,
              state: storeCity === 'Medellín' ? 'Antioquia' : 'Cundinamarca',
              latitude: dto.storeLatitude ?? 4.711,
              longitude: dto.storeLongitude ?? -74.0721,
              imageUrl: dto.storeImageUrl || undefined,
              phone: dto.phone,
              whatsapp: dto.phone,
            },
          },
        },
      });

      createdStoreId = newStore.id;
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        storeId: createdStoreId,
        roles: targetRole
          ? {
              create: {
                roleId: targetRole.id,
              },
            }
          : undefined,
      },
      include: {
        store: {
          include: { locations: true },
        },
        roles: {
          include: { role: true },
        },
      },
    });

    const roles = user.roles.map((ur) => ur.role.name);
    const payload = {
      sub: user.id,
      email: user.email,
      roles,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        roles,
        storeId: user.storeId ?? null,
        store: user.store ?? null,
      },
    };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario no válido');
    }

    return user;
  }
}
