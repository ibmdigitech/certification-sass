import { NextResponse } from 'next/server';
import { openRouter, AI_MODELS } from '@/lib/ai';

export async function GET() {
  const isConfigured = openRouter.isConfigured();

  return NextResponse.json({
    configured: isConfigured,
    defaultModel: openRouter.defaultModel,
    availableModels: Object.values(AI_MODELS),
    baseUrl: openRouter.baseUrl,
  });
}