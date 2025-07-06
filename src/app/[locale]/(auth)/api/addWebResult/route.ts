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
    const { title, description, url } = await request.json();

    if (!title || !url) {
      return NextResponse.json(
        { error: 'Title and URL are required' },
        { status: 400 },
      );
    }

    // Combine title and description as the data
    const data = description ? `${title}\n\n${description}` : title;

    const resp = await fetch(`${CLOUD_URL}/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({
        data,
        metadata: {
          title,
          author: url,
          type: 'web_result',
          source_url: url,
        },
      }),
    });

    if (!resp.ok) {
      logger.error(
        `Failed to add web result: ${resp.status} ${resp.statusText}`,
      );
      return NextResponse.json(
        { error: 'Failed to add web result' },
        { status: resp.status },
      );
    }

    const result = await resp.json();
    logger.info(`Web result added successfully: ${title}`);

    return NextResponse.json({
      data: result,
    });
  } catch (error) {
    logger.error(error, 'An error occurred while adding web result');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
};
