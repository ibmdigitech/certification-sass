import { NextRequest, NextResponse } from 'next/server';
import { InspectionReportService } from '@/lib/services';
import { InspectionReportPDFGenerator } from '@/lib/services';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const companyId = parseInt(searchParams.get('companyId') || '1');
    const reportId = parseInt(id);

    const report = await InspectionReportService.getReportById(reportId, companyId);

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const pdfBuffer = await InspectionReportPDFGenerator.generateReportPDF(reportId, companyId);

    await InspectionReportPDFGenerator.savePDFToStorage(reportId, companyId, pdfBuffer);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${report.reportNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}