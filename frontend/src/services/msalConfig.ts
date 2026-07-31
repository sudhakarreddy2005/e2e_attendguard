import { PublicClientApplication, Configuration, LogLevel } from '@azure/msal-browser';

const CLIENT_ID = import.meta.env.VITE_AZURE_CLIENT_ID || '8b51b70f-d5de-4b5f-b347-a8b477ea361e';
const TENANT_ID = import.meta.env.VITE_AZURE_TENANT_ID || 'f6981b0a-3915-4628-be7e-368196415f8f';

export const msalConfig: Configuration = {
  auth: {
    clientId: CLIENT_ID,
    authority: `https://login.microsoftonline.com/${TENANT_ID}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: true,
  },
  system: {
    allowNativeBroker: false,
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:
            console.error('[MSAL Error]:', message);
            return;
          case LogLevel.Info:
            console.info('[MSAL Info]:', message);
            return;
          case LogLevel.Verbose:
            console.debug('[MSAL Verbose]:', message);
            return;
          case LogLevel.Warning:
            console.warn('[MSAL Warning]:', message);
            return;
        }
      },
      logLevel: LogLevel.Warning,
    },
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

msalInstance.initialize().catch((err) => {
  console.error('MSAL initialization failed:', err);
});

export const loginRequest = {
  scopes: ['openid', 'profile', 'email', 'User.Read'],
};
