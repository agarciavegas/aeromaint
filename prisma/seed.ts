import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function calculateRuleStatus(
  hoursSinceLast: number,
  cyclesSinceLast: number,
  dateLastCompleted: Date | null,
  intervalHours: number | null,
  intervalMonths: number | null,
  intervalCycles: number | null
): string {
  let maxRatio = 0;

  if (intervalHours && intervalHours > 0) {
    maxRatio = Math.max(maxRatio, hoursSinceLast / intervalHours);
  }
  if (intervalCycles && intervalCycles > 0) {
    maxRatio = Math.max(maxRatio, cyclesSinceLast / intervalCycles);
  }
  if (intervalMonths && intervalMonths > 0 && dateLastCompleted) {
    const monthsSinceLast =
      (Date.now() - dateLastCompleted.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
    maxRatio = Math.max(maxRatio, monthsSinceLast / intervalMonths);
  }
  if (intervalMonths && intervalMonths > 0 && !dateLastCompleted) {
    maxRatio = 1.5; // never completed -> overdue
  }

  if (!intervalHours && !intervalMonths && !intervalCycles) return 'na';
  if (maxRatio >= 1.0) return 'overdue';
  if (maxRatio >= 0.8) return 'due_soon';
  return 'compliant';
}

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.workOrderItem.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.rule.deleteMany();
  await prisma.part.deleteMany();
  await prisma.aircraft.deleteMany();
  await prisma.ruleTemplate.deleteMany();
  await prisma.partTemplate.deleteMany();
  await prisma.aircraftModelTemplate.deleteMany();

  // ============================================
  // MODEL 1: Cessna 172 Skyhawk
  // ============================================
  const cessna172 = await prisma.aircraftModelTemplate.create({
    data: {
      name: 'Cessna 172 Skyhawk',
      manufacturer: 'Cessna',
      model: '172',
      engineModel: 'Lycoming O-360-A4M',
      propModel: 'McCauley 1C160/DTM7557',
      description: 'Avión ligero monomotor de ala alta, ampliamente utilizado en instrucción y aviación general.',
    },
  });

  // Airframe
  const c172Airframe = await prisma.partTemplate.create({
    data: {
      name: 'Airframe',
      partNumber: '172-00001',
      ataChapter: '05',
      modelId: cessna172.id,
      sortOrder: 0,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      { name: 'Inspección Anual', ruleType: 'inspection', intervalMonths: 12, reference: 'FAR 91.409(a)', category: 'mandatory', partTemplateId: c172Airframe.id },
      { name: 'Inspección 100 Horas', ruleType: 'inspection', intervalHours: 100, reference: 'FAR 91.409(b)', category: 'mandatory', partTemplateId: c172Airframe.id },
    ],
  });

  // Engine
  const c172Engine = await prisma.partTemplate.create({
    data: {
      name: 'Motor Lycoming O-360-A4M',
      partNumber: 'O-360-A4M',
      ataChapter: '72',
      modelId: cessna172.id,
      sortOrder: 1,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      { name: 'Overhaul del Motor', ruleType: 'hard_time', intervalHours: 2000, intervalMonths: 144, reference: 'Lycoming SB 1009D', category: 'mandatory', partTemplateId: c172Engine.id },
      { name: 'Cambio de Aceite', ruleType: 'on_condition', intervalHours: 50, reference: 'Lycoming SI 1014', category: 'mandatory', partTemplateId: c172Engine.id },
    ],
  });

  // Carburetor
  const c172Carb = await prisma.partTemplate.create({
    data: {
      name: 'Carburador',
      partNumber: 'MA-4-5',
      ataChapter: '73',
      parentId: c172Engine.id,
      modelId: cessna172.id,
      sortOrder: 0,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      { name: 'Overhaul Carburador', ruleType: 'hard_time', intervalHours: 2000, reference: 'Precision Airmotive', category: 'recommended', partTemplateId: c172Carb.id },
    ],
  });

  // Magnetos
  const c172Magnetos = await prisma.partTemplate.create({
    data: {
      name: 'Magnetos',
      partNumber: 'D4LN-xxx',
      ataChapter: '74',
      parentId: c172Engine.id,
      modelId: cessna172.id,
      sortOrder: 1,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      { name: 'Inspección Magnetos', ruleType: 'inspection', intervalHours: 500, reference: 'FAR 91.409', category: 'mandatory', partTemplateId: c172Magnetos.id },
      { name: 'Overhaul Magnetos', ruleType: 'hard_time', intervalHours: 1000, reference: 'Champion SB', category: 'recommended', partTemplateId: c172Magnetos.id },
    ],
  });

  // Fuel Pump
  const c172FuelPump = await prisma.partTemplate.create({
    data: {
      name: 'Bomba de Combustible',
      partNumber: 'AC FP-xxx',
      ataChapter: '73',
      parentId: c172Engine.id,
      modelId: cessna172.id,
      sortOrder: 2,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      { name: 'Overhaul Bomba Combustible', ruleType: 'hard_time', intervalHours: 2000, reference: 'AC Fuel Pumps', category: 'recommended', partTemplateId: c172FuelPump.id },
    ],
  });

  // Propeller
  const c172Prop = await prisma.partTemplate.create({
    data: {
      name: 'Hélice McCauley',
      partNumber: '1C160/DTM7557',
      ataChapter: '61',
      modelId: cessna172.id,
      sortOrder: 2,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      { name: 'Overhaul Hélice', ruleType: 'hard_time', intervalHours: 2000, intervalMonths: 60, reference: 'McCauley SB 137E', category: 'mandatory', partTemplateId: c172Prop.id },
    ],
  });

  // Battery
  const c172Battery = await prisma.partTemplate.create({
    data: {
      name: 'Batería',
      partNumber: 'RG-24-11',
      ataChapter: '24',
      modelId: cessna172.id,
      sortOrder: 3,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      { name: 'Reemplazo Batería', ruleType: 'hard_time', intervalMonths: 24, reference: 'Mfg. Recommendation', category: 'recommended', partTemplateId: c172Battery.id },
    ],
  });

  // ELT
  const c172ELT = await prisma.partTemplate.create({
    data: {
      name: 'ELT',
      partNumber: 'AK-451',
      ataChapter: '25',
      modelId: cessna172.id,
      sortOrder: 4,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      { name: 'Inspección Anual ELT', ruleType: 'inspection', intervalMonths: 12, reference: 'FAR 91.207', category: 'mandatory', partTemplateId: c172ELT.id },
      { name: 'Reemplazo Batería ELT', ruleType: 'hard_time', intervalMonths: 24, reference: 'FAR 91.207(c)(6)', category: 'mandatory', partTemplateId: c172ELT.id },
    ],
  });

  // Altimeter / Pitot-Static
  const c172Altimeter = await prisma.partTemplate.create({
    data: {
      name: 'Altímetro / Sistema Pitot-Estático',
      partNumber: 'ALT-xxx',
      ataChapter: '34',
      modelId: cessna172.id,
      sortOrder: 5,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      { name: 'Calibración Altímetro', ruleType: 'hard_time', intervalMonths: 24, reference: 'FAR 91.411', category: 'mandatory', partTemplateId: c172Altimeter.id },
    ],
  });

  // Transponder
  const c172Transponder = await prisma.partTemplate.create({
    data: {
      name: 'Transpondedor',
      partNumber: 'KT-76C',
      ataChapter: '34',
      modelId: cessna172.id,
      sortOrder: 6,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      { name: 'Inspección Transpondedor', ruleType: 'hard_time', intervalMonths: 24, reference: 'FAR 91.413', category: 'mandatory', partTemplateId: c172Transponder.id },
    ],
  });

  // ============================================
  // MODEL 2: Piper PA-28 Cherokee
  // ============================================
  const piper28 = await prisma.aircraftModelTemplate.create({
    data: {
      name: 'Piper PA-28 Cherokee',
      manufacturer: 'Piper',
      model: 'PA-28',
      engineModel: 'Lycoming O-320-D3D',
      propModel: 'Sensenich M76EMMS-6',
      description: 'Avión ligero monomotor de ala baja, entrenamiento y vuelo de recreo.',
    },
  });

  const p28Airframe = await prisma.partTemplate.create({
    data: {
      name: 'Airframe',
      partNumber: '28-00001',
      ataChapter: '05',
      modelId: piper28.id,
      sortOrder: 0,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      { name: 'Inspección Anual', ruleType: 'inspection', intervalMonths: 12, reference: 'FAR 91.409(a)', category: 'mandatory', partTemplateId: p28Airframe.id },
      { name: 'Inspección 100 Horas', ruleType: 'inspection', intervalHours: 100, reference: 'FAR 91.409(b)', category: 'mandatory', partTemplateId: p28Airframe.id },
    ],
  });

  const p28Engine = await prisma.partTemplate.create({
    data: {
      name: 'Motor Lycoming O-320-D3D',
      partNumber: 'O-320-D3D',
      ataChapter: '72',
      modelId: piper28.id,
      sortOrder: 1,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      { name: 'Overhaul del Motor', ruleType: 'hard_time', intervalHours: 2000, intervalMonths: 144, reference: 'Lycoming SB 1009D', category: 'mandatory', partTemplateId: p28Engine.id },
      { name: 'Cambio de Aceite', ruleType: 'on_condition', intervalHours: 50, reference: 'Lycoming SI 1014', category: 'mandatory', partTemplateId: p28Engine.id },
    ],
  });

  const p28Carb = await prisma.partTemplate.create({
    data: {
      name: 'Carburador',
      partNumber: 'MA-4-SPA',
      ataChapter: '73',
      parentId: p28Engine.id,
      modelId: piper28.id,
      sortOrder: 0,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      { name: 'Overhaul Carburador', ruleType: 'hard_time', intervalHours: 2000, reference: 'Precision Airmotive', category: 'recommended', partTemplateId: p28Carb.id },
    ],
  });

  const p28Magnetos = await prisma.partTemplate.create({
    data: {
      name: 'Magnetos',
      partNumber: 'D4LN-xxx',
      ataChapter: '74',
      parentId: p28Engine.id,
      modelId: piper28.id,
      sortOrder: 1,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      { name: 'Inspección Magnetos', ruleType: 'inspection', intervalHours: 500, reference: 'FAR 91.409', category: 'mandatory', partTemplateId: p28Magnetos.id },
      { name: 'Overhaul Magnetos', ruleType: 'hard_time', intervalHours: 1000, reference: 'Champion SB', category: 'recommended', partTemplateId: p28Magnetos.id },
    ],
  });

  const p28Prop = await prisma.partTemplate.create({
    data: {
      name: 'Hélice Sensenich',
      partNumber: 'M76EMMS-6',
      ataChapter: '61',
      modelId: piper28.id,
      sortOrder: 2,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      { name: 'Overhaul Hélice', ruleType: 'hard_time', intervalHours: 2000, intervalMonths: 60, reference: 'Sensenich SB', category: 'mandatory', partTemplateId: p28Prop.id },
    ],
  });

  const p28Battery = await prisma.partTemplate.create({
    data: {
      name: 'Batería',
      partNumber: 'RG-24-11',
      ataChapter: '24',
      modelId: piper28.id,
      sortOrder: 3,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      { name: 'Reemplazo Batería', ruleType: 'hard_time', intervalMonths: 24, reference: 'Mfg. Recommendation', category: 'recommended', partTemplateId: p28Battery.id },
    ],
  });

  const p28ELT = await prisma.partTemplate.create({
    data: {
      name: 'ELT',
      partNumber: 'AK-451',
      ataChapter: '25',
      modelId: piper28.id,
      sortOrder: 4,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      { name: 'Inspección Anual ELT', ruleType: 'inspection', intervalMonths: 12, reference: 'FAR 91.207', category: 'mandatory', partTemplateId: p28ELT.id },
      { name: 'Reemplazo Batería ELT', ruleType: 'hard_time', intervalMonths: 24, reference: 'FAR 91.207(c)(6)', category: 'mandatory', partTemplateId: p28ELT.id },
    ],
  });

  const p28Altimeter = await prisma.partTemplate.create({
    data: {
      name: 'Altímetro / Sistema Pitot-Estático',
      partNumber: 'ALT-xxx',
      ataChapter: '34',
      modelId: piper28.id,
      sortOrder: 5,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      { name: 'Calibración Altímetro', ruleType: 'hard_time', intervalMonths: 24, reference: 'FAR 91.411', category: 'mandatory', partTemplateId: p28Altimeter.id },
    ],
  });

  const p28Transponder = await prisma.partTemplate.create({
    data: {
      name: 'Transpondedor',
      partNumber: 'KT-76C',
      ataChapter: '34',
      modelId: piper28.id,
      sortOrder: 6,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      { name: 'Inspección Transpondedor', ruleType: 'hard_time', intervalMonths: 24, reference: 'FAR 91.413', category: 'mandatory', partTemplateId: p28Transponder.id },
    ],
  });

  // ============================================
  // MODEL 3: Beechcraft Bonanza F33A
  // ============================================
  const bonanza = await prisma.aircraftModelTemplate.create({
    data: {
      name: 'Beechcraft Bonanza F33A',
      manufacturer: 'Beechcraft',
      model: 'F33A',
      engineModel: 'Continental IO-520-BB',
      propModel: 'Hartzell HC-C2YK-1BF',
      description: 'Avión monomotor de alto rendimiento con tren retráctil, utilizado para viaje corporativo y personal.',
    },
  });

  const b33Airframe = await prisma.partTemplate.create({
    data: {
      name: 'Airframe',
      partNumber: 'F33-00001',
      ataChapter: '05',
      modelId: bonanza.id,
      sortOrder: 0,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      { name: 'Inspección Anual', ruleType: 'inspection', intervalMonths: 12, reference: 'FAR 91.409(a)', category: 'mandatory', partTemplateId: b33Airframe.id },
      { name: 'Inspección 100 Horas', ruleType: 'inspection', intervalHours: 100, reference: 'FAR 91.409(b)', category: 'mandatory', partTemplateId: b33Airframe.id },
      { name: 'Inspección NDT Estructura', ruleType: 'inspection', intervalMonths: 60, reference: 'Beechcraft SB 53-xx', category: 'mandatory', partTemplateId: b33Airframe.id },
    ],
  });

  // Retractable Gear
  const b33Gear = await prisma.partTemplate.create({
    data: {
      name: 'Tren de Aterrizaje Retráctil',
      partNumber: 'F33-GEAR',
      ataChapter: '32',
      modelId: bonanza.id,
      sortOrder: 1,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      { name: 'Inspección Tren Retráctil', ruleType: 'inspection', intervalHours: 500, reference: 'Beechcraft MM', category: 'mandatory', partTemplateId: b33Gear.id },
      { name: 'Overhaul Tren Retráctil', ruleType: 'hard_time', intervalHours: 3000, intervalMonths: 72, reference: 'Beechcraft SB 52-xx', category: 'mandatory', partTemplateId: b33Gear.id },
    ],
  });

  // Engine
  const b33Engine = await prisma.partTemplate.create({
    data: {
      name: 'Motor Continental IO-520-BB',
      partNumber: 'IO-520-BB',
      ataChapter: '72',
      modelId: bonanza.id,
      sortOrder: 2,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      { name: 'Overhaul del Motor', ruleType: 'hard_time', intervalHours: 1700, intervalMonths: 144, reference: 'Continental SB M89-7R1', category: 'mandatory', partTemplateId: b33Engine.id },
      { name: 'Cambio de Aceite', ruleType: 'on_condition', intervalHours: 50, reference: 'Continental SI 1001', category: 'mandatory', partTemplateId: b33Engine.id },
    ],
  });

  // Fuel Injection
  const b33FuelInj = await prisma.partTemplate.create({
    data: {
      name: 'Sistema Inyección Combustible',
      partNumber: 'RSA-5AF1',
      ataChapter: '73',
      parentId: b33Engine.id,
      modelId: bonanza.id,
      sortOrder: 0,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      { name: 'Overhaul Inyector Combustible', ruleType: 'hard_time', intervalHours: 2000, reference: 'Precision Airmotive', category: 'recommended', partTemplateId: b33FuelInj.id },
    ],
  });

  const b33Magnetos = await prisma.partTemplate.create({
    data: {
      name: 'Magnetos',
      partNumber: 'D4LN-xxx',
      ataChapter: '74',
      parentId: b33Engine.id,
      modelId: bonanza.id,
      sortOrder: 1,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      { name: 'Inspección Magnetos', ruleType: 'inspection', intervalHours: 500, reference: 'FAR 91.409', category: 'mandatory', partTemplateId: b33Magnetos.id },
      { name: 'Overhaul Magnetos', ruleType: 'hard_time', intervalHours: 1000, reference: 'Champion SB', category: 'recommended', partTemplateId: b33Magnetos.id },
    ],
  });

  const b33Prop = await prisma.partTemplate.create({
    data: {
      name: 'Hélice Hartzell',
      partNumber: 'HC-C2YK-1BF',
      ataChapter: '61',
      modelId: bonanza.id,
      sortOrder: 3,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      { name: 'Overhaul Hélice', ruleType: 'hard_time', intervalHours: 2000, intervalMonths: 60, reference: 'Hartzell SB 61-xx', category: 'mandatory', partTemplateId: b33Prop.id },
    ],
  });

  const b33Battery = await prisma.partTemplate.create({
    data: {
      name: 'Batería',
      partNumber: 'RG-24-11',
      ataChapter: '24',
      modelId: bonanza.id,
      sortOrder: 4,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      { name: 'Reemplazo Batería', ruleType: 'hard_time', intervalMonths: 24, reference: 'Mfg. Recommendation', category: 'recommended', partTemplateId: b33Battery.id },
    ],
  });

  const b33ELT = await prisma.partTemplate.create({
    data: {
      name: 'ELT',
      partNumber: 'AK-451',
      ataChapter: '25',
      modelId: bonanza.id,
      sortOrder: 5,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      { name: 'Inspección Anual ELT', ruleType: 'inspection', intervalMonths: 12, reference: 'FAR 91.207', category: 'mandatory', partTemplateId: b33ELT.id },
      { name: 'Reemplazo Batería ELT', ruleType: 'hard_time', intervalMonths: 24, reference: 'FAR 91.207(c)(6)', category: 'mandatory', partTemplateId: b33ELT.id },
    ],
  });

  const b33Altimeter = await prisma.partTemplate.create({
    data: {
      name: 'Altímetro / Sistema Pitot-Estático',
      partNumber: 'ALT-xxx',
      ataChapter: '34',
      modelId: bonanza.id,
      sortOrder: 6,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      { name: 'Calibración Altímetro', ruleType: 'hard_time', intervalMonths: 24, reference: 'FAR 91.411', category: 'mandatory', partTemplateId: b33Altimeter.id },
    ],
  });

  const b33Transponder = await prisma.partTemplate.create({
    data: {
      name: 'Transpondedor',
      partNumber: 'KT-76C',
      ataChapter: '34',
      modelId: bonanza.id,
      sortOrder: 7,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      { name: 'Inspección Transpondedor', ruleType: 'hard_time', intervalMonths: 24, reference: 'FAR 91.413', category: 'mandatory', partTemplateId: b33Transponder.id },
    ],
  });

  // ============================================
  // AIRCRAFT 1: EC-ABC (Cessna 172, 1500h)
  // ============================================
  const ecAbc = await prisma.aircraft.create({
    data: {
      registration: 'EC-ABC',
      serialNumber: '172-72345',
      modelId: cessna172.id,
      totalHours: 1500,
      totalCycles: 1200,
      year: 2005,
      status: 'active',
    },
  });

  // Clone parts from template - two pass: root parts first, then children
  const c172Templates = await prisma.partTemplate.findMany({
    where: { modelId: cessna172.id },
    include: { rules: true },
    orderBy: { sortOrder: 'asc' },
  });

  const templateIdToPartId: Record<string, string> = {};

  // First pass: root parts (no parent)
  for (const pt of c172Templates.filter(p => !p.parentId)) {
    const part = await prisma.part.create({
      data: {
        name: pt.name,
        partNumber: pt.partNumber,
        serialNumber: pt.name === 'Airframe' ? '172-72345' : undefined,
        parentId: null,
        aircraftId: ecAbc.id,
        templateId: pt.id,
        hoursSinceNew: 1500,
        hoursSinceOvh: pt.name.includes('Motor') ? 500 : 0,
        cyclesSinceNew: 1200,
        status: 'serviceable',
        sortOrder: pt.sortOrder,
      },
    });
    templateIdToPartId[pt.id] = part.id;
  }

  // Second pass: child parts
  for (const pt of c172Templates.filter(p => p.parentId)) {
    const parentPartId = templateIdToPartId[pt.parentId];
    if (!parentPartId) continue;
    const part = await prisma.part.create({
      data: {
        name: pt.name,
        partNumber: pt.partNumber,
        parentId: parentPartId,
        aircraftId: ecAbc.id,
        templateId: pt.id,
        hoursSinceNew: 1500,
        hoursSinceOvh: 0,
        cyclesSinceNew: 1200,
        status: 'serviceable',
        sortOrder: pt.sortOrder,
      },
    });
    templateIdToPartId[pt.id] = part.id;
  }

  // Clone rules for all parts
  for (const pt of c172Templates) {
    const partId = templateIdToPartId[pt.id];
    if (!partId) continue;

    for (const rt of pt.rules) {
      let hoursSinceLast = 0;
      let cyclesSinceLast = 0;
      let dateLastCompleted: Date | null = new Date('2024-06-15');
      let dueDate: Date | null = null;

      // Custom hours for demo data - EC-ABC specific
      if (rt.name === 'Inspección Anual') {
        hoursSinceLast = 80;
        dateLastCompleted = new Date('2025-01-15');
      } else if (rt.name === 'Inspección 100 Horas') {
        hoursSinceLast = 85;
        dateLastCompleted = new Date('2025-02-01');
      } else if (rt.name === 'Overhaul del Motor' && pt.partNumber === 'O-360-A4M') {
        hoursSinceLast = 500;
        dateLastCompleted = new Date('2022-01-10');
      } else if (rt.name === 'Cambio de Aceite') {
        hoursSinceLast = 45;
        dateLastCompleted = new Date('2025-05-01');
      } else if (rt.name === 'Inspección Magnetos') {
        hoursSinceLast = 480;
        dateLastCompleted = new Date('2024-06-15');
      } else if (rt.name === 'Overhaul Magnetos') {
        hoursSinceLast = 500;
        dateLastCompleted = new Date('2023-01-15');
      } else if (rt.name === 'Overhaul Hélice') {
        hoursSinceLast = 300;
        dateLastCompleted = new Date('2023-06-01');
      } else if (rt.name === 'Reemplazo Batería') {
        dateLastCompleted = new Date('2024-01-01');
      } else if (rt.name === 'Reemplazo Batería ELT') {
        dateLastCompleted = new Date('2023-06-01');
      } else if (rt.name === 'Inspección Anual ELT') {
        dateLastCompleted = new Date('2025-01-15');
      } else if (rt.name.includes('Altímetro') || rt.name.includes('Transpondedor')) {
        dateLastCompleted = new Date('2023-06-01');
      } else {
        hoursSinceLast = 200;
        dateLastCompleted = new Date('2024-01-01');
      }

      const status = calculateRuleStatus(
        hoursSinceLast, cyclesSinceLast, dateLastCompleted,
        rt.intervalHours, rt.intervalMonths, rt.intervalCycles
      );

      if (rt.intervalMonths && dateLastCompleted) {
        const due = new Date(dateLastCompleted);
        due.setMonth(due.getMonth() + rt.intervalMonths);
        dueDate = due;
      }

      await prisma.rule.create({
        data: {
          name: rt.name,
          description: rt.description,
          ruleType: rt.ruleType,
          intervalHours: rt.intervalHours,
          intervalMonths: rt.intervalMonths,
          intervalCycles: rt.intervalCycles,
          reference: rt.reference,
          category: rt.category,
          hoursSinceLast,
          cyclesSinceLast,
          dateLastCompleted,
          dueDate,
          status,
          partId,
          templateId: rt.id,
        },
      });
    }
  }

  // ============================================
  // AIRCRAFT 2: EC-XYZ (Piper PA-28, 800h)
  // ============================================
  const ecXyz = await prisma.aircraft.create({
    data: {
      registration: 'EC-XYZ',
      serialNumber: '28-12345',
      modelId: piper28.id,
      totalHours: 800,
      totalCycles: 650,
      year: 2010,
      status: 'active',
    },
  });

  const p28Templates = await prisma.partTemplate.findMany({
    where: { modelId: piper28.id },
    include: { rules: true },
    orderBy: { sortOrder: 'asc' },
  });

  const p28TemplateIdToPartId: Record<string, string> = {};

  // First pass: root parts
  for (const pt of p28Templates.filter(p => !p.parentId)) {
    const part = await prisma.part.create({
      data: {
        name: pt.name,
        partNumber: pt.partNumber,
        serialNumber: pt.name === 'Airframe' ? '28-12345' : undefined,
        parentId: null,
        aircraftId: ecXyz.id,
        templateId: pt.id,
        hoursSinceNew: 800,
        hoursSinceOvh: pt.name.includes('Motor') ? 200 : 0,
        cyclesSinceNew: 650,
        status: 'serviceable',
        sortOrder: pt.sortOrder,
      },
    });
    p28TemplateIdToPartId[pt.id] = part.id;
  }

  // Second pass: child parts
  for (const pt of p28Templates.filter(p => p.parentId)) {
    const parentPartId = p28TemplateIdToPartId[pt.parentId];
    if (!parentPartId) continue;
    const part = await prisma.part.create({
      data: {
        name: pt.name,
        partNumber: pt.partNumber,
        parentId: parentPartId,
        aircraftId: ecXyz.id,
        templateId: pt.id,
        hoursSinceNew: 800,
        hoursSinceOvh: 0,
        cyclesSinceNew: 650,
        status: 'serviceable',
        sortOrder: pt.sortOrder,
      },
    });
    p28TemplateIdToPartId[pt.id] = part.id;
  }

  // Clone rules
  for (const pt of p28Templates) {
    const partId = p28TemplateIdToPartId[pt.id];
    if (!partId) continue;

    for (const rt of pt.rules) {
      let hoursSinceLast = 0;
      let cyclesSinceLast = 0;
      let dateLastCompleted: Date | null = new Date('2024-06-15');
      let dueDate: Date | null = null;

      // Custom for EC-XYZ
      if (rt.name === 'Inspección Anual') {
        hoursSinceLast = 60;
        dateLastCompleted = new Date('2025-03-01');
      } else if (rt.name === 'Inspección 100 Horas') {
        hoursSinceLast = 30;
        dateLastCompleted = new Date('2025-05-15');
      } else if (rt.name === 'Overhaul del Motor' && pt.partNumber === 'O-320-D3D') {
        hoursSinceLast = 200;
        dateLastCompleted = new Date('2023-06-01');
      } else if (rt.name === 'Cambio de Aceite') {
        hoursSinceLast = 10;
        dateLastCompleted = new Date('2025-05-20');
      } else if (rt.name === 'Inspección Magnetos') {
        hoursSinceLast = 120;
        dateLastCompleted = new Date('2024-09-01');
      } else if (rt.name === 'Overhaul Magnetos') {
        hoursSinceLast = 120;
        dateLastCompleted = new Date('2024-09-01');
      } else if (rt.name === 'Overhaul Hélice') {
        hoursSinceLast = 50;
        dateLastCompleted = new Date('2024-01-15');
      } else if (rt.name === 'Reemplazo Batería') {
        dateLastCompleted = new Date('2024-08-01');
      } else if (rt.name === 'Reemplazo Batería ELT') {
        dateLastCompleted = new Date('2023-06-01');
      } else if (rt.name === 'Inspección Anual ELT') {
        dateLastCompleted = new Date('2025-03-01');
      } else if (rt.name.includes('Altímetro') || rt.name.includes('Transpondedor')) {
        dateLastCompleted = new Date('2024-08-01');
      } else {
        hoursSinceLast = 50;
        dateLastCompleted = new Date('2024-06-01');
      }

      const status = calculateRuleStatus(
        hoursSinceLast, cyclesSinceLast, dateLastCompleted,
        rt.intervalHours, rt.intervalMonths, rt.intervalCycles
      );

      if (rt.intervalMonths && dateLastCompleted) {
        const due = new Date(dateLastCompleted);
        due.setMonth(due.getMonth() + rt.intervalMonths);
        dueDate = due;
      }

      await prisma.rule.create({
        data: {
          name: rt.name,
          description: rt.description,
          ruleType: rt.ruleType,
          intervalHours: rt.intervalHours,
          intervalMonths: rt.intervalMonths,
          intervalCycles: rt.intervalCycles,
          reference: rt.reference,
          category: rt.category,
          hoursSinceLast,
          cyclesSinceLast,
          dateLastCompleted,
          dueDate,
          status,
          partId,
          templateId: rt.id,
        },
      });
    }
  }

  // ============================================
  // SAMPLE WORK ORDER
  // ============================================
  // Find a rule from EC-ABC to create a work order
  const sampleRules = await prisma.rule.findMany({
    where: { part: { aircraftId: ecAbc.id } },
    take: 3,
  });

  const woNumber = `WO-${new Date().getFullYear()}-001`;

  const sampleWO = await prisma.workOrder.create({
    data: {
      number: woNumber,
      title: 'Inspección Anual EC-ABC',
      description: 'Inspección anual programada según FAR 91.409(a)',
      aircraftId: ecAbc.id,
      status: 'open',
      priority: 'normal',
      type: 'scheduled',
      assignedTo: 'Taller Mantenimiento A',
      scheduledDate: new Date('2025-07-01'),
    },
  });

  if (sampleRules.length > 0) {
    for (let i = 0; i < sampleRules.length; i++) {
      await prisma.workOrderItem.create({
        data: {
          workOrderId: sampleWO.id,
          ruleId: sampleRules[i].id,
          description: sampleRules[i].name,
          status: 'pending',
          sortOrder: i,
        },
      });
    }
  }

  // Add a manual item
  await prisma.workOrderItem.create({
    data: {
      workOrderId: sampleWO.id,
      ruleId: null,
      description: 'Verificar niveles de aceite y fluidos',
      status: 'pending',
      sortOrder: sampleRules.length,
    },
  });

  console.log('Database seeded successfully!');
  console.log(`- 3 aircraft model templates created`);
  console.log(`- 2 aircraft created (EC-ABC, EC-XYZ)`);
  console.log(`- 1 sample work order created`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
