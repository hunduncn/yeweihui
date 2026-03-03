import { NextRequest, NextResponse } from 'next/server';
import { getRecord, createAttachment } from '@/lib/records';
import { requireAdmin } from '@/lib/server-auth';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const recordId = parseInt(id);

  const record = getRecord(recordId);
  if (!record) {
    return NextResponse.json({ error: '记录不存在' }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const category = (formData.get('category') as string | null) || 'other';

  if (!file) {
    return NextResponse.json({ error: '未提供文件' }, { status: 400 });
  }

  const ext = path.extname(file.name);
  const storedFilename = `${uuidv4()}${ext}`;
  const filePath = path.join(UPLOADS_DIR, storedFilename);

  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, buffer);

  const fileType = file.type.startsWith('image/') ? 'image' : 'document';

  const attachment = createAttachment({
    record_id: recordId,
    filename: storedFilename,
    original_name: file.name,
    file_type: fileType,
    file_size: file.size,
    category,
  });

  return NextResponse.json(attachment, { status: 201 });
}
