import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function setupTestDatabase() {
  // Clean slate for test tenant
  await prisma.timesheet.deleteMany({});
  await prisma.inspectionReport.deleteMany({});
  await prisma.inspection.deleteMany({});
  await prisma.trainingSession.deleteMany({});
  await prisma.certificate.deleteMany({});
  await prisma.jobService.deleteMany({});
  await prisma.job.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.location.deleteMany({});
  await prisma.company.deleteMany({});
  await prisma.user.deleteMany({});

  const company = await prisma.company.create({
    data: { name: 'TestCo', prefix: 'TST', subscriptionPlan: 'Enterprise' },
  });
  const location = await prisma.location.create({
    data: { name: 'Dubai', code: 'DXB', country: 'UAE', emirate: 'Dubai', company: { connect: { id: company.id } } },
  });
  const customer = await prisma.customer.create({
    data: { contact: 'Test Customer', email: 'test@customer.com', phone: '+971500000000', companyId: company.id },
  });
  const user = await prisma.user.create({
    data: { email: 'admin@testco.com', name: 'Admin', passwordHash: 'hashed', role: 'ADMIN', company: { connect: { id: company.id } } },
  });
  return { company, location, customer, user };
}

export async function teardownTestDatabase() {
  await prisma.$disconnect();
}

export { prisma };



