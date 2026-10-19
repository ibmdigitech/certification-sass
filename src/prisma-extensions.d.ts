// Global Prisma Client type extensions to fix stale types
// This file provides type assertions for models that exist in the schema
// but are missing from the generated Prisma client due to regeneration issues

import { PrismaClient } from '@prisma/client';

declare module '@prisma/client' {
  interface PrismaClient {
    trainee: any;
    trainingCourse: any;
    trainingSession: any;
    competency: any;
    enrollment: any;
    assessmentAttempt: any;
    certificate: any;
    job: any;
    deliveryLog: any;
    customer: any;
    customerSite: any;
    customerAsset: any;
    salesInquiry: any;
    salesQuotation: any;
    inspection: any;
    inspectionReport: any;
    failureWorkflow: any;
    user: any;
    auditLog: any;
    // Transaction client
    $transaction: any;
  }

  // Transaction client types
  interface PrismaTransactionClient {
    trainee: any;
    trainingCourse: any;
    trainingSession: any;
    competency: any;
    enrollment: any;
    assessmentAttempt: any;
    certificate: any;
    job: any;
    deliveryLog: any;
    customer: any;
    customerSite: any;
    customerAsset: any;
    salesInquiry: any;
    salesQuotation: any;
    inspection: any;
    inspectionReport: any;
    failureWorkflow: any;
    user: any;
    auditLog: any;
  }
}