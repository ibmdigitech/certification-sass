import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai';
import { z } from 'zod';

const findingSchema = z.object({
  item: z.string().min(1),
  status: z.enum(['PASS', 'FAIL', 'N/A']),
  notes: z.string().optional(),
});

const inspectionReportSchema = z.object({
  inspectionType: z.string().min(1),
  equipment: z.string().optional(),
  location: z.string().min(1),
  findings: z.array(findingSchema).min(1),
  inspectorName: z.string().min(1),
  date: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = inspectionReportSchema.parse(body);

    const report = await aiService.generateInspectionReport(input);

    return NextResponse.json({ report });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Generate inspection report error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to generate inspection report' },
      { status: 500 }
    );
  }
}