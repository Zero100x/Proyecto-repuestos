import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeiliSearch, Index } from 'meilisearch';

@Injectable()
export class MeilisearchService implements OnModuleInit {
  private client: MeiliSearch;
  private partsIndex: Index;
  private readonly logger = new Logger(MeilisearchService.name);

  constructor(private configService: ConfigService) {
    this.client = new MeiliSearch({
      host: this.configService.get<string>('MEILISEARCH_HOST', 'http://localhost:7700'),
      apiKey: this.configService.get<string>('MEILISEARCH_API_KEY'),
    });
  }

  async onModuleInit() {
    try {
      // Crear o obtener el índice de repuestos
      await this.client.createIndex('parts', { primaryKey: 'id' });
      this.logger.log('Índice "parts" creado/verificado en Meilisearch');
    } catch (error) {
      // El índice ya existe, lo cual está bien
      this.logger.log('Índice "parts" ya existe');
    }

    this.partsIndex = this.client.index('parts');

    // Configurar atributos de filtrado y ordenamiento
    await this.configureIndex();
  }

  private async configureIndex() {
    try {
      // Atributos que se pueden usar como filtros
      await this.partsIndex.updateFilterableAttributes([
        'category',
        'categorySlug',
        'brand',
        'makes',
        'models',
        'years',
        'versions',
        'conditions',
        'minPrice',
        'maxPrice',
        'isAvailable',
        'storeNames',
        'locationCount',
      ]);

      // Atributos por los que se puede ordenar
      await this.partsIndex.updateSortableAttributes([
        'minPrice',
        'maxPrice',
        'totalStock',
        'updatedAt',
        'name',
      ]);

      // Atributos de búsqueda (en orden de prioridad)
      await this.partsIndex.updateSearchableAttributes([
        'name',
        'partNumbers',
        'brand',
        'category',
        'makes',
        'models',
        'storeNames',
        'description',
      ]);

      // Configuración de ranking
      await this.partsIndex.updateRankingRules([
        'words',
        'typo',
        'proximity',
        'attribute',
        'sort',
        'exactness',
      ]);

      // Sinónimos para búsquedas comunes en español
      await this.partsIndex.updateSynonyms({
        'pastillas': ['balatas', 'pads'],
        'balatas': ['pastillas', 'pads'],
        'amortiguador': ['shock', 'absorber'],
        'bujía': ['spark plug', 'bujia'],
        'aceite': ['lubricante', 'oil'],
        'filtro aceite': ['oil filter'],
        'alternador': ['alternator'],
        'batería': ['battery', 'bateria'],
        'radiador': ['radiator'],
        'correa': ['banda', 'belt'],
        'empaque': ['junta', 'gasket'],
      });

      // Typo tolerance configurada
      await this.partsIndex.updateTypoTolerance({
        enabled: true,
        minWordSizeForTypos: {
          oneTypo: 3,
          twoTypos: 6,
        },
      });

      this.logger.log('Configuración de índice Meilisearch completada');
    } catch (error) {
      this.logger.error('Error configurando Meilisearch:', error);
    }
  }

  // Indexar un repuesto
  async indexPart(document: any) {
    try {
      await this.partsIndex.addDocuments([document]);
    } catch (error) {
      this.logger.error(`Error indexando repuesto ${document.id}:`, error);
    }
  }

  // Indexar múltiples repuestos
  async indexParts(documents: any[]) {
    try {
      await this.partsIndex.addDocuments(documents);
    } catch (error) {
      this.logger.error('Error indexando repuestos:', error);
    }
  }

  // Eliminar un repuesto del índice
  async removePart(id: string) {
    try {
      await this.partsIndex.deleteDocument(id);
    } catch (error) {
      this.logger.error(`Error eliminando repuesto ${id} del índice:`, error);
    }
  }

