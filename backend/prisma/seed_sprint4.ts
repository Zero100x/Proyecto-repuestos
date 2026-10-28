import { PrismaClient, LeadStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Seeding Sprint 4: Leads, Preguntas Técnicas y Demanda Insatisfecha...');

  const store1 = await prisma.store.findFirst({ where: { name: 'Repuestos El Motor' } });
  if (!store1) {
    console.log('Store 1 no encontrado');
    return;
  }

  const parts = await prisma.part.findMany({ take: 6 });
  const locations = await prisma.location.findMany({ where: { storeId: store1.id } });

  if (parts.length === 0 || locations.length === 0) {
    console.log('Partes o locaciones no encontradas');
    return;
  }

  // 1. Leads de prueba
  console.log('📋 Creando leads para Repuestos El Motor...');
  const sampleLeads = [
    {
      storeId: store1.id,
      locationId: locations[0]?.id,
      partId: parts[0].id,
      buyerName: 'Taller Mecánico Automotriz El Sol',
      buyerPhone: '+573105559871',
      buyerCity: 'Bogotá',
      buyerMessage: '¿Tienen 2 juegos de pastillas para entrega hoy mismo en Calle 170?',
      quotedPrice: 85000,
      sourceUrl: `/parts/${parts[0].slug}`,
      status: LeadStatus.NEW,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // hace 2 horas
    },
    {
      storeId: store1.id,
      locationId: locations[0]?.id,
      partId: parts[1].id,
      buyerName: 'Carlos Mario Pineda',
      buyerPhone: '+573158884321',
      buyerCity: 'Bogotá',
      buyerMessage: 'Hola, ¿los discos vienen balanceados y listos para montar?',
      quotedPrice: 180000,
      sourceUrl: `/parts/${parts[1].slug}`,
      status: LeadStatus.CONTACTED,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // ayer
    },
    {
      storeId: store1.id,
      locationId: locations[1]?.id || locations[0]?.id,
      partId: parts[2].id,
      buyerName: 'Frenos & Embragues del Norte',
      buyerPhone: '+573204441122',
      buyerCity: 'Bogotá',
      buyerMessage: 'Cotización por 4 unidades con factura electrónica para empresa.',
      quotedPrice: 45000,
      sourceUrl: `/parts/${parts[2].slug}`,
      status: LeadStatus.CONVERTED,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // hace 3 días
    },
    {
      storeId: store1.id,
      locationId: locations[0]?.id,
      partId: parts[3]?.id || parts[0].id,
      buyerName: 'Distribuidora AutoFrenos S.A.S',
      buyerPhone: '+573012229988',
      buyerCity: 'Chía',
      buyerMessage: '¿Tienen cobertura de envío para entrega en Chía mañana temprano?',
      quotedPrice: 65000,
      sourceUrl: `/parts/${parts[0].slug}`,
      status: LeadStatus.CONTACTED,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      storeId: store1.id,
      locationId: locations[1]?.id || locations[0]?.id,
      partId: parts[0].id,
      buyerName: 'Serviteca Los Andes',
      buyerPhone: '+573129993344',
      buyerCity: 'Bogotá',
      buyerMessage: 'Cliente esperando en taller. ¿Disponibilidad inmediata en sede sur?',
      quotedPrice: 85000,
      sourceUrl: `/parts/${parts[0].slug}`,
      status: LeadStatus.CONVERTED,
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const lead of sampleLeads) {
    await prisma.lead.create({ data: lead });
  }

  // 2. Preguntas técnicas de prueba (PDCIRA-17)
  console.log('💬 Creando preguntas técnicas en fichas de repuestos...');
  const sampleQuestions = [
    {
      partId: parts[0].id,
      authorName: 'Ing. Taller MotorTech',
      question: '¿Estas pastillas son de compuesto cerámico o semimetálico? ¿Generan chillido?',
      answer: 'Son de formulación 100% cerámica de alta resistencia térmica (hasta 650°C) con láminas antirruido vulcanizadas. Garantizadas sin chillido.',
      answeredBy: 'Jorge Martínez (Asesor Técnico El Motor)',
      answeredAt: new Date(),
    },
    {
      partId: parts[0].id,
      authorName: 'Andrés López',
      question: '¿Aplica para el modelo con frenos ABS o solo estándar?',
      answer: null, // Pendiente de respuesta
      answeredBy: null,
      answeredAt: null,
    },
    {
      partId: parts[1]?.id || parts[0].id,
      authorName: 'Mecánica Rápida Express',
      question: '¿El precio publicado es por la unidad o por el par de discos delanteros?',
      answer: 'El precio es por el par (juego de 2 discos) en caja original con balanceo computarizado.',
      answeredBy: 'Jorge Martínez (Asesor Técnico El Motor)',
      answeredAt: new Date(),
    },
  ];

  for (const q of sampleQuestions) {
    await prisma.partQuestion.create({ data: q });
  }

  // 3. Demanda insatisfecha / Consultas de búsqueda (PDCIRA-16)
  console.log('🔍 Creando registros de búsquedas para analítica de demanda...');
  const sampleSearches = [
    { query: 'amortiguadores mazda cx-5 2021', resultsCount: 0, city: 'Bogotá' },
    { query: 'amortiguadores mazda cx-5 2021', resultsCount: 0, city: 'Bogotá' },
    { query: 'amortiguadores mazda cx-5 2021', resultsCount: 0, city: 'Bogotá' },
    { query: 'kit embrague d-max 3.0 diesel', resultsCount: 0, city: 'Bogotá' },
    { query: 'kit embrague d-max 3.0 diesel', resultsCount: 0, city: 'Bogotá' },
    { query: 'sensor oxigeno renault duster 2.0', resultsCount: 0, city: 'Medellín' },
    { query: 'sensor oxigeno renault duster 2.0', resultsCount: 0, city: 'Bogotá' },
    { query: 'cremallera direccion hyundai tucson', resultsCount: 0, city: 'Cali' },
    { query: 'pastillas de freno clio 2', resultsCount: 5, city: 'Bogotá' },
  ];

  for (const s of sampleSearches) {
    await prisma.searchQuery.create({ data: s });
  }

  console.log('✅ Seed Sprint 4 terminado con éxito!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
