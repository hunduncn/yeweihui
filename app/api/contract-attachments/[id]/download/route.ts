import { NextRequest, NextResponse } from 'next/server';
import { getContractAttachment, deleteContractAttachment } from '@/lib/contracts';
import { requireAdmin } from '@/lib/server-auth';
import path from 'path';
import fs from 'fs';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const att = getContractAttachment(parseInt(id));
  if (!att) return NextResponse.json({ error: '附件不存在' }, { status: 404 });

  const filePath = path.join(UPLOADS_DIR, att.filename);
  if (!fs.existsSync(filePath)) return NextResponse.json({ error: '文件不存在' }, { status: 404 });

  const buffer = fs.readFileSync(filePath);
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(att.original_name)}`,
      'Content-Length': buffer.length.toString(),
    },
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const att = getContractAttachment(parseInt(id));
  if (!att) return NextResponse.json({ error: '附件不存在' }, { status: 404 });

  const filePath = path.join(UPLOADS_DIR, att.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  deleteContractAttachment(parseInt(id));
  return new NextResponse(null, { status: 204 });
}
