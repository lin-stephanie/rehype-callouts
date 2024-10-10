import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/themes/**/*.ts', 'src/types.ts'],
      reporter: ['text', 'json'],
      provider: 'v8',
    },
  },
})
