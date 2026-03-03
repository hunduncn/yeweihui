import { NextResponse } from 'next/server';
import { getContractStats } from '@/lib/contracts';

export async function GET() {
  return NextResponse.json(getContractStats());
}
