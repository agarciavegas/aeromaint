import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Limpiando base de datos...');
  await prisma.workOrderItem.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.rule.deleteMany();
  await prisma.part.deleteMany();
  await prisma.aircraft.deleteMany();
  await prisma.ruleTemplate.deleteMany();
  await prisma.partTemplate.deleteMany();
  await prisma.aircraftModelTemplate.deleteMany();

  // =====================================================
  // CESSNA 172 SKYHAWK
  // =====================================================
  console.log('Creando Cessna 172 Skyhawk...');
  const cessna172 = await prisma.aircraftModelTemplate.create({
    data: {
      name: 'Cessna 172 Skyhawk',
      manufacturer: 'Cessna',
      model: '172',
      engineModel: 'Lycoming O-360-A4M',
      propModel: 'McCauley 1C160/DTM7557',
      description: 'Avion monomotor de ala alta, 4 plazas',
    },
  });

  // Airframe
  const cessnaAirframe = await prisma.partTemplate.create({
    data: {
      name: 'Estructura (Airframe)',
      ataChapter: '53',
      modelId: cessna172.id,
      sortOrder: 1,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      {
        name: 'Inspeccion Anual',
        ruleType: 'inspection',
        intervalMonths: 12,
        reference: 'FAR 91.409(a)(1)',
        category: 'mandatory',
        partTemplateId: cessnaAirframe.id,
      },
      {
        name: 'Inspeccion 100 Horas',
        ruleType: 'inspection',
        intervalHours: 100,
        reference: 'FAR 91.409(b)',
        category: 'mandatory',
        partTemplateId: cessnaAirframe.id,
      },
    ],
  });

  // Motor
  const cessnaMotor = await prisma.partTemplate.create({
    data: {
      name: 'Motor',
      ataChapter: '72',
      modelId: cessna172.id,
      sortOrder: 2,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      {
        name: 'Overhaul del Motor',
        ruleType: 'hard_time',
        intervalHours: 2000,
        intervalMonths: 144,
        reference: 'Lycoming SB 1009D',
        category: 'mandatory',
        partTemplateId: cessnaMotor.id,
      },
      {
        name: 'Cambio de Aceite',
        ruleType: 'on_condition',
        intervalHours: 50,
        reference: 'Lycoming SI 1014M',
        category: 'recommended',
        partTemplateId: cessnaMotor.id,
      },
    ],
  });

  // Sub-partes del motor
  const cessnaCarburador = await prisma.partTemplate.create({
    data: {
      name: 'Carburador',
      ataChapter: '73',
      parentId: cessnaMotor.id,
      modelId: cessna172.id,
      sortOrder: 1,
    },
  });

  await prisma.ruleTemplate.create({
    data: {
      name: 'Inspeccion del Carburador',
      ruleType: 'inspection',
      intervalHours: 500,
      reference: 'Lycoming SB 1275',
      category: 'recommended',
      partTemplateId: cessnaCarburador.id,
    },
  });

  const cessnaMagnetos = await prisma.partTemplate.create({
    data: {
      name: 'Magnetos',
      ataChapter: '74',
      parentId: cessnaMotor.id,
      modelId: cessna172.id,
      sortOrder: 2,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      {
        name: 'Inspeccion de Magnetos',
        ruleType: 'inspection',
        intervalHours: 500,
        reference: 'Lycoming SI 1042R',
        category: 'recommended',
        partTemplateId: cessnaMagnetos.id,
      },
      {
        name: 'Overhaul de Magnetos',
        ruleType: 'hard_time',
        intervalHours: 1000,
        reference: 'Lycoming SB 640L',
        category: 'mandatory',
        partTemplateId: cessnaMagnetos.id,
      },
    ],
  });

  const cessnaBombaComb = await prisma.partTemplate.create({
    data: {
      name: 'Bomba de Combustible',
      ataChapter: '73',
      parentId: cessnaMotor.id,
      modelId: cessna172.id,
      sortOrder: 3,
    },
  });

  await prisma.ruleTemplate.create({
    data: {
      name: 'Overhaul Bomba de Combustible',
      ruleType: 'hard_time',
      intervalHours: 2000,
      reference: 'Lycoming SI 1184',
      category: 'mandatory',
      partTemplateId: cessnaBombaComb.id,
    },
  });

  // Helice
  const cessnaHelice = await prisma.partTemplate.create({
    data: {
      name: 'Helice',
      ataChapter: '61',
      modelId: cessna172.id,
      sortOrder: 3,
    },
  });

  await prisma.ruleTemplate.create({
    data: {
      name: 'Overhaul de Helice',
      ruleType: 'hard_time',
      intervalHours: 2000,
      intervalMonths: 60,
      reference: 'McCauley SB 137',
      category: 'mandatory',
      partTemplateId: cessnaHelice.id,
    },
  });

  // Bateria
  const cessnaBateria = await prisma.partTemplate.create({
    data: {
      name: 'Bateria',
      ataChapter: '24',
      modelId: cessna172.id,
      sortOrder: 4,
    },
  });

  await prisma.ruleTemplate.create({
    data: {
      name: 'Reemplazo de Bateria',
      ruleType: 'on_condition',
      intervalMonths: 24,
      reference: 'Cessna MM 24-00',
      category: 'recommended',
      partTemplateId: cessnaBateria.id,
    },
  });

  // ELT
  const cessnaELT = await prisma.partTemplate.create({
    data: {
      name: 'ELT (Transmisor de Localizacion de Emergencia)',
      ataChapter: '25',
      modelId: cessna172.id,
      sortOrder: 5,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      {
        name: 'Inspeccion del ELT',
        ruleType: 'inspection',
        intervalMonths: 12,
        reference: 'FAR 91.207(d)',
        category: 'mandatory',
        partTemplateId: cessnaELT.id,
      },
      {
        name: 'Bateria del ELT - Reemplazo al 50% de vida',
        ruleType: 'on_condition',
        intervalMonths: 24,
        reference: 'FAR 91.207(c)',
        category: 'mandatory',
        partTemplateId: cessnaELT.id,
      },
    ],
  });

  // Altimetro/Pitot
  const cessnaAltimetro = await prisma.partTemplate.create({
    data: {
      name: 'Altimetro / Sistema Pitot-Estatico',
      ataChapter: '34',
      modelId: cessna172.id,
      sortOrder: 6,
    },
  });

  await prisma.ruleTemplate.create({
    data: {
      name: 'Inspeccion del Sistema Pitot-Estatico',
      ruleType: 'inspection',
      intervalMonths: 24,
      reference: 'FAR 91.411',
      category: 'mandatory',
      partTemplateId: cessnaAltimetro.id,
    },
  });

  // Transponder
  const cessnaTransponder = await prisma.partTemplate.create({
    data: {
      name: 'Transponder',
      ataChapter: '34',
      modelId: cessna172.id,
      sortOrder: 7,
    },
  });

  await prisma.ruleTemplate.create({
    data: {
      name: 'Inspeccion del Transponder',
      ruleType: 'inspection',
      intervalMonths: 24,
      reference: 'FAR 91.413',
      category: 'mandatory',
      partTemplateId: cessnaTransponder.id,
    },
  });

  // =====================================================
  // PIPER PA-28 CHEROKEE
  // =====================================================
  console.log('Creando Piper PA-28 Cherokee...');
  const piper28 = await prisma.aircraftModelTemplate.create({
    data: {
      name: 'Piper PA-28 Cherokee',
      manufacturer: 'Piper',
      model: 'PA-28',
      engineModel: 'Lycoming O-320-E3D',
      propModel: 'Sensenich M76EMM2',
      description: 'Avion monomotor de ala baja, 4 plazas',
    },
  });

  // Airframe
  const piperAirframe = await prisma.partTemplate.create({
    data: {
      name: 'Estructura (Airframe)',
      ataChapter: '53',
      modelId: piper28.id,
      sortOrder: 1,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      {
        name: 'Inspeccion Anual',
        ruleType: 'inspection',
        intervalMonths: 12,
        reference: 'FAR 91.409(a)(1)',
        category: 'mandatory',
        partTemplateId: piperAirframe.id,
      },
      {
        name: 'Inspeccion 100 Horas',
        ruleType: 'inspection',
        intervalHours: 100,
        reference: 'FAR 91.409(b)',
        category: 'mandatory',
        partTemplateId: piperAirframe.id,
      },
    ],
  });

  // Motor
  const piperMotor = await prisma.partTemplate.create({
    data: {
      name: 'Motor',
      ataChapter: '72',
      modelId: piper28.id,
      sortOrder: 2,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      {
        name: 'Overhaul del Motor',
        ruleType: 'hard_time',
        intervalHours: 2000,
        intervalMonths: 144,
        reference: 'Lycoming SB 1009D',
        category: 'mandatory',
        partTemplateId: piperMotor.id,
      },
      {
        name: 'Cambio de Aceite',
        ruleType: 'on_condition',
        intervalHours: 50,
        reference: 'Lycoming SI 1014M',
        category: 'recommended',
        partTemplateId: piperMotor.id,
      },
    ],
  });

  const piperCarburador = await prisma.partTemplate.create({
    data: {
      name: 'Carburador',
      ataChapter: '73',
      parentId: piperMotor.id,
      modelId: piper28.id,
      sortOrder: 1,
    },
  });

  await prisma.ruleTemplate.create({
    data: {
      name: 'Inspeccion del Carburador',
      ruleType: 'inspection',
      intervalHours: 500,
      reference: 'Lycoming SB 1275',
      category: 'recommended',
      partTemplateId: piperCarburador.id,
    },
  });

  const piperMagnetos = await prisma.partTemplate.create({
    data: {
      name: 'Magnetos',
      ataChapter: '74',
      parentId: piperMotor.id,
      modelId: piper28.id,
      sortOrder: 2,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      {
        name: 'Inspeccion de Magnetos',
        ruleType: 'inspection',
        intervalHours: 500,
        reference: 'Lycoming SI 1042R',
        category: 'recommended',
        partTemplateId: piperMagnetos.id,
      },
      {
        name: 'Overhaul de Magnetos',
        ruleType: 'hard_time',
        intervalHours: 1000,
        reference: 'Lycoming SB 640L',
        category: 'mandatory',
        partTemplateId: piperMagnetos.id,
      },
    ],
  });

  // Helice
  const piperHelice = await prisma.partTemplate.create({
    data: {
      name: 'Helice',
      ataChapter: '61',
      modelId: piper28.id,
      sortOrder: 3,
    },
  });

  await prisma.ruleTemplate.create({
    data: {
      name: 'Overhaul de Helice',
      ruleType: 'hard_time',
      intervalHours: 2000,
      intervalMonths: 60,
      reference: 'Sensenich SB 1R-16',
      category: 'mandatory',
      partTemplateId: piperHelice.id,
    },
  });

  // Bateria
  const piperBateria = await prisma.partTemplate.create({
    data: {
      name: 'Bateria',
      ataChapter: '24',
      modelId: piper28.id,
      sortOrder: 4,
    },
  });

  await prisma.ruleTemplate.create({
    data: {
      name: 'Reemplazo de Bateria',
      ruleType: 'on_condition',
      intervalMonths: 24,
      reference: 'Piper MM 24-10',
      category: 'recommended',
      partTemplateId: piperBateria.id,
    },
  });

  // ELT
  const piperELT = await prisma.partTemplate.create({
    data: {
      name: 'ELT (Transmisor de Localizacion de Emergencia)',
      ataChapter: '25',
      modelId: piper28.id,
      sortOrder: 5,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      {
        name: 'Inspeccion del ELT',
        ruleType: 'inspection',
        intervalMonths: 12,
        reference: 'FAR 91.207(d)',
        category: 'mandatory',
        partTemplateId: piperELT.id,
      },
      {
        name: 'Bateria del ELT - Reemplazo al 50% de vida',
        ruleType: 'on_condition',
        intervalMonths: 24,
        reference: 'FAR 91.207(c)',
        category: 'mandatory',
        partTemplateId: piperELT.id,
      },
    ],
  });

  // Altimetro
  const piperAltimetro = await prisma.partTemplate.create({
    data: {
      name: 'Altimetro / Sistema Pitot-Estatico',
      ataChapter: '34',
      modelId: piper28.id,
      sortOrder: 6,
    },
  });

  await prisma.ruleTemplate.create({
    data: {
      name: 'Inspeccion del Sistema Pitot-Estatico',
      ruleType: 'inspection',
      intervalMonths: 24,
      reference: 'FAR 91.411',
      category: 'mandatory',
      partTemplateId: piperAltimetro.id,
    },
  });

  // Transponder
  const piperTransponder = await prisma.partTemplate.create({
    data: {
      name: 'Transponder',
      ataChapter: '34',
      modelId: piper28.id,
      sortOrder: 7,
    },
  });

  await prisma.ruleTemplate.create({
    data: {
      name: 'Inspeccion del Transponder',
      ruleType: 'inspection',
      intervalMonths: 24,
      reference: 'FAR 91.413',
      category: 'mandatory',
      partTemplateId: piperTransponder.id,
    },
  });

  // =====================================================
  // BEECHCRAFT BONANZA
  // =====================================================
  console.log('Creando Beechcraft Bonanza...');
  const bonanza = await prisma.aircraftModelTemplate.create({
    data: {
      name: 'Beechcraft Bonanza',
      manufacturer: 'Beechcraft',
      model: 'F33A',
      engineModel: 'Continental IO-520-B',
      propModel: 'McCauley 3A32C87',
      description: 'Avion monomotor de ala baja, tren retráctil, 6 plazas',
    },
  });

  // Airframe
  const bonanzaAirframe = await prisma.partTemplate.create({
    data: {
      name: 'Estructura (Airframe)',
      ataChapter: '53',
      modelId: bonanza.id,
      sortOrder: 1,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      {
        name: 'Inspeccion Anual',
        ruleType: 'inspection',
        intervalMonths: 12,
        reference: 'FAR 91.409(a)(1)',
        category: 'mandatory',
        partTemplateId: bonanzaAirframe.id,
      },
      {
        name: 'Inspeccion 100 Horas',
        ruleType: 'inspection',
        intervalHours: 100,
        reference: 'FAR 91.409(b)',
        category: 'mandatory',
        partTemplateId: bonanzaAirframe.id,
      },
      {
        name: 'Inspeccion NDT de Pernos del Ala',
        ruleType: 'inspection',
        intervalMonths: 60,
        reference: 'Beechcraft SB 2305',
        category: 'mandatory',
        partTemplateId: bonanzaAirframe.id,
      },
    ],
  });

  // Tren de aterrizaje
  const bonanzaTren = await prisma.partTemplate.create({
    data: {
      name: 'Tren de Aterrizaje Retráctil',
      ataChapter: '32',
      modelId: bonanza.id,
      sortOrder: 2,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      {
        name: 'Inspeccion del Tren de Aterrizaje',
        ruleType: 'inspection',
        intervalHours: 500,
        reference: 'Beechcraft MM 32-00',
        category: 'mandatory',
        partTemplateId: bonanzaTren.id,
      },
      {
        name: 'Overhaul del Tren de Aterrizaje',
        ruleType: 'hard_time',
        intervalHours: 3000,
        intervalMonths: 72,
        reference: 'Beechcraft SB 2108',
        category: 'mandatory',
        partTemplateId: bonanzaTren.id,
      },
    ],
  });

  // Motor
  const bonanzaMotor = await prisma.partTemplate.create({
    data: {
      name: 'Motor',
      ataChapter: '72',
      modelId: bonanza.id,
      sortOrder: 3,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      {
        name: 'Overhaul del Motor',
        ruleType: 'hard_time',
        intervalHours: 1700,
        intervalMonths: 144,
        reference: 'Continental SB M89-9R1',
        category: 'mandatory',
        partTemplateId: bonanzaMotor.id,
      },
      {
        name: 'Cambio de Aceite',
        ruleType: 'on_condition',
        intervalHours: 50,
        reference: 'Continental SI 1485R',
        category: 'recommended',
        partTemplateId: bonanzaMotor.id,
      },
    ],
  });

  const bonanzaMagnetos = await prisma.partTemplate.create({
    data: {
      name: 'Magnetos',
      ataChapter: '74',
      parentId: bonanzaMotor.id,
      modelId: bonanza.id,
      sortOrder: 1,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      {
        name: 'Inspeccion de Magnetos',
        ruleType: 'inspection',
        intervalHours: 500,
        reference: 'Continental SI 1545',
        category: 'recommended',
        partTemplateId: bonanzaMagnetos.id,
      },
      {
        name: 'Overhaul de Magnetos',
        ruleType: 'hard_time',
        intervalHours: 1000,
        reference: 'Continental SB 643',
        category: 'mandatory',
        partTemplateId: bonanzaMagnetos.id,
      },
    ],
  });

  const bonanzaFuelInj = await prisma.partTemplate.create({
    data: {
      name: 'Sistema de Inyeccion de Combustible',
      ataChapter: '73',
      parentId: bonanzaMotor.id,
      modelId: bonanza.id,
      sortOrder: 2,
    },
  });

  await prisma.ruleTemplate.create({
    data: {
      name: 'Inspeccion del Sistema de Inyeccion',
      ruleType: 'inspection',
      intervalHours: 500,
      reference: 'Continental SI 1578',
      category: 'recommended',
      partTemplateId: bonanzaFuelInj.id,
    },
  });

  // Helice
  const bonanzaHelice = await prisma.partTemplate.create({
    data: {
      name: 'Helice',
      ataChapter: '61',
      modelId: bonanza.id,
      sortOrder: 4,
    },
  });

  await prisma.ruleTemplate.create({
    data: {
      name: 'Overhaul de Helice',
      ruleType: 'hard_time',
      intervalHours: 2000,
      intervalMonths: 60,
      reference: 'McCauley SB 137',
      category: 'mandatory',
      partTemplateId: bonanzaHelice.id,
    },
  });

  // Bateria
  const bonanzaBateria = await prisma.partTemplate.create({
    data: {
      name: 'Bateria',
      ataChapter: '24',
      modelId: bonanza.id,
      sortOrder: 5,
    },
  });

  await prisma.ruleTemplate.create({
    data: {
      name: 'Reemplazo de Bateria',
      ruleType: 'on_condition',
      intervalMonths: 24,
      reference: 'Beechcraft MM 24-00',
      category: 'recommended',
      partTemplateId: bonanzaBateria.id,
    },
  });

  // ELT
  const bonanzaELT = await prisma.partTemplate.create({
    data: {
      name: 'ELT (Transmisor de Localizacion de Emergencia)',
      ataChapter: '25',
      modelId: bonanza.id,
      sortOrder: 6,
    },
  });

  await prisma.ruleTemplate.createMany({
    data: [
      {
        name: 'Inspeccion del ELT',
        ruleType: 'inspection',
        intervalMonths: 12,
        reference: 'FAR 91.207(d)',
        category: 'mandatory',
        partTemplateId: bonanzaELT.id,
      },
      {
        name: 'Bateria del ELT - Reemplazo al 50% de vida',
        ruleType: 'on_condition',
        intervalMonths: 24,
        reference: 'FAR 91.207(c)',
        category: 'mandatory',
        partTemplateId: bonanzaELT.id,
      },
    ],
  });

  // Altimetro
  const bonanzaAltimetro = await prisma.partTemplate.create({
    data: {
      name: 'Altimetro / Sistema Pitot-Estatico',
      ataChapter: '34',
      modelId: bonanza.id,
      sortOrder: 7,
    },
  });

  await prisma.ruleTemplate.create({
    data: {
      name: 'Inspeccion del Sistema Pitot-Estatico',
      ruleType: 'inspection',
      intervalMonths: 24,
      reference: 'FAR 91.411',
      category: 'mandatory',
      partTemplateId: bonanzaAltimetro.id,
    },
  });

  // Transponder
  const bonanzaTransponder = await prisma.partTemplate.create({
    data: {
      name: 'Transponder',
      ataChapter: '34',
      modelId: bonanza.id,
      sortOrder: 8,
    },
  });

  await prisma.ruleTemplate.create({
    data: {
      name: 'Inspeccion del Transponder',
      ruleType: 'inspection',
      intervalMonths: 24,
      reference: 'FAR 91.413',
      category: 'mandatory',
      partTemplateId: bonanzaTransponder.id,
    },
  });

  // =====================================================
  // CREAR AERONAVES REALES
  // =====================================================
  console.log('Creando aeronave EC-ABC (Cessna 172)...');

  const ecabc = await prisma.aircraft.create({
    data: {
      registration: 'EC-ABC',
      serialNumber: '172-72345',
      modelId: cessna172.id,
      totalHours: 1500,
      totalCycles: 3000,
      year: 2005,
      status: 'active',
    },
  });

  // Clone parts from template for EC-ABC
  const cessnaTemplates = await prisma.partTemplate.findMany({
    where: { modelId: cessna172.id },
    include: { rules: true },
    orderBy: { sortOrder: 'asc' },
  });

  const templateIdToPartId: Record<string, string> = {};

  for (const pt of cessnaTemplates) {
    const part = await prisma.part.create({
      data: {
        name: pt.name,
        serialNumber: null,
        parentId: pt.parentId ? templateIdToPartId[pt.parentId] : null,
        aircraftId: ecabc.id,
        templateId: pt.id,
        hoursSinceNew: 1500,
        hoursSinceOvh: pt.name === 'Motor' ? 500 : 0,
        cyclesSinceNew: 3000,
        status: 'serviceable',
        sortOrder: pt.sortOrder,
      },
    });
    templateIdToPartId[pt.id] = part.id;

    for (const rt of pt.rules) {
      const hoursSinceLast = rt.name === 'Cambio de Aceite' ? 30 : (rt.name?.includes('100 Horas') ? 65 : 200);
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
          hoursSinceLast: hoursSinceLast,
          cyclesSinceLast: 300,
          dateLastCompleted: new Date('2025-06-15'),
          status: 'compliant',
          partId: part.id,
          templateId: rt.id,
        },
      });
    }
  }

  console.log('Creando aeronave EC-XYZ (Piper PA-28)...');
  const ecxyz = await prisma.aircraft.create({
    data: {
      registration: 'EC-XYZ',
      serialNumber: '28-45678',
      modelId: piper28.id,
      totalHours: 800,
      totalCycles: 1500,
      year: 2010,
      status: 'active',
    },
  });

  const piperTemplates = await prisma.partTemplate.findMany({
    where: { modelId: piper28.id },
    include: { rules: true },
    orderBy: { sortOrder: 'asc' },
  });

  const piperTemplateIdToPartId: Record<string, string> = {};

  for (const pt of piperTemplates) {
    const part = await prisma.part.create({
      data: {
        name: pt.name,
        serialNumber: null,
        parentId: pt.parentId ? piperTemplateIdToPartId[pt.parentId] : null,
        aircraftId: ecxyz.id,
        templateId: pt.id,
        hoursSinceNew: 800,
        hoursSinceOvh: pt.name === 'Motor' ? 200 : 0,
        cyclesSinceNew: 1500,
        status: 'serviceable',
        sortOrder: pt.sortOrder,
      },
    });
    piperTemplateIdToPartId[pt.id] = part.id;

    for (const rt of pt.rules) {
      const hoursSinceLast = rt.name === 'Cambio de Aceite' ? 45 : (rt.name?.includes('100 Horas') ? 80 : 150);
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
          hoursSinceLast: hoursSinceLast,
          cyclesSinceLast: 200,
          dateLastCompleted: new Date('2025-09-01'),
          status: 'compliant',
          partId: part.id,
          templateId: rt.id,
        },
      });
    }
  }

  // Make some rules overdue/due_soon for testing
  console.log('Actualizando estados de reglas para demostracion...');

  const oilChangeRules = await prisma.rule.findMany({
    where: { name: 'Cambio de Aceite' },
  });
  for (const rule of oilChangeRules) {
    await prisma.rule.update({
      where: { id: rule.id },
      data: {
        hoursSinceLast: 48,
        status: 'due_soon',
      },
    });
  }

  const annualRules = await prisma.rule.findMany({
    where: { name: 'Inspeccion Anual' },
  });
  for (const rule of annualRules) {
    await prisma.rule.update({
      where: { id: rule.id },
      data: {
        dateLastCompleted: new Date('2024-05-10'),
        dueDate: new Date('2025-05-10'),
        status: 'overdue',
      },
    });
  }

  const hundredHourRules = await prisma.rule.findMany({
    where: { name: 'Inspeccion 100 Horas' },
  });
  for (const rule of hundredHourRules) {
    await prisma.rule.update({
      where: { id: rule.id },
      data: {
        hoursSinceLast: 92,
        status: 'due_soon',
      },
    });
  }

  // Create a sample work order
  console.log('Creando orden de trabajo de ejemplo...');
  const overdueAnnualRule = await prisma.rule.findFirst({
    where: { name: 'Inspeccion Anual', status: 'overdue' },
  });

  if (overdueAnnualRule) {
    const wo = await prisma.workOrder.create({
      data: {
        number: 'WO-2026-001',
        title: 'Inspeccion Anual - EC-ABC',
        description: 'Inspeccion anual programada para la aeronave EC-ABC',
        aircraftId: ecabc.id,
        status: 'open',
        priority: 'high',
        type: 'scheduled',
        assignedTo: 'Taller Mantenimiento A',
        scheduledDate: new Date('2026-06-15'),
      },
    });

    await prisma.workOrderItem.create({
      data: {
        workOrderId: wo.id,
        ruleId: overdueAnnualRule.id,
        description: 'Realizar inspeccion anual segun FAR 91.409(a)(1)',
        status: 'pending',
        sortOrder: 1,
      },
    });
  }

  console.log('Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
