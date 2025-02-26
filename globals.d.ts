// globals.d.ts
interface Window {
  __analytics__?: {
    appUrl?: string;
    services?: Record<string, string>;
  };
}
