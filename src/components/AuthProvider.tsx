'use client';

import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

import userManager from '@/libs/oidc';

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // useEffect(() => {
  //   const renew = async () => {
  //     try {
  //       console.log('authprovider useeffect');
  //       await userManager.signinSilent({
  //         state: window.location.pathname,
  //       });
  //       const user = await userManager.getUser();
  //       const currentTime = Math.floor(Date.now() / 1000);
  //       if (!user || (user && user.expires_at! < currentTime)) {
  //         Cookies.set('user', '');
  //         await userManager.clearStaleState();
  //         await userManager.startSilentRenew();
  //       }
  //     } catch (error) {
  //       console.warn(error);
  //     }
  //   };

  //   console.log('[authprovider] userManager:', userManager);

  //   userManager.events.addAccessTokenExpiring(renew);
  //   userManager.events.addAccessTokenExpired(renew);
  //   userManager.events.addUserLoaded((user) => {
  //     console.log('userManager.events.addUserLoaded:', user);
  //     Cookies.set('user', JSON.stringify(user));
  //   });

  //   return () => {
  //     userManager.events.removeAccessTokenExpiring(renew);
  //     userManager.events.removeAccessTokenExpired(renew);
  //   };
  // }, []);

  const router = useRouter();
  const tokenCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Periodic token check - runs every 2 minutes
  useEffect(() => {
    const checkTokenExpiry = async () => {
      try {
        const user = await userManager.getUser();
        if (!user) {
          // No user, clear any stale cookie
          Cookies.remove('user');
          return;
        }

        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = (user.expires_at || 0) - now;

        // If token expires within 10 minutes, try to renew it
        if (timeUntilExpiry < 600) {
          try {
            const renewedUser = await userManager.signinSilent();
            if (renewedUser) {
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

              Cookies.set('user', JSON.stringify(renewedUser), cookieOptions);
            }
          } catch (error) {
            // Silent renewal failed, clear cookie and let bootstrap handle redirect
            Cookies.remove('user');
          }
        } else {
          // Token is still valid, ensure cookie is set
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
        // Error checking token, clear cookie
        Cookies.remove('user');
      }
    };

    // Start periodic token checking (every 2 minutes)
    tokenCheckInterval.current = setInterval(checkTokenExpiry, 120000);

    // Run initial check
    checkTokenExpiry();

    return () => {
      if (tokenCheckInterval.current) {
        clearInterval(tokenCheckInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    async function bootstrap() {
      const path = window.location.pathname;

      // if we’re on the callback page, finish signin and redirect
      if (
        path === '/signin-callback' ||
        path === '/signin-silent-callback' ||
        path === '/signin' ||
        path === '/signin-silent'
      ) {
        return;
      }

      // otherwise, normal bootstrap logic
      const user = await userManager.getUser();
      if (!user) {
        console.log('no session, redirect to signin with state', path);
        userManager.signinRedirect({ state: path });
        return;
      }
      if (user.expired) {
        try {
          console.log('token expired, doing silent renew');
          const renewedUser = await userManager.signinSilent({ state: path });
          if (renewedUser) {
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

            Cookies.set('user', JSON.stringify(renewedUser), cookieOptions);
          }
        } catch {
          // Silent renew failed, redirecting to interactive login
          userManager.signinRedirect({ state: path });
        }
      } else {
        // User is valid, ensure cookie is set
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
      // if we get here, session is valid
    }

    bootstrap();
  }, [router]);

  return children;
}
