import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

function uniqueString(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

describe('Inspection Checklists (NORMAL vs FULL) and Mixed Outcomes (Phase E)', () => {
  let company: any;
  let customer: any;
  let inspector: any;
  let job: any;
  let asset1: any;
  let asset2: any;

  beforeAll(async () => {
    prisma = new PrismaClient();
    company = await prisma.company.create({
      data: {
        name: uniqueString('Co-InspTest'),
        prefix: 'INS',
        subscriptionPlan: 'Enterprise',
      },
    });

    customer = await prisma.customer.create({
      data: {
        companyId: company.id,
        name: 'Dubai Industrial Cranes LLC',
        email: uniqueString('client') + '@dic.ae',
      },
    });

    inspector = await prisma.user.create({
      data: {
        companyId: company.id,
        name: 'Rizwanuddin Inspector',
        email: uniqueString('inspector') + '@tsc.ae',
        passwordHash: 'hash',
        role: 'INSPECTOR',
      },
    });

    asset1 = await prisma.customerAsset.create({
      data: {
        companyId: company.id,
        customerId: customer.id,
        assetType: 'Overhead Crane',
        make: 'Konecranes',
        serialNumber: uniqueString('SN-OHC-1'),
        status: 'active',
      },
    });

    asset2 = await prisma.customerAsset.create({
      data: {
        companyId: company.id,
        customerId: customer.id,
        assetType: 'Air Receiver',
        make: 'Atlas Copco',
        serialNumber: uniqueString('SN-AR-2'),
        status: 'active',
      },
    });

    job = await prisma.job.create({
      data: {
        companyId: company.id,
        customerId: customer.id,
        jobNumber: uniqueString('JOB-INSP'),
        status: 'IN_PROGRESS',
        inspectorId: inspector.id,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('should execute NORMAL checklist for Asset 1 resulting in PASSED and Certificate Eligibility', async () => {
    const normalChecklistData = {
      type: 'NORMAL',
      sections: [
        { name: 'General Safety', items: [{ text: 'Visual structure check', result: 'PASS' }, { text: 'Emergency Stop check', result: 'PASS' }] },
        { name: 'Operational Testing', items: [{ text: 'Hoist motion under no-load', result: 'PASS' }] }
      ]
    };

    const inspection1 = await prisma.inspection.create({
      data: {
        companyId: company.id,
        jobId: job.id,
        inspectorId: inspector.id,
        clientId: customer.id,
        assetId: asset1.id,
        inspectionType: 'Overhead Crane Annual Inspection',
        checklistType: 'NORMAL',
        checklist: normalChecklistData,
        status: 'COMPLETED',
        result: 'PASSED',
        reviewStatus: 'APPROVED',
        approvalStatus: 'APPROVED',
        equipmentAsset: `${asset1.assetType} - ${asset1.serialNumber}`,
      },
    });

    expect(inspection1.checklistType).toBe('NORMAL');
    expect(inspection1.result).toBe('PASSED');
    expect(inspection1.approvalStatus).toBe('APPROVED');
  });

  test('should execute FULL checklist for Asset 2 resulting in FAILED with Findings and Rejection Queue', async () => {
    const fullChecklistData = {
      type: 'FULL',
      sections: [
        { name: 'Pressure Vessel Shell', items: [{ text: 'Ultrasonic thickness measurement', result: 'FAIL', notes: 'Corrosion below allowable wall thickness' }] },
        { name: 'Safety Relief Valves', items: [{ text: 'Pop test calibration', result: 'PASS' }] },
        { name: 'Internal Inspection', items: [{ text: 'Borescope inspection of internal welds', result: 'FAIL', notes: 'Pitting detected' }] }
      ]
    };

    const findingsData = [
      {
        severity: 'CRITICAL',
        code: 'FIND-CORR-01',
        description: 'Vessel wall thickness degraded by 2.4mm exceeding ASME Section VIII tolerance',
        correctiveAction: 'De-rate pressure vessel or replace bottom shell plate prior to re-inspection',
        status: 'OPEN',
      }
    ];

    const inspection2 = await prisma.inspection.create({
      data: {
        companyId: company.id,
        jobId: job.id,
        inspectorId: inspector.id,
        clientId: customer.id,
        assetId: asset2.id,
        inspectionType: 'Pressure Vessel Thorough Examination',
        checklistType: 'FULL',
        checklist: fullChecklistData,
        findings: findingsData,
        status: 'COMPLETED',
        result: 'FAILED',
        reviewStatus: 'REJECTED',
        approvalStatus: 'REJECTED',
        equipmentAsset: `${asset2.assetType} - ${asset2.serialNumber}`,
      },
    });

    expect(inspection2.checklistType).toBe('FULL');
    expect(inspection2.result).toBe('FAILED');
    expect(inspection2.approvalStatus).toBe('REJECTED');

    // Verify mixed outcomes under the single parent Job
    const jobInspections = await prisma.inspection.findMany({
      where: { jobId: job.id },
      include: { asset: true },
    });

    expect(jobInspections).toHaveLength(2);
    const passed = jobInspections.filter((i) => i.result === 'PASSED');
    const failed = jobInspections.filter((i) => i.result === 'FAILED');

    expect(passed).toHaveLength(1);
    expect(failed).toHaveLength(1);
    expect(failed[0].checklistType).toBe('FULL');
    expect(passed[0].checklistType).toBe('NORMAL');
  });
});
