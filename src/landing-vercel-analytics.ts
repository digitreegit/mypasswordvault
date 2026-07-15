import { inject, track } from "@vercel/analytics";

inject();

declare global {
  interface Window {
    MPV_VERCEL_TRACK?: (
      name: string,
      data?: Record<string, string | number | boolean | null>,
    ) => void;
  }
}

window.MPV_VERCEL_TRACK = (name, data) => {
  track(name, data);
};