  // Limpiar todos los documentos del índice antes de resincronizar
  async clearAllParts() {
    try {
      const task = await this.partsIndex.deleteAllDocuments();
      await this.client.waitForTask(task.taskUid, { timeOutMs: 5000 }).catch(() => {});
    } catch (error) {
      this.logger.error('Error limpiando índice de repuestos:', error);
    }
  }

  // ============ BÚSQUEDA (PDCIRA-8) ============

  async searchParts(params: {
    query?: string;
    make?: string;
    model?: string;
    year?: number;
    version?: string;
    category?: string;
    condition?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    const query = params.query || '';
    const {
      make, model, year, version,
      category, condition,
      minPrice, maxPrice,
      sortBy, sortOrder = 'asc',
    } = params;

    const safeLimit = Math.max(1, Number(params.limit) || 20);
    const safePage = Math.max(1, Number(params.page) || 1);

    // Construir filtros
    const filters: string[] = ['isAvailable = true'];

    if (make && typeof make === 'string' && make.trim()) filters.push(`makes = "${make.trim()}"`);
    if (model && typeof model === 'string' && model.trim()) filters.push(`models = "${model.trim()}"`);
    if (year !== undefined && year !== null && Number.isFinite(Number(year))) filters.push(`years = ${Number(year)}`);
    if (version && typeof version === 'string' && version.trim()) filters.push(`versions = "${version.trim()}"`);
    if (category && typeof category === 'string' && category.trim()) filters.push(`categorySlug = "${category.trim()}"`);
    if (condition && typeof condition === 'string' && condition.trim()) filters.push(`conditions = "${condition.trim()}"`);
    if (minPrice !== undefined && minPrice !== null && Number.isFinite(Number(minPrice))) filters.push(`minPrice >= ${Number(minPrice)}`);
    if (maxPrice !== undefined && maxPrice !== null && Number.isFinite(Number(maxPrice))) filters.push(`maxPrice <= ${Number(maxPrice)}`);

    // Construir sort
    const sort: string[] = [];
    if (sortBy) {
      const sortField = sortBy === 'price' ? 'minPrice' : sortBy;
      sort.push(`${sortField}:${sortOrder}`);
    }

    const result = await this.partsIndex.search(query, {
      filter: filters.length > 0 ? filters.join(' AND ') : undefined,
      sort: sort.length > 0 ? sort : undefined,
      limit: safeLimit,
      offset: (safePage - 1) * safeLimit,
      attributesToHighlight: ['name', 'description'],
      showRankingScore: true,
    });

    return {
      data: result.hits,
      meta: {
        query: query || undefined,
        filters: { make, model, year, version, category, condition, minPrice, maxPrice },
        total: result.estimatedTotalHits,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil((result.estimatedTotalHits || 0) / safeLimit),
        processingTimeMs: result.processingTimeMs,
      },
    };
  }

  // Obtener facetas/filtros disponibles dinámicamente
  async getAvailableFilters(params: {
    make?: string;
    model?: string;
    year?: number;
  }) {
    const filters: string[] = ['isAvailable = true'];
    if (params.make && typeof params.make === 'string' && params.make.trim()) filters.push(`makes = "${params.make.trim()}"`);
    if (params.model && typeof params.model === 'string' && params.model.trim()) filters.push(`models = "${params.model.trim()}"`);
    if (params.year !== undefined && params.year !== null && Number.isFinite(Number(params.year))) filters.push(`years = ${Number(params.year)}`);

    const result = await this.partsIndex.search('', {
      filter: filters.join(' AND '),
      facets: ['category', 'brand', 'conditions', 'makes', 'models', 'years', 'versions'],
      limit: 0,
    });

    return {
      facets: result.facetDistribution,
      stats: result.facetStats,
    };
  }

  // Verificar salud de Meilisearch
  async health() {
    try {
      const health = await this.client.health();
      const stats = await this.partsIndex.getStats();
      return {
        status: health.status,
        numberOfDocuments: stats.numberOfDocuments,
        isIndexing: stats.isIndexing,
      };
    } catch (error) {
      return { status: 'unavailable', error: error.message };
    }
  }
}
