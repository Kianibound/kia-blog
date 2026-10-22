import { configDefaults, defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.e2e-spec.ts'],
    exclude: [...configDefaults.exclude, 'test/isolated/**'],
  },

  plugins: [
    swc.vite({
      module: {
        type: 'es6',
      },
    }),
  ],
});
