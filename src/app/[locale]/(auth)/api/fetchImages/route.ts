import { NextResponse } from 'next/server';

import { logger } from '@/libs/Logger';
import { getAccessToken } from '@/utils/getAccessToken';

export const POST = async (request: Request) => {
  const { CLOUD_URL } = process.env;

  const TOKEN = getAccessToken();

  if (!TOKEN) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }

  const { page, limit } = await request.json();

  const resp = await fetch(`${CLOUD_URL}/fetchImages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      page,
      limit,
    }),
  });
  logger.info('resp:', resp);
  const data = await resp.json();

  try {
    logger.info(`Fetched images for page ${page}: ${JSON.stringify(data)}`);

    return NextResponse.json({
      data,
    });
  } catch (error) {
    logger.error(error, 'An error occurred while fetching images');

    return NextResponse.json({}, { status: 500 });
  }
};
