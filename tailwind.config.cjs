let sharedPreset;

try {
  sharedPreset = require('../respondr-design-tokens/web-tailwind-preset.cjs');
} catch (err) {
  if (err.code !== 'MODULE_NOT_FOUND') throw err;
  sharedPreset = require('../respondr-design-tokens/respondr-design-tokens/web-tailwind-preset.cjs');
}

module.exports = {
  presets: [sharedPreset],
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
