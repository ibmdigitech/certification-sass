import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai';
import { z } from 'zod';

const emailTemplateSchema = z.object({
  purpose: z.enum(['job_confirmation', 'schedule_notification', 'certificate_issued', 'inspection_reminder', 'payment_reminder', 'custom']),
  recipient: z.string().min(1),
  context: z.record(z.string(), z.string()),
  tone: z.enum(['formal', 'friendly', 'urgent']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = emailTemplateSchema.parse(body);

    const template = await aiService.generateEmailTemplate(input);

    return NextResponse.json({ template });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Generate email template error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to generate email template' },
      { status: 500 }
    );
  }
}