import { PrismaClient, RoleType, PartCondition } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de datos...');

  // Limpiar datos existentes de forma segura para re-ejecución
  try {
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE 
        inventory, 
        part_compatibility, 
        part_numbers, 
        parts, 
        part_categories, 
        vehicle_versions, 
        vehicle_years, 
        vehicle_models, 
        vehicle_makes, 
        locations, 
        users, 
        stores 
      CASCADE;
    `);
  } catch (err) {
    console.log('Aviso al limpiar tablas:', err);
  }

  // ============ ROLES ============
  console.log('📋 Creando roles...');
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: RoleType.BUYER },
      update: {},
      create: { name: RoleType.BUYER, description: 'Comprador - busca y compara repuestos' },
    }),
    prisma.role.upsert({
      where: { name: RoleType.STORE_ADMIN },
      update: {},
      create: { name: RoleType.STORE_ADMIN, description: 'Administrador de almacén - gestiona inventario y sedes' },
    }),
    prisma.role.upsert({
      where: { name: RoleType.PLATFORM_ADMIN },
      update: {},
      create: { name: RoleType.PLATFORM_ADMIN, description: 'Administrador de plataforma - gestión total' },
    }),
  ]);

  // ============ USUARIOS DE PRUEBA ============
  console.log('👤 Creando usuarios...');
  const passwordHash = await bcrypt.hash('password123', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@repuestos.com' },
    update: {},
    create: {
      email: 'admin@repuestos.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'Plataforma',
      phone: '+573001000000',
    },
  });

  // Asignar rol admin
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: roles[2].id } },
    update: {},
    create: { userId: adminUser.id, roleId: roles[2].id },
  });

  // ============ ALMACENES Y SEDES ============
  console.log('🏪 Creando almacenes y sedes...');

  const store1 = await prisma.store.upsert({
    where: { nit: '900111222-1' },
    update: {},
    create: {
      name: 'Repuestos El Motor',
      nit: '900111222-1',
      phone: '+573002001000',
      email: 'contacto@elmotor.com',
    },
  });

  const store2 = await prisma.store.upsert({
    where: { nit: '900333444-2' },
    update: {},
    create: {
      name: 'AutoPartes Colombia',
      nit: '900333444-2',
      phone: '+573003002000',
      email: 'ventas@autopartescol.com',
    },
  });

  const store3 = await prisma.store.upsert({
    where: { nit: '900555666-3' },
    update: {},
    create: {
      name: 'Distribuidora JR Parts',
      nit: '900555666-3',
      phone: '+573004003000',
      email: 'info@jrparts.co',
    },
  });

  // Crear usuarios administradores de almacén
  const storeAdmin1 = await prisma.user.upsert({
    where: { email: 'jorge@elmotor.com' },
    update: {},
    create: {
      email: 'jorge@elmotor.com',
      passwordHash,
      firstName: 'Jorge',
      lastName: 'Martínez',
      phone: '+573002001001',
      storeId: store1.id,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: storeAdmin1.id, roleId: roles[1].id } },
    update: {},
    create: { userId: storeAdmin1.id, roleId: roles[1].id },
  });

  const storeAdmin2 = await prisma.user.upsert({
    where: { email: 'camila@autopartescol.com' },
    update: {},
    create: {
      email: 'camila@autopartescol.com',
      passwordHash,
      firstName: 'Camila',
      lastName: 'Rodríguez',
      phone: '+573003002001',
      storeId: store2.id,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: storeAdmin2.id, roleId: roles[1].id } },
    update: {},
    create: { userId: storeAdmin2.id, roleId: roles[1].id },
  });

  // Comprador de prueba
  const buyer = await prisma.user.upsert({
    where: { email: 'andres@gmail.com' },
    update: {},
    create: {
      email: 'andres@gmail.com',
      passwordHash,
      firstName: 'Andrés',
      lastName: 'López',
      phone: '+573005004000',
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: buyer.id, roleId: roles[0].id } },
    update: {},
    create: { userId: buyer.id, roleId: roles[0].id },
  });

  // Sedes en Pasto, Nariño
  const loc1a = await prisma.location.create({
    data: {
      storeId: store1.id, name: 'Sede Julián Bucheli',
      address: 'Carrera 19 #14-35, Barrio Julián Bucheli', city: 'Pasto', state: 'Nariño',
      latitude: 1.2084, longitude: -77.2765,
      phone: '+576027234510', whatsapp: '+573002001002',
    },
  });

  const loc1b = await prisma.location.create({
    data: {
      storeId: store1.id, name: 'Bodega Parque Bolívar',
      address: 'Calle 18 #19-52, Sector Parque Bolívar', city: 'Pasto', state: 'Nariño',
      latitude: 1.2112, longitude: -77.2740,
      phone: '+576027228910', whatsapp: '+573002001003',
    },
  });

  const loc2 = await prisma.location.create({
    data: {
      storeId: store2.id, name: 'Sede Av. Panamericana',
      address: 'Av. Panamericana Km 2 #28-15, Pandiaco', city: 'Pasto', state: 'Nariño',
      latitude: 1.2248, longitude: -77.2882,
      phone: '+576027314400', whatsapp: '+573003002002',
    },
  });

  const loc3 = await prisma.location.create({
    data: {
      storeId: store3.id, name: 'Centro de Distribución Sur',
      address: 'Av. Idema #12-80, Sector Potrerillo', city: 'Pasto', state: 'Nariño',
      latitude: 1.1985, longitude: -77.2720,
      phone: '+576027291820', whatsapp: '+573004003001',
    },
  });

  // ============ CATÁLOGO VEHICULAR ============
  console.log('🚗 Creando catálogo de vehículos...');

  // Toyota
  const toyota = await prisma.vehicleMake.create({ data: { name: 'Toyota' } });
  const corolla = await prisma.vehicleModel.create({ data: { makeId: toyota.id, name: 'Corolla' } });
  const hilux = await prisma.vehicleModel.create({ data: { makeId: toyota.id, name: 'Hilux' } });
  const rav4 = await prisma.vehicleModel.create({ data: { makeId: toyota.id, name: 'RAV4' } });

  const corollaYears = await Promise.all(
    [2019, 2020, 2021, 2022, 2023].map(year =>
      prisma.vehicleYear.create({ data: { modelId: corolla.id, year } })
    )
  );

  const hiluxYears = await Promise.all(
    [2020, 2021, 2022, 2023].map(year =>
      prisma.vehicleYear.create({ data: { modelId: hilux.id, year } })
    )
  );

  const corollaVersions = await Promise.all([
    prisma.vehicleVersion.create({ data: { yearId: corollaYears[2].id, name: 'LE 1.8L', engine: '1.8L 4-cyl' } }),
    prisma.vehicleVersion.create({ data: { yearId: corollaYears[2].id, name: 'SE 2.0L', engine: '2.0L 4-cyl' } }),
    prisma.vehicleVersion.create({ data: { yearId: corollaYears[3].id, name: 'LE 1.8L', engine: '1.8L 4-cyl' } }),
    prisma.vehicleVersion.create({ data: { yearId: corollaYears[3].id, name: 'XLE 2.0L', engine: '2.0L 4-cyl' } }),
    prisma.vehicleVersion.create({ data: { yearId: corollaYears[4].id, name: 'SE 2.0L', engine: '2.0L 4-cyl' } }),
  ]);

  const hiluxVersions = await Promise.all([
    prisma.vehicleVersion.create({ data: { yearId: hiluxYears[1].id, name: '2.4L Diesel MT', engine: '2.4L Diesel' } }),
    prisma.vehicleVersion.create({ data: { yearId: hiluxYears[2].id, name: '2.8L Diesel AT', engine: '2.8L Diesel' } }),
  ]);

  // Chevrolet
  const chevrolet = await prisma.vehicleMake.create({ data: { name: 'Chevrolet' } });
  const spark = await prisma.vehicleModel.create({ data: { makeId: chevrolet.id, name: 'Spark' } });
  const onix = await prisma.vehicleModel.create({ data: { makeId: chevrolet.id, name: 'Onix' } });
  const tracker = await prisma.vehicleModel.create({ data: { makeId: chevrolet.id, name: 'Tracker' } });

  const sparkYears = await Promise.all(
    [2019, 2020, 2021, 2022].map(year =>
      prisma.vehicleYear.create({ data: { modelId: spark.id, year } })
    )
  );

  const sparkVersions = await Promise.all([
    prisma.vehicleVersion.create({ data: { yearId: sparkYears[1].id, name: 'GT 1.4L MT', engine: '1.4L 4-cyl' } }),
    prisma.vehicleVersion.create({ data: { yearId: sparkYears[2].id, name: 'GT 1.4L MT', engine: '1.4L 4-cyl' } }),
    prisma.vehicleVersion.create({ data: { yearId: sparkYears[2].id, name: 'Premier 1.4L AT', engine: '1.4L 4-cyl' } }),
  ]);

  const onixYears = await Promise.all(
    [2021, 2022, 2023].map(year =>
      prisma.vehicleYear.create({ data: { modelId: onix.id, year } })
    )
  );

  const onixVersions = await Promise.all([
    prisma.vehicleVersion.create({ data: { yearId: onixYears[0].id, name: 'LT 1.0T', engine: '1.0L Turbo' } }),
    prisma.vehicleVersion.create({ data: { yearId: onixYears[1].id, name: 'Premier 1.0T', engine: '1.0L Turbo' } }),
  ]);

  // Renault
  const renault = await prisma.vehicleMake.create({ data: { name: 'Renault' } });
  const logan = await prisma.vehicleModel.create({ data: { makeId: renault.id, name: 'Logan' } });
  const duster = await prisma.vehicleModel.create({ data: { makeId: renault.id, name: 'Duster' } });

  const loganYears = await Promise.all(
    [2020, 2021, 2022].map(year =>
      prisma.vehicleYear.create({ data: { modelId: logan.id, year } })
    )
  );

  const loganVersions = await Promise.all([
    prisma.vehicleVersion.create({ data: { yearId: loganYears[1].id, name: 'Life 1.6L', engine: '1.6L 4-cyl' } }),
    prisma.vehicleVersion.create({ data: { yearId: loganYears[2].id, name: 'Intens 1.6L', engine: '1.6L 4-cyl' } }),
  ]);

  // Mazda
  const mazda = await prisma.vehicleMake.create({ data: { name: 'Mazda' } });
  const mazda3 = await prisma.vehicleModel.create({ data: { makeId: mazda.id, name: 'Mazda 3' } });
  const cx5 = await prisma.vehicleModel.create({ data: { makeId: mazda.id, name: 'CX-5' } });

  const mazda3Years = await Promise.all(
    [2020, 2021, 2022, 2023].map(year =>
      prisma.vehicleYear.create({ data: { modelId: mazda3.id, year } })
    )
  );

  const mazda3Versions = await Promise.all([
    prisma.vehicleVersion.create({ data: { yearId: mazda3Years[1].id, name: 'Touring 2.0L', engine: '2.0L Skyactiv-G' } }),
    prisma.vehicleVersion.create({ data: { yearId: mazda3Years[2].id, name: 'Grand Touring 2.5L', engine: '2.5L Skyactiv-G' } }),
  ]);

  // Kia
  const kia = await prisma.vehicleMake.create({ data: { name: 'Kia' } });
  const picanto = await prisma.vehicleModel.create({ data: { makeId: kia.id, name: 'Picanto' } });
  const sportage = await prisma.vehicleModel.create({ data: { makeId: kia.id, name: 'Sportage' } });

  const picantoYears = await Promise.all(
    [2020, 2021, 2022].map(year =>
      prisma.vehicleYear.create({ data: { modelId: picanto.id, year } })
    )
  );

  const picantoVersions = await Promise.all([
    prisma.vehicleVersion.create({ data: { yearId: picantoYears[1].id, name: 'EX 1.0L', engine: '1.0L 3-cyl' } }),
    prisma.vehicleVersion.create({ data: { yearId: picantoYears[2].id, name: 'EX+ 1.2L', engine: '1.2L 4-cyl' } }),
  ]);

  // ============ CATEGORÍAS DE REPUESTOS ============
  console.log('📦 Creando categorías de repuestos...');

  const catFrenos = await prisma.partCategory.create({
    data: { name: 'Frenos', slug: 'frenos', description: 'Sistema de frenado' },
  });
  const catMotor = await prisma.partCategory.create({
    data: { name: 'Motor', slug: 'motor', description: 'Componentes del motor' },
  });
  const catSuspension = await prisma.partCategory.create({
    data: { name: 'Suspensión', slug: 'suspension', description: 'Sistema de suspensión' },
  });
  const catElectrico = await prisma.partCategory.create({
    data: { name: 'Eléctrico', slug: 'electrico', description: 'Sistema eléctrico y electrónico' },
  });
  const catFiltros = await prisma.partCategory.create({
    data: { name: 'Filtros', slug: 'filtros', description: 'Filtros de aire, aceite, combustible' },
  });
  const catTransmision = await prisma.partCategory.create({
    data: { name: 'Transmisión', slug: 'transmision', description: 'Sistema de transmisión y embrague' },
  });
  const catRefrigeracion = await prisma.partCategory.create({
    data: { name: 'Refrigeración', slug: 'refrigeracion', description: 'Sistema de enfriamiento del motor' },
  });
  const catCarroceria = await prisma.partCategory.create({
    data: { name: 'Carrocería', slug: 'carroceria', description: 'Partes exteriores y de carrocería' },
  });

  // ============ REPUESTOS ============
  console.log('🔧 Creando repuestos...');

  const parts = await Promise.all([
    // Frenos
    prisma.part.create({
      data: {
        categoryId: catFrenos.id,
        name: 'Pastillas de freno delanteras',
        slug: 'pastillas-freno-delanteras-ceramicas',
        description: 'Pastillas de freno cerámicas de alto rendimiento con indicador de desgaste integrado',
        brand: 'Brembo',
        weight: 0.8,
      },
    }),
    prisma.part.create({
      data: {
        categoryId: catFrenos.id,
        name: 'Discos de freno ventilados',
        slug: 'discos-freno-ventilados-delanteros',
        description: 'Discos de freno ventilados para eje delantero, mayor disipación de calor',
        brand: 'Bosch',
        weight: 5.2,
      },
    }),
    prisma.part.create({
      data: {
        categoryId: catFrenos.id,
        name: 'Pastillas de freno traseras',
        slug: 'pastillas-freno-traseras',
        description: 'Pastillas de freno semimetálicas para eje trasero',
        brand: 'TRW',
        weight: 0.6,
      },
    }),
    // Motor
    prisma.part.create({
      data: {
        categoryId: catMotor.id,
        name: 'Bujías de encendido Iridium',
        slug: 'bujias-encendido-iridium',
        description: 'Bujías de iridio de larga duración, mejor rendimiento y menor consumo',
        brand: 'NGK',
        weight: 0.1,
      },
    }),
    prisma.part.create({
      data: {
        categoryId: catMotor.id,
        name: 'Correa de distribución',
        slug: 'correa-distribucion-kit',
        description: 'Kit completo de correa de distribución con tensor y polea guía',
        brand: 'Gates',
        weight: 1.2,
      },
    }),
    prisma.part.create({
      data: {
        categoryId: catMotor.id,
        name: 'Bomba de aceite',
        slug: 'bomba-aceite-motor',
        description: 'Bomba de aceite de reemplazo directo para motor',
        brand: 'Aisin',
        weight: 2.5,
      },
    }),
    // Suspensión
    prisma.part.create({
      data: {
        categoryId: catSuspension.id,
        name: 'Amortiguadores delanteros (par)',
        slug: 'amortiguadores-delanteros-par',
        description: 'Par de amortiguadores de gas para eje delantero, conducción suave',
        brand: 'Monroe',
        weight: 6.0,
      },
    }),
    prisma.part.create({
      data: {
        categoryId: catSuspension.id,
        name: 'Terminal de dirección',
        slug: 'terminal-direccion',
        description: 'Terminal de dirección exterior, acero forjado de alta resistencia',
        brand: 'Moog',
        weight: 0.4,
      },
    }),
    // Eléctrico
    prisma.part.create({
      data: {
        categoryId: catElectrico.id,
        name: 'Alternador',
        slug: 'alternador-remanufacturado',
        description: 'Alternador remanufacturado con garantía, amperage original',
        brand: 'Denso',
        weight: 4.5,
      },
    }),
    prisma.part.create({
      data: {
        categoryId: catElectrico.id,
        name: 'Batería 12V 60Ah',
        slug: 'bateria-12v-60ah',
        description: 'Batería libre de mantenimiento, tecnología AGM',
        brand: 'MAC',
        weight: 15.0,
      },
    }),
    // Filtros
    prisma.part.create({
      data: {
        categoryId: catFiltros.id,
        name: 'Filtro de aceite',
        slug: 'filtro-aceite-motor',
        description: 'Filtro de aceite de alta eficiencia, retención 99%',
        brand: 'Mann-Filter',
        weight: 0.3,
      },
    }),
    prisma.part.create({
      data: {
        categoryId: catFiltros.id,
        name: 'Filtro de aire motor',
        slug: 'filtro-aire-motor',
        description: 'Filtro de aire de panel, flujo optimizado para máximo rendimiento',
        brand: 'K&N',
        weight: 0.4,
      },
    }),
    // Refrigeración
    prisma.part.create({
      data: {
        categoryId: catRefrigeracion.id,
        name: 'Radiador principal',
        slug: 'radiador-principal-aluminio',
        description: 'Radiador de aluminio de alto rendimiento, transmisión manual y automática',
        brand: 'Denso',
        weight: 4.0,
      },
    }),
    prisma.part.create({
      data: {
        categoryId: catRefrigeracion.id,
        name: 'Termostato',
        slug: 'termostato-motor',
        description: 'Termostato de apertura controlada, incluye empaque',
        brand: 'Gates',
        weight: 0.2,
      },
    }),
    // Transmisión
    prisma.part.create({
      data: {
        categoryId: catTransmision.id,
        name: 'Kit de embrague completo',
        slug: 'kit-embrague-completo',
        description: 'Kit de embrague: disco, prensa y rodamiento de empuje',
        brand: 'Valeo',
        weight: 5.5,
      },
    }),
  ]);

  // ============ NÚMEROS DE PARTE ============
  console.log('🔢 Creando números de parte...');

  const partNumberData = [
    { partId: parts[0].id, number: '04465-02220', type: 'OEM' },
    { partId: parts[0].id, number: 'P83024N', type: 'AFTERMARKET' },
    { partId: parts[1].id, number: '43512-02330', type: 'OEM' },
    { partId: parts[1].id, number: 'BD126363', type: 'AFTERMARKET' },
    { partId: parts[2].id, number: '04466-02260', type: 'OEM' },
    { partId: parts[3].id, number: '90919-01253', type: 'OEM' },
    { partId: parts[3].id, number: 'ILKAR7B11', type: 'AFTERMARKET' },
    { partId: parts[4].id, number: '13568-09130', type: 'OEM' },
    { partId: parts[4].id, number: 'T327', type: 'AFTERMARKET' },
    { partId: parts[5].id, number: '15100-37030', type: 'OEM' },
    { partId: parts[6].id, number: '48510-80566', type: 'OEM' },
    { partId: parts[7].id, number: '45046-09620', type: 'OEM' },
    { partId: parts[8].id, number: '27060-0T140', type: 'OEM' },
    { partId: parts[9].id, number: 'MAC-34-60', type: 'AFTERMARKET' },
    { partId: parts[10].id, number: '04152-YZZA1', type: 'OEM' },
    { partId: parts[10].id, number: 'W712/83', type: 'AFTERMARKET' },
    { partId: parts[11].id, number: '17801-21060', type: 'OEM' },
    { partId: parts[12].id, number: '16400-21270', type: 'OEM' },
    { partId: parts[13].id, number: '90916-03133', type: 'OEM' },
    { partId: parts[14].id, number: '31250-12552', type: 'OEM' },
    { partId: parts[14].id, number: '826928', type: 'AFTERMARKET' },
  ];

  await prisma.partNumber.createMany({ data: partNumberData, skipDuplicates: true });

  // ============ COMPATIBILIDAD ============
  console.log('🔗 Creando compatibilidades...');

  const allVersions = [...corollaVersions, ...hiluxVersions, ...sparkVersions, ...onixVersions, ...loganVersions, ...mazda3Versions, ...picantoVersions];

  // Pastillas de freno delanteras — compatible con Toyota Corolla y Mazda 3
  for (const v of [...corollaVersions, ...mazda3Versions]) {
    await prisma.partCompatibility.create({
      data: { partId: parts[0].id, versionId: v.id },
    }).catch(() => {});
  }

  // Discos de freno — compatible con Corolla
  for (const v of corollaVersions) {
    await prisma.partCompatibility.create({
      data: { partId: parts[1].id, versionId: v.id },
    }).catch(() => {});
  }

  // Pastillas traseras — Spark y Onix
  for (const v of [...sparkVersions, ...onixVersions]) {
    await prisma.partCompatibility.create({
      data: { partId: parts[2].id, versionId: v.id },
    }).catch(() => {});
  }

  // Bujías — todos los vehículos
  for (const v of allVersions) {
    await prisma.partCompatibility.create({
      data: { partId: parts[3].id, versionId: v.id },
    }).catch(() => {});
  }

  // Correa distribución — Corolla y Logan
  for (const v of [...corollaVersions, ...loganVersions]) {
    await prisma.partCompatibility.create({
      data: { partId: parts[4].id, versionId: v.id },
    }).catch(() => {});
  }

  // Bomba de aceite — Hilux
  for (const v of hiluxVersions) {
    await prisma.partCompatibility.create({
      data: { partId: parts[5].id, versionId: v.id },
    }).catch(() => {});
  }

  // Amortiguadores — Spark, Picanto
  for (const v of [...sparkVersions, ...picantoVersions]) {
    await prisma.partCompatibility.create({
      data: { partId: parts[6].id, versionId: v.id },
    }).catch(() => {});
  }

  // Terminal dirección — Corolla, Logan
  for (const v of [...corollaVersions, ...loganVersions]) {
    await prisma.partCompatibility.create({
      data: { partId: parts[7].id, versionId: v.id },
    }).catch(() => {});
  }

  // Alternador — Corolla
  for (const v of corollaVersions) {
    await prisma.partCompatibility.create({
      data: { partId: parts[8].id, versionId: v.id },
    }).catch(() => {});
  }

  // Batería — universal (todos)
  for (const v of allVersions) {
    await prisma.partCompatibility.create({
      data: { partId: parts[9].id, versionId: v.id },
    }).catch(() => {});
  }

  // Filtro aceite — Corolla, Hilux
  for (const v of [...corollaVersions, ...hiluxVersions]) {
    await prisma.partCompatibility.create({
      data: { partId: parts[10].id, versionId: v.id },
    }).catch(() => {});
  }

  // Filtro aire — Corolla, Mazda 3
  for (const v of [...corollaVersions, ...mazda3Versions]) {
    await prisma.partCompatibility.create({
      data: { partId: parts[11].id, versionId: v.id },
    }).catch(() => {});
  }

  // Radiador — Corolla
  for (const v of corollaVersions) {
    await prisma.partCompatibility.create({
      data: { partId: parts[12].id, versionId: v.id },
    }).catch(() => {});
  }

  // Termostato — Corolla, Spark
  for (const v of [...corollaVersions, ...sparkVersions]) {
    await prisma.partCompatibility.create({
      data: { partId: parts[13].id, versionId: v.id },
    }).catch(() => {});
  }

  // Kit embrague — Spark, Logan, Picanto
  for (const v of [...sparkVersions, ...loganVersions, ...picantoVersions]) {
    await prisma.partCompatibility.create({
      data: { partId: parts[14].id, versionId: v.id },
    }).catch(() => {});
  }

  // ============ INVENTARIO ============
  console.log('📊 Creando inventario...');

  const inventoryData = [
    // Sede Norte - El Motor
    { partId: parts[0].id, locationId: loc1a.id, price: 85000, stock: 12, condition: PartCondition.NEW },
    { partId: parts[1].id, locationId: loc1a.id, price: 195000, stock: 4, condition: PartCondition.NEW },
    { partId: parts[3].id, locationId: loc1a.id, price: 18000, stock: 50, condition: PartCondition.NEW },
    { partId: parts[6].id, locationId: loc1a.id, price: 320000, stock: 3, condition: PartCondition.NEW },
    { partId: parts[9].id, locationId: loc1a.id, price: 380000, stock: 8, condition: PartCondition.NEW },
    { partId: parts[10].id, locationId: loc1a.id, price: 22000, stock: 30, condition: PartCondition.NEW },
    { partId: parts[11].id, locationId: loc1a.id, price: 35000, stock: 20, condition: PartCondition.NEW },
    { partId: parts[12].id, locationId: loc1a.id, price: 450000, stock: 2, condition: PartCondition.NEW },
    { partId: parts[13].id, locationId: loc1a.id, price: 42000, stock: 15, condition: PartCondition.NEW },

    // Bodega Sur - El Motor
    { partId: parts[0].id, locationId: loc1b.id, price: 82000, stock: 20, condition: PartCondition.NEW },
    { partId: parts[4].id, locationId: loc1b.id, price: 250000, stock: 5, condition: PartCondition.NEW },
    { partId: parts[5].id, locationId: loc1b.id, price: 380000, stock: 2, condition: PartCondition.NEW },
    { partId: parts[7].id, locationId: loc1b.id, price: 65000, stock: 10, condition: PartCondition.NEW },
    { partId: parts[14].id, locationId: loc1b.id, price: 420000, stock: 3, condition: PartCondition.NEW },

    // AutoPartes Colombia
    { partId: parts[0].id, locationId: loc2.id, price: 78000, stock: 8, condition: PartCondition.NEW },
    { partId: parts[0].id, locationId: loc2.id, price: 55000, stock: 5, condition: PartCondition.USED },
    { partId: parts[1].id, locationId: loc2.id, price: 185000, stock: 6, condition: PartCondition.NEW },
    { partId: parts[2].id, locationId: loc2.id, price: 62000, stock: 10, condition: PartCondition.NEW },
    { partId: parts[3].id, locationId: loc2.id, price: 16500, stock: 80, condition: PartCondition.NEW },
    { partId: parts[6].id, locationId: loc2.id, price: 290000, stock: 4, condition: PartCondition.NEW },
    { partId: parts[8].id, locationId: loc2.id, price: 520000, stock: 2, condition: PartCondition.REFURBISHED },
    { partId: parts[9].id, locationId: loc2.id, price: 350000, stock: 15, condition: PartCondition.NEW },
    { partId: parts[12].id, locationId: loc2.id, price: 420000, stock: 3, condition: PartCondition.NEW },

    // JR Parts
    { partId: parts[1].id, locationId: loc3.id, price: 175000, stock: 10, condition: PartCondition.NEW },
    { partId: parts[3].id, locationId: loc3.id, price: 15000, stock: 100, condition: PartCondition.NEW },
    { partId: parts[4].id, locationId: loc3.id, price: 230000, stock: 8, condition: PartCondition.NEW },
    { partId: parts[5].id, locationId: loc3.id, price: 350000, stock: 3, condition: PartCondition.NEW },
    { partId: parts[7].id, locationId: loc3.id, price: 58000, stock: 15, condition: PartCondition.NEW },
    { partId: parts[8].id, locationId: loc3.id, price: 480000, stock: 1, condition: PartCondition.REFURBISHED },
    { partId: parts[10].id, locationId: loc3.id, price: 19500, stock: 45, condition: PartCondition.NEW },
    { partId: parts[11].id, locationId: loc3.id, price: 32000, stock: 25, condition: PartCondition.NEW },
    { partId: parts[13].id, locationId: loc3.id, price: 38000, stock: 20, condition: PartCondition.NEW },
    { partId: parts[14].id, locationId: loc3.id, price: 390000, stock: 5, condition: PartCondition.NEW },
  ];

  for (const inv of inventoryData) {
    await prisma.inventory.create({ data: inv }).catch(() => {});
  }

  console.log('✅ Seed completado exitosamente!');
  console.log('');
  console.log('📌 Usuarios de prueba:');
  console.log('   Admin:    admin@repuestos.com / password123');
  console.log('   Almacén:  jorge@elmotor.com / password123');
  console.log('   Almacén:  camila@autopartescol.com / password123');
  console.log('   Comprador: andres@gmail.com / password123');
  console.log('');
  console.log(`📦 ${parts.length} repuestos creados con compatibilidad y stock`);
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
