import { NextResponse } from 'next/server';

import { logger } from '@/libs/Logger';
import { getAccessToken } from '@/utils/getAccessToken';

// GET /api/user/customization - Retrieve user's customization settings
export const GET = async () => {
  const { CLOUD_URL } = process.env;

  const TOKEN = getAccessToken();

  if (!TOKEN) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }

  try {
    const resp = await fetch(`${CLOUD_URL}/user/getCompanionCSS`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
        'x-companion-secret': process.env.COMPANION_SECRET!,
      },
    });

    logger.info('GET customization response status:', resp.status);

    if (!resp.ok) {
      logger.warn('Failed to fetch customization settings:', resp.status);
      return NextResponse.json({}, { status: resp.status });
    }

    const data = await resp.json();
    logger.info(
      'GET customization data:',
      JSON.stringify(data).substring(0, 200),
    );

    return NextResponse.json(data);
  } catch (error) {
    logger.error(
      error,
      'An error occurred while fetching customization settings',
    );
    return NextResponse.json({}, { status: 500 });
  }
};
