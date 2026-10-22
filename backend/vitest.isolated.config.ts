import { defineConfig } from 'vitest/config';
import ts from 'typescript';

// Preserve Nest constructor metadata without requiring SWC's platform-native addon.
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/isolated/**/*.e2e-spec.ts'],
  },
  plugins: [
    {
      name: 'typescript-decorator-metadata',
      enforce: 'pre',
      transform(source, id) {
        if (!id.endsWith('.ts') || id.includes('/node_modules/')) return;
        return {
          code: ts.transpileModule(source, {
            fileName: id,
            compilerOptions: {
              target: ts.ScriptTarget.ES2023,
              module: ts.ModuleKind.ESNext,
              experimentalDecorators: true,
              emitDecoratorMetadata: true,
              esModuleInterop: true,
            },
          }).outputText,
          map: null,
        };
      },
    },
  ],
});
