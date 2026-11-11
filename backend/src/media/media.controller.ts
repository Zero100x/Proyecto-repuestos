import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { MediaService } from './media.service';

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get(':filename')
  @ApiOperation({ summary: 'Servir imagen almacenada de forma persistente en base de datos' })
  async serveImage(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const file = await this.mediaService.getImageByFilename(filename);
    if (!file) {
      throw new NotFoundException('Imagen no encontrada');
    }

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', String(file.size));
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    return res.status(200).send(file.buffer);
  }
}

