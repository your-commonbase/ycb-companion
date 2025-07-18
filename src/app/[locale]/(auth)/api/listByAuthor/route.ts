import { NextResponse } from 'next/server';

import { logger } from '@/libs/Logger';
import { getAccessToken } from '@/utils/getAccessToken';

export const POST = async (request: Request) => {
  const { author, title, page, limit } = await request.json();
  const { CLOUD_URL } = process.env;

  const TOKEN = getAccessToken();

  if (!TOKEN) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }

  // Validate that at least author or title is provided
  if (
    (!author || typeof author !== 'string') &&
    (!title || typeof title !== 'string')
  ) {
    return NextResponse.json(
      { error: 'At least one of author or title parameter is required' },
      { status: 400 },
    );
  }

  let pageNum = page;
  let limitNum = limit;

  // Set defaults and validate parameters
  if (pageNum === undefined || pageNum < 1) {
    pageNum = 1;
  }

  if (limitNum === undefined) {
    limitNum = 50;
  }

  if (limitNum > 100) {
    limitNum = 100;
  }
  if (limitNum < 1) {
    limitNum = 1;
  }

  try {
    const resp = await fetch(`${CLOUD_URL}/listByAuthor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({
        ...(author && { author }),
        ...(title && { title }),
        page: pageNum,
        limit: limitNum,
      }),
    });

    if (!resp.ok) {
      logger.error(`API request failed with status ${resp.status}`);
      return NextResponse.json(
        { error: 'Failed to fetch entries by author' },
        { status: resp.status },
      );
    }

    const data = await resp.json();

    logger.info(
      `Fetched entries by author: ${author || 'none'}, title: ${title || 'none'}, page: ${pageNum}, limit: ${limitNum}`,
    );

    return NextResponse.json({
      data: data.records || data.data || [],
    });
  } catch (error) {
    logger.error(error, 'An error occurred while fetching entries by author');

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
};
