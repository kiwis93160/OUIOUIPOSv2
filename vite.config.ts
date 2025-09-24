import fs from 'fs';
import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const resolveSupabaseFallbackAlias = (): Record<string, string> => {
  const supabaseModulePath = path.resolve(
    __dirname,
    'node_modules/@supabase/supabase-js'
  );

  if (fs.existsSync(supabaseModulePath)) {
    return {};
  }

  return {
    '@supabase/supabase-js': path.resolve(__dirname, 'stubs/supabase-js.ts'),
  };
};

      },
    },
  };
});
