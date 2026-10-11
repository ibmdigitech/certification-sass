import { PrismaClient, JobServiceType } from '@prisma/client';

let prisma: PrismaClient;

function generateJobNumber(): string {
  return `TEST-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@test.com`;
}

describe('Job Order Core - Basic Test', () => {
  let company: any;
  let location: any;
  let customer: any;
  let adminUser: any;

  beforeAll(async () => {
    prisma = new PrismaClient();
    // No cleanup; rely on unique fields
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('should create job with training service and link jobServiceId', async () => {
    company = await prisma.company.create({
      data: { name: 'TestCo', prefix: 'TST', subscriptionPlan: 'Enterprise' },
    });
    location = await prisma.location.create({
      data: { name: 'Dubai', code: 'DXB', country: 'UAE', emirate: 'Dubai', companyId: company.id },
    });
    customer = await prisma.customer.create({
      data: { contact: 'Test Customer', email: uniqueEmail('customer'), phone: '+971500000000', companyId: company.id },
    });
    adminUser = await prisma.user.create({
      data: { email: uniqueEmail('admin'), name: 'Admin', passwordHash: 'hashed', role: 'ADMIN', companyId: company.id },
    });

    const job = await prisma.job.create({
      data: {
        jobNumber: generateJobNumber(),
        companyId: company.id,
        customerId: customer.id,
        locationId: location.id,
        status: 'QUOTED',
        jobServices: {
          create: {
            serviceType: JobServiceType.TRAINING,
            serviceCode: 'TRN-001',
            description: 'Operator Training',
            status: 'PENDING',
            companyId: company.id, // required
          },
        },
      },
      include: { jobServices: true },
    });

    expect(job.jobServices).toHaveLength(1);
    expect(job.jobServices[0].serviceType).toBe(JobServiceType.TRAINING);
    expect(job.jobServices[0].jobId).toBe(job.id);
    expect(job.jobServices[0].companyId).toBe(company.id);
  });
});
