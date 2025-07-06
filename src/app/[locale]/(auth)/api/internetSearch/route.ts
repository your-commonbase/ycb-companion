import { NextResponse } from 'next/server';

import { logger } from '@/libs/Logger';
import { getAccessToken } from '@/utils/getAccessToken';

export const GET = async (request: Request) => {
  const { CLOUD_URL } = process.env;

  const TOKEN = getAccessToken();

  if (!TOKEN) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter is required' },
      { status: 400 },
    );
  }

  try {
    const resp = await fetch(
      `${CLOUD_URL}/internetSearch?query=${encodeURIComponent(query)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TOKEN}`,
        },
      },
    );

    if (!resp.ok) {
      logger.error(`Internet search failed: ${resp.status} ${resp.statusText}`);
      return NextResponse.json(
        { error: 'Internet search failed' },
        { status: resp.status },
      );
    }

    const data = await resp.json();
    logger.info(`Internet search completed for query: ${query}`);

    return NextResponse.json({
      data: data.results || [],
    });
  } catch (error) {
    logger.error(error, 'An error occurred while performing internet search');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
};
