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
    const { plan } = body;

    if (!plan) {
      return NextResponse.json({ error: 'Plan is required' }, { status: 400 });
    }

    const resp = await fetch(`${CLOUD_URL}/changePlan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({ plan }),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      logger.error(`Failed to change plan: ${resp.status} - ${errorText}`);
      return NextResponse.json(
        { error: 'Failed to change plan' },
        { status: resp.status },
      );
    }

    const data = await resp.json();

    if (data.checkout_url) {
      return NextResponse.json({
        redirect: true,
        checkout_url: data.checkout_url,
        ...data,
      });
    }

    logger.info(`Plan changed to ${plan} successfully`);
    return NextResponse.json(data);
  } catch (error) {
    logger.error(error, 'An error occurred while changing plan');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
};
