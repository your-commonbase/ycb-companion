import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { Env } from '@/libs/Env';
import { getAccessToken } from '@/utils/getAccessToken';

export async function POST(request: NextRequest) {
  try {
    const token = await getAccessToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { page = 1, limit = 50 } = body;

    const response = await fetch(`${Env.CLOUD_URL}/fetchKanban`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        page,
        limit,
      }),
    });

    if (!response.ok) {
      console.error('Cloud API error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch kanban entries' },
        { status: response.status },
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (err) {
    console.error('API route error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
