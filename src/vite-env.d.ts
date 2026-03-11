/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  turnstile?: {
    render: (container: string | HTMLElement, options: any) => string;
    reset: (widgetIdOrContainer: string | HTMLElement) => void;
    remove: (widgetIdOrContainer: string | HTMLElement) => void;
    getResponse: (widgetIdOrContainer?: string | HTMLElement) => string | undefined;
  };
}
