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
    const { id1, id2 } = await request.json();

    if (!id1 || !id2) {
      return NextResponse.json(
        { error: 'Both id1 and id2 are required' },
        { status: 400 },
      );
    }

    // Validate that both IDs are valid UUIDs
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id1) || !uuidRegex.test(id2)) {
      return NextResponse.json(
        { error: 'Both IDs must be valid UUIDs' },
        { status: 400 },
      );
    }

    const resp = await fetch(`${CLOUD_URL}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({
        id1,
        id2,
      }),
    });

    if (!resp.ok) {
      logger.error(`Failed to join entries: ${resp.status} ${resp.statusText}`);
      return NextResponse.json(
        { error: 'Failed to join entries' },
        { status: resp.status },
      );
    }

    const result = await resp.json();
    logger.info(`Entries joined successfully: ${id1} + ${id2}`);

    return NextResponse.json({
      data: result,
    });
  } catch (error) {
    logger.error(error, 'An error occurred while joining entries');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
};
