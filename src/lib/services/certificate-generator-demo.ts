import { prisma } from '@/lib/prisma';
import { TrainingCertificateGenerator } from '@/lib/services/training-certificate-generator.service';

const CERTIFICATE_TYPES_12 = [
  'Earth Moving Equipment',
  'Scaffolding',
  'Falsework',
  'Tower Cranes',
  'Overhead Cranes',
  'Lifting Gear',
  'Shackles',
  'Slings',
  'Electrical',
  'Fire',
  'Pressure Vessel',
  'Training',
] as const;

const TRAINING_TOPICS: Record<string, string[]> = {
  'Earth Moving Equipment': ['Safety Procedures', 'Equipment Inspection', 'Hazard Identification', 'Emergency Response'],
  'Scaffolding': ['Scaffold Design', 'Load Capacity', 'Assembly/Disassembly', 'Fall Protection'],
  'Falsework': ['Structural Principles', 'Load Analysis', 'Support Systems', 'Safety Checks'],
  'Tower Cranes': ['Crane Operations', 'Load Charts', 'Wind Conditions', 'Maintenance Protocols'],
  'Overhead Cranes': ['Crane Inspection', 'Wire Rope Safety', 'Load Handling', 'Daily Checks'],
  'Lifting Gear': ['Lifting Equipment', 'Inspection Criteria', 'Load Testing', 'Defect Recognition'],
  'Shackles': ['Shackle Types', 'Load Ratings', 'Inspection Points', 'Replacement Criteria'],
  'Slings': ['Sling Materials', 'Capacity Markings', 'Damage Assessment', 'Safe Use'],
  Electrical: ['Lockout/Tagout', 'Voltage Awareness', 'PPE Requirements', 'Electrical Safety'],
  'Fire': ['Fire Prevention', 'Extinguisher Use', 'Evacuation Procedures', 'Fire Detection'],
  'Pressure Vessel': ['Pressure Testing', 'Inspection Intervals', 'Safety Valves', 'Corrosion Monitoring'],
  Training: ['General Safety', 'Risk Assessment', 'Equipment Handling', 'Certification Requirements'],
};

const INSPECTION_DATA: Record<string, { equipment: string; inspector: string; findings: string[] }> = {
  'Earth Moving Equipment': {
    equipment: 'CAT 320 Excavator',
    inspector: 'Eng. Ahmed Al-Maktoum',
    findings: ['Hydraulic system checked', 'Undercarriage condition verified', 'Safety switches functional'],
  },
  Scaffolding: {
    equipment: 'Modular Scaffold System',
    inspector: 'Eng. Sarah Johnson',
    findings: ['Foundation integrity verified', 'Guardrails installed correctly', 'Load capacity confirmed'],
  },
  Falsework: {
    equipment: 'Steel Falsework Structure',
    inspector: 'Eng. Michael Chen',
    findings: ['Load-bearing calculation verified', 'Bracing systems secure', 'All connections checked'],
  },
  'Tower Cranes': {
    equipment: 'Liebherr LTM 1500',
    inspector: 'Eng. David Rodriguez',
    findings: ['Counterweight verified', 'Turntable bearing inspected', 'Hoist rope condition good'],
  },
  'Overhead Cranes': {
    equipment: 'Grove RT530 Crane',
    inspector: 'Eng. Fatima Al-Sayed',
    findings: ['Bridge drive inspected', 'Trolley wheels checked', 'Limit switches tested'],
  },
  'Lifting Gear': {
    equipment: 'Chain Hoist 2 Ton',
    inspector: 'Eng. James Wilson',
    findings: ['Load chain inspected', 'Brake mechanism tested', 'Hook deformation checked'],
  },
  Shackles: {
    equipment: 'Safety Shackles 10mm',
    inspector: 'Eng. Robert Taylor',
    findings: ['Grade verification passed', 'Dimensional accuracy confirmed', 'Surface finish checked'],
  },
  Slings: {
    equipment: 'Wire Rope Slings 5 Ton',
    inspector: 'Eng. Lisa Anderson',
    findings: ['Strand lay inspected', 'End fittings verified', 'Broken wire count within limits'],
  },
  Electrical: {
    equipment: 'Distribution Panel Board',
    inspector: 'Eng. Kevin Patel',
    findings: ['Earthing continuity verified', 'Circuit breaker functionality tested', 'Insulation resistance measured'],
  },
  'Fire': {
    equipment: 'Fire Extinguisher 6kg ABC',
    inspector: 'Eng. Maria Santos',
    findings: ['Extinguisher pressure verified', 'Hose nozzle checked', 'Safety pin intact'],
  },
  'Pressure Vessel': {
    equipment: 'Air Receiver Tank 500L',
    inspector: 'Eng. William Brown',
    findings: ['Hydrostatic test passed', 'Safety valve setting verified', 'External inspection completed'],
  },
  Training: {
    equipment: 'Safety Harness Training Kit',
    inspector: 'Eng. Emma Davis',
    findings: ['Harness fitting assessed', 'Lanyard function tested', 'Fall arrest demonstrated'],
  },
};

