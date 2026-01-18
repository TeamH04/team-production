import { fontFamilies } from '@team/theme';

import type { Config } from 'tailwindcss';

const preset = require('nativewind/preset');

const config: Config = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './features/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [preset],
  theme: {
    extend: {
      fontFamily: {
        sans: [fontFamilies.sans],
        medium: [fontFamilies.medium],
      },
    },
  },
  plugins: [],
};

export default config;
