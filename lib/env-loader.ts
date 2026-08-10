/**
 * CRITICAL: This file is ONLY for standalone scripts (setup-vector-db.ts, test-questions.ts)
 * It should NEVER be imported by files that are used in the Next.js application.
 *
 * Scripts that need this should import it directly at the top of the script file.
 * Example: import { readEnv } from '../lib/env-loader';
 *
 * DO NOT import this in:
 * - lib/supabase.ts
 * - lib/usage-limits.ts
 * - Any API routes
 * - Any components
 * - Any hooks
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

/**
 * Manually loads variables from .env.local for use in standalone scripts.
 * This ensures our scripts have access to the same secrets as our main Next.js application,
 * keeping all secrets in one secure, git-ignored file.
 */
export function readEnv() {
  const envPath = resolve(process.cwd(), '.env.local');

  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach((line) => {
      // Match key-value pairs and ignore comments or empty lines
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        // Remove quotes from the value if they exist
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1);
        }

        // Set the environment variable only if it's not already set
        // This allows for overriding variables from the command line
        if (!process.env[key]) {
          process.env[key] = value.trim();
        }
      }
    });
    console.log('✅ Environment variables loaded from .env.local');
  } else {
    console.warn('⚠️ Could not find .env.local file. Scripts that require API keys might fail.');
  }
}
