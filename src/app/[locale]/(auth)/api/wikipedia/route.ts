import { NextResponse } from 'next/server';

import { logger } from '@/libs/Logger';
import { getAccessToken } from '@/utils/getAccessToken';

export const POST = async (request: Request): Promise<any> => {
  const TOKEN = getAccessToken();

  if (!TOKEN) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }

  try {
    // First, get a random Wikipedia article title
    const randomResponse = await fetch(
      'https://en.wikipedia.org/api/rest_v1/page/random/summary',
      {
        headers: {
          'User-Agent': 'YCB-Companion/1.0 (https://yourcommonbase.com)',
        },
      },
    );

    if (!randomResponse.ok) {
      throw new Error('Failed to fetch random Wikipedia article');
    }

    const randomData = await randomResponse.json();
    const pageTitle = randomData.title;

    // Get the full page content with extract and thumbnail
    const contentResponse = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`,
      {
        headers: {
          'User-Agent': 'YCB-Companion/1.0 (https://yourcommonbase.com)',
        },
      },
    );

    if (!contentResponse.ok) {
      throw new Error('Failed to fetch Wikipedia content');
    }

    const contentData = await contentResponse.json();

    // Filter out disambiguation pages and pages with very short extracts
    if (
      contentData.type === 'disambiguation' ||
      !contentData.extract ||
      contentData.extract.length < 100
    ) {
      // Try again with a different random article
      return await POST(request);
    }

    const wikipediaData = {
      title: contentData.title,
      extract: contentData.extract,
      thumbnail: contentData.thumbnail,
      pageUrl:
        contentData.content_urls?.desktop?.page ||
        `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}`,
    };

    logger.info(`Fetched Wikipedia article: ${pageTitle}`);

    return NextResponse.json({
      data: wikipediaData,
    });
  } catch (error) {
    logger.error(error, 'Error fetching Wikipedia content');

    return NextResponse.json(
      { error: 'Failed to fetch Wikipedia content' },
      { status: 500 },
    );
  }
};
