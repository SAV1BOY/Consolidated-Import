/**
 * Seed script for ILUMINAR Import Management System
 *
 * Populates the database with the initial consolidation data
 * from the RAW array in dashboard_v2.jsx (101 items, 16 suppliers).
 *
 * Usage: npx prisma db seed
 * Requires: DATABASE_URL environment variable
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Exchange rate from the first consolidation
const EXCHANGE_RATE = 5.3232;

// RAW data extracted from dashboard_v2.jsx (first 14 items with purchase suggestions)
const SEED_ITEMS = [
  { c: 240570, f: 'BO GLASS INDUSTRIAL LIMITED', d: 'VIDRO ICE PEQUENO', ef: 141, ed: 136, mm: 4, de: 34, s: 0, cf: 25, tf: 0, tb: 0, tn: 0 },
  { c: 161379, f: 'DARKOO', d: 'HOLDE 6 FOCOS + OPTICA 36 MULTIPOINT BRANCO', ef: 82, ed: 72, mm: 22, de: 3.27, s: 100, cf: 1.25, tf: 125, tb: 665.4, tn: 1330.8 },
  { c: 142189, f: 'DARKOO', d: 'HOLDE 6 FOCOS + OPTICA 36 MULTIPOINT PRETO', ef: 293, ed: 258, mm: 15, de: 17.2, s: 220, cf: 0.9, tf: 198, tb: 1054, tn: 2107.99 },
  { c: 142186, f: 'DARKOO', d: 'Optica 25 graus iLed 200 / iLed 100', ef: 1051, ed: 1048, mm: 35, de: 29.94, s: 400, cf: 0.16, tf: 64, tb: 340.68, tn: 681.37 },
  { c: 266668, f: 'GREEN POWER', d: 'Driver 24W 24V', ef: 0, ed: 0, mm: 0, de: 0, s: 75, cf: 2.45, tf: 183.75, tb: 978.14, tn: 1956.28 },
  { c: 195514, f: 'HI ZEALED', d: 'Driver iLed 500 3-9VDC 600mA', ef: 0, ed: 0, mm: 0, de: 0, s: 1600, cf: 1.4, tf: 2240, tb: 11923.97, tn: 23847.94 },
  { c: 143850, f: 'HI ZEALED', d: 'Driver Multipoint 6x iLed 200 16-20V 700mA', ef: 45, ed: 22, mm: 14, de: 1.57, s: 800, cf: 2.58, tf: 2064, tb: 10987.08, tn: 21974.17 },
  { c: 143840, f: 'HI ZEALED', d: 'Driver iLed 200 3-6V 700mA', ef: 0, ed: 0, mm: 0, de: 0, s: 150, cf: 1.4, tf: 210, tb: 1117.87, tn: 2235.74 },
  { c: 146874, f: 'HUA FENG', d: 'iLed - S 2700', ef: 0, ed: 0, mm: 0, de: 0, s: 600, cf: 8.75, tf: 5250, tb: 27946.8, tn: 55893.6 },
  { c: 231629, f: 'L POWER', d: 'DRIVER 24V 120W', ef: 14, ed: 14, mm: 4, de: 3.5, s: 160, cf: 3.6, tf: 576, tb: 3066.16, tn: 6132.33 },
  { c: 239132, f: 'TUER', d: 'ARTICULACAO DE LATAO PARA SPOT PEN', ef: 0, ed: 0, mm: 0, de: 0, s: 600, cf: 0.98, tf: 588, tb: 3130.04, tn: 6260.08 },
  { c: 239135, f: 'TUER', d: 'Articulacao Cromada para spot 13mm x 35mm', ef: 0, ed: 0, mm: 0, de: 0, s: 800, cf: 0.7, tf: 560, tb: 2980.99, tn: 5961.98 },
  { c: 246181, f: 'TUER', d: 'MICROCANOPLA CONICA DE REGULAGEM COMPLETA', ef: 0, ed: 0, mm: 0, de: 0, s: 250, cf: 0.8, tf: 200, tb: 1064.64, tn: 2129.28 },
  { c: 255344, f: 'U-POLEMAG', d: 'IMA DE NEODIMIO PERSONALIZADO EM H', ef: 38, ed: 19, mm: 100, de: 0.19, s: 950, cf: 0.967, tf: 918.65, tb: 4889.16, tn: 9780.32 },
];

async function seed() {
  console.log('Seeding database...');

  // Create unique suppliers
  const supplierNames = [...new Set(SEED_ITEMS.map(i => i.f))];
  const supplierMap = new Map<string, number>();

  for (const name of supplierNames) {
    const supplier = await prisma.supplier.upsert({
      where: { code: name.replace(/\s+/g, '_').toUpperCase().slice(0, 20) },
      update: {},
      create: {
        code: name.replace(/\s+/g, '_').toUpperCase().slice(0, 20),
        name,
      },
    });
    supplierMap.set(name, supplier.id);
  }
  console.log(`  Created ${supplierMap.size} suppliers`);

  // Create items
  for (const item of SEED_ITEMS) {
    const supplierId = supplierMap.get(item.f)!;
    await prisma.item.upsert({
      where: { code: item.c },
      update: { costFobUsd: item.cf },
      create: {
        code: item.c,
        description: item.d,
        supplierId,
        costFobUsd: item.cf,
      },
    });
  }
  console.log(`  Created ${SEED_ITEMS.length} items`);

  // Create first consolidation
  const consolidation = await prisma.consolidation.create({
    data: {
      meetingNumber: 1,
      totalMeetings: 26,
      meetingDate: new Date('2026-03-01'),
      description: 'Primeira Reuniao (Marco)',
      exchangeRate: EXCHANGE_RATE,
      status: 'draft',
    },
  });
  console.log(`  Created consolidation #${consolidation.meetingNumber}`);

  // Create line items
  for (const row of SEED_ITEMS) {
    const item = await prisma.item.findUnique({ where: { code: row.c } });
    if (!item) continue;

    await prisma.consolidationLineItem.create({
      data: {
        consolidationId: consolidation.id,
        itemId: item.id,
        stockPhysical: row.ef,
        stockAvailable: row.ed,
        monthlyAvg: row.mm,
        stockDuration: row.de,
        suggestedQty: row.s,
        totalFobUsd: row.tf,
        totalFobBrl: row.tb,
        totalNationalized: row.tn,
      },
    });
  }
  console.log(`  Created ${SEED_ITEMS.length} line items`);

  console.log('Seed completed!');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
