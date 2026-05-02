import config from 'virtual:unix-tty/config';
import type { APIRoute } from 'astro';
import { buildFsManifest } from '../lib/buildFsManifest.js';
import { UNIX_VERSION } from '../version.js';

export const prerender = true;

export const GET: APIRoute = async () => {
  const manifest = await buildFsManifest({
    user: config.terminal.username,
    hostname: config.terminal.hostname,
    home: config.terminal.home,
    motd: config.terminal.motd,
    defaultTheme: config.terminal.defaultTheme,
    scanlines: config.terminal.scanlines,
    flicker: config.terminal.flicker,
    unixVersion: UNIX_VERSION,
  });

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'content-type': 'application/json' },
  });
};
