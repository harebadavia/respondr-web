const sharedPreset = require('../respondr-design-tokens/web-tailwind-preset.cjs');

module.exports = {
  presets: [sharedPreset],
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
