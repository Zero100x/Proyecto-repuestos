import { PrismaClient, ReservationStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📦 Creando reservas de prueba para Click & Collect...');

  const store = await prisma.store.findFirst({
    where: { name: { contains: 'Motor', mode: 'insensitive' } },
    include: {
      locations: true,
    },
  });

  if (!store || store.locations.length === 0) {
    console.log('No se encontró el almacén El Motor o no tiene sedes.');
    return;
  }

  const locationNorte = store.locations.find((l) => l.name.includes('Norte')) || store.locations[0];
  const locationSur = store.locations.find((l) => l.name.includes('Sur')) || store.locations[0];

  const clioPart = await prisma.part.findFirst({
    where: { name: { contains: 'clio', mode: 'insensitive' } },
    include: { inventory: true },
  });

  const corollaPart = await prisma.part.findFirst({
    where: { name: { contains: 'freno', mode: 'insensitive' } },
    include: { inventory: true },
  });

  if (!clioPart) {
    console.log('No se encontraron repuestos para asociar reservas.');
    return;
  }

  // 1. Reserva Pendiente 1
  await prisma.reservation.upsert({
    where: { code: 'RES-4821-BOG' },
    update: {},
    create: {
      code: 'RES-4821-BOG',
      storeId: store.id,
      locationId: locationNorte.id,
      partId: clioPart.id,
      inventoryId: clioPart.inventory[0]?.id || null,
      customerName: 'Carlos Mario Gómez (Taller El Rayo)',
      customerPhone: '3001234567',
      customerEmail: 'carlos@elrayotaller.com',
      customerDocument: '1018293847',
      quantity: 1,
      unitPrice: 40000,
      totalPrice: 40000,
      status: ReservationStatus.PENDING,
      notes: 'Pasa en la tarde a retirar para instalar en Clio 2012',
      expiresAt: new Date(Date.now() + 36 * 60 * 60 * 1000), // Vence en 36h
    },
  });

  // 2. Reserva Pendiente Próxima a vencer (< 8h)
  await prisma.reservation.upsert({
    where: { code: 'RES-9182-BOG' },
    update: {},
    create: {
      code: 'RES-9182-BOG',
      storeId: store.id,
      locationId: locationNorte.id,
      partId: clioPart.id,
      inventoryId: clioPart.inventory[0]?.id || null,
      customerName: 'Laura Marcela Pinzón',
      customerPhone: '3159876543',
      customerEmail: 'laura.pinzon@gmail.com',
      customerDocument: '52938471',
      quantity: 2,
      unitPrice: 40000,
      totalPrice: 80000,
      status: ReservationStatus.PENDING,
      notes: 'Cliente llamó para confirmar que retira antes del mediodía',
      expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000), // Vence en 6 horas
    },
  });

  // 3. Reserva Entregada / Completada
  await prisma.reservation.upsert({
    where: { code: 'RES-1045-BOG' },
    update: {},
    create: {
      code: 'RES-1045-BOG',
      storeId: store.id,
      locationId: locationSur.id,
      partId: clioPart.id,
      inventoryId: clioPart.inventory[0]?.id || null,
      customerName: 'Andrés Felipe Morales',
      customerPhone: '3105559876',
      customerEmail: 'andres.morales@taller.co',
      customerDocument: '80938472',
      quantity: 1,
      unitPrice: 40000,
      totalPrice: 40000,
      status: ReservationStatus.COMPLETED,
      notes: 'Entregado en mostrador. Pagó con datáfono voucher #8921',
      expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      deliveredAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      deliveredBy: 'Jorge Martínez (Asesor)',
    },
  });

  console.log('✅ Reservas de prueba creadas exitosamente.');
}

main()
  .catch((e) => {
    console.error('Error sembrando reservas:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
