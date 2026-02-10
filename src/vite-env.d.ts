/// \u003creference types="vite/client" /\u003e

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_PROXY_TARGET?: string;
  readonly VITE_WS_URL?: string;
  readonly VITE_SENTRY_DSN?: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.jsx' {
  import type { ComponentType } from 'react';
  const Component: ComponentType<any>;
  export default Component;
}
