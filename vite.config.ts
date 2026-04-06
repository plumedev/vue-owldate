import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import { resolve } from 'path'

const isLibBuild = process.env.BUILD_LIB === 'true'

export default defineConfig({
  plugins: [
    vue(),
    ...(isLibBuild
      ? [
          dts({
            entryRoot: 'src',
            cleanVueFileName: true,
          }),
        ]
      : []),
    cssInjectedByJsPlugin(),
  ],
  ...(isLibBuild
    ? {
        build: {
          lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'VueOwldate',
            fileName: 'vue-owldate',
          },
          rollupOptions: {
            external: ['vue'],
            output: {
              globals: { vue: 'Vue' },
              exports: 'named',
            },
          },
        },
      }
    : {}),
  css: {
    preprocessorOptions: {
      scss: {
      },
    },
  },
})

