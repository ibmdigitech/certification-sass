import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function () {
  await prisma.$connect();
  // Truncate test tables before suite
  await prisma.$executeRaw`TRUNCATE TABLE "Job", "JobService", "Customer", "Location", "Company", "User", "TrainingSession", "Inspection", "Certificate", "Timesheet", "InspectionReport" RESTART IDENTITY CASCADE;`;
}

export async function teardown() {
  await prisma.$disconnect();
}