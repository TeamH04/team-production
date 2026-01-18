import { fontFamilies } from '@team/theme';
import preset from 'nativewind/preset';

import type { Config } from 'tailwindcss';

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
