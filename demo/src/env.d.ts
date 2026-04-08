/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare module 'virtual:unix-tty/config' {
  import type { UnixTtyConfig } from 'unix-tty/config';
  const config: UnixTtyConfig;
  export default config;
}
