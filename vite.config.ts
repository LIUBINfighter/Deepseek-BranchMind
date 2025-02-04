import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  base: './', // 添加这一行
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5175,
    open: true
  }
})
