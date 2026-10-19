import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
const DEFAULT_NOTIFICATIONS = [
  {
    eventCode: 'JOB_COMPLETED',
    description: 'Once Job Order Completed (Ready for Certificate)',
    recipientRole: 'OPERATIONS_COORDINATOR, TECHNICAL_MANAGER',
    channels: 'EMAIL',
    templateSubject: 'Job Order {{jobNumber}} Completed — Ready for Certification',
    templateBody: 'Job order has been finished by field engineer and is waiting for technical review.',
    isActive: true,
  },
  {
    eventCode: 'CERT_APPROVED',
    description: 'Once Certificate approved (Ready for Printing and Invoicing)',
    recipientRole: 'ACCOUNTS, CUSTOMER, OPERATIONS',
    channels: 'EMAIL',
    templateSubject: 'Official Certificate {{certNumber}} Approved for {{customerName}}',
    templateBody: 'Certificate has passed technical review and is ready for print and invoicing.',
    isActive: true,
  },
  {
    eventCode: 'INSPECTOR_ASSIGNED',
    description: 'Once Inspector Assigned (Field Schedule Notification)',
    recipientRole: 'INSPECTOR, CUSTOMER',
    channels: 'EMAIL, SMS',
    templateSubject: 'Inspection Assignment: Job {{jobNumber}} on {{scheduledDate}}',
    templateBody: 'You have been assigned to conduct thorough examination at site {{siteName}}.',
    isActive: true,
  },
  {
    eventCode: 'FAILURE_RECORDED',
    description: 'Once Equipment Inspection Rejected / Non-Conformance Found',
    recipientRole: 'TECHNICAL_MANAGER, CLIENT_SAFETY_OFFICER',
    channels: 'EMAIL',
    templateSubject: 'CRITICAL: Safety Non-Conformance on Asset {{serialNumber}}',
    templateBody: 'An equipment safety defect has been identified requiring immediate corrective action.',
    isActive: true,
  },
  {
    eventCode: 'DELIVERY_CONFIRMED',
    description: 'Once Certificate Delivery Confirmation (DC) Completed',
    recipientRole: 'OPERATIONS, ACCOUNTS',
    channels: 'EMAIL',
    templateSubject: 'Delivery Confirmed for Certificate {{certNumber}}',
    templateBody: 'Certificate physical dispatch has been acknowledged by recipient.',
    isActive: true,
  },
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const companyId = session.user.companyId;

    let settings = await (prisma as any).notificationSetting.findMany({
      where: { companyId },
      orderBy: { createdAt: 'asc' },
    });

    if (settings.length === 0) {
      for (const item of DEFAULT_NOTIFICATIONS) {
        await (prisma as any).notificationSetting.create({
          data: {
            companyId,
            ...item,
          },
        });
      }
      settings = await (prisma as any).notificationSetting.findMany({
        where: { companyId },
        orderBy: { createdAt: 'asc' },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json({ error: 'Failed to fetch notification settings' }, { status: 500 });
  }
}
