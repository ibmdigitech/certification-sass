import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai';
import { z } from 'zod';

const jobSummarySchema = z.object({
  jobNumber: z.string().min(1),
  customer: z.string().min(1),
  location: z.string().min(1),
  services: z.array(z.object({
    type: z.enum(['TRAINING', 'INSPECTION']),
    details: z.string().min(1),
    status: z.string().min(1),
  })).min(1),
  timeline: z.object({
    startDate: z.string().min(1),
    endDate: z.string().optional(),
  }),
  personnel: z.array(z.object({
    name: z.string().min(1),
    role: z.string().min(1),
    service: z.enum(['TRAINING', 'INSPECTION']),
  })).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = jobSummarySchema.parse(body);

    const summary = await aiService.generateJobSummary(input);

    return NextResponse.json({ summary });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Generate job summary error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to generate job summary' },
      { status: 500 }
    );
  }
}