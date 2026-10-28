import { Module } from '@nestjs/common';
import { MeilisearchService } from './meilisearch.service';
import { SearchController } from './search.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SearchController],
  providers: [MeilisearchService],
  exports: [MeilisearchService],
})
export class SearchModule {}
