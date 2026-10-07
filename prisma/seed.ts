import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { JobNumberService } from '../src/lib/services/job-number.service'
import { CertificateNumberService } from '../src/lib/services/certificate-number.service'

const prisma = new PrismaClient()

async function main() {
  // Companies
  const companyA = await prisma.company.create({
    data: {
      name: 'TechSafe Inspections',
      logo: 'https://example.com/logoA.png',
      prefix: 'TSC',
      subscriptionPlan: 'Enterprise'
    }
  })

  const companyB = await prisma.company.create({
    data: {
      name: 'EduCert Training',
      logo: 'https://example.com/logoB.png',
      prefix: 'EDC',
      subscriptionPlan: 'Professional'
    }
  })

  // Users
  const adminA = await prisma.user.create({
    data: {
      name: 'Ahmed',
      email: 'admin@techsafe.com',
      passwordHash: bcrypt.hashSync('adminpass123', 10),
      role: 'SuperAdmin',
      companyId: companyA.id
    }
  })

  const engineerA = await prisma.user.create({
    data: {
      name: 'John',
      email: 'engineer@techsafe.com',
      passwordHash: bcrypt.hashSync('engineerpass123', 10),
      role: 'Engineer',
      companyId: companyA.id
    }
  })

  const managerA = await prisma.user.create({
    data: {
      name: 'Fatima',
      email: 'manager@techsafe.com',
      passwordHash: bcrypt.hashSync('managerpass123', 10),
      role: 'TechnicalManager',
      companyId: companyA.id
    }
  })

  // Customer
  const customerA = await prisma.customer.create({
    data: {
      companyId: companyA.id,
      contact: 'ABC Trading',
      email: 'contact@abctrading.com',
      phone: '+971500000000'
    }
  })

  // Jobs - using JobNumberService
  const jobNumber1 = await JobNumberService.generateJobNumber(companyA.id)
  const job1 = await prisma.job.create({
    data: {
      companyId: companyA.id,
      customerId: customerA.id,
      jobNumber: jobNumber1,
      type: 'Inspection',
      status: 'scheduled',
      scheduledDate: new Date(),
      engineerId: engineerA.id
    }
  })

  const jobNumber2 = await JobNumberService.generateJobNumber(companyA.id)
  const job2 = await prisma.job.create({
    data: {
      companyId: companyA.id,
      customerId: customerA.id,
      jobNumber: jobNumber2,
      type: 'Training',
      status: 'scheduled',
      scheduledDate: new Date(),
      engineerId: engineerA.id
    }
  })

  // Reschedule (simulate incomplete inspection)
  await prisma.reschedule.create({
    data: {
      companyId: companyA.id,
      jobId: job1.id,
      reason: 'Engineer unavailable',
      suggestedDate: new Date(Date.now() + 86400000),
      status: 'pending',
      rescheduledBy: managerA.id
    }
  })

  // Checklist templates
  await prisma.checklistTemplate.createMany({
    data: [
      {
        companyId: companyA.id,
        certificateType: 'Pressure Vessel',
        authority: 'EIAC',
        items: JSON.stringify([
          'Visual inspection',
          'Thickness measurement',
          'Pressure test',
          'Safety valve check',
          'Serial number verification'
        ])
      },
      {
        companyId: companyA.id,
        certificateType: 'Training Certificate',
        authority: 'ENAS',
        items: JSON.stringify([
          'Trainer qualification check',
          'Curriculum compliance',
          'Attendance verification',
          'Assessment record',
          'Certificate numbering compliance'
        ])
      }
    ]
  })

  // Certificate - using CertificateNumberService
  const certNumberResult = await CertificateNumberService.generateCertificateNumber(job1.id, companyA.id)
  const cert1 = await prisma.certificate.create({
    data: {
      companyId: companyA.id,
      jobId: job1.id,
      jobNumber: certNumberResult.jobNumber,
      sequence: certNumberResult.sequence,
      number: certNumberResult.certificateNumber,
      revision: 0,
      pdfUrl: 'https://example.com/cert1.pdf',
      qrUrl: 'https://example.com/qr1.png',
      status: 'issued',
      complianceAuthority: 'EIAC'
    }
  })

  // Payment + Invoice
  const payment1 = await prisma.payment.create({
    data: {
      companyId: companyA.id,
      jobId: job1.id,
      amount: 1500.0,
      method: 'Cash',
      status: 'completed'
    }
  })

  await prisma.invoice.create({
    data: {
      companyId: companyA.id,
      paymentId: payment1.id,
      invoiceNumber: 'INV-1001',
      pdfUrl: 'https://example.com/invoice1.pdf'
    }
  })

  // Delivery log
  await prisma.deliveryLog.create({
    data: {
      companyId: companyA.id,
      certificateId: cert1.id,
      deliveryDate: new Date(),
      method: 'Courier',
      status: 'delivered'
    }
  })

  console.log('✅ Seed data created successfully')
  console.log(`Job 1: ${job1.jobNumber}`)
  console.log(`Job 2: ${job2.jobNumber}`)
  console.log(`Certificate: ${cert1.number}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })