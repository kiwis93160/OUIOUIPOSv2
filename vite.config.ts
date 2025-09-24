import fs from 'fs';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const geminiApiKey = env.VITE_GEMINI_API_KEY ?? env.GEMINI_API_KEY;

    const aliases: Record<string, string> = {
      '@': path.resolve(__dirname, '.'),
    };

    const supabaseModulePath = path.resolve(__dirname, 'node_modules/@supabase/supabase-js');
    if (!fs.existsSync(supabaseModulePath)) {
      aliases['@supabase/supabase-js'] = path.resolve(__dirname, 'stubs/supabase-js.ts');
    }

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(geminiApiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey)
      },
      resolve: {
        alias: aliases
      }
    };
});
