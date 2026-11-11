import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { extname } from 'path';

const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/png',
  'image/x-png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/bmp',
  'image/heic',
  'image/heif',
]);

const ALLOWED_IMAGE_EXTS = new Set([
  '.jpg',
  '.jpeg',
  '.jfif',
  '.png',
  '.webp',
  '.gif',
  '.avif',
  '.bmp',
  '.heic',
  '.heif',
]);

export const IMAGE_MULTER_OPTIONS: MulterOptions = {
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB máximo
  fileFilter: (_req, file, cb) => {
    const mime = (file.mimetype || '').toLowerCase();
    const ext = extname(file.originalname || '').toLowerCase();
    const validMime = ALLOWED_IMAGE_MIMES.has(mime);
    const validOctetFallback =
      (!mime || mime === 'application/octet-stream') && ALLOWED_IMAGE_EXTS.has(ext);

    if (validMime || validOctetFallback) {
      return cb(null, true);
    }

    return cb(
      new BadRequestException(
        'Solo se admiten formatos de imagen válidos (JPG, PNG, WEBP, GIF, AVIF)',
      ),
      false,
    );
  },
};
