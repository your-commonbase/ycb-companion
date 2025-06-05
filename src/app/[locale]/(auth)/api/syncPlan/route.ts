import { NextResponse } from 'next/server';

import { logger } from '@/libs/Logger';
import { getAccessToken } from '@/utils/getAccessToken';

export const POST = async () => {
  const { CLOUD_URL } = process.env;
  const TOKEN = getAccessToken();

  if (!TOKEN) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }

  try {
    const resp = await fetch(`${CLOUD_URL}/user/syncPlan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
      },
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      logger.error(`Failed to sync plan: ${resp.status} - ${errorText}`);
      return NextResponse.json(
        { error: 'Failed to sync plan' },
        { status: resp.status },
      );
    }

    const data = await resp.json();

    logger.info('Plan synced successfully');
    return NextResponse.json(data);
  } catch (error) {
    logger.error(error, 'An error occurred while syncing plan');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
};
