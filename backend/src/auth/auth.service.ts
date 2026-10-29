import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { LoginDto, RegisterDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
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
      const storeCity = dto.storeCity?.trim() || 'Pasto';
      const storeAddress = dto.storeAddress?.trim() || 'Carrera 19 # 14-35, Barrio Julián Bucheli';

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
              state: 'Nariño',
              latitude: dto.storeLatitude ?? 1.2084,
              longitude: dto.storeLongitude ?? -77.2765,
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

    // Disparar correo de bienvenida en segundo plano (sin bloquear respuesta)
    this.mailService
      .sendWelcomeEmail(user.email, `${user.firstName} ${user.lastName}`.trim())
      .catch(() => {});

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

  async forgotPassword(dto: ForgotPasswordDto) {
    const cleanEmail = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: {
        email: { equals: cleanEmail, mode: 'insensitive' },
      },
    });

    if (!user || !user.isActive) {
      throw new NotFoundException(
        'No encontramos ninguna cuenta registrada con ese correo electrónico',
      );
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: otpCode,
        resetPasswordExpires: expiresAt,
      },
    });

    const fullName = `${user.firstName} ${user.lastName}`.trim();
    const smtpSent = await this.mailService.sendPasswordResetEmail(
      user.email,
      fullName,
      otpCode,
    );

    return {
      message: smtpSent
        ? `Hemos enviado un código de verificación de 6 dígitos al correo ${user.email}`
        : `Código de verificación generado para ${user.email}`,
      smtpSent,
      // En modo desarrollo local (sin SMTP configurado), devolvemos el código para poder probar el flujo al instante
      devCode: !smtpSent ? otpCode : undefined,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const cleanEmail = dto.email.trim().toLowerCase();
    const cleanCode = dto.code.trim();

    const user = await this.prisma.user.findFirst({
      where: {
        email: { equals: cleanEmail, mode: 'insensitive' },
      },
    });

    if (!user || !user.isActive) {
      throw new NotFoundException('No se encontró la cuenta asociada a este correo');
    }

    if (!user.resetPasswordToken || user.resetPasswordToken !== cleanCode) {
      throw new BadRequestException('El código de verificación de 6 dígitos es incorrecto');
    }

    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new BadRequestException(
        'El código de verificación ha expirado (validez de 15 minutos). Solicita uno nuevo',
      );
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return {
      message: 'Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión.',
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
