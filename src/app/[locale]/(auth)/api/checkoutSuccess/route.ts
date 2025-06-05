import { NextResponse } from 'next/server';

import { logger } from '@/libs/Logger';
import { getAccessToken } from '@/utils/getAccessToken';

export const POST = async (request: Request) => {
  const { CLOUD_URL } = process.env;
  const TOKEN = getAccessToken();

  if (!TOKEN) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { session_id: sessionID } = body;

    if (!sessionID) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 },
      );
    }

    const resp = await fetch(`${CLOUD_URL}/checkoutSuccess`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({ sessionID }),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      logger.error(`Failed to process checkout: ${resp.status} - ${errorText}`);
      return NextResponse.json(
        { error: 'Failed to process checkout' },
        { status: resp.status },
      );
    }

    const data = await resp.json();

    logger.info(`Checkout processed successfully for session: ${sessionID}`);
    return NextResponse.json(data);
  } catch (error) {
    logger.error(error, 'An error occurred while processing checkout');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
};
