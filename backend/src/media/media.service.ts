import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { extname, join, basename } from 'path';
import { existsSync, readFileSync } from 'fs';
import { randomUUID } from 'crypto';

const EXT_TO_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.jfif': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.bmp': 'image/bmp',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
};

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
};

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Extrae el origen público del request si no corre en localhost.
   */
  static resolveRequestOrigin(req?: {
    headers?: Record<string, string | string[] | undefined>;
    protocol?: string;
  }): string {
    if (!req?.headers) return '';
    const rawHost = req.headers['x-forwarded-host'] || req.headers.host;
    const host = (Array.isArray(rawHost) ? rawHost[0] : rawHost)?.trim();
    if (!host) return '';
    const lowerHost = host.toLowerCase();
    if (lowerHost.startsWith('localhost') || lowerHost.startsWith('127.0.0.1')) {
      return '';
    }
    const rawProto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const proto =
      (Array.isArray(rawProto) ? rawProto[0] : rawProto)
        .split(',')[0]
        .trim() || 'https';
    return `${proto}://${host}`;
  }

  /**
   * Guarda una imagen de forma persistente en PostgreSQL y devuelve su URL pública.
   */
  async saveImage(
    file: Express.Multer.File,
    category: 'part' | 'store' = 'part',
    requestOrigin?: string,
  ): Promise<{ id: string; filename: string; url: string }> {
    if (!file?.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Archivo de imagen vacío o inválido');
    }

    const rawExt = extname(file.originalname || '').toLowerCase();
    const cleanMime = (file.mimetype || '').toLowerCase();
    const cleanExt = EXT_TO_MIME[rawExt]
      ? rawExt
      : MIME_TO_EXT[cleanMime] || '.jpg';
    const resolvedMime =
      EXT_TO_MIME[cleanExt] ||
      (cleanMime.startsWith('image/') ? cleanMime : 'image/jpeg');

    const prefix = category === 'store' ? 'store' : 'part';
    const filename = `${prefix}-${Date.now()}-${randomUUID().slice(0, 8)}${cleanExt}`;

    const record = await this.prisma.storedImage.create({
      data: {
        filename,
        mimeType: resolvedMime,
        data: Buffer.from(file.buffer),
        size: file.buffer.length,
        category,
      },
      select: {
        id: true,
        filename: true,
      },
    });

    const configuredBase =
      process.env.API_PUBLIC_URL ||
      process.env.RENDER_EXTERNAL_URL ||
      requestOrigin ||
      '';
    const baseUrl = configuredBase.trim().replace(/\/$/, '');
    const url = baseUrl
      ? `${baseUrl}/api/media/${record.filename}`
      : `/api/media/${record.filename}`;

    return {
      id: record.id,
      filename: record.filename,
      url,
    };
  }

  /**
   * Recupera una imagen por filename desde PostgreSQL (con respaldo en disco local si existiera).
   */
  async getImageByFilename(
    rawFilename: string,
  ): Promise<{ buffer: Buffer; mimeType: string; size: number } | null> {
    const safeName = basename(rawFilename || '').trim();
    if (!safeName) return null;

    const stored = await this.prisma.storedImage.findUnique({
      where: { filename: safeName },
      select: {
        data: true,
        mimeType: true,
        size: true,
      },
    });

    if (stored) {
      const buffer = Buffer.from(stored.data);
      return {
        buffer,
        mimeType: stored.mimeType || 'image/jpeg',
        size: stored.size || buffer.length,
      };
    }

    // Respaldo opcional para archivos locales heredados en desarrollo
    const candidatePaths = [
      join(process.cwd(), 'uploads', 'parts', safeName),
      join(process.cwd(), 'uploads', safeName),
    ];
    for (const filePath of candidatePaths) {
      if (existsSync(filePath)) {
        const buffer = readFileSync(filePath);
        const ext = extname(safeName).toLowerCase();
        return {
          buffer,
          mimeType: EXT_TO_MIME[ext] || 'image/jpeg',
          size: buffer.length,
        };
      }
    }

    return null;
  }
}

