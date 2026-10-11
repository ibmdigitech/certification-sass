import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai';
import { z } from 'zod';

const certificateContentSchema = z.object({
  certificateType: z.enum(['TRAINING', 'INSPECTION']),
  holderName: z.string().min(1),
  courseOrInspection: z.string().min(1),
  issueDate: z.string().min(1),
  expiryDate: z.string().optional(),
  accreditation: z.string().optional(),
  achievements: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = certificateContentSchema.parse(body);

    const content = await aiService.generateCertificateContent(input);

    return NextResponse.json({ content });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Generate certificate content error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to generate certificate content' },
      { status: 500 }
    );
  }
}