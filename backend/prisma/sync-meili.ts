import { PrismaClient } from '@prisma/client';
import { MeiliSearch } from 'meilisearch';

const prisma = new PrismaClient();
const meili = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILISEARCH_API_KEY || 'repuestos_meili_master_key_2026',
});

async function sync() {
  console.log('🔄 Sincronizando catálogo con Meilisearch...');
  const parts = await prisma.part.findMany({
    include: {
      category: true,
      partNumbers: true,
      compatibility: {
        include: {
          version: {
            include: {
              year: {
                include: {
                  model: {
                    include: { make: true },
                  },
                },
              },
            },
          },
        },
      },
      inventory: {
        include: {
          location: {
            include: { store: true },
          },
        },
      },
    },
  });

  const documents = parts.map((part) => {
    const makes = new Set<string>();
    const models = new Set<string>();
    const years = new Set<number>();
    const versions = new Set<string>();

    for (const c of part.compatibility) {
      if (c.version?.year?.model?.make) {
        makes.add(c.version.year.model.make.name);
        models.add(c.version.year.model.name);
        years.add(c.version.year.year);
        versions.add(c.version.name);
      }
    }

    const prices = part.inventory.map((i) => i.price);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;
    const totalStock = part.inventory.reduce((sum, i) => sum + i.stock, 0);
    const conditions = Array.from(new Set(part.inventory.map((i) => i.condition)));
    const storeNames = Array.from(new Set(part.inventory.map((i) => i.location?.store?.name).filter(Boolean)));
    const addresses = Array.from(new Set(part.inventory.map((i) => i.location?.address).filter(Boolean)));
    const locationNames = Array.from(new Set(part.inventory.map((i) => i.location?.name).filter(Boolean)));
    const cities = Array.from(new Set(part.inventory.map((i) => i.location?.city).filter(Boolean)));
    const locations = part.inventory.map((i) => ({
      id: i.location?.id,
      storeId: i.location?.storeId,
      storeName: i.location?.store?.name,
      name: i.location?.name,
      address: i.location?.address,
      city: i.location?.city,
      latitude: i.location?.latitude,
      longitude: i.location?.longitude,
      phone: i.location?.phone || i.location?.whatsapp,
    }));

    return {
      id: part.id,
      name: part.name,
      slug: part.slug,
      description: part.description,
      brand: part.brand,
      imageUrl: part.imageUrl,
      category: part.category?.name,
      categorySlug: part.category?.slug,
      partNumbers: part.partNumbers.map((pn) => pn.number),
      makes: Array.from(makes),
      models: Array.from(models),
      years: Array.from(years),
      versions: Array.from(versions),
      conditions,
      minPrice,
      maxPrice,
      totalStock,
      isAvailable: totalStock > 0,
      storeNames,
      addresses,
      locationNames,
      cities,
      locations,
      locationCount: part.inventory.length,
      updatedAt: part.updatedAt.toISOString(),
    };
  });

  const index = meili.index('parts');
  await index.addDocuments(documents);
  console.log(`✅ ${documents.length} repuestos sincronizados exitosamente con Meilisearch!`);
}

sync()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
