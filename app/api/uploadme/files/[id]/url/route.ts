import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Proxy endpoint in chatflow that fetches a signed URL from UploadMe API
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // The Node SDK currently doesn't expose a getSignedUrl helper,
    // so we call the UploadMe REST endpoint directly using fetch.
    const apiUrl = process.env.UPLOADME_API_URL;
    const apiKey = process.env.UPLOADME_API_KEY;

    if (!apiUrl || !apiKey) {
      return NextResponse.json(
        { success: false, error: 'UPLOADME_API_URL or UPLOADME_API_KEY not configured' },
        { status: 500 }
      );
    }

    const res = await fetch(`${apiUrl}/files/${id}/url`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      // Node runtime, so no need for `cache: 'no-store'` unless you want fresh each time
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Failed to fetch signed URL from UploadMe:', res.status, text);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch signed URL from UploadMe' },
        { status: 500 }
      );
    }

    const data = await res.json();
    const signedUrl = data?.data?.url;

    if (!signedUrl) {
      return NextResponse.json(
        { success: false, error: 'Signed URL not returned from UploadMe' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, url: signedUrl }, { status: 200 });
  } catch (error) {
    console.error('Error in /api/uploadme/files/[id]/url:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
