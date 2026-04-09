// @ts-check
import { defineConfig } from 'astro/config';
import unixTty from 'unix-tty/integration';
import site from './site.config.ts';

export default defineConfig({
  integrations: [unixTty(site)],
  vite: {
    // Allow ngrok tunnels for mobile testing. A leading dot matches any
    // subdomain, so every fresh ngrok URL is accepted without restarting
    // the dev/preview server.
    server: {
      allowedHosts: ['.ngrok-free.app', '.ngrok.app'],
    },
    preview: {
      allowedHosts: ['.ngrok-free.app', '.ngrok.app'],
    },
  },
});
