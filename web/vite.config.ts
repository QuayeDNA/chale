import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative asset URLs: the static build must run from any host and any
  // sub-path (Vercel, Netlify, or Supabase Storage at /storage/v1/object/...).
  base: './',
});
