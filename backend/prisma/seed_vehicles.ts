import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚗 Iniciando enriquecimiento del catálogo de vehículos...');

  // ==========================================
  // 1. RENAULT
  // ==========================================
  let renault = await prisma.vehicleMake.findFirst({ where: { name: 'Renault' } });
  if (!renault) {
    renault = await prisma.vehicleMake.create({ data: { name: 'Renault' } });
  }

  // Modelos Renault
  const renaultModelsData = [
    {
      name: 'Clio',
      years: [2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016],
      versions: [
        { name: 'Clio 2 Fase 1 1.4L', engine: '1.4L 8V K7J' },
        { name: 'Clio 2 Fase 2 1.6L 16V Dynamique', engine: '1.6L 16V K4M' },
        { name: 'Clio 2 Fase 2 1.6L 16V Expression', engine: '1.6L 16V K4M' },
        { name: 'Clio Campus 1.2L 16V', engine: '1.2L 16V D4F' },
        { name: 'Clio Style 1.2L 16V', engine: '1.2L 16V D4F' },
      ],
    },
    {
      name: 'Sandero',
      years: [2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
      versions: [
        { name: 'Authentique 1.6L', engine: '1.6L 8V K7M' },
        { name: 'Expression 1.6L', engine: '1.6L 8V K7M' },
        { name: 'Dynamique 1.6L 16V', engine: '1.6L 16V K4M' },
        { name: 'Zen 1.6L 16V', engine: '1.6L 16V H4M' },
        { name: 'Intens 1.6L 16V', engine: '1.6L 16V H4M' },
      ],
    },
    {
      name: 'Stepway',
      years: [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
      versions: [
        { name: 'Dynamique 1.6L 16V', engine: '1.6L 16V K4M' },
        { name: 'Zen 1.6L 16V', engine: '1.6L 16V H4M' },
        { name: 'Intens 1.6L 16V MT', engine: '1.6L 16V H4M' },
        { name: 'Intens 1.6L CVT', engine: '1.6L 16V H4M' },
      ],
    },
    {
      name: 'Kwid',
      years: [2019, 2020, 2021, 2022, 2023, 2024],
      versions: [
        { name: 'Life 1.0L', engine: '1.0L 3-cyl SCe' },
        { name: 'Zen 1.0L', engine: '1.0L 3-cyl SCe' },
        { name: 'Outsider 1.0L', engine: '1.0L 3-cyl SCe' },
        { name: 'Iconic 1.0L', engine: '1.0L 3-cyl SCe' },
      ],
    },
    {
      name: 'Twingo',
      years: [1998, 2000, 2002, 2004, 2006, 2008, 2010, 2012],
      versions: [
        { name: 'Twingo 1.2L 8V', engine: '1.2L 8V D7F' },
        { name: 'Twingo 1.2L 16V Dynamique', engine: '1.2L 16V D4F' },
        { name: 'Twingo 1.2L 16V Acces', engine: '1.2L 16V D4F' },
      ],
    },
    {
      name: 'Megane',
      years: [2001, 2003, 2005, 2007, 2009, 2011],
      versions: [
        { name: 'Megane 1 Classic 1.4L', engine: '1.4L 16V K4J' },
        { name: 'Megane 1 Classic 1.6L', engine: '1.6L 16V K4M' },
        { name: 'Megane 2 2.0L 16V', engine: '2.0L 16V F4R' },
      ],
    },
    {
      name: 'Symbol',
      years: [2002, 2004, 2006, 2008, 2010, 2012],
      versions: [
        { name: 'Alize 1.4L 8V', engine: '1.4L 8V K7J' },
        { name: 'Expression 1.4L 16V', engine: '1.4L 16V K4J' },
        { name: 'Luxe 1.6L 16V', engine: '1.6L 16V K4M' },
      ],
    },
  ];

  for (const mData of renaultModelsData) {
    let model = await prisma.vehicleModel.findFirst({
      where: { makeId: renault.id, name: mData.name },
    });
    if (!model) {
      model = await prisma.vehicleModel.create({
        data: { makeId: renault.id, name: mData.name },
      });
      console.log(`  + Creado modelo ${renault.name} ${mData.name}`);
    }

    for (const yr of mData.years) {
      let vYear = await prisma.vehicleYear.findFirst({
        where: { modelId: model.id, year: yr },
      });
      if (!vYear) {
        vYear = await prisma.vehicleYear.create({
          data: { modelId: model.id, year: yr },
        });
      }

      for (const ver of mData.versions) {
        const existingVer = await prisma.vehicleVersion.findFirst({
          where: { yearId: vYear.id, name: ver.name },
        });
        if (!existingVer) {
          await prisma.vehicleVersion.create({
            data: {
              yearId: vYear.id,
              name: ver.name,
              engine: ver.engine,
            },
          });
        }
      }
    }
  }

  // ==========================================
  // 2. CHEVROLET (Aveo, Sail, Corsa, etc.)
  // ==========================================
  let chevrolet = await prisma.vehicleMake.findFirst({ where: { name: 'Chevrolet' } });
  if (chevrolet) {
    const chevroletModels = [
      {
        name: 'Aveo',
        years: [2008, 2009, 2010, 2011, 2012, 2013],
        versions: [
          { name: 'Family 1.5L', engine: '1.5L 8V' },
          { name: 'Emotion 1.6L', engine: '1.6L 16V' },
          { name: 'Sedan 1.6L', engine: '1.6L 16V' },
        ],
      },
      {
        name: 'Sail',
        years: [2013, 2014, 2015, 2016, 2017, 2018, 2019],
        versions: [
          { name: 'LT 1.4L MT', engine: '1.4L DOHC' },
          { name: 'LTZ 1.4L MT', engine: '1.4L DOHC' },
        ],
      },
    ];

    for (const mData of chevroletModels) {
      let model = await prisma.vehicleModel.findFirst({
        where: { makeId: chevrolet.id, name: mData.name },
      });
      if (!model) {
        model = await prisma.vehicleModel.create({
          data: { makeId: chevrolet.id, name: mData.name },
        });
        console.log(`  + Creado modelo ${chevrolet.name} ${mData.name}`);
      }
      for (const yr of mData.years) {
        let vYear = await prisma.vehicleYear.findFirst({
          where: { modelId: model.id, year: yr },
        });
        if (!vYear) {
          vYear = await prisma.vehicleYear.create({
            data: { modelId: model.id, year: yr },
          });
        }
        for (const ver of mData.versions) {
          const existingVer = await prisma.vehicleVersion.findFirst({
            where: { yearId: vYear.id, name: ver.name },
          });
          if (!existingVer) {
            await prisma.vehicleVersion.create({
              data: { yearId: vYear.id, name: ver.name, engine: ver.engine },
            });
          }
        }
      }
    }
  }

  // ==========================================
  // 3. MAZDA (Mazda 2, CX-30)
  // ==========================================
  let mazda = await prisma.vehicleMake.findFirst({ where: { name: 'Mazda' } });
  if (mazda) {
    const mazdaModels = [
      {
        name: 'Mazda 2',
        years: [2016, 2017, 2018, 2019, 2020, 2021, 2022],
        versions: [
          { name: 'Touring 1.5L', engine: '1.5L Skyactiv-G' },
          { name: 'Grand Touring 1.5L', engine: '1.5L Skyactiv-G' },
        ],
      },
    ];
    for (const mData of mazdaModels) {
      let model = await prisma.vehicleModel.findFirst({
        where: { makeId: mazda.id, name: mData.name },
      });
      if (!model) {
        model = await prisma.vehicleModel.create({
          data: { makeId: mazda.id, name: mData.name },
        });
      }
      for (const yr of mData.years) {
        let vYear = await prisma.vehicleYear.findFirst({
          where: { modelId: model.id, year: yr },
        });
        if (!vYear) {
          vYear = await prisma.vehicleYear.create({
            data: { modelId: model.id, year: yr },
          });
        }
        for (const ver of mData.versions) {
          const existingVer = await prisma.vehicleVersion.findFirst({
            where: { yearId: vYear.id, name: ver.name },
          });
          if (!existingVer) {
            await prisma.vehicleVersion.create({
              data: { yearId: vYear.id, name: ver.name, engine: ver.engine },
            });
          }
        }
      }
    }
  }

  // ==========================================
  // 4. VINCULAR LOS REPUESTOS DE CLIO A LAS VERSIONES DE CLIO
  // ==========================================
  console.log('🔗 Vinculando repuestos de Clio a las versiones creadas...');

  // Buscar el modelo Clio y todas sus versiones
  const clioModel = await prisma.vehicleModel.findFirst({
    where: { makeId: renault.id, name: 'Clio' },
    include: {
      years: {
        include: { versions: true },
      },
    },
  });

  if (clioModel) {
    const clioVersionIds = clioModel.years.flatMap((y: any) => y.versions.map((v: any) => v.id));
    console.log(`  Encontradas ${clioVersionIds.length} versiones de Renault Clio.`);

    // Buscar los repuestos de Clio
    const clioParts = await prisma.part.findMany({
      where: {
        OR: [
          { name: { contains: 'clio', mode: 'insensitive' } },
          { slug: { contains: 'clio', mode: 'insensitive' } },
          { description: { contains: 'clio', mode: 'insensitive' } },
        ],
      },
    });

    for (const part of clioParts) {
      console.log(`  - Asociando compatibilidad para: "${part.name}" (${part.id})`);
      for (const versionId of clioVersionIds) {
        const existingComp = await prisma.partCompatibility.findFirst({
          where: { partId: part.id, versionId },
        });
        if (!existingComp) {
          await prisma.partCompatibility.create({
            data: { partId: part.id, versionId },
          });
        }
      }
    }
  }

  console.log('✅ Catálogo vehicular y compatibilidades actualizadas exitosamente.');
}

main()
  .catch((e) => {
    console.error('Error enriqueciendo vehículos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
