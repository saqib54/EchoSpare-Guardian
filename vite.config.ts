import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Vite automatically loads .env files and makes VITE_* variables available via import.meta.env
  // No need to manually define them
});