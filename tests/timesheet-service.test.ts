import { PrismaClient, Prisma } from '@prisma/client';
import { TimesheetService, TimesheetStatus } from '../src/lib/services/timesheet.service';

let prisma: PrismaClient;

function uniqueString(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

describe('Timesheet Service', () => {
  let company: { id: number; prefix: string | null };
  let engineer: { id: number; name: string };
  let customer: { id: number };
  let job: { id: number; jobNumber: string };
  let createdTimesheetIds: number[] = [];

  beforeAll(async () => {
    prisma = new PrismaClient();

    company = await prisma.company.create({
      data: {
        name: uniqueString('Co-TS'),
        prefix: 'TS',
        subscriptionPlan: 'Enterprise',
      },
    });

    engineer = await prisma.user.create({
      data: {
        companyId: company.id,
        name: 'Test Engineer',
        email: uniqueString('engineer') + '@test.com',
        passwordHash: 'hash',
        role: 'ENGINEER',
      },
    }) as { id: number; name: string };

    customer = await prisma.customer.create({
      data: {
        companyId: company.id,
        name: 'Test Customer',
        contact: 'Test Customer Inc',
      },
    }) as { id: number };

    job = await prisma.job.create({
      data: {
        companyId: company.id,
        customerId: customer.id,
        engineerId: engineer.id,
        jobNumber: uniqueString('JOB'),
        type: 'INSPECTION',
        status: 'IN_PROGRESS',
      },
    }) as { id: number; jobNumber: string };
  });

  afterAll(async () => {
    for (const id of createdTimesheetIds) {
      await prisma.timesheet.delete({ where: { id, companyId: company.id } }).catch(() => {});
    }
    await prisma.job.delete({ where: { id: job.id } }).catch(() => {});
    await prisma.customer.delete({ where: { id: customer.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: engineer.id } }).catch(() => {});
    await prisma.company.delete({ where: { id: company.id } }).catch(() => {});
    await prisma.$disconnect();
  });

  describe('calculateHours', () => {
    test('should calculate correct working hours and overtime', () => {
      const start = new Date('2025-01-15T08:00:00');
      const end = new Date('2025-01-15T17:00:00');
      const result = TimesheetService.calculateHours(start, end, 30, 0);

      expect(result.totalWorkingHours).toBe(8.5);
      expect(result.overtimeHours).toBe(0.5);
    });

    test('should handle breaks correctly', () => {
      const start = new Date('2025-01-15T08:00:00');
      const end = new Date('2025-01-15T12:00:00');
      const result = TimesheetService.calculateHours(start, end, 30, 0, 8);

      expect(result.netMinutes).toBe(210);
      expect(result.totalWorkingHours).toBe(3.5);
    });

    test('should handle travel time', () => {
      const start = new Date('2025-01-15T08:00:00');
      const end = new Date('2025-01-15T17:00:00');
      const result = TimesheetService.calculateHours(start, end, 30, 60);

      expect(result.totalWorkingHours).toBe(7.5);
      expect(result.overtimeHours).toBe(0);
    });
  });

  describe('create', () => {
    test('should create a timesheet with draft status by default', async () => {
      const timesheet = await TimesheetService.create({
        companyId: company.id,
        userId: engineer.id,
        jobId: job.id,
        date: '2025-01-15',
        startTime: '2025-01-15T08:00:00',
        endTime: '2025-01-15T17:00:00',
        breakMinutes: 30,
        travelTimeMinutes: 0,
        description: 'Field inspection of overhead crane',
        timesheetType: 'INSPECTION',
        equipmentItems: [],
      });

      createdTimesheetIds.push(timesheet.id);
      expect(timesheet.status).toBe('draft');
      expect(timesheet.timesheetNumber).toMatch(/^TS-/);
      expect(timesheet.timesheetType).toBe('INSPECTION');
      expect(timesheet.totalWorkingHours).toBe(8.5);
      expect(timesheet.overtimeHours).toBe(0.5);
      expect(timesheet.job!.jobNumber).toBe(job.jobNumber);
    });

    test('should create a training timesheet', async () => {
      const timesheet = await TimesheetService.create({
        companyId: company.id,
        userId: engineer.id,
        date: '2025-01-16',
        startTime: '2025-01-16T09:00:00',
        endTime: '2025-01-16T15:00:00',
        breakMinutes: 30,
        description: 'Training session delivery',
        timesheetType: 'TRAINING',
        equipmentItems: [],
      });

      createdTimesheetIds.push(timesheet.id);
      expect(timesheet.timesheetType).toBe('TRAINING');
      expect(timesheet.status).toBe('draft');
    });

    test('should reject timesheet with endTime before startTime', async () => {
      await expect(
        TimesheetService.create({
          companyId: company.id,
          userId: engineer.id,
          jobId: job.id,
          date: '2025-01-15',
          startTime: '2025-01-15T17:00:00',
          endTime: '2025-01-15T08:00:00',
          breakMinutes: 30,
          description: 'Test',
          timesheetType: 'INSPECTION',
          equipmentItems: [],
        })
      ).rejects.toThrow('End time must be after start time');
    });

    test('should create equipment items with timesheet', async () => {
      const timesheet = await TimesheetService.create({
        companyId: company.id,
        userId: engineer.id,
        jobId: job.id,
        date: '2025-01-17',
        startTime: '2025-01-17T08:00:00',
        endTime: '2025-01-17T12:00:00',
        breakMinutes: 0,
        description: 'Inspection with equipment',
        timesheetType: 'INSPECTION',
        equipmentItems: [
          {
            equipmentType: 'Overhead Crane',
            equipmentDescription: 'Main Hoist',
            manufacturer: 'Konecranes',
            model: 'CLX',
            serialNumber: 'SN-001',
            quantity: 1,
            inspectionResult: 'PASSED',
            certificateStatus: 'ISSUED',
            reportStatus: 'GENERATED',
          },
        ],
      });

      createdTimesheetIds.push(timesheet.id);
      expect(timesheet.equipmentItems).toHaveLength(1);
      expect(timesheet.equipmentItems[0].equipmentType).toBe('Overhead Crane');
      expect(timesheet.equipmentItems[0].certificateStatus).toBe('ISSUED');
    });
  });

  describe('status transitions', () => {
    let tsId: number;

    beforeAll(async () => {
      const ts = await TimesheetService.create({
        companyId: company.id,
        userId: engineer.id,
        jobId: job.id,
        date: '2025-01-18',
        startTime: '2025-01-18T08:00:00',
        endTime: '2025-01-18T16:00:00',
        breakMinutes: 30,
        description: 'Status transition test',
        timesheetType: 'INSPECTION',
        equipmentItems: [],
      });
      tsId = ts.id;
      createdTimesheetIds.push(tsId);
    });

    test('draft -> submitted', async () => {
      const result = await TimesheetService.submit(tsId, company.id);
    expect(result.status).toBe('submitted');
    expect(result.submittedAt).not.toBeNull();
    });

    test('submitted -> pending_review', async () => {
      const result = await TimesheetService.moveToReview(tsId, company.id);
      expect(result.status).toBe('pending_review');
    });

    test('pending_review -> approved', async () => {
      const result = await TimesheetService.approve(tsId, company.id, engineer.id);
      expect(result.status).toBe('approved');
      expect(result.approvedAt).toBeTruthy();
    });

    test('cannot submit an approved timesheet', async () => {
      await expect(TimesheetService.submit(tsId, company.id)).rejects.toThrow(
        'Cannot submit'
      );
    });
  });

  describe('getById', () => {
    test('should return timesheet with relations', async () => {
      const created = await TimesheetService.create({
        companyId: company.id,
        userId: engineer.id,
        jobId: job.id,
        date: '2025-01-20',
        startTime: '2025-01-20T08:00:00',
        endTime: '2025-01-20T17:00:00',
        breakMinutes: 30,
        description: 'Get by ID test',
        timesheetType: 'INSPECTION',
        equipmentItems: [],
      });
      createdTimesheetIds.push(created.id);

      const result = await TimesheetService.getById(created.id, company.id);
      expect(result).not.toBeNull();
      expect(result!.timesheetNumber).toBe(created.timesheetNumber);
      expect(result!.user).toBeDefined();
      expect(result!.job).toBeDefined();
    });

    test('should return null for non-existent timesheet', async () => {
      const result = await TimesheetService.getById(999999, company.id);
      expect(result).toBeNull();
    });
  });

  describe('list', () => {
    beforeAll(async () => {
      await TimesheetService.create({
        companyId: company.id,
        userId: engineer.id,
        jobId: job.id,
        date: '2025-01-21',
        startTime: '2025-01-21T08:00:00',
        endTime: '2025-01-21T17:00:00',
        breakMinutes: 30,
        description: 'List test 1',
        timesheetType: 'INSPECTION',
        equipmentItems: [],
      });
      await TimesheetService.create({
        companyId: company.id,
        userId: engineer.id,
        date: '2025-01-22',
        startTime: '2025-01-22T09:00:00',
        endTime: '2025-01-22T15:00:00',
        breakMinutes: 30,
        description: 'List test 2',
        timesheetType: 'TRAINING',
        equipmentItems: [],
      });
    });

    test('should list timesheets filtered by type', async () => {
      const result = await TimesheetService.list({
        companyId: company.id,
        timesheetType: 'INSPECTION',
        page: 1,
        pageSize: 20,
      });

      expect(result.timesheets.length).toBeGreaterThan(0);
      result.timesheets.forEach((ts) => {
        expect(ts.timesheetType).toBe('INSPECTION');
      });
    });

    test('should list training timesheets', async () => {
      const result = await TimesheetService.list({
        companyId: company.id,
        timesheetType: 'TRAINING',
        page: 1,
        pageSize: 20,
      });

      expect(result.timesheets.length).toBeGreaterThan(0);
      result.timesheets.forEach((ts) => {
        expect(ts.timesheetType).toBe('TRAINING');
      });
    });

    test('should filter by status', async () => {
      const result = await TimesheetService.list({
        companyId: company.id,
        status: 'approved',
        page: 1,
        pageSize: 20,
      });

      result.timesheets.forEach((ts) => {
        expect(ts.status).toBe('approved');
      });
    });
  });

  describe('getSummary', () => {
    test('should return summary with counts', async () => {
      const summary = await TimesheetService.getSummary(company.id);
      expect(summary).toHaveProperty('total');
      expect(summary).toHaveProperty('draft');
      expect(summary).toHaveProperty('submitted');
      expect(summary).toHaveProperty('approved');
      expect(summary).toHaveProperty('pendingReview');
    });
  });

  describe('checkDuplicate', () => {
    test('should detect duplicate timesheet for same job, engineer, date', async () => {
      const input = {
        companyId: company.id,
        userId: engineer.id,
        jobId: job.id,
        date: '2025-01-25',
        startTime: '2025-01-25T08:00:00',
        endTime: '2025-01-25T17:00:00',
        breakMinutes: 30,
        timesheetType: 'INSPECTION' as const,
        equipmentItems: [],
      };

      await TimesheetService.create(input);

      const isDuplicate = await TimesheetService.checkDuplicate(
        job.id,
        engineer.id,
        company.id,
        new Date('2025-01-25')
      );

      expect(isDuplicate).toBe(true);
    });

    test('should not detect duplicate for different date', async () => {
      const isDuplicate = await TimesheetService.checkDuplicate(
        job.id,
        engineer.id,
        company.id,
        new Date('2025-01-30')
      );

      expect(isDuplicate).toBe(false);
    });
  });

  describe('review workflow', () => {
    let reviewTsId: number;
    let reviewTs2Id: number;
    let reviewTs3Id: number;

    beforeAll(async () => {
      const ts = await TimesheetService.create({
        companyId: company.id,
        userId: engineer.id,
        jobId: job.id,
        date: '2025-01-28',
        startTime: '2025-01-28T08:00:00',
        endTime: '2025-01-28T17:00:00',
        breakMinutes: 30,
        description: 'Review test 1',
        timesheetType: 'INSPECTION',
        equipmentItems: [],
      });
      reviewTsId = ts.id;
      createdTimesheetIds.push(reviewTsId);

      const ts2 = await TimesheetService.create({
        companyId: company.id,
        userId: engineer.id,
        jobId: job.id,
        date: '2025-01-29',
        startTime: '2025-01-29T08:00:00',
        endTime: '2025-01-29T17:00:00',
        breakMinutes: 30,
        description: 'Review test 2',
        timesheetType: 'INSPECTION',
        equipmentItems: [],
      });
      reviewTs2Id = ts2.id;
      createdTimesheetIds.push(reviewTs2Id);

      const ts3 = await TimesheetService.create({
        companyId: company.id,
        userId: engineer.id,
        jobId: job.id,
        date: '2025-01-30',
        startTime: '2025-01-30T08:00:00',
        endTime: '2025-01-30T17:00:00',
        breakMinutes: 30,
        description: 'Review test 3',
        timesheetType: 'INSPECTION',
        equipmentItems: [],
      });
      reviewTs3Id = ts3.id;
      createdTimesheetIds.push(reviewTs3Id);

      await TimesheetService.submit(reviewTsId, company.id);
      await TimesheetService.submit(reviewTs2Id, company.id);
      await TimesheetService.submit(reviewTs3Id, company.id);
      await TimesheetService.moveToReview(reviewTsId, company.id);
      await TimesheetService.moveToReview(reviewTs2Id, company.id);
      await TimesheetService.moveToReview(reviewTs3Id, company.id);
    });

    test('review with reject decision', async () => {
      const result = await TimesheetService.review(
        reviewTsId,
        company.id,
        engineer.id,
        'reject',
        'Insufficient documentation'
      );
      expect(result.status).toBe('rejected');
      expect(result.reviewComments).toBe('Insufficient documentation');
    });

    test('review with return decision', async () => {
      const result = await TimesheetService.review(
        reviewTs2Id,
        company.id,
        engineer.id,
        'return',
        'Needs revision'
      );
      expect(result.status).toBe('returned');
    });

    test('review with approve decision', async () => {
      const result = await TimesheetService.review(
        reviewTs3Id,
        company.id,
        engineer.id,
        'approve',
        'Meets all requirements'
      );
      expect(result.status).toBe('approved');
      expect(result.reviewComments).toBe('Meets all requirements');
    });
  });

  describe('lock', () => {
    test('should lock an approved timesheet', async () => {
      const ts = await TimesheetService.create({
        companyId: company.id,
        userId: engineer.id,
        jobId: job.id,
        date: '2025-01-30',
        startTime: '2025-01-30T08:00:00',
        endTime: '2025-01-30T17:00:00',
        breakMinutes: 30,
        description: 'Lock test',
        timesheetType: 'INSPECTION',
        equipmentItems: [],
      });
      createdTimesheetIds.push(ts.id);

      await TimesheetService.submit(ts.id, company.id);
      await TimesheetService.moveToReview(ts.id, company.id);
      await TimesheetService.approve(ts.id, company.id, engineer.id);

      const result = await TimesheetService.lock(ts.id, company.id, engineer.id);
      expect(result.status).toBe('locked');
    });
  });

  describe('generateTimesheetNumber', () => {
    test('should generate unique timesheet numbers for different companies', async () => {
      const otherCompany = await prisma.company.create({
        data: {
          name: uniqueString('OtherCo'),
          prefix: 'OT',
          subscriptionPlan: 'Enterprise',
        },
      });

      const ts = await TimesheetService.create({
        companyId: otherCompany.id,
        userId: engineer.id,
        date: '2025-01-28',
        startTime: '2025-01-28T08:00:00',
        endTime: '2025-01-28T17:00:00',
        breakMinutes: 30,
        description: 'Number gen test',
        timesheetType: 'INSPECTION',
        equipmentItems: [],
      });
      createdTimesheetIds.push(ts.id);
      await prisma.company.delete({ where: { id: otherCompany.id } }).catch(() => {});

      expect(ts.timesheetNumber).toMatch(/^OT-/);
    });
  });
});
