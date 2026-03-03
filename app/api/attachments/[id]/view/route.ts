import { NextRequest, NextResponse } from 'next/server';
import { getAttachment } from '@/lib/records';
import path from 'path';
import fs from 'fs';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
};

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const attachment = getAttachment(parseInt(id));

  if (!attachment) {
    return NextResponse.json({ error: '附件不存在' }, { status: 404 });
  }

  const filePath = path.join(UPLOADS_DIR, attachment.filename);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: '文件不存在' }, { status: 404 });
  }

  const ext = path.extname(attachment.filename).toLowerCase();
  const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';
  const buffer = fs.readFileSync(filePath);

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': 'inline',
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
