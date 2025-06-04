import Cookies from 'js-cookie';

import userManager from '@/libs/oidc';

export async function authedFetch(input: any, init: any) {
  let user = await userManager.getUser();
  const now = Math.floor(Date.now() / 1000);

  // Check if token is expired or expires within 5 minutes
  if (!user || (user.expires_at || 0) - now < 300) {
    try {
      user = await userManager.signinSilent();
      if (user) {
        const cookieOptions = {
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax' as const,
          domain: undefined as string | undefined,
        };

        if (
          typeof window !== 'undefined' &&
          window.location.hostname !== 'localhost'
        ) {
          cookieOptions.domain = window.location.hostname;
        }

        Cookies.set('user', JSON.stringify(user), cookieOptions);
      }
    } catch (error) {
      // Silent renewal failed
      throw new Error('Authentication required');
    }
  }

  if (!user) {
    throw new Error('No user session available');
  }

  const headers = {
    ...init.headers,
    Authorization: `${user.token_type} ${user.access_token}`,
  };

  let res = await fetch(input, { ...init, headers });

  // Handle 401 with one retry attempt
  if (res.status === 401) {
    try {
      user = await userManager.signinSilent();
      if (user) {
        const cookieOptions = {
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax' as const,
          domain: undefined as string | undefined,
        };

        if (
          typeof window !== 'undefined' &&
          window.location.hostname !== 'localhost'
        ) {
          cookieOptions.domain = window.location.hostname;
        }

        Cookies.set('user', JSON.stringify(user), cookieOptions);
        headers.Authorization = `${user.token_type} ${user.access_token}`;
        res = await fetch(input, { ...init, headers });
      }
    } catch (error) {
      // Final attempt failed, clear cookie and throw
      Cookies.remove('user');
      throw new Error('Authentication failed');
    }
  }

  return res;
}
