import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, AssignRoleDto } from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        include: {
          roles: { include: { role: true } },
          store: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users.map((u) => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phone,
        isActive: u.isActive,
        roles: u.roles.map((ur) => ur.role.name),
        store: u.store,
        createdAt: u.createdAt,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: { include: { role: true } },
        store: true,
      },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      isActive: user.isActive,
      roles: user.roles.map((ur) => ur.role.name),
      store: user.store,
      createdAt: user.createdAt,
    };
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('El email ya está registrado');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const role = await this.prisma.role.findUnique({ where: { name: dto.role } });
    if (!role) throw new NotFoundException('Rol no encontrado');

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        storeId: dto.storeId,
        roles: {
          create: { roleId: role.id },
        },
      },
      include: {
        roles: { include: { role: true } },
      },
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles.map((ur) => ur.role.name),
    };
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id); // Verifica existencia

    const user = await this.prisma.user.update({
      where: { id },
      data: dto,
      include: {
        roles: { include: { role: true } },
      },
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      isActive: user.isActive,
      roles: user.roles.map((ur) => ur.role.name),
    };
  }

  async assignRole(userId: string, dto: AssignRoleDto) {
    await this.findOne(userId);

    const role = await this.prisma.role.findUnique({ where: { name: dto.role } });
    if (!role) throw new NotFoundException('Rol no encontrado');

    // Verificar si ya tiene el rol
    const existingUserRole = await this.prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId: role.id } },
    });

    if (existingUserRole) {
      throw new ConflictException('El usuario ya tiene este rol');
    }

    await this.prisma.userRole.create({
      data: { userId, roleId: role.id },
    });

    return this.findOne(userId);
  }

  async removeRole(userId: string, roleName: string) {
    const role = await this.prisma.role.findUnique({ where: { name: roleName as any } });
    if (!role) throw new NotFoundException('Rol no encontrado');

    await this.prisma.userRole.deleteMany({
      where: { userId, roleId: role.id },
    });

    return this.findOne(userId);
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
