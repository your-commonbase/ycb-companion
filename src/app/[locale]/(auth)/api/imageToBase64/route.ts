import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 },
      );
    }

    // Fetch the image from the CDN
    const response = await fetch(imageUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status}` },
        { status: response.status },
      );
    }

    // Convert to buffer
    const buffer = await response.arrayBuffer();

    // Convert to base64
    const base64 = Buffer.from(buffer).toString('base64');

    // Get content type from response headers
    const contentType = response.headers.get('content-type') || 'image/webp';

    return NextResponse.json({
      base64,
      contentType,
      size: buffer.byteLength,
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
