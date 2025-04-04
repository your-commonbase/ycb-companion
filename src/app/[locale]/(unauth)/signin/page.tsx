'use client';

import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import userManager from '@/libs/oidc';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    async function handleLogin() {
      const user = await userManager.getUser();
      const currentTime = Math.floor(Date.now() / 1000);

      if (user) {
        Cookies.set('user', JSON.stringify(user));
        if (user.expires_at! < currentTime) {
          await userManager.signinRedirect();
        }
        router.push('/dashboard'); // Redirect to dashboard
      } else {
        console.log('redirect');
        console.log(userManager);
        await userManager.signinRedirect();
      }
    }

    handleLogin();
  }, []);

  return (
    <div>
      You are signed in.{' '}
      <a href="/dashboard">Click here to go to the dashboard.</a>
    </div>
  );
}
