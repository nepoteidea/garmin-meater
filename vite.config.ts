/// <reference types="vitest/config" />
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { svelteTesting } from '@testing-library/svelte/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [svelte(), svelteTesting()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest-setup.ts'],
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,svelte}'],
      exclude: ['src/main.ts', 'src/**/*.test.ts', 'src/**/*.d.ts'],
      reporter: ['text', 'html', 'lcov'],
      // Floors just under today's numbers; the gaps are mostly Svelte-compiled
      // template fallbacks and gesture edge cases jsdom can't produce.
      thresholds: { lines: 97, functions: 92, statements: 97, branches: 88 },
    },
  },
})
