import Cookies from 'js-cookie';
import { UserManager } from 'oidc-client-ts';

// OIDC_AUTHORITY=http://localhost:8080/realms/ycb
// OIDC_CLIENT_ID=ycb
// OIDC_REDIRECT_URI=http://localhost:3000/signin-callback
// OIDC_LOGOUT_REDIRECT_URI=http://localhost:3000/

const oidcConfig = {
  authority: process.env.NEXT_PUBLIC_OIDC_AUTHORITY!,
  client_id: process.env.NEXT_PUBLIC_OIDC_CLIENT_ID!,
  redirect_uri: process.env.NEXT_PUBLIC_OIDC_REDIRECT_URI!,
  post_logout_redirect_uri: process.env.NEXT_PUBLIC_OIDC_LOGOUT_REDIRECT_URI!,
  scope: 'openid profile email',
  automaticSilentRenew: true,
  silent_redirect_uri: process.env.NEXT_PUBLIC_OIDC_SILENT_REDIRECT_URI!,
  accessTokenExpiringNotificationTime: 300, // 5 minutes before expiry
  // userStore: new WebStorageStateStore({ store }),
};

const userManager = new UserManager(oidcConfig);

// Handle token expiring (before it expires) - this is the main renewal mechanism
userManager.events.addAccessTokenExpiring(() => {
  // This fires when token is about to expire (5 min before)
  userManager
    .signinSilent()
    .then((user) => {
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
    })
    .catch((error) => {
      // If silent renewal fails, don't redirect immediately
      // Let the app handle it when API calls fail
      console.warn('Silent token renewal failed:', error);
    });
});

// Handle token already expired
userManager.events.addAccessTokenExpired(() => {
  // Clear the expired user data
  Cookies.remove('user');
  // Don't automatically redirect - let AuthProvider handle it
});

// Handle successful user load
userManager.events.addUserLoaded((user) => {
  // Update cookie whenever user is loaded/renewed
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
});

// Handle silent renewal errors
userManager.events.addSilentRenewError((error) => {
  console.warn('Silent renewal error:', error);
  // Don't automatically redirect - let the app handle expired state
  Cookies.remove('user');
});

export default userManager;
