import replace from '@rollup/plugin-replace';
import typescript from 'rollup-plugin-typescript2';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import serve from 'rollup-plugin-serve';
import { readFileSync } from 'fs';

const dev = process.env.ROLLUP_WATCH;
const production = process.env.BUILD === 'production';
const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

export default {
  input: 'src/parqet-card.ts',
  output: {
    file: 'custom_components/parqet/frontend/parqet-card.js',
    format: 'es',
    sourcemap: !production,
    inlineDynamicImports: true,
  },
  plugins: [
    replace({ preventAssignment: true, __VERSION__: pkg.version }),
    nodeResolve({ browser: true }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      clean: true,
    }),
    production && terser({ format: { comments: false } }),
    dev &&
      serve({
        contentBase: ['custom_components/parqet/frontend', '.'],
        port: 3000,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }),
  ].filter(Boolean),
};
