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

  // ===== CERTIFICATE VALIDITY RULES =====
  const validityRules = [
    // Lifting and man-related equipment - 6 months
    { name: 'Forklift', equipmentCategory: 'FORKLIFT', certificateType: 'INSPECTION', validityMonths: 6, isDefault: false, isActive: true },
    { name: 'Mobile Crane', equipmentCategory: 'CRANE', certificateType: 'INSPECTION', validityMonths: 6, isDefault: false, isActive: true },
    { name: 'Tower Crane', equipmentCategory: 'CRANE', certificateType: 'INSPECTION', validityMonths: 6, isDefault: false, isActive: true },
    { name: 'Overhead Crane', equipmentCategory: 'CRANE', certificateType: 'INSPECTION', validityMonths: 6, isDefault: false, isActive: true },
    { name: 'Manlift / MEWP', equipmentCategory: 'MANLIFT', certificateType: 'INSPECTION', validityMonths: 6, isDefault: false, isActive: true },
    { name: 'Hoist / Winch', equipmentCategory: 'HOIST', certificateType: 'INSPECTION', validityMonths: 6, isDefault: false, isActive: true },
    { name: 'Rigging Equipment', equipmentCategory: 'RIGGING', certificateType: 'INSPECTION', validityMonths: 6, isDefault: false, isActive: true },
    
    // Earth moving equipment - 1 year
    { name: 'Excavator', equipmentCategory: 'EXCAVATOR', certificateType: 'INSPECTION', validityMonths: 12, isDefault: false, isActive: true },
    { name: 'Loader', equipmentCategory: 'LOADER', certificateType: 'INSPECTION', validityMonths: 12, isDefault: false, isActive: true },
    { name: 'Dozer / Bulldozer', equipmentCategory: 'DOZER', certificateType: 'INSPECTION', validityMonths: 12, isDefault: false, isActive: true },
    { name: 'Grader', equipmentCategory: 'GRADER', certificateType: 'INSPECTION', validityMonths: 12, isDefault: false, isActive: true },
    { name: 'Roller / Compactor', equipmentCategory: 'ROLLER', certificateType: 'INSPECTION', validityMonths: 12, isDefault: false, isActive: true },
    { name: 'Backhoe', equipmentCategory: 'BACKHOE', certificateType: 'INSPECTION', validityMonths: 12, isDefault: false, isActive: true },
    { name: 'Skid Steer', equipmentCategory: 'SKID_STEER', certificateType: 'INSPECTION', validityMonths: 12, isDefault: false, isActive: true },
    { name: 'Telehandler', equipmentCategory: 'TELEHANDLER', certificateType: 'INSPECTION', validityMonths: 12, isDefault: false, isActive: true },
    { name: 'Dump Truck', equipmentCategory: 'DUMP_TRUCK', certificateType: 'INSPECTION', validityMonths: 12, isDefault: false, isActive: true },
    
    // False work scaffold/shackle - 6 months
    { name: 'Scaffolding', equipmentCategory: 'SCAFFOLD', certificateType: 'INSPECTION', validityMonths: 6, isDefault: false, isActive: true },
    { name: 'Shackle / Lifting Accessories', equipmentCategory: 'SHACKLE', certificateType: 'INSPECTION', validityMonths: 6, isDefault: false, isActive: true },
    { name: 'Falsework', equipmentCategory: 'FALSEWORK', certificateType: 'INSPECTION', validityMonths: 6, isDefault: false, isActive: true },
    
    // Training certificates - typically 3 years for operator training, 1-2 years for safety
    { name: 'Operator Training', equipmentCategory: 'OPERATOR', certificateType: 'TRAINING', validityMonths: 36, isDefault: false, isActive: true },
    { name: 'Safety Training', equipmentCategory: 'SAFETY', certificateType: 'TRAINING', validityMonths: 24, isDefault: false, isActive: true },
    { name: 'Inspector Training', equipmentCategory: 'INSPECTOR', certificateType: 'TRAINING', validityMonths: 36, isDefault: false, isActive: true },
    { name: 'General Training', equipmentCategory: 'GENERAL', certificateType: 'TRAINING', validityMonths: 24, isDefault: true, isActive: true },
  ];

  for (const rule of validityRules) {
    await prisma.certificateValidityRule.upsert({
      where: { companyId_name: { companyId: companyA.id, name: rule.name } },
      update: {
        equipmentCategory: rule.equipmentCategory,
        certificateType: rule.certificateType,
        validityMonths: rule.validityMonths,
        isActive: rule.isActive,
        isDefault: rule.isDefault,
        description: `Validity rule for ${rule.name} (${rule.certificateType})`,
      },
      create: {
        companyId: companyA.id,
        name: rule.name,
        equipmentCategory: rule.equipmentCategory,
        certificateType: rule.certificateType,
        validityMonths: rule.validityMonths,
        isActive: rule.isActive,
        isDefault: rule.isDefault,
        description: `Validity rule for ${rule.name} (${rule.certificateType})`,
      },
    });
  }
  console.log('✓ Certificate validity rules seeded');

  // ===== CERTIFICATE TEMPLATES =====
  // Training Certificate Template
  const trainingCertTemplate = {
    companyId: companyA.id,
    name: 'Training Certificate - IBM Digitech',
    description: 'Training completion certificate with trainee details, ID documents, and trainer signatures',
    type: 'TRAINING',
    isDefault: true,
    isActive: true,
    content: JSON.stringify({
      pageSize: 'A4',
      orientation: 'portrait',
      header: {
        companyLogo: '/logos/ibm-digitech.svg',
        accreditationLogo: '/logos/eiac.svg',
        companyName: 'IBM Digitech Technical Services',
        address: 'Business Bay, Dubai, United Arab Emirates',
        contact: {
          phone: '+971-XX-XXXXXXX',
          email: 'admin@ibmdigitech.com'
        }
      },
      certificateType: 'Training',
      traineeInformation: {
        traineeName: '{{holderName}}',
        traineePhoto: '{{photoUrl}}',
        identityDocuments: [
          {
            documentType: '{{idTypeUsed}}',
            documentNumber: '{{idNumber}}',
            documentImage: '{{idDocumentUrl}}'
          }
        ],
        employeeOf: '{{holderCompany}}'
      },
      trainingInformation: {
        trainingCourse: '{{courseTitle}}',
        trainingCategory: '{{courseCategory}}',
        trainingLevel: '{{courseLevel}}',
        topicsCovered: '{{topicsCovered}}',
        heldOn: '{{trainingDate}}',
        validUntil: '{{expiryDate}}'
      },
      trainerDetails: {
        approvedBy: 'Training Manager',
        trainerName: '{{trainerName}}',
        trainerId: '{{trainerId}}',
        trainerSignature: '{{trainerSignatureUrl}}'
      },
      verificationSection: {
        qrCode: '{{qrUrl}}',
        certificateHash: '{{verificationToken}}',
        verificationUrl: 'https://verify.ibmdigitech.com/{{certificateNumber}}'
      },
      certificateFooter: {
        terms: [
          'This certificate is valid only until the stated expiry date.',
          'This certificate shall not be reproduced except in full.',
          'IBM Digitech is not liable for any injury or damage caused by negligent operation or misuse.',
          'Validity applies only to the operator trained under the conditions of this program.'
        ],
        footerCode: 'IBM-DIGITECH-TRN-001'
      }
    }),
    createdBy: adminUser.id,
  };

  // Inspection Certificate Template
  const inspectionCertTemplate = {
    companyId: companyA.id,
    name: 'Inspection Certificate - IBM Digitech',
    description: 'Equipment inspection certificate with checklist, findings, and inspector signatures',
    type: 'INSPECTION',
    isDefault: true,
    isActive: true,
    content: JSON.stringify({
      pageSize: 'A4',
      orientation: 'portrait',
      header: {
        companyLogo: '/logos/ibm-digitech.svg',
        accreditationLogo: '/logos/eiac_or_enas.svg',
        companyName: 'IBM Digitech Technical Services',
        address: 'Business Bay, Dubai, United Arab Emirates',
        contact: {
          phone: '+971-XX-XXXXXXX',
          email: 'admin@ibmdigitech.com'
        }
      },
      certificateType: 'Inspection',
      generalInformation: {
        companyName: '{{holderCompany}}',
        timeSheetNo: '{{timesheetNumber}}',
        typeOfInspection: '{{inspectionType}}',
        procedureNo: '{{procedureNumber}}',
        dateOfInspection: '{{inspectionDate}}',
        referenceStandard: '{{referenceStandard}}',
        location: '{{locationName}}',
        testingEquipmentDetails: '{{testingEquipment}}',
        previousInspectionDetails: '{{previousInspection}}',
        result: '{{result}}'
      },
      equipmentDetails: {
        serialNo: '{{equipmentSerialNumber}}',
        description: '{{equipmentDescription}}',
        manufacturerYear: '{{manufacturerYear}}'
      },
      inspectionDetails: {
        model: '{{equipmentModel}}',
        quantity: '{{quantity}}',
        powerSupply: '{{powerSupply}}',
        size: '{{size}}',
        swl: '{{swl}}',
        testLoad: '{{testLoad}}',
        nextInspectionDate: '{{nextInspectionDate}}',
        lastThoroughExamination: '{{lastThoroughExamination}}',
        lastProofLoadTest: '{{lastProofLoadTest}}',
        nextProofLoadTestDate: '{{nextProofLoadTestDate}}'
      },
      inspectionChecklist: [
        {
          category: 'Documentations & General',
          items: [
            { description: 'Manufacturer manual', status: '{{doc_manual}}', remark: '{{doc_manual_remark}}' },
            { description: 'Previous Certificate', status: '{{doc_previous_cert}}', remark: '{{doc_previous_cert_remark}}' },
            { description: 'Maintenance record', status: '{{doc_maintenance}}', remark: '{{doc_maintenance_remark}}' },
            { description: 'Covid-19 Precautions', status: '{{doc_covid}}', remark: '{{doc_covid_remark}}' },
            { description: 'PPE', status: '{{doc_ppe}}', remark: '{{doc_ppe_remark}}' }
          ]
        },
        {
          category: 'Condition',
          items: [
            { description: 'chain / wire rope', status: '{{cond_chain_rope}}', remark: '{{cond_chain_rope_remark}}' },
            { description: 'Guards', status: '{{cond_guards}}', remark: '{{cond_guards_remark}}' },
            { description: 'cracks & deformation', status: '{{cond_cracks}}', remark: '{{cond_cracks_remark}}' },
            { description: 'Welding Joints', status: '{{cond_welding}}', remark: '{{cond_welding_remark}}' },
            { description: 'Anchor Bolts', status: '{{cond_anchor}}', remark: '{{cond_anchor_remark}}' },
            { description: 'Corrosion', status: '{{cond_corrosion}}', remark: '{{cond_corrosion_remark}}' },
            { description: 'Lifting Point', status: '{{cond_lifting}}', remark: '{{cond_lifting_remark}}' },
            { description: 'Deformation', status: '{{cond_deformation}}', remark: '{{cond_deformation_remark}}' },
            { description: 'Fork (if any)', status: '{{cond_fork}}', remark: '{{cond_fork_remark}}' },
            { description: 'Load Test', status: '{{cond_load_test}}', remark: '{{cond_load_test_remark}}' },
            { description: 'General condition on structure', status: '{{cond_general}}', remark: '{{cond_general_remark}}' }
          ]
        },
        {
          category: 'Electrical System',
          items: [
            { description: 'Electrical Cable Insulation', status: '{{elec_cable}}', remark: '{{elec_cable_remark}}' },
            { description: 'ON & OFF Switch', status: '{{elec_switch}}', remark: '{{elec_switch_remark}}' },
            { description: 'Earthing Connection', status: '{{elec_earthing}}', remark: '{{elec_earthing_remark}}' },
            { description: 'General Condition on electrical', status: '{{elec_general}}', remark: '{{elec_general_remark}}' }
          ]
        },
        {
          category: 'Others',
          items: [
            { description: 'Others', status: '{{other_items}}', remark: '{{other_items_remark}}' }
          ]
        }
      ],
      inspectionFindings: {
        findings: '{{findings}}',
        criticalFindings: '{{criticalFindings}}'
      },
      inspectorDetails: {
        inspectedBy: '{{inspectorName}}',
        approvedBy: '{{approverName}}',
        inspectorSignature: '{{inspectorSignatureUrl}}',
        approverSignature: '{{approverSignatureUrl}}'
      },
      certificateFooter: {
        terms: [
          'Certificate valid only until expiry date.',
          'Invalid if equipment relocated, modified, repaired, or altered.',
          'Certificate shall not be reproduced except in full.',
          'IBM Digitech is not liable for misuse or improper operation.'
        ],
        footerCode: 'IBM-DIGITECH-CER-001'
      }
    }),
    createdBy: adminUser.id,
  };

  // Create/Update Training Certificate Template
  await prisma.certificateTemplate.upsert({
    where: { companyId_name: { companyId: companyA.id, name: trainingCertTemplate.name } },
    update: trainingCertTemplate,
    create: trainingCertTemplate,
  });
  console.log('✓ Training certificate template seeded');

  // Create/Update Inspection Certificate Template
  await prisma.certificateTemplate.upsert({
    where: { companyId_name: { companyId: companyA.id, name: inspectionCertTemplate.name } },
    update: inspectionCertTemplate,
    create: inspectionCertTemplate,
  });
  console.log('✓ Inspection certificate template seeded');

  // ===== INSPECTION CHECKLIST TEMPLATES =====
  
  // Forklift Checklist Template
  const forkliftTemplate = await prisma.checklistTemplate.upsert({
    where: { companyId_name: { companyId: companyA.id, name: 'Forklift Inspection Checklist' } },
    update: {
      companyId: companyA.id,
      certificateType: 'INSPECTION',
      equipmentType: 'FORKLIFT',
      checklistType: 'NORMAL',
      authority: 'EIAC',
      version: '1.0',
      status: 'ACTIVE',
      createdBy: adminUser.id,
    },
    create: {
      companyId: companyA.id,
      name: 'Forklift Inspection Checklist',
      certificateType: 'INSPECTION',
      equipmentType: 'FORKLIFT',
      checklistType: 'NORMAL',
      authority: 'EIAC',
      version: '1.0',
      status: 'ACTIVE',
      createdBy: adminUser.id,
    },
  });

  // Create forklift checklist items
  const forkliftItems = [
    { section: 'Documentations & General', itemNumber: 'DG-01', description: 'Manufacturer manual', isRequired: true, referenceStd: 'ISO 3691-1', order: 1 },
    { section: 'Documentations & General', itemNumber: 'DG-02', description: 'Previous Certificate', isRequired: true, referenceStd: '', order: 2 },
    { section: 'Documentations & General', itemNumber: 'DG-03', description: 'Maintenance record', isRequired: true, referenceStd: '', order: 3 },
    { section: 'Documentations & General', itemNumber: 'DG-04', description: 'Covid-19 Precautions', isRequired: false, referenceStd: '', order: 4 },
    { section: 'Documentations & General', itemNumber: 'DG-05', description: 'PPE', isRequired: true, referenceStd: '', order: 5 },
    { section: 'Condition', itemNumber: 'CN-01', description: 'chain / wire rope', isRequired: true, referenceStd: '', order: 6 },
    { section: 'Condition', itemNumber: 'CN-02', description: 'Guards', isRequired: true, referenceStd: '', order: 7 },
    { section: 'Condition', itemNumber: 'CN-03', description: 'cracks & deformation', isRequired: true, referenceStd: '', order: 8 },
    { section: 'Condition', itemNumber: 'CN-04', description: 'Welding Joints', isRequired: true, referenceStd: '', order: 9 },
    { section: 'Condition', itemNumber: 'CN-05', description: 'Anchor Bolts', isRequired: true, referenceStd: '', order: 10 },
    { section: 'Condition', itemNumber: 'CN-06', description: 'Corrosion', isRequired: true, referenceStd: '', order: 11 },
    { section: 'Condition', itemNumber: 'CN-07', description: 'Lifting Point', isRequired: true, referenceStd: '', order: 12 },
    { section: 'Condition', itemNumber: 'CN-08', description: 'Deformation', isRequired: true, referenceStd: '', order: 13 },
    { section: 'Condition', itemNumber: 'CN-09', description: 'Fork (if any)', isRequired: true, referenceStd: 'ISO 5057', order: 14 },
    { section: 'Condition', itemNumber: 'CN-10', description: 'Load Test', isRequired: true, referenceStd: '', order: 15 },
    { section: 'Condition', itemNumber: 'CN-11', description: 'General condition on structure', isRequired: true, referenceStd: '', order: 16 },
    { section: 'Electrical System', itemNumber: 'EL-01', description: 'Electrical Cable Insulation', isRequired: true, referenceStd: '', order: 17 },
    { section: 'Electrical System', itemNumber: 'EL-02', description: 'ON & OFF Switch', isRequired: true, referenceStd: '', order: 18 },
    { section: 'Electrical System', itemNumber: 'EL-03', description: 'Earthing Connection', isRequired: true, referenceStd: '', order: 19 },
    { section: 'Electrical System', itemNumber: 'EL-04', description: 'General Condition on electrical', isRequired: true, referenceStd: '', order: 20 },
    { section: 'Others', itemNumber: 'OT-01', description: 'Others', isRequired: false, referenceStd: '', order: 21 },
  ];

  for (const item of forkliftItems) {
    await prisma.checklistItem.upsert({
      where: { templateId_itemNumber: { templateId: forkliftTemplate.id, itemNumber: item.itemNumber } },
      update: { ...item, templateId: forkliftTemplate.id, companyId: companyA.id },
      create: { ...item, templateId: forkliftTemplate.id, companyId: companyA.id },
    });
  }

  // Crane Checklist Template
  const craneTemplate = await prisma.checklistTemplate.upsert({
    where: { companyId_name: { companyId: companyA.id, name: 'Crane Inspection Checklist' } },
    update: {
      companyId: companyA.id,
      certificateType: 'INSPECTION',
      equipmentType: 'CRANE',
      checklistType: 'NORMAL',
      authority: 'EIAC',
      version: '1.0',
      status: 'ACTIVE',
      createdBy: adminUser.id,
    },
    create: {
      companyId: companyA.id,
      name: 'Crane Inspection Checklist',
      certificateType: 'INSPECTION',
      equipmentType: 'CRANE',
      checklistType: 'NORMAL',
      authority: 'EIAC',
      version: '1.0',
      status: 'ACTIVE',
      createdBy: adminUser.id,
    },
  });

  const craneItems = [
    { section: 'Documentations & General', itemNumber: 'DG-01', description: 'Manufacturer manual', isRequired: true, referenceStd: 'ISO 4309', order: 1 },
    { section: 'Documentations & General', itemNumber: 'DG-02', description: 'Previous Certificate', isRequired: true, referenceStd: '', order: 2 },
    { section: 'Documentations & General', itemNumber: 'DG-03', description: 'Maintenance record', isRequired: true, referenceStd: '', order: 3 },
    { section: 'Documentations & General', itemNumber: 'DG-04', description: 'Load test certificate', isRequired: true, referenceStd: '', order: 4 },
    { section: 'Documentations & General', itemNumber: 'DG-05', description: 'PPE', isRequired: true, referenceStd: '', order: 5 },
    { section: 'Structure', itemNumber: 'ST-01', description: 'Main frame & boom', isRequired: true, referenceStd: '', order: 6 },
    { section: 'Structure', itemNumber: 'ST-02', description: 'Welding joints & bolts', isRequired: true, referenceStd: '', order: 7 },
    { section: 'Structure', itemNumber: 'ST-03', description: 'Corrosion protection', isRequired: true, referenceStd: '', order: 8 },
    { section: 'Structure', itemNumber: 'ST-04', description: 'Outriggers / stabilizers', isRequired: true, referenceStd: '', order: 9 },
    { section: 'Wire Ropes & Chains', itemNumber: 'WR-01', description: 'Hoist rope condition', isRequired: true, referenceStd: 'ISO 4309', order: 10 },
    { section: 'Wire Ropes & Chains', itemNumber: 'WR-02', description: 'Rope terminations', isRequired: true, referenceStd: '', order: 11 },
    { section: 'Wire Ropes & Chains', itemNumber: 'WR-03', description: 'Sheaves & drums', isRequired: true, referenceStd: '', order: 12 },
    { section: 'Wire Ropes & Chains', itemNumber: 'WR-04', description: 'Chain slings & hooks', isRequired: true, referenceStd: '', order: 13 },
    { section: 'Electrical System', itemNumber: 'EL-01', description: 'Cable insulation & routing', isRequired: true, referenceStd: '', order: 14 },
    { section: 'Electrical System', itemNumber: 'EL-02', description: 'Limit switches', isRequired: true, referenceStd: '', order: 15 },
    { section: 'Electrical System', itemNumber: 'EL-03', description: 'Emergency stop', isRequired: true, referenceStd: '', order: 16 },
    { section: 'Electrical System', itemNumber: 'EL-04', description: 'Earthing & bonding', isRequired: true, referenceStd: '', order: 17 },
    { section: 'Safety Devices', itemNumber: 'SD-01', description: 'Load moment indicator (LMI)', isRequired: true, referenceStd: '', order: 18 },
    { section: 'Safety Devices', itemNumber: 'SD-02', description: 'Anti-two block device', isRequired: true, referenceStd: '', order: 19 },
    { section: 'Safety Devices', itemNumber: 'SD-03', description: 'Boom angle indicator', isRequired: true, referenceStd: '', order: 20 },
    { section: 'Safety Devices', itemNumber: 'SD-04', description: 'Radius indicator', isRequired: true, referenceStd: '', order: 21 },
    { section: 'Load Test', itemNumber: 'LT-01', description: 'Rated load test', isRequired: true, referenceStd: '', order: 22 },
    { section: 'Load Test', itemNumber: 'LT-02', description: 'Overload test (125%)', isRequired: true, referenceStd: '', order: 23 },
    { section: 'Load Test', itemNumber: 'LT-03', description: 'Deflection measurements', isRequired: true, referenceStd: '', order: 24 },
    { section: 'Others', itemNumber: 'OT-01', description: 'Others', isRequired: false, referenceStd: '', order: 25 },
  ];

  for (const item of craneItems) {
    await prisma.checklistItem.upsert({
      where: { templateId_itemNumber: { templateId: craneTemplate.id, itemNumber: item.itemNumber } },
      update: { ...item, templateId: craneTemplate.id, companyId: companyA.id },
      create: { ...item, templateId: craneTemplate.id, companyId: companyA.id },
    });
  }

  // Excavator Checklist Template
  const excavatorTemplate = await prisma.checklistTemplate.upsert({
    where: { companyId_name: { companyId: companyA.id, name: 'Excavator Inspection Checklist' } },
    update: {
      companyId: companyA.id,
      certificateType: 'INSPECTION',
      equipmentType: 'EXCAVATOR',
      checklistType: 'NORMAL',
      authority: 'EIAC',
      version: '1.0',
      status: 'ACTIVE',
      createdBy: adminUser.id,
    },
    create: {
      companyId: companyA.id,
      name: 'Excavator Inspection Checklist',
      certificateType: 'INSPECTION',
      equipmentType: 'EXCAVATOR',
      checklistType: 'NORMAL',
      authority: 'EIAC',
      version: '1.0',
      status: 'ACTIVE',
      createdBy: adminUser.id,
    },
  });

  const excavatorItems = [
    { section: 'Documentations & General', itemNumber: 'DG-01', description: 'Manufacturer manual', isRequired: true, referenceStd: '', order: 1 },
    { section: 'Documentations & General', itemNumber: 'DG-02', description: 'Previous Certificate', isRequired: true, referenceStd: '', order: 2 },
    { section: 'Documentations & General', itemNumber: 'DG-03', description: 'Maintenance record', isRequired: true, referenceStd: '', order: 3 },
    { section: 'Documentations & General', itemNumber: 'DG-04', description: 'Operator certification', isRequired: true, referenceStd: '', order: 4 },
    { section: 'Documentations & General', itemNumber: 'DG-05', description: 'PPE', isRequired: true, referenceStd: '', order: 5 },
    { section: 'Undercarriage', itemNumber: 'UC-01', description: 'Track chains & shoes', isRequired: true, referenceStd: '', order: 6 },
    { section: 'Undercarriage', itemNumber: 'UC-02', description: 'Rollers & idlers', isRequired: true, referenceStd: '', order: 7 },
    { section: 'Undercarriage', itemNumber: 'UC-03', description: 'Sprockets', isRequired: true, referenceStd: '', order: 8 },
    { section: 'Undercarriage', itemNumber: 'UC-04', description: 'Track tension', isRequired: true, referenceStd: '', order: 9 },
    { section: 'Boom & Arm', itemNumber: 'BA-01', description: 'Boom structure', isRequired: true, referenceStd: '', order: 10 },
    { section: 'Boom & Arm', itemNumber: 'BA-02', description: 'Arm structure', isRequired: true, referenceStd: '', order: 11 },
    { section: 'Boom & Arm', itemNumber: 'BA-03', description: 'Bucket & teeth', isRequired: true, referenceStd: '', order: 12 },
    { section: 'Boom & Arm', itemNumber: 'BA-04', description: 'Pins & bushings', isRequired: true, referenceStd: '', order: 13 },
    { section: 'Boom & Arm', itemNumber: 'BA-05', description: 'Hydraulic cylinders', isRequired: true, referenceStd: '', order: 14 },
    { section: 'Hydraulic System', itemNumber: 'HY-01', description: 'Hoses & fittings', isRequired: true, referenceStd: '', order: 15 },
    { section: 'Hydraulic System', itemNumber: 'HY-02', description: 'Pump & motor', isRequired: true, referenceStd: '', order: 16 },
    { section: 'Hydraulic System', itemNumber: 'HY-03', description: 'Control valves', isRequired: true, referenceStd: '', order: 17 },
    { section: 'Hydraulic System', itemNumber: 'HY-04', description: 'Oil level & condition', isRequired: true, referenceStd: '', order: 18 },
    { section: 'Cab & Controls', itemNumber: 'CC-01', description: 'Seat & seatbelt', isRequired: true, referenceStd: '', order: 19 },
    { section: 'Cab & Controls', itemNumber: 'CC-02', description: 'Joysticks & pedals', isRequired: true, referenceStd: '', order: 20 },
    { section: 'Cab & Controls', itemNumber: 'CC-03', description: 'Gauges & indicators', isRequired: true, referenceStd: '', order: 21 },
    { section: 'Cab & Controls', itemNumber: 'CC-04', description: 'Visibility (windows/mirrors)', isRequired: true, referenceStd: '', order: 22 },
    { section: 'Safety Devices', itemNumber: 'SD-01', description: 'Travel alarm', isRequired: true, referenceStd: '', order: 23 },
    { section: 'Safety Devices', itemNumber: 'SD-02', description: 'Swing brake', isRequired: true, referenceStd: '', order: 24 },
    { section: 'Safety Devices', itemNumber: 'SD-03', description: 'Overload warning', isRequired: true, referenceStd: '', order: 25 },
    { section: 'Safety Devices', itemNumber: 'SD-04', description: 'Fire extinguisher', isRequired: true, referenceStd: '', order: 26 },
    { section: 'Others', itemNumber: 'OT-01', description: 'Others', isRequired: false, referenceStd: '', order: 27 },
  ];

  for (const item of excavatorItems) {
    await prisma.checklistItem.upsert({
      where: { templateId_itemNumber: { templateId: excavatorTemplate.id, itemNumber: item.itemNumber } },
      update: { ...item, templateId: excavatorTemplate.id, companyId: companyA.id },
      create: { ...item, templateId: excavatorTemplate.id, companyId: companyA.id },
    });
  }

  // Scaffold Checklist Template
  const scaffoldTemplate = await prisma.checklistTemplate.upsert({
    where: { companyId_name: { companyId: companyA.id, name: 'Scaffold Inspection Checklist' } },
    update: {
      companyId: companyA.id,
      certificateType: 'INSPECTION',
      equipmentType: 'SCAFFOLD',
      checklistType: 'NORMAL',
      authority: 'EIAC',
      version: '1.0',
      status: 'ACTIVE',
      createdBy: adminUser.id,
    },
    create: {
      companyId: companyA.id,
      name: 'Scaffold Inspection Checklist',
      certificateType: 'INSPECTION',
      equipmentType: 'SCAFFOLD',
      checklistType: 'NORMAL',
      authority: 'EIAC',
      version: '1.0',
      status: 'ACTIVE',
      createdBy: adminUser.id,
    },
  });

  const scaffoldItems = [
    { section: 'Documentations & General', itemNumber: 'DG-01', description: 'Design drawing / GA', isRequired: true, referenceStd: '', order: 1 },
    { section: 'Documentations & General', itemNumber: 'DG-02', description: 'Risk assessment', isRequired: true, referenceStd: '', order: 2 },
    { section: 'Documentations & General', itemNumber: 'DG-03', description: 'Previous inspection record', isRequired: true, referenceStd: '', order: 3 },
    { section: 'Documentations & General', itemNumber: 'DG-04', description: 'Competent person cert', isRequired: true, referenceStd: '', order: 4 },
    { section: 'Documentations & General', itemNumber: 'DG-05', description: 'PPE', isRequired: true, referenceStd: '', order: 5 },
    { section: 'Foundations & Base', itemNumber: 'FB-01', description: 'Base plates / sole boards', isRequired: true, referenceStd: '', order: 6 },
    { section: 'Foundations & Base', itemNumber: 'FB-02', description: 'Ground conditions', isRequired: true, referenceStd: '', order: 7 },
    { section: 'Foundations & Base', itemNumber: 'FB-03', description: 'Adjustable base jacks', isRequired: true, referenceStd: '', order: 8 },
    { section: 'Foundations & Base', itemNumber: 'FB-04', description: 'Level & plumb', isRequired: true, referenceStd: '', order: 9 },
    { section: 'Standards & Ledgers', itemNumber: 'SL-01', description: 'Standards (uprights)', isRequired: true, referenceStd: '', order: 10 },
    { section: 'Standards & Ledgers', itemNumber: 'SL-02', description: 'Ledgers (horizontal)', isRequired: true, referenceStd: '', order: 11 },
    { section: 'Standards & Ledgers', itemNumber: 'SL-03', description: 'Transoms', isRequired: true, referenceStd: '', order: 12 },
    { section: 'Standards & Ledgers', itemNumber: 'SL-04', description: 'Bracing (diagonal/plan)', isRequired: true, referenceStd: '', order: 13 },
    { section: 'Standards & Ledgers', itemNumber: 'SL-05', description: 'Couplers & fittings', isRequired: true, referenceStd: '', order: 14 },
    { section: 'Platforms & Access', itemNumber: 'PA-01', description: 'Board condition', isRequired: true, referenceStd: '', order: 15 },
    { section: 'Platforms & Access', itemNumber: 'PA-02', description: 'Guardrails & toe boards', isRequired: true, referenceStd: '', order: 16 },
    { section: 'Platforms & Access', itemNumber: 'PA-03', description: 'Access ladders/stairs', isRequired: true, referenceStd: '', order: 17 },
    { section: 'Platforms & Access', itemNumber: 'PA-04', description: 'Loading capacity marked', isRequired: true, referenceStd: '', order: 18 },
    { section: 'Ties & Stability', itemNumber: 'TS-01', description: 'Physical ties to structure', isRequired: true, referenceStd: '', order: 19 },
    { section: 'Ties & Stability', itemNumber: 'TS-02', description: 'Box ties / lip ties', isRequired: true, referenceStd: '', order: 20 },
    { section: 'Ties & Stability', itemNumber: 'TS-03', description: 'Raker ties', isRequired: true, referenceStd: '', order: 21 },
    { section: 'Ties & Stability', itemNumber: 'TS-04', description: 'Stability overall', isRequired: true, referenceStd: '', order: 22 },
    { section: 'Others', itemNumber: 'OT-01', description: 'Others', isRequired: false, referenceStd: '', order: 23 },
  ];

  for (const item of scaffoldItems) {
    await prisma.checklistItem.upsert({
      where: { templateId_itemNumber: { templateId: scaffoldTemplate.id, itemNumber: item.itemNumber } },
      update: { ...item, templateId: scaffoldTemplate.id, companyId: companyA.id },
      create: { ...item, templateId: scaffoldTemplate.id, companyId: companyA.id },
    });
  }

  // Lifting Accessories (Shackles, Slings, etc.) Checklist Template
  const liftingTemplate = await prisma.checklistTemplate.upsert({
    where: { companyId_name: { companyId: companyA.id, name: 'Lifting Accessories Inspection Checklist' } },
    update: {
      companyId: companyA.id,
      certificateType: 'INSPECTION',
      equipmentType: 'SHACKLE',
      checklistType: 'NORMAL',
      authority: 'EIAC',
      version: '1.0',
      status: 'ACTIVE',
      createdBy: adminUser.id,
    },
    create: {
      companyId: companyA.id,
      name: 'Lifting Accessories Inspection Checklist',
      certificateType: 'INSPECTION',
      equipmentType: 'SHACKLE',
      checklistType: 'NORMAL',
      authority: 'EIAC',
      version: '1.0',
      status: 'ACTIVE',
      createdBy: adminUser.id,
    },
  });

  const liftingItems = [
    { section: 'Documentations', itemNumber: 'DC-01', description: 'Certificate of conformity', isRequired: true, referenceStd: '', order: 1 },
    { section: 'Documentations', itemNumber: 'DC-02', description: 'Previous test certificate', isRequired: true, referenceStd: '', order: 2 },
    { section: 'Documentations', itemNumber: 'DC-03', description: 'Identification marking', isRequired: true, referenceStd: 'ISO 2415 / ASME B30.26', order: 3 },
    { section: 'Visual Inspection', itemNumber: 'VI-01', description: 'Body deformation', isRequired: true, referenceStd: '', order: 4 },
    { section: 'Visual Inspection', itemNumber: 'VI-02', description: 'Pin/bolt condition', isRequired: true, referenceStd: '', order: 5 },
    { section: 'Visual Inspection', itemNumber: 'VI-03', description: 'Thread condition', isRequired: true, referenceStd: '', order: 6 },
    { section: 'Visual Inspection', itemNumber: 'VI-04', description: 'Corrosion / pitting', isRequired: true, referenceStd: '', order: 7 },
    { section: 'Visual Inspection', itemNumber: 'VI-05', description: 'Cracks (magnetic particle)', isRequired: true, referenceStd: '', order: 8 },
    { section: 'Visual Inspection', itemNumber: 'VI-06', description: 'Wear on crown/bow', isRequired: true, referenceStd: '', order: 9 },
    { section: 'Functional Test', itemNumber: 'FT-01', description: 'Pin engagement', isRequired: true, referenceStd: '', order: 10 },
    { section: 'Functional Test', itemNumber: 'FT-02', description: 'Thread engagement', isRequired: true, referenceStd: '', order: 11 },
    { section: 'Functional Test', itemNumber: 'FT-03', description: 'SWL marking legible', isRequired: true, referenceStd: '', order: 12 },
    { section: 'Proof Load Test', itemNumber: 'PL-01', description: 'Proof load applied', isRequired: true, referenceStd: '', order: 13 },
    { section: 'Proof Load Test', itemNumber: 'PL-02', description: 'Permanent deformation check', isRequired: true, referenceStd: '', order: 14 },
    { section: 'Others', itemNumber: 'OT-01', description: 'Others', isRequired: false, referenceStd: '', order: 15 },
  ];

  for (const item of liftingItems) {
    await prisma.checklistItem.upsert({
      where: { templateId_itemNumber: { templateId: liftingTemplate.id, itemNumber: item.itemNumber } },
      update: { ...item, templateId: liftingTemplate.id, companyId: companyA.id },
      create: { ...item, templateId: liftingTemplate.id, companyId: companyA.id },
    });
  }

  console.log('✓ Inspection checklist templates seeded (5 equipment types)');

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