async function main() {
  const now = new Date();

  console.log('=== Creating IBMDIGITECH training job and generating certificates ===\n');

  const company = await prisma.company.upsert({
    where: { id: 1 },
    update: { name: 'IBMDIGITECH', logo: 'https://example.com/ibmdigitech-logo.png' },
    create: { name: 'IBMDIGITECH', logo: 'https://example.com/ibmdigitech-logo.png' },
  });

  const userCount = await prisma.user.count({ where: { companyId: company.id, email: 'admin@techsafe.com' } });
  let inspector: Awaited<ReturnType<typeof prisma.user.findFirst>>;
  if (userCount === 0) {
    inspector = await prisma.user.create({
      data: {
        companyId: company.id,
        name: 'Ahmed Ali',
        email: 'inspector@ibmdigitech.com',
        passwordHash: '$2a$10$placeholder',
        role: 'inspector',
      },
    });
  } else {
    inspector = await prisma.user.findFirst({ where: { companyId: company.id, email: 'inspector@ibmdigitech.com' } });
    if (!inspector) {
      inspector = await prisma.user.create({
        data: {
          companyId: company.id,
          name: 'Ahmed Ali',
          email: 'inspector@ibmdigitech.com',
          passwordHash: '$2a$10$placeholder',
          role: 'inspector',
        },
      });
    }
  }

  const customer = await prisma.customer.upsert({
    where: { id: 1 },
    update: { name: 'TechSafe Industrial Solutions', companyId: company.id },
    create: { name: 'TechSafe Industrial Solutions', companyId: company.id },
  });

  const location = await prisma.location.upsert({
    where: { id: 1 },
    update: { code: 'DXB-001', name: 'Dubai Industrial Zone', country: 'UAE', companyId: company.id },
    create: { code: 'DXB-001', name: 'Dubai Industrial Zone', country: 'UAE', companyId: company.id },
  });

  const accreditation = await prisma.accreditationAuthority.upsert({
    where: { id: 1 },
    update: { code: 'MOH-PRL', name: 'Ministry of Human Resources & Emiratisation - Professional Licensing', companyId: company.id },
    create: { code: 'MOH-PRL', name: 'Ministry of Human Resources & Emiratisation - Professional Licensing', companyId: company.id },
  });

  const jobNumber = `J2026-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  console.log(`Creating job: ${jobNumber}`);

  const job = await prisma.job.create({
    data: {
      companyId: company.id,
      customerId: customer.id,
      jobNumber,
      type: 'TRAINING_INSPECTION',
      status: 'ACTIVE',
      scheduledDate: now,
      site: 'Dubai Industrial Zone - Plot 45',
      locationId: location.id,
      contactName: 'Mohammed Al-Farsi',
      contactPhone: '+971-50-123-4567',
      contactEmail: 'mohammed@techsafe.ae',
      scope: 'Complete training and inspection services for all 12 certificate types',
      priority: 'HIGH',
    },
  });

  console.log(`Job created with ID: ${job.id}\n`);

  // Create a trainee
  const trainee = await prisma.trainee.upsert({
    where: { id: 56 },
    update: {
      firstName: 'Omar',
      lastName: 'Hassan',
      employeeId: 'TS-EMP-7842',
      emiratesId: '784-12-1234567-001',
    },
    create: {
      companyId: company.id,
      firstName: 'Omar',
      lastName: 'Hassan',
      email: `omar.hassan.${Date.now()}@techsafe.ae`,
      employeeId: 'TS-EMP-7842',
      emiratesId: '784-12-1234567-001',
      companyName: 'TechSafe Industrial Solutions',
      jobTitle: 'Equipment Operator',
      nationality: 'UAE',
      locationId: location.id,
      status: 'active',
    },
  });

  console.log(`Trainee created: ${trainee.firstName} ${trainee.lastName} (ID: ${trainee.id})\n`);

  // Create training course
  const trainingCourse = await prisma.trainingCourse.upsert({
    where: { id: 50 },
    update: {
      title: 'IBMDIGITECH Comprehensive Safety Training',
      code: `TS-SAFETY-${Date.now()}`,
    },
    create: {
      companyId: company.id,
      title: 'IBMDIGITECH Comprehensive Safety Training',
      description: 'Complete safety training for all 12 certificate types',
      code: `TS-SAFETY-${Date.now()}`,
      status: 'ACTIVE',
      courseType: 'SAFETY',
      category: 'Industrial Safety',
      trainingHours: 40,
      assessmentRequired: true,
      practicalAssessmentRequired: true,
      certificateValidityMonths: 12,
      locationId: location.id,
      accreditationId: accreditation.id,
      version: '2.0',
      tags: ['safety', 'compliance', 'industrial'],
    },
  });

  console.log(`Training Course created: ${trainingCourse.title} (ID: ${trainingCourse.id})\n`);

  const enrollment = await prisma.$transaction(async (tx) => {
    await tx.enrollment.deleteMany({ where: { traineeId: trainee.id, courseId: trainingCourse.id } });
    return tx.enrollment.create({
      data: {
        companyId: company.id,
        courseId: trainingCourse.id,
        traineeId: trainee.id,
        locationId: location.id,
        jobId: job.id,
        jobNumber: job.jobNumber,
        trainingDate: now,
        timesheetNumber: `TS-${job.id}-${Math.floor(Math.random() * 100)}`,
        photoUrl: 'https://example.com/trainee-omarb-photo.jpg',
        idUrl: 'https://example.com/trainee-omarb-id.jpg',
        status: 'completed',
      },
    });
  });

  console.log(`Enrollment created (ID: ${enrollment.id})\n`);

  await prisma.$executeRaw`SELECT 1`;

  console.log(''.padEnd(80, '='));
  console.log('TRAINING CERTIFICATES - Generating for all 12 certificate types');
  console.log(''.padEnd(80, '='));
  console.log('');

  for (const certType of CERTIFICATE_TYPES_12) {
    const topics = TRAINING_TOPICS[certType] ?? ['General Safety Training'];
    const certInput = {
      certificateNumber: `${job.jobNumber}-T-${CERTIFICATE_TYPES_12.indexOf(certType) + 1}`,
      companyLogo: company.logo ?? 'https://example.com/ibmdigitech-logo.png',
      trainerSignature: 'https://example.com/signature-ahmed-ali.png',
      companyStamp: 'https://example.com/stamp-ibmdigitech.png',
      jobNumber: job.jobNumber,
      traineeName: `${trainee.firstName} ${trainee.lastName}`,
      traineeId: trainee.employeeId ?? trainee.emiratesId ?? '',
      employerName: trainee.companyName ?? company.name,
      trainingTitle: `${certType} Safety Training`,
      topicsCovered: topics,
      trainingDate: now.toLocaleDateString('en-AE', { year: 'numeric', month: 'short', day: 'numeric' }),
      validUntil: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-AE', { year: 'numeric', month: 'short', day: 'numeric' }),
      approvedBy: inspector.name,
      footerDisclaimer: 'This certificate is issued by IBMDIGITECH. All rights reserved.',
    };

    const certJSON = TrainingCertificateGenerator.generateJSON(certInput);
    console.log(`\n--- Training Certificate: ${certType} ---`);
    console.log(JSON.stringify(certJSON, null, 2));

    const certificate = await prisma.certificate.create({
      data: {
        companyId: company.id,
        jobId: job.id,
        jobNumber: job.jobNumber,
        sequence: CERTIFICATE_TYPES_12.indexOf(certType) + 1,
        number: certInput.certificateNumber,
        certificateType: 'TRAINING',
        holderName: `${trainee.firstName} ${trainee.lastName}`,
        holderCompany: trainee.companyName ?? company.name,
        issueDate: now,
        expiryDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
        approvedBy: inspector.id,
        status: 'ISSUED',
        pdfUrl: `https://example.com/certificates/${certInput.certificateNumber}/pdf`,
      },
    });
    console.log(`  [DB] Certificate record created (Cert ID: ${certificate.id})`);
  }

  console.log('\n');
  console.log(''.padEnd(80, '='));
  console.log('INSPECTION CERTIFICATES - Generating for all 12 certificate types');
  console.log(''.padEnd(80, '='));

  for (const certType of CERTIFICATE_TYPES_12) {
    const inspData = INSPECTION_DATA[certType];
    const certInput = {
      certificateNumber: `${job.jobNumber}-I-${CERTIFICATE_TYPES_12.indexOf(certType) + 1}`,
      companyLogo: company.logo ?? 'https://example.com/ibmdigitech-logo.png',
      trainerSignature: 'https://example.com/signature-ahmed-ali.png',
      companyStamp: 'https://example.com/stamp-ibmdigitech.png',
      jobNumber: job.jobNumber,
      traineeName: inspector.name,
      traineeId: `INSP-${inspector.id}`,
      employerName: company.name,
      trainingTitle: `${inspData.equipment} - ${certType} Inspection`,
      topicsCovered: inspData.findings,
      trainingDate: now.toLocaleDateString('en-AE', { year: 'numeric', month: 'short', day: 'numeric' }),
      validUntil: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toLocaleDateString('en-AE', { year: 'numeric', month: 'short', day: 'numeric' }),
      approvedBy: inspector.name,
      footerDisclaimer: 'This certificate is issued by IBMDIGITECH. All rights reserved.',
    };

    const certJSON = TrainingCertificateGenerator.generateJSON(certInput);
    console.log(`\n--- Inspection Certificate: ${certType} (${inspData.equipment}) ---`);
    console.log(JSON.stringify(certJSON, null, 2));

    const inspection = await prisma.inspection.create({
      data: {
        companyId: company.id,
        jobId: job.id,
        inspectorId: inspector.id,
        locationId: location.id,
        inspectionType: certType,
        equipmentAsset: inspData.equipment,
        date: now,
        status: 'PASSED',
        result: 'PASSED',
        reviewStatus: 'APPROVED',
        approvalStatus: 'APPROVED',
        checklistType: 'FULL',
        findings: JSON.stringify(inspData.findings.reduce((acc, f, i) => ({ ...acc, [`item_${i + 1}`]: { value: f, status: 'PASS' } }), {})),
      },
    });

    const certificate = await prisma.certificate.create({
      data: {
        companyId: company.id,
        jobId: job.id,
        jobNumber: job.jobNumber,
        sequence: 12 + CERTIFICATE_TYPES_12.indexOf(certType) + 1,
        number: certInput.certificateNumber,
        certificateType: 'INSPECTION',
        holderName: inspector.name,
        holderCompany: company.name,
        inspectionId: inspection.id,
        locationId: location.id,
        accreditationId: accreditation.id,
        issueDate: now,
        expiryDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000),
        approvedBy: inspector.id,
        status: 'ISSUED',
        pdfUrl: `https://example.com/certificates/${certInput.certificateNumber}/pdf`,
        complianceAuthority: accreditation.name,
      },
    });
    console.log(`  [DB] Certificate record created (Cert ID: ${certificate.id}, Inspection ID: ${inspection.id})`);
  }

  console.log('\n');
  console.log(''.padEnd(80, '='));
  console.log('SUMMARY');
  console.log(''.padEnd(80, '='));
  const certCount = await prisma.certificate.count({ where: { jobId: job.id } });
  const trainingCerts = await prisma.certificate.count({ where: { jobId: job.id, certificateType: 'TRAINING' } });
  const inspectionCerts = await prisma.certificate.count({ where: { jobId: job.id, certificateType: 'INSPECTION' } });
  console.log(`Job: ${job.jobNumber} (ID: ${job.id})`);
  console.log(`Company: ${company.name}`);
  console.log(`Trainee: ${trainee.firstName} ${trainee.lastName} (${trainee.employeeId})`);
  console.log(`Inspector: ${inspector.name}`);
  console.log(`Location: ${location.name}, ${location.country}`);
  console.log(`Accreditation: ${accreditation.name}`);
  console.log(`\nCertificates Created: ${certCount} (Training: ${trainingCerts}, Inspection: ${inspectionCerts})`);
  console.log('');
  console.log('=== All certificate generation complete ===');
}

main()
  .catch(async (e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
