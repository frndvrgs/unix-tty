import type { APIRoute } from 'astro';
import config from 'virtual:unix-tty/config';
import { buildFsManifest } from '../lib/buildFsManifest.js';
import { UNIX_VERSION } from '../version.js';

// Static JSON endpoint generated at build time. The terminal fetches this
// at runtime to learn the virtual filesystem layout.
export const prerender = true;

export const GET: APIRoute = async () => {
  const manifest = await buildFsManifest({
    user: config.terminal.username,
    hostname: config.terminal.hostname,
    home: config.terminal.home,
    motd: config.terminal.motd,
    defaultTheme: config.terminal.defaultTheme,
    unixVersion: UNIX_VERSION,
  });

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'content-type': 'application/json' },
  });
};
