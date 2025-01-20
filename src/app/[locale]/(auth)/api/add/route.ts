import { NextResponse } from 'next/server';

import { logger } from '@/libs/Logger';

// import env variables

export const POST = async (request: Request) => {
  const { data, metadata } = await request.json();
  const { CLOUD_URL, TOKEN } = process.env;

  const resp = await fetch(`${CLOUD_URL}/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      data,
      metadata,
    }),
  });
  logger.info('resp:', resp);
  const respData = await resp.json();

  try {
    logger.info(`A new fetch has been created ${JSON.stringify(respData)}`);

    return NextResponse.json({
      respData,
    });
  } catch (error) {
    logger.error(error, 'An error occurred while creating a search');

    return NextResponse.json({}, { status: 500 });
  }
};
