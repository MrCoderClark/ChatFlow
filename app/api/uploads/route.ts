import { NextRequest, NextResponse } from 'next/server';
import { uploadMeClient } from '@/lib/uploadme';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filename = (file as any).name ?? 'upload.bin';

    const uploaded = await uploadMeClient.uploadBuffer(buffer, filename);

    return NextResponse.json({ file: uploaded }, { status: 200 });
  } catch (error) {
    console.error('UploadMe upload failed:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
