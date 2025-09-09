import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './@'),
    },
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: [
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tooltip',
    ],
  },
})
/** Test polyfills (Radix/UI) */
if (!(globalThis as any).Element?.prototype.hasPointerCapture) {
  (globalThis as any).Element.prototype.hasPointerCapture = () => {};
}
if (!(globalThis as any).window?.scrollIntoView) {
  (globalThis as any).window.scrollIntoView = () => {};
}
if (!(globalThis as any).Element?.prototype.getBoundingClientRect) {
  (globalThis as any).Element.prototype.getBoundingClientRect = () => ({x:0,y:0,width:100,height:20,top:0,left:0,bottom:20,right:100,toJSON(){return{}}});
}