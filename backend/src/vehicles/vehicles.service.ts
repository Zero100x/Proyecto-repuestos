import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async findAllMakes() {
    return this.prisma.vehicleMake.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { models: true } } },
    });
  }

  async findModelsByMake(makeId: string) {
    return this.prisma.vehicleModel.findMany({
      where: { makeId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { years: true } } },
    });
  }

  async findYearsByModel(modelId: string) {
    return this.prisma.vehicleYear.findMany({
      where: { modelId },
      orderBy: { year: 'desc' },
      include: { _count: { select: { versions: true } } },
    });
  }

  async findVersionsByYear(yearId: string) {
    return this.prisma.vehicleVersion.findMany({
      where: { yearId },
      orderBy: { name: 'asc' },
    });
  }

  // Cascada completa para el selector del frontend
  async getVehicleCascade(makeId?: string, modelId?: string, yearId?: string) {
    const result: any = {};

    result.makes = await this.findAllMakes();

    if (makeId) {
      result.models = await this.findModelsByMake(makeId);
    }

    if (modelId) {
      result.years = await this.findYearsByModel(modelId);
    }

    if (yearId) {
      result.versions = await this.findVersionsByYear(yearId);
    }

    return result;
  }
}
