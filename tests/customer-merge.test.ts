import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

function uniqueString(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

describe('Customer Merge Safeguards & Data Preservation (Phase B / Section D)', () => {
  let company: any;
  let sourceCustomer: any;
  let targetCustomer: any;
  let adminUser: any;
  let sourceSite: any;
  let sourceAsset: any;
  let sourceJob: any;

  beforeAll(async () => {
    prisma = new PrismaClient();
    company = await prisma.company.create({
      data: {
        name: uniqueString('Co-MergeTest'),
        prefix: 'MRG',
        subscriptionPlan: 'Enterprise',
      },
    });

    adminUser = await prisma.user.create({
      data: {
        companyId: company.id,
        name: 'System Administrator',
        email: uniqueString('admin') + '@tsc.ae',
        passwordHash: 'hash',
        role: 'ADMIN',
      },
    });

    // Create Source Customer (e.g. "PK Contracting (Old)")
    sourceCustomer = await prisma.customer.create({
      data: {
        companyId: company.id,
        name: 'PK Contracting (Old Branch)',
        code: 'CUST-PK-OLD',
        email: uniqueString('pk-old') + '@pk.ae',
        status: 'active',
      },
    });

    // Create Target Customer (e.g. "PK Contracting LLC (Main)")
    targetCustomer = await prisma.customer.create({
      data: {
        companyId: company.id,
        name: 'PK Contracting LLC (HQ)',
        code: 'CUST-PK-HQ',
        email: uniqueString('pk-hq') + '@pk.ae',
        status: 'active',
      },
    });

    // Add Site and Asset to Source Customer
    sourceSite = await prisma.customerSite.create({
      data: {
        companyId: company.id,
        customerId: sourceCustomer.id,
        name: 'Al Quoz Yard',
      },
    });

    sourceAsset = await prisma.customerAsset.create({
      data: {
        companyId: company.id,
        customerId: sourceCustomer.id,
        siteId: sourceSite.id,
        assetType: 'Wheel Loader',
        serialNumber: uniqueString('SN-WL-01'),
      },
    });

    // Add Job to Source Customer
    sourceJob = await prisma.job.create({
      data: {
        companyId: company.id,
        customerId: sourceCustomer.id,
        jobNumber: uniqueString('JOB-PK-01'),
        status: 'COMPLETED',
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('should safely reassign all assets, sites, and jobs to target customer and archive source', async () => {
    // Transactional Merge Logic matching /api/customers/merge
    const mergeResult = await prisma.$transaction(async (tx) => {
      // 1. Verify both belong to the same company
      const src = await tx.customer.findUnique({ where: { id: sourceCustomer.id } });
      const tgt = await tx.customer.findUnique({ where: { id: targetCustomer.id } });

      if (!src || !tgt || src.companyId !== tgt.companyId) {
        throw new Error('Tenant isolation mismatch or invalid customer IDs');
      }

      // 2. Reassign Sites
      const reassignSites = await tx.customerSite.updateMany({
        where: { customerId: src.id },
        data: { customerId: tgt.id },
      });

      // 3. Reassign Assets
      const reassignAssets = await tx.customerAsset.updateMany({
        where: { customerId: src.id },
        data: { customerId: tgt.id },
      });

      // 4. Reassign Jobs
      const reassignJobs = await tx.job.updateMany({
        where: { customerId: src.id },
        data: { customerId: tgt.id },
      });

      // 5. Archive Source Customer (Never hard delete!)
      const archivedSource = await tx.customer.update({
        where: { id: src.id },
        data: {
          status: 'merged_archived',
        },
      });

      // 6. Write Immutable Audit Log
      await tx.auditLog.create({
        data: {
          companyId: src.companyId,
          userId: adminUser.id,
          action: 'CUSTOMER_MERGE',
          entityType: 'Customer',
          entityId: src.id,
          tenantId: src.companyId,
          previousValue: { id: src.id, name: src.name, status: src.status },
          newValue: {
            mergedIntoCustomerId: tgt.id,
            reassignedSites: reassignSites.count,
            reassignedAssets: reassignAssets.count,
            reassignedJobs: reassignJobs.count,
          },
        },
      });

      return {
        sitesMoved: reassignSites.count,
        assetsMoved: reassignAssets.count,
        jobsMoved: reassignJobs.count,
        archivedSourceStatus: archivedSource.status,
      };
    });

    expect(mergeResult.sitesMoved).toBe(1);
    expect(mergeResult.assetsMoved).toBe(1);
    expect(mergeResult.jobsMoved).toBe(1);
    expect(mergeResult.archivedSourceStatus).toBe('merged_archived');

    // Verify Target Customer now owns the assets, sites, and jobs
    const updatedTarget = await prisma.customer.findUnique({
      where: { id: targetCustomer.id },
      include: { sites: true, assets: true, jobs: true },
    });

    expect(updatedTarget!.sites).toHaveLength(1);
    expect(updatedTarget!.assets).toHaveLength(1);
    expect(updatedTarget!.jobs).toHaveLength(1);
    expect(updatedTarget!.assets[0].serialNumber).toBe(sourceAsset.serialNumber);

    // Verify Source Customer still exists in database as archived (zero data loss)
    const preservedSource = await prisma.customer.findUnique({
      where: { id: sourceCustomer.id },
    });
    expect(preservedSource).not.toBeNull();
    expect(preservedSource!.status).toBe('merged_archived');
  });
});
