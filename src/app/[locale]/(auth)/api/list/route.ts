import { NextResponse } from 'next/server';

import { logger } from '@/libs/Logger';
import { getAccessToken } from '@/utils/getAccessToken';

export const POST = async (request: Request) => {
  const { page, limit } = await request.json();
  const { CLOUD_URL } = process.env;

  const TOKEN = getAccessToken();

  if (!TOKEN) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
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

  const resp = await fetch(`${CLOUD_URL}/list`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      page: pageNum,
      limit: limitNum,
    }),
  });

  if (!resp.ok) {
    logger.error(`API request failed with status ${resp.status}`);
    return NextResponse.json(
      { error: 'Failed to fetch entries' },
      { status: resp.status },
    );
  }

  const data = await resp.json();

  try {
    logger.info(`A new list has been created ${JSON.stringify(data)}`);

    return NextResponse.json({
      data,
    });
  } catch (error) {
    logger.error(error, 'An error occurred while creating a list');

    return NextResponse.json({}, { status: 500 });
  }
};
