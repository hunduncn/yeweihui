import { NextRequest, NextResponse } from 'next/server';
import { getContract, createContractAttachment } from '@/lib/contracts';
import { requireAdmin } from '@/lib/server-auth';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { id } = await params;
  const contractId = parseInt(id);

  if (!getContract(contractId)) {
    return NextResponse.json({ error: '合同不存在' }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: '未提供文件' }, { status: 400 });

  const ext = path.extname(file.name);
  const storedFilename = `${uuidv4()}${ext}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, storedFilename), Buffer.from(await file.arrayBuffer()));

  const attachment = createContractAttachment({
    contract_id: contractId,
    filename: storedFilename,
    original_name: file.name,
    file_type: file.type.startsWith('image/') ? 'image' : 'document',
    file_size: file.size,
  });

  return NextResponse.json(attachment, { status: 201 });
}
