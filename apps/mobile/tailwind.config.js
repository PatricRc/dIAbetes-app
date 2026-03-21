/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./src/**/*.{js,jsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Design System - Neutral
        brand: {
          bg: '#F5EFE8',
          bgSoft: '#FFF9F4',
          surface: '#FFFFFF',
          surfaceSoft: '#F7F2EC',
          surfaceMuted: '#EEE8E1',
          line: '#E5DDD3',
          black: '#0A0A0A',
        },
        // Design System - Pastel
        pastel: {
          yellow: '#F4DD75',
          pink: '#EEC0D8',
          pinkBright: '#F68AC8',
          green: '#CFE1A8',
          blue: '#BCD0F3',
          purple: '#CDB8F4',
          orange: '#F6C29B',
          mint: '#BFE8D9',
        },
      },
      borderRadius: {
        'ds-xs': '8px',
        'ds-sm': '12px',
        'ds-md': '16px',
        'ds-lg': '20px',
        'ds-xl': '24px',
        'ds-xxl': '32px',
      },
    },
  },
  plugins: [],
};
