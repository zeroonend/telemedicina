import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
    },
  },
  server: {
    port: 5173,
    headers: {
      'Content-Security-Policy': [
        "default-src 'self'",
        // Permitimos Daily.co, UNPKG e agora Stripe (scripts)
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://c.daily.co https://b.daily.co https://unpkg.com https://js.stripe.com https://*.stripe.com",
        "style-src 'self' 'unsafe-inline'",
        // Permitimos conexões ao backend local e serviços Stripe necessários
        "connect-src 'self' http://localhost:3002 wss://*.daily.co https://*.daily.co https://api.stripe.com https://m.stripe.network https://js.stripe.com https://*.stripe.com",
        "img-src 'self' data: https: blob:",
        "media-src 'self' blob: https://*.daily.co",
        // Permitimos iframes do Daily e do Stripe
        "frame-src 'self' https://*.daily.co https://js.stripe.com https://*.stripe.com https://hooks.stripe.com"
      ].join('; ')
    }
  }
});
