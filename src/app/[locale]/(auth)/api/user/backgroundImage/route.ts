import console from 'console';
import { NextResponse } from 'next/server';

import { logger } from '@/libs/Logger';
import { getAccessToken } from '@/utils/getAccessToken';

// GET /api/user/backgroundImage - Retrieve user's background image
export const GET = async () => {
  const { CLOUD_URL } = process.env;

  const TOKEN = getAccessToken();

  if (!TOKEN) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }

  try {
    const resp = await fetch(`${CLOUD_URL}/user/getBackgroundImage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
        'x-companion-secret': process.env.COMPANION_SECRET!,
      },
      body: JSON.stringify({}),
    });

    logger.info('GET background image response status:', resp.status);

    const data = await resp.json();
    logger.info(
      'Background image fetched:',
      JSON.stringify(data).substring(0, 100),
    );

    return NextResponse.json({
      data,
    });
  } catch (error) {
    logger.error(error, 'An error occurred while fetching background image');
    return NextResponse.json({}, { status: 500 });
  }
};

// POST /api/user/backgroundImage - Upload user's background image
export const POST = async (request: Request) => {
  const { CLOUD_URL } = process.env;

  const TOKEN = getAccessToken();

  if (!TOKEN) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }

  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    console.log('invalid content-type:', contentType);
    return NextResponse.json(
      { error: 'Invalid content type' },
      { status: 400 },
    );
  }

  const formData = await request.formData();
  // debug log of incoming fields
  const entries = [];
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      entries.push([key, `File: ${value.name} (${value.size} bytes)`]);
    } else {
      entries.push([key, value]);
    }
  }

  logger.info('Background image upload form data:', entries);

  const fileField = formData.get('file');
  if (!fileField) {
    return NextResponse.json(
      { error: 'No file field in form data' },
      { status: 400 },
    );
  }

  const fileBlob = fileField as Blob;
  const filename =
    fileField instanceof File ? fileField.name : 'background-image';

  // forward file to Express endpoint
  const forwardForm = new FormData();
  forwardForm.append('file', fileBlob, filename);

  try {
    const proxyRes = await fetch(`${CLOUD_URL}/user/setBackgroundImage`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'x-companion-secret': process.env.COMPANION_SECRET!,
      },
      body: forwardForm,
    });

    logger.info('Background image upload response status:', proxyRes.status);

    const data = await proxyRes.json();
    return NextResponse.json(data, { status: proxyRes.status });
  } catch (error) {
    logger.error(error, 'An error occurred while uploading background image');
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
};

// DELETE /api/user/backgroundImage - Remove user's background image
export const DELETE = async () => {
  const { CLOUD_URL } = process.env;

  const TOKEN = getAccessToken();

  if (!TOKEN) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }

  try {
    const resp = await fetch(`${CLOUD_URL}/user/removeBackgroundImage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
        'x-companion-secret': process.env.COMPANION_SECRET!,
      },
      body: JSON.stringify({}),
    });

    logger.info('DELETE background image response status:', resp.status);

    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } catch (error) {
    logger.error(error, 'An error occurred while deleting background image');
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
};
