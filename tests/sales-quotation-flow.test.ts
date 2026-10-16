import { PrismaClient, JobServiceType } from '@prisma/client';

let prisma: PrismaClient;

function uniqueString(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

describe('Sales Inquiry, Quotation and Idempotent Job Conversion Flow (Phase C)', () => {
  let company: any;
  let customer: any;
  let site: any;
  let salesPerson: any;
  let inquiry: any;
  let quotation: any;

  beforeAll(async () => {
    prisma = new PrismaClient();
    company = await prisma.company.create({
      data: {
        name: uniqueString('Co-SalesFlow'),
        prefix: 'SLS',
        subscriptionPlan: 'Enterprise',
      },
    });

    customer = await prisma.customer.create({
      data: {
        companyId: company.id,
        name: 'Arabtec Construction LLC',
        code: 'CUST-ARB-01',
        email: uniqueString('sales-client') + '@arabtec.com',
      },
    });

    site = await prisma.customerSite.create({
      data: {
        companyId: company.id,
        customerId: customer.id,
        name: 'Downtown Commercial Tower',
        emirate: 'Dubai',
      },
    });

    salesPerson = await prisma.user.create({
      data: {
        companyId: company.id,
        name: 'Hesham P K (Sales Manager)',
        email: uniqueString('hesham') + '@tsc.ae',
        passwordHash: 'hashed_pw',
        role: 'SALES_MANAGER',
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('should create Sales Inquiry with salesperson and customer', async () => {
    inquiry = await prisma.salesInquiry.create({
      data: {
        companyId: company.id,
        inquiryNumber: uniqueString('INQ-2026'),
        customerId: customer.id,
        salesPersonId: salesPerson.id,
        subject: 'Annual Tower Crane Inspection & Operator Training',
        scope: '3 Tower Cranes + 5 Rigger Trainees',
        source: 'Email Inquiry',
        status: 'NEW',
      },
    });

    expect(inquiry.id).toBeDefined();
    expect(inquiry.status).toBe('NEW');
    expect(inquiry.salesPersonId).toBe(salesPerson.id);
  });

  test('should create Quotation with line items and calculate subtotal/total', async () => {
    const item1 = { serviceType: 'INSPECTION', description: 'Tower Crane Thorough Examination (EIAC)', quantity: 3, unitPrice: 1500, totalPrice: 4500 };
    const item2 = { serviceType: 'TRAINING', description: 'Certified Crane Operator & Rigger Training', quantity: 5, unitPrice: 800, totalPrice: 4000 };
    const subtotal = item1.totalPrice + item2.totalPrice; // 8500
    const taxAmount = subtotal * 0.05; // 425
    const totalAmount = subtotal + taxAmount; // 8925

    quotation = await prisma.salesQuotation.create({
      data: {
        companyId: company.id,
        quotationNumber: uniqueString('QT-2026'),
        revisionNumber: 0,
        inquiryId: inquiry.id,
        customerId: customer.id,
        salesPersonId: salesPerson.id,
        title: 'Quotation for Crane Inspection & Trainee Certification',
        status: 'APPROVED',
        subtotal,
        taxRate: 5.0,
        taxAmount,
        totalAmount,
        items: {
          create: [item1, item2],
        },
      },
      include: { items: true },
    });

    expect(quotation.items).toHaveLength(2);
    expect(quotation.totalAmount).toBe(8925);
    expect(quotation.status).toBe('APPROVED');
  });

  test('should idempotently convert approved quotation to Job Order without duplicates', async () => {
    // Conversion helper logic matching API handler
    async function convertQuotationToJob(quotationId: number) {
      return await prisma.$transaction(async (tx) => {
        const q = await tx.salesQuotation.findUnique({
          where: { id: quotationId },
          include: { items: true },
        });

        if (!q) throw new Error('Quotation not found');

        // Idempotency check: if already converted, return existing job
        if (q.convertedJobId) {
          return tx.job.findUnique({
            where: { id: q.convertedJobId },
            include: { jobServices: true },
          });
        }

        // Generate Job
        const jobNumber = `JOB-${q.quotationNumber.replace('QT-', '')}`;
        const newJob = await tx.job.create({
          data: {
            companyId: q.companyId,
            customerId: q.customerId,
            jobNumber,
            status: 'PLANNED',
            scope: q.title,
            quotationId: q.quotationNumber,
            customerReference: `Approved QT #${q.quotationNumber}`,
            siteId: site.id,
            jobServices: {
              create: q.items.map((item) => ({
                companyId: q.companyId,
                serviceType: item.serviceType === 'TRAINING' ? JobServiceType.TRAINING : JobServiceType.INSPECTION,
                serviceCode: item.serviceType === 'TRAINING' ? 'TRN-SRV' : 'INS-SRV',
                description: item.description,
                status: 'PLANNED',
              })),
            },
          },
          include: { jobServices: true },
        });

        // Link quotation to converted job and mark CONVERTED
        await tx.salesQuotation.update({
          where: { id: quotationId },
          data: {
            convertedJobId: newJob.id,
            status: 'CONVERTED',
          },
        });

        return newJob;
      });
    }

    // First conversion
    const job1 = await convertQuotationToJob(quotation.id);
    expect(job1).not.toBeNull();
    expect(job1!.jobServices).toHaveLength(2);
    expect(job1!.quotationId).toBe(quotation.quotationNumber);

    // Second conversion attempt (retry/double-click)
    const job2 = await convertQuotationToJob(quotation.id);
    expect(job2!.id).toBe(job1!.id); // Must be identical record

    // Verify only ONE job was created
    const countJobs = await prisma.job.count({
      where: { quotationId: quotation.quotationNumber },
    });
    expect(countJobs).toBe(1);
  });
});
