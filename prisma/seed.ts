import { PrismaClient, Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

function generateJobNumber(): string {
  const min = 1000000;
  const num = Math.floor(Math.random() * (9999999 - min + 1)) + min;
  return `TSC-${num}`;
}

function formatCertificateNumber(jobNumber: string, sequence: number): string {
  return `${jobNumber}-${String(sequence).padStart(2, '0')}`;
}

function generateToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

async function main() {
  console.log('🌱 Starting idempotent seed...');

  // ===== COMPANIES =====
  // @ts-ignore - Prisma client types need regeneration
  const companyA = await prisma.company.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'TechSafe Inspections',
      logo: 'https://example.com/logoA.png',
      prefix: 'TSC',
      subscriptionPlan: 'Enterprise'
    }
  });

  await prisma.company.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'EduCert Training',
      logo: 'https://example.com/logoB.png',
      prefix: 'EDC',
      subscriptionPlan: 'Professional'
    }
  });

  console.log('✓ Companies seeded');

  // ===== LOCATIONS =====
  const dubaiLocation = await prisma.location.upsert({
    where: { code_companyId: { companyId: companyA.id, code: 'DXB' } },
    update: {
      name: 'Dubai',
      country: 'UAE',
      emirate: 'Dubai',
      status: 'ACTIVE'
    },
    create: {
      companyId: companyA.id,
      code: 'DXB',
      name: 'Dubai',
      country: 'UAE',
      emirate: 'Dubai',
      status: 'ACTIVE'
    }
  });

  const abuDhabiLocation = await prisma.location.upsert({
    where: { code_companyId: { companyId: companyA.id, code: 'AUH' } },
    update: {
      name: 'Abu Dhabi',
      country: 'UAE',
      emirate: 'Abu Dhabi',
      status: 'ACTIVE'
    },
    create: {
      companyId: companyA.id,
      code: 'AUH',
      name: 'Abu Dhabi',
      country: 'UAE',
      emirate: 'Abu Dhabi',
      status: 'ACTIVE'
    }
  });

  console.log('✓ Locations seeded: Dubai (DXB), Abu Dhabi (AUH)');

  // ===== ACCREDITATION BODIES =====
  const eiacAccred = await prisma.accreditationAuthority.upsert({
    where: { code_companyId: { companyId: companyA.id, code: 'EIAC' } },
    update: { name: 'Emirates International Accreditation Centre', status: 'ACTIVE' },
    create: {
      companyId: companyA.id,
      code: 'EIAC',
      name: 'Emirates International Accreditation Centre',
      status: 'ACTIVE'
    }
  });

  const enasAccred = await prisma.accreditationAuthority.upsert({
    where: { code_companyId: { companyId: companyA.id, code: 'ENAS' } },
    update: { name: 'Emirates National Accreditation System', status: 'ACTIVE' },
    create: {
      companyId: companyA.id,
      code: 'ENAS',
      name: 'Emirates National Accreditation System',
      status: 'ACTIVE'
    }
  });

  console.log('✓ Accreditation bodies seeded: EIAC, ENAS');

  // ===== LOCATION-ACCREDITATION MAPPINGS =====
  await prisma.locationAccreditation.upsert({
    where: { locationId_accreditationId: { locationId: dubaiLocation.id, accreditationId: eiacAccred.id } },
    update: { status: 'VERIFIED', effectiveFrom: new Date() },
    create: {
      companyId: companyA.id,
      locationId: dubaiLocation.id,
      accreditationId: eiacAccred.id,
      status: 'VERIFIED',
      effectiveFrom: new Date()
    }
  });

  await prisma.locationAccreditation.upsert({
    where: { locationId_accreditationId: { locationId: abuDhabiLocation.id, accreditationId: enasAccred.id } },
    update: { status: 'VERIFIED', effectiveFrom: new Date() },
    create: {
      companyId: companyA.id,
      locationId: abuDhabiLocation.id,
      accreditationId: enasAccred.id,
      status: 'VERIFIED',
      effectiveFrom: new Date()
    }
  });

  console.log('✓ Location-accreditation mappings seeded: DXB→EIAC, AUH→ENAS');

  // ===== COMPETENCIES =====
  const competenciesData = [
    { code: 'SAFE-001', name: 'Work at Height Safety', category: 'Safety', validityMonths: 24 },
    { code: 'SAFE-002', name: 'Hazard Identification', category: 'Safety', validityMonths: 24 },
    { code: 'ELE-001', name: 'Basic Electrical Safety', category: 'Electrical', validityMonths: 24 },
    { code: 'ELE-002', name: 'Lockout Tagout (LOTO)', category: 'Electrical', validityMonths: 12 },
    { code: 'MECH-001', name: 'Mechanical Equipment Safety', category: 'Mechanical', validityMonths: 24 },
    { code: 'FIRE-001', name: 'Fire Safety Awareness', category: 'Fire Safety', validityMonths: 24 },
    { code: 'CONF-001', name: 'Site Conduct & PPE', category: 'Compliance', validityMonths: 12 },
  ];

  for (const comp of competenciesData) {
    await prisma.competency.upsert({
      where: { code_companyId: { companyId: companyA.id, code: comp.code } },
      update: {
        name: comp.name,
        description: comp.name,
        category: comp.category,
        validityMonths: comp.validityMonths,
        status: 'ACTIVE'
      },
      create: {
        companyId: companyA.id,
        code: comp.code,
        name: comp.name,
        description: comp.name,
        category: comp.category,
        validityMonths: comp.validityMonths,
        status: 'ACTIVE'
      }
    });
  }
  console.log('✓ Competencies seeded');

  // ===== ROLES =====
  const rolesData = [
    { name: 'ADMIN', description: 'Full system access' },
    { name: 'TRAINING_MANAGER', description: 'Manage courses, sessions, trainees, attendance' },
    { name: 'TRAINER', description: 'Assigned sessions, attendance, training records' },
    { name: 'ASSESSOR', description: 'Assessments, competency decisions' },
    { name: 'INSPECTOR', description: 'Jobs, inspections, findings, evidence' },
    { name: 'REVIEWER', description: 'Review inspections and certificates' },
    { name: 'CERTIFICATE_OFFICER', description: 'Certificate generation, issuance, renewal, revocation' },
    { name: 'CLIENT', description: 'Own jobs, certificates, verification' },
  ];

  for (const roleData of rolesData) {
    await prisma.role.upsert({
      where: { name_companyId: { name: roleData.name, companyId: companyA.id } },
      update: { description: roleData.description },
      create: {
        name: roleData.name,
        description: roleData.description,
        companyId: companyA.id
      }
    });
  }
  console.log('✓ Roles seeded');

  // ===== USERS =====
  const adminRole = await prisma.role.findUnique({ where: { name_companyId: { name: 'ADMIN', companyId: companyA.id } } });
  const trainerRole = await prisma.role.findUnique({ where: { name_companyId: { name: 'TRAINER', companyId: companyA.id } } });
  const assessorRole = await prisma.role.findUnique({ where: { name_companyId: { name: 'ASSESSOR', companyId: companyA.id } } });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@techsafe.com' },
    update: { name: 'Admin User', role: 'ADMIN', roleId: adminRole?.id },
    create: {
      name: 'Admin User',
      email: 'admin@techsafe.com',
      passwordHash: bcrypt.hashSync('adminpass123', 10),
      role: 'ADMIN',
      roleId: adminRole?.id ?? undefined,
      companyId: companyA.id
    }
  });

  const trainerUser = await prisma.user.upsert({
    where: { email: 'trainer@techsafe.com' },
    update: { name: 'Trainer User', role: 'TRAINER', roleId: trainerRole?.id },
    create: {
      name: 'Trainer User',
      email: 'trainer@techsafe.com',
      passwordHash: bcrypt.hashSync('trainerpass123', 10),
      role: 'TRAINER',
      roleId: trainerRole?.id ?? undefined,
      companyId: companyA.id
    }
  });

  await prisma.trainer.upsert({
    where: { userId_companyId: { userId: trainerUser.id, companyId: companyA.id } },
    update: { status: 'ACTIVE' },
    create: {
      companyId: companyA.id,
      userId: trainerUser.id,
      specializations: ['SAFETY', 'ELECTRICAL'],
      qualifications: ['NEBOSH', 'OSHA Instructor'],
      certifications: ['IOSH Managing Safely'],
      status: 'ACTIVE'
    }
  });

  const assessorUser = await prisma.user.upsert({
    where: { email: 'assessor@techsafe.com' },
    update: { name: 'Assessor User', role: 'ASSESSOR', roleId: assessorRole?.id },
    create: {
      name: 'Assessor User',
      email: 'assessor@techsafe.com',
      passwordHash: bcrypt.hashSync('assessorpass123', 10),
      role: 'ASSESSOR',
      roleId: assessorRole?.id ?? undefined,
      companyId: companyA.id
    }
  });

  await prisma.assessor.upsert({
    where: { userId_companyId: { userId: assessorUser.id, companyId: companyA.id } },
    update: { status: 'ACTIVE' },
    create: {
      companyId: companyA.id,
      userId: assessorUser.id,
      competencies: [1, 2, 3, 4, 5],
      qualifications: ['Level 3 Award in Assessment'],
      certifications: ['ISO 17024 Lead Assessor'],
      status: 'ACTIVE'
    }
  });
  console.log('✓ Users, Trainers, Assessors seeded');

  // ===== OPERATOR TRAINING COURSES =====
  const operatorCourses = [
    {
      code: 'DXB-SAFE-101',
      title: 'Work at Height Safety Training (Dubai)',
      description: 'Comprehensive training on work at height safety, fall protection equipment, and rescue procedures.',
      category: 'Safety',
      courseType: 'OPERATOR',
      duration: 480,
      trainingHours: 8,
      assessmentRequired: true,
      practicalAssessmentRequired: true,
      certificateValidityMonths: 24,
      trainerRequirements: 'Certified safety trainer with minimum 3 years experience',
      locationId: dubaiLocation.id,
      accreditationId: eiacAccred.id,
      status: 'PENDING_VERIFICATION',
      version: '1.0',
      competencyCodes: ['SAFE-001'],
    },
    {
      code: 'DXB-ELE-201',
      title: 'Electrical Safety for Operators (Dubai)',
      description: 'Basic electrical safety awareness for non-electrical personnel working near energized equipment.',
      category: 'Electrical',
      courseType: 'OPERATOR',
      duration: 240,
      trainingHours: 4,
      assessmentRequired: true,
      practicalAssessmentRequired: false,
      certificateValidityMonths: 24,
      trainerRequirements: 'Qualified electrical safety instructor',
      locationId: dubaiLocation.id,
      accreditationId: eiacAccred.id,
      status: 'PENDING_VERIFICATION',
      version: '1.0',
      competencyCodes: ['ELE-001'],
    },
    {
      code: 'AUH-SAFE-101',
      title: 'Work at Height Safety Training (Abu Dhabi)',
      description: 'Comprehensive training on work at height safety, fall protection equipment, and rescue procedures.',
      category: 'Safety',
      courseType: 'OPERATOR',
      duration: 480,
      trainingHours: 8,
      assessmentRequired: true,
      practicalAssessmentRequired: true,
      certificateValidityMonths: 24,
      trainerRequirements: 'Certified safety trainer with minimum 3 years experience',
      locationId: abuDhabiLocation.id,
      accreditationId: enasAccred.id,
      status: 'PENDING_VERIFICATION',
      version: '1.0',
      competencyCodes: ['SAFE-001'],
    },
    {
      code: 'AUH-FIRE-301',
      title: 'Fire Safety Fundamentals (Abu Dhabi)',
      description: 'Fire safety awareness, fire prevention, use of extinguishers, and evacuation procedures.',
      category: 'Fire Safety',
      courseType: 'OPERATOR',
      duration: 180,
      trainingHours: 3,
      assessmentRequired: true,
      practicalAssessmentRequired: false,
      certificateValidityMonths: 24,
      trainerRequirements: 'Qualified fire safety instructor',
      locationId: abuDhabiLocation.id,
      accreditationId: enasAccred.id,
      status: 'PENDING_VERIFICATION',
      version: '1.0',
      competencyCodes: ['FIRE-001'],
    },
  ];

  for (const courseData of operatorCourses) {
    const { competencyCodes, certificateValidityMonths, practicalAssessmentRequired, ...rest } = courseData;
    const course = await prisma.trainingCourse.upsert({
      where: { code_companyId: { companyId: companyA.id, code: courseData.code } },
      update: {
        title: courseData.title,
        description: courseData.description,
        category: courseData.category,
        courseType: courseData.courseType,
        duration: courseData.duration,
        trainingHours: courseData.trainingHours,
        assessmentRequired: courseData.assessmentRequired,
        practicalAssessmentRequired: courseData.practicalAssessmentRequired,
        certificateValidityMonths: courseData.certificateValidityMonths,
        trainerRequirements: courseData.trainerRequirements,
        locationId: courseData.locationId,
        accreditationId: courseData.accreditationId,
        status: courseData.status,
        version: courseData.version,
        tags: [courseData.category, courseData.courseType],
      },
      create: {
        companyId: companyA.id,
        ...rest,
        certificateValidityMonths: courseData.certificateValidityMonths,
        practicalAssessmentRequired: courseData.practicalAssessmentRequired,
        tags: [courseData.category, courseData.courseType],
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
      }
    });

    // Create module if not exists
    const existingModule = await prisma.trainingModule.findFirst({
      where: { companyId: companyA.id, courseId: course.id }
    });
    if (!existingModule) {
      await prisma.trainingModule.create({
        data: {
          companyId: companyA.id,
          courseId: course.id,
          title: `${courseData.title} - Core Module`,
          description: `Core module for ${courseData.title}`,
          order: 1,
          duration: courseData.duration,
        }
      });
    }

    // Link competencies
    for (const compCode of competencyCodes) {
      const comp = await prisma.competency.findUnique({
        where: { code_companyId: { companyId: companyA.id, code: compCode } }
      });
      if (comp) {
        await prisma.courseCompetency.upsert({
          where: { courseId_competencyId: { courseId: course.id, competencyId: comp.id } },
          update: { isRequired: true },
          create: { companyId: companyA.id, courseId: course.id, competencyId: comp.id, isRequired: true }
        });
      }
    }
  }
  console.log('✓ Operator training courses seeded');

  // ===== INITIAL TRAINING CERTIFICATION COURSES (19 courses) =====
  const initialCourses = [
    { code: 'EXC-001', title: 'EXCAVATOR OPERATOR', category: 'Operator', courseType: 'OPERATOR', duration: 480, trainingHours: 40, assessmentRequired: true, practicalAssessmentRequired: true, certificateValidityMonths: 36, status: 'ACTIVE' },
    { code: 'FW-001', title: 'FIRE WATCHER', category: 'Safety', courseType: 'SAFETY', duration: 48, trainingHours: 8, assessmentRequired: true, practicalAssessmentRequired: true, certificateValidityMonths: 24, status: 'ACTIVE' },
    { code: 'FM-001', title: 'FLAG MAN', category: 'Safety', courseType: 'SAFETY', duration: 32, trainingHours: 4, assessmentRequired: true, practicalAssessmentRequired: true, certificateValidityMonths: 24, status: 'ACTIVE' },
    { code: 'FL-001', title: 'FORKLIFT OPERATOR', category: 'Operator', courseType: 'OPERATOR', duration: 240, trainingHours: 16, assessmentRequired: true, practicalAssessmentRequired: true, certificateValidityMonths: 36, status: 'ACTIVE' },
    { code: 'LS-001', title: 'LIFTING SUPERVISOR', category: 'Operator', courseType: 'OPERATOR', duration: 160, trainingHours: 20, assessmentRequired: true, practicalAssessmentRequired: true, certificateValidityMonths: 36, status: 'ACTIVE' },
    { code: 'LL-001', title: 'LORRY LOADER OPERATOR', category: 'Operator', courseType: 'OPERATOR', duration: 240, trainingHours: 16, assessmentRequired: true, practicalAssessmentRequired: true, certificateValidityMonths: 36, status: 'ACTIVE' },
    { code: 'RIG-001', title: 'RIGGER', category: 'Operator', courseType: 'OPERATOR', duration: 160, trainingHours: 20, assessmentRequired: true, practicalAssessmentRequired: true, certificateValidityMonths: 36, status: 'ACTIVE' },
    { code: 'RS-001', title: 'RIGGING AND SLINGING', category: 'Operator', courseType: 'OPERATOR', duration: 120, trainingHours: 16, assessmentRequired: true, practicalAssessmentRequired: true, certificateValidityMonths: 36, status: 'ACTIVE' },
    { code: 'ROL-001', title: 'ROLLER OPERATOR', category: 'Operator', courseType: 'OPERATOR', duration: 240, trainingHours: 16, assessmentRequired: true, practicalAssessmentRequired: true, certificateValidityMonths: 36, status: 'ACTIVE' },
    { code: 'SCA-001', title: 'SCAFFOLDING ERECTION AND DISMANTLING', category: 'Operator', courseType: 'OPERATOR', duration: 320, trainingHours: 40, assessmentRequired: true, practicalAssessmentRequired: true, certificateValidityMonths: 36, status: 'ACTIVE' },
    { code: 'SCI-001', title: 'SCAFFOLDING INSPECTOR', category: 'Inspector', courseType: 'INSPECTION', duration: 240, trainingHours: 24, assessmentRequired: true, practicalAssessmentRequired: true, certificateValidityMonths: 36, status: 'ACTIVE' },
    { code: 'SSL-001', title: 'SKID STEER LOADER OPERATOR', category: 'Operator', courseType: 'OPERATOR', duration: 240, trainingHours: 16, assessmentRequired: true, practicalAssessmentRequired: true, certificateValidityMonths: 36, status: 'ACTIVE' },
    { code: 'TH-001', title: 'TELEHANDLER OPERATOR', category: 'Operator', courseType: 'OPERATOR', duration: 240, trainingHours: 16, assessmentRequired: true, practicalAssessmentRequired: true, certificateValidityMonths: 36, status: 'ACTIVE' },
    { code: 'TC-001', title: 'TOWER CRANE OPERATOR', category: 'Operator', courseType: 'OPERATOR', duration: 480, trainingHours: 60, assessmentRequired: true, practicalAssessmentRequired: true, certificateValidityMonths: 36, status: 'ACTIVE' },
    { code: 'VGS-001', title: 'VACUUM GLASS SUCKER OPERATOR', category: 'Operator', courseType: 'OPERATOR', duration: 80, trainingHours: 8, assessmentRequired: true, practicalAssessmentRequired: true, certificateValidityMonths: 24, status: 'ACTIVE' },
    { code: 'VH-001', title: 'VIBRO HAMMER OPERATOR', category: 'Operator', courseType: 'OPERATOR', duration: 160, trainingHours: 16, assessmentRequired: true, practicalAssessmentRequired: true, certificateValidityMonths: 36, status: 'ACTIVE' },
    { code: 'WLD-001', title: 'WELDER', category: 'Technical', courseType: 'TECHNICAL', duration: 480, trainingHours: 80, assessmentRequired: true, practicalAssessmentRequired: true, certificateValidityMonths: 36, status: 'ACTIVE' },
    { code: 'WL-001', title: 'WHEEL LOADER OPERATOR', category: 'Operator', courseType: 'OPERATOR', duration: 240, trainingHours: 16, assessmentRequired: true, practicalAssessmentRequired: true, certificateValidityMonths: 36, status: 'ACTIVE' },
    { code: 'WAH-001', title: 'WORK AT HEIGHT', category: 'Safety', courseType: 'SAFETY', duration: 48, trainingHours: 8, assessmentRequired: true, practicalAssessmentRequired: true, certificateValidityMonths: 24, status: 'ACTIVE' },
  ];

  for (const courseData of initialCourses) {
    const course = await prisma.trainingCourse.upsert({
      where: { code_companyId: { companyId: companyA.id, code: courseData.code } },
      update: {
        title: courseData.title,
        description: `${courseData.title} certification training course`,
        category: courseData.category,
        courseType: courseData.courseType,
        duration: courseData.duration,
        trainingHours: courseData.trainingHours,
        assessmentRequired: courseData.assessmentRequired,
        practicalAssessmentRequired: courseData.practicalAssessmentRequired,
        certificateValidityMonths: courseData.certificateValidityMonths,
        status: courseData.status,
        version: '1.0',
        tags: [courseData.category, courseData.courseType],
        updatedBy: adminUser.id,
      },
      create: {
        companyId: companyA.id,
        ...courseData,
        description: `${courseData.title} certification training course`,
        tags: [courseData.category, courseData.courseType],
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
      }
    });

    // Create module if not exists
    const existingModule = await prisma.trainingModule.findFirst({
      where: { companyId: companyA.id, courseId: course.id }
    });
    if (!existingModule) {
      await prisma.trainingModule.create({
        data: {
          companyId: companyA.id,
          courseId: course.id,
          title: `${courseData.title} - Core Module`,
          description: `Core module for ${courseData.title}`,
          order: 1,
          duration: courseData.duration,
        }
      });
    }
  }
  console.log('✓ Initial training certification courses seeded (19 courses)');

  // ===== CUSTOMER =====
  const customerA = await prisma.customer.upsert({
    where: { id: 1 },
    update: {
      contact: 'ABC Trading',
      email: 'contact@abctrading.com',
      phone: '+971500000000',
    },
    create: {
      id: 1,
      companyId: companyA.id,
      contact: 'ABC Trading',
      email: 'contact@abctrading.com',
      phone: '+971500000000'
    }
  });

  // ===== JOBS =====
  const jobNumber1 = generateJobNumber();
  const job1 = await prisma.job.upsert({
    where: { id: 1 },
    update: {
      companyId: companyA.id,
      customerId: customerA.id,
      jobNumber: jobNumber1,
      type: 'Inspection',
      status: 'PLANNED',
      scheduledDate: new Date(),
      engineerId: adminUser.id
    },
    create: {
      companyId: companyA.id,
      customerId: customerA.id,
      jobNumber: jobNumber1,
      type: 'Inspection',
      status: 'PLANNED',
      scheduledDate: new Date(),
      engineerId: adminUser.id
    }
  });

  console.log('✓ Jobs seeded');

  // ===== CERTIFICATES =====
  const certNumberResult = {
    certificateNumber: formatCertificateNumber(job1.jobNumber, 1),
    sequence: 1,
    jobNumber: job1.jobNumber,
  };
  const verificationToken = generateToken();
  await prisma.certificate.upsert({
    where: { id: 1 },
    update: {
      number: certNumberResult.certificateNumber,
      revision: 0,
      pdfUrl: 'https://example.com/cert1.pdf',
      qrUrl: 'https://example.com/qr1.png',
      status: 'ISSUED',
      complianceAuthority: 'EIAC',
      verificationToken: verificationToken,
      verificationTokenExpiresAt: null,
      certificateType: 'INSPECTION',
    },
    create: {
      companyId: companyA.id,
      jobId: job1.id,
      jobNumber: certNumberResult.jobNumber,
      sequence: certNumberResult.sequence,
      number: certNumberResult.certificateNumber,
      revision: 0,
      pdfUrl: 'https://example.com/cert1.pdf',
      qrUrl: 'https://example.com/qr1.png',
      status: 'ISSUED',
      complianceAuthority: 'EIAC',
      verificationToken: verificationToken,
      certificateType: 'INSPECTION',
      locationId: dubaiLocation.id,
      accreditationId: eiacAccred.id,
    }
  });

  console.log('✅ Seed data created/updated successfully (idempotent)');
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
