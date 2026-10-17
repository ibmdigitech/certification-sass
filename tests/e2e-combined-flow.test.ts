import { PrismaClient, JobServiceType } from '@prisma/client';

let prisma: PrismaClient;

function uniqueString(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

describe('End-to-End Combined Commercial & Operational Flow (Sections 4 & 5)', () => {
  let company: any;
  let customer: any;
  let siteDubai: any;
  let siteAbuDhabi: any;
  let craneAsset: any;
  let forkliftAsset: any;
  let trainee1: any;
  let trainee2: any;
  let inspector: any;
  let trainer: any;
  let trainerRecord: any;
  let course: any;
  let quotation: any;
  let parentJob: any;

  beforeAll(async () => {
    prisma = new PrismaClient();
    company = await prisma.company.create({
      data: {
        name: uniqueString('Co-ABC-Operations'),
        prefix: 'ABC',
        subscriptionPlan: 'Enterprise',
      },
    });

    inspector = await prisma.user.create({
      data: {
        companyId: company.id,
        name: 'Hassan Inspection Engineer',
        email: uniqueString('hassan') + '@abc.ae',
        passwordHash: 'hash',
        role: 'INSPECTOR',
      },
    });

    trainer = await prisma.user.create({
      data: {
        companyId: company.id,
        name: 'Bilal Technical Trainer',
        email: uniqueString('bilal') + '@abc.ae',
        passwordHash: 'hash',
        role: 'TRAINER',
      },
    });

    // 1. Customer with multiple sites & assets
    customer = await prisma.customer.create({
      data: {
        companyId: company.id,
        name: 'ABC Contracting LLC',
        code: 'CUST-ABC-01',
        email: uniqueString('info') + '@abccontracting.ae',
      },
    });

    siteDubai = await prisma.customerSite.create({
      data: { companyId: company.id, customerId: customer.id, name: 'Dubai Marina Project', emirate: 'Dubai' },
    });
    siteAbuDhabi = await prisma.customerSite.create({
      data: { companyId: company.id, customerId: customer.id, name: 'Yas Marina Project', emirate: 'Abu Dhabi' },
    });

    craneAsset = await prisma.customerAsset.create({
      data: {
        companyId: company.id,
        customerId: customer.id,
        siteId: siteDubai.id,
        assetType: 'Overhead Crane',
        serialNumber: uniqueString('SN-CRANE-ABC'),
      },
    });

    forkliftAsset = await prisma.customerAsset.create({
      data: {
        companyId: company.id,
        customerId: customer.id,
        siteId: siteAbuDhabi.id,
        assetType: 'Forklift',
        serialNumber: uniqueString('SN-FORK-ABC'),
      },
    });

    // 2. Trainees (Distinct from User)
    trainee1 = await prisma.trainee.create({
      data: {
        companyId: company.id,
        companyName: customer.name,
        firstName: 'Ahmed',
        lastName: 'Al Mansoori',
        employeeId: 'EMP-ABC-01',
        emiratesId: uniqueString('784-1990'),
      },
    });

    trainee2 = await prisma.trainee.create({
      data: {
        companyId: company.id,
        companyName: customer.name,
        firstName: 'Suresh',
        lastName: 'Kumar',
        employeeId: 'EMP-ABC-02',
        emiratesId: uniqueString('784-1995'),
      },
    });

    // 3. Trainer record (links User to Trainer model for FK)
    trainerRecord = await prisma.trainer.create({
      data: {
        companyId: company.id,
        userId: trainer.id,
        specializations: ['Crane Operations'],
        qualifications: ['NEBOSH'],
        certifications: ['IOSH'],
        status: 'ACTIVE',
      },
    });

    // 4. Course catalog
    course = await prisma.trainingCourse.create({
      data: {
        companyId: company.id,
        title: 'Safe Crane Operation & Rigging',
        code: uniqueString('CRS-CRN'),
        status: 'PUBLISHED',
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('should create Quotation and convert to Job with both Inspection and Training services', async () => {
    // 1. Create Quotation with 2 line items
    quotation = await prisma.salesQuotation.create({
      data: {
        companyId: company.id,
        quotationNumber: uniqueString('QT-ABC-01'),
        customerId: customer.id,
        title: 'Comprehensive Examination & Operator Training Package',
        status: 'APPROVED',
        subtotal: 5000,
        taxAmount: 250,
        totalAmount: 5250,
        items: {
          create: [
            { serviceType: 'INSPECTION', description: 'Annual Inspection of 2 Lifting Assets', quantity: 2, unitPrice: 1500, totalPrice: 3000 },
            { serviceType: 'TRAINING', description: 'Certified Operator Training for 2 Attendees', quantity: 2, unitPrice: 1000, totalPrice: 2000 },
          ],
        },
      },
    });

    expect(quotation.id).toBeDefined();

    // 2. Convert to Job Order with individual service lines
    parentJob = await prisma.job.create({
      data: {
        companyId: company.id,
        customerId: customer.id,
        jobNumber: uniqueString('JOB-ABC-COMBINED'),
        status: 'IN_PROGRESS',
        quotationId: quotation.quotationNumber,
        siteId: siteDubai.id,
        jobServices: {
          create: [
            {
              companyId: company.id,
              serviceType: JobServiceType.INSPECTION,
              serviceCode: 'INS-01',
              description: 'Crane & Forklift Thorough Examination',
              status: 'IN_PROGRESS',
              assignedResponsibleId: inspector.id,
            },
            {
              companyId: company.id,
              serviceType: JobServiceType.TRAINING,
              serviceCode: 'TRN-01',
              description: 'Safe Crane Operator Certification',
              status: 'IN_PROGRESS',
              assignedResponsibleId: trainer.id,
            },
          ],
        },
      },
      include: { jobServices: true },
    });

    expect(parentJob.jobServices).toHaveLength(2);
    expect(parentJob.quotationId).toBe(quotation.quotationNumber);
  });

  test('should execute inspections on multiple assets under same job with mixed outcomes', async () => {
    const inspectionService = parentJob.jobServices.find((s: any) => s.serviceType === JobServiceType.INSPECTION);

    // Crane Inspection -> PASSED
    const craneInspection = await prisma.inspection.create({
      data: {
        companyId: company.id,
        jobId: parentJob.id,
        jobServiceId: inspectionService.id,
        clientId: customer.id,
        assetId: craneAsset.id,
        inspectorId: inspector.id,
        inspectionType: 'Overhead Crane Annual Examination',
        checklistType: 'NORMAL',
        result: 'PASSED',
        approvalStatus: 'APPROVED',
        status: 'COMPLETED',
      },
    });

    // Forklift Inspection -> FAILED with non-conformance findings
    const forkliftInspection = await prisma.inspection.create({
      data: {
        companyId: company.id,
        jobId: parentJob.id,
        jobServiceId: inspectionService.id,
        clientId: customer.id,
        assetId: forkliftAsset.id,
        inspectorId: inspector.id,
        inspectionType: 'Forklift Thorough Examination',
        checklistType: 'FULL',
        result: 'FAILED',
        approvalStatus: 'REJECTED',
        findings: [
          { severity: 'CRITICAL', issue: 'Hydraulic steering cylinder leak and worn fork heel below 10%' },
        ],
        status: 'COMPLETED',
      },
    });

    expect(craneInspection.result).toBe('PASSED');
    expect(forkliftInspection.result).toBe('FAILED');

    // Only Crane qualifies for Certificate issuance!
    const certNumber = `${parentJob.jobNumber}-01`;
    const issuedCert = await prisma.certificate.create({
      data: {
        companyId: company.id,
        jobId: parentJob.id,
        jobNumber: parentJob.jobNumber,
        sequence: 1,
        inspectionId: craneInspection.id, // Linked to exact qualifying record!
        number: certNumber,
        status: 'ACTIVE',
        certificateType: 'INSPECTION',
        issueDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    expect(issuedCert.number).toBe(certNumber);
    expect(issuedCert.inspectionId).toBe(craneInspection.id);
  });

  test('should track trainee attendance, individual competency, timesheet, and delivery confirmation', async () => {
    const trainingService = parentJob.jobServices.find((s: any) => s.serviceType === JobServiceType.TRAINING);

    // 1. Training Session under parent job service
    const session = await prisma.trainingSession.create({
      data: {
        companyId: company.id,
        jobId: parentJob.id,
        courseId: course.id,
        trainerId: trainerRecord.id, // Must reference Trainer.id, not User.id
        startDate: new Date(),
        endDate: new Date(),
        status: 'COMPLETED',
      },
    });

    // 2. Individual enrollments under session
    const enrollment1 = await prisma.sessionEnrollment.create({
      data: {
        companyId: company.id,
        sessionId: session.id,
        traineeId: trainee1.id,
        status: 'COMPLETED',
      },
    });

    const enrollment2 = await prisma.sessionEnrollment.create({
      data: {
        companyId: company.id,
        sessionId: session.id,
        traineeId: trainee2.id,
        status: 'FAILED',
      },
    });

    expect(enrollment1.status).toBe('COMPLETED');
    expect(enrollment2.status).toBe('FAILED');

    // 3. Issue certificate ONLY for qualifying trainee 1
    const traineeCert = await prisma.certificate.create({
      data: {
        companyId: company.id,
        jobId: parentJob.id,
        jobNumber: parentJob.jobNumber,
        sequence: 2,
        courseId: course.id,
        number: `${parentJob.jobNumber}-02`,
        holderName: `${trainee1.firstName} ${trainee1.lastName}`,
        status: 'ACTIVE',
        certificateType: 'TRAINING',
        issueDate: new Date(),
      },
    });

    expect(traineeCert.number).toBe(`${parentJob.jobNumber}-02`);

    // 4. Timesheet linked to parent job and logged hours
    const timesheet = await prisma.timesheet.create({
      data: {
        companyId: company.id,
        jobId: parentJob.id,
        userId: inspector.id,
        date: new Date(),
        startTime: new Date(Date.now() - 4 * 3600 * 1000),
        endTime: new Date(),
        description: 'Conducted field inspections and safety load tests',
        status: 'approved',
      },
    });

    expect(timesheet.jobId).toBe(parentJob.id);

    // 5. Payment allocation
    const payment = await prisma.payment.create({
      data: {
        companyId: company.id,
        jobId: parentJob.id,
        amount: 5250,
        method: 'BANK_TRANSFER',
        status: 'COMPLETED',
      },
    });

    expect(payment.amount).toBe(5250);

    // 6. Delivery Confirmation (DC)
    const delivery = await prisma.deliveryLog.create({
      data: {
        companyId: company.id,
        certificateId: traineeCert.id,
        method: 'COURIER',
        status: 'DELIVERED',
        deliveryDate: new Date(),
      },
    });

    expect(delivery.status).toBe('DELIVERED');
  });
});
