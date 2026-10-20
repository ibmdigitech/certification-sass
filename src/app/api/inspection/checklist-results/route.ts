import { NextRequest } from 'next/server';
import { POST as inspectionsPOST } from '@/app/api/inspections/checklist-results/route';

// Backward compatibility forwarder
export async function POST(request: NextRequest) {
  return inspectionsPOST(request);
}