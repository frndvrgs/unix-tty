import { defineConfig } from 'unix-tty/config';

export default defineConfig({
  site: {
    title: 'unix-tty example',
    description: 'Minimal consumer site used to smoke-test the library.',
    url: 'http://localhost:4321',
  },
  terminal: {
    hostname: 'example',
    username: 'user',
    home: '/home/user',
    defaultTheme: 'ember',
    motd: ['unix {version} | tty0 | utf-8', 'last login: {buildDate}', "type 'help' for a list of commands"],
  },
  reader: {
    theme: 'ember',
  },
});
