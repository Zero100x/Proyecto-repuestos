import { Module } from '@nestjs/common';
import { MeilisearchService } from './meilisearch.service';
import { SearchController } from './search.controller';

@Module({
  controllers: [SearchController],
  providers: [MeilisearchService],
  exports: [MeilisearchService],
})
export class SearchModule {}
