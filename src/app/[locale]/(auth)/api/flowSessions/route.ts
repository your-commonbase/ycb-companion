import { NextResponse } from 'next/server';

import { logger } from '@/libs/Logger';

import { GET } from '../getCBPath/route';

// import env variables

export const POST = async (request: Request) => {
  const { CLOUD_URL } = process.env;
  const { page } = await request.json();

  const dbRes = await GET(request);
  if (!dbRes) {
    return NextResponse.json({}, { status: 500 });
  }
  const { DATABASE_URL, API_KEY } = await dbRes.json();

  const resp = await fetch(`${CLOUD_URL}/flow/list`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dbPath: DATABASE_URL,
      apiKey: API_KEY,
      page,
    }),
  });

  const data = await resp.json();

  try {
    logger.info(`A new flow list has been created ${JSON.stringify(data)}`);

    return NextResponse.json({
      data,
    });
  } catch (error) {
    logger.error(error, 'An error occurred while creating a flow list');

    return NextResponse.json({}, { status: 500 });
  }
};
