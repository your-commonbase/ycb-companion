// Import the cookies utility
import { NextResponse } from 'next/server';

import { logger } from '@/libs/Logger';
import { getAccessToken } from '@/utils/getAccessToken';

// import env variables

export const POST = async (request: Request) => {
  const { data, metadata, createdAt, duplicateCheck } = await request.json();
  const { CLOUD_URL } = process.env;
  const TOKEN = getAccessToken();

  if (!TOKEN) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }

  const entryBody: {
    data: any;
    metadata: any;
    created_at?: string;
    duplicate_check?: any;
  } = {
    data,
    metadata,
  };

  if (duplicateCheck) {
    entryBody.duplicate_check = duplicateCheck;
  }

  if (createdAt) {
    entryBody.created_at = createdAt;
  }

  const resp = await fetch(`${CLOUD_URL}/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify(entryBody),
  });
  logger.info('add resp:', resp);
  const respData = await resp.json();
  const respStatus = resp.status;

  try {
    logger.info(`A new add has been created ${JSON.stringify(respData)}`);

    if (respData.error) {
      const error = new Error(respData.error);
      (error as any).status = respStatus; // Attach the status property
      throw error;
    }

    return NextResponse.json({
      respData,
    });
  } catch (error: any) {
    logger.error(error, 'An error occurred while creating a add');

    if (error.status === 429) {
      return NextResponse.json(
        {
          error:
            'You have reached the limit for your account. Please upgrade your plan.',
        },
        { status: 429 },
      );
    }
    return NextResponse.json(
      {
        error: 'An error occurred while adding an entry',
      },
      { status: 500 },
    );
  }
};
