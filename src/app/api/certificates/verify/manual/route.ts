import { NextRequest, NextResponse } from 'next/server';
import { VerificationTokenService } from '@/lib/services';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { certificateNumber } = body;

    if (!certificateNumber) {
      return NextResponse.json(
        { error: 'Certificate number is required', valid: false },
        { status: 400 }
      );
    }

    const result = await VerificationTokenService.verifyByCertificateNumber(certificateNumber);

    const statusCode = result.valid ? 200 : 404;

    return NextResponse.json(result, { status: statusCode });
  } catch (error) {
    console.error('Manual verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error', valid: false },
      { status: 500 }
    );
  }
}