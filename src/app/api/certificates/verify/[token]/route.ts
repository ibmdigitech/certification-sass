import { NextRequest, NextResponse } from 'next/server';
import { VerificationTokenService } from '@/lib/services';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required', valid: false },
        { status: 400 }
      );
    }

    const result = await VerificationTokenService.verifyToken(token);

    const statusCode = result.valid ? 200 : 404;

    return NextResponse.json(result, { status: statusCode });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error', valid: false },
      { status: 500 }
    );
  }
}