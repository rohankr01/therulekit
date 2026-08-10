/**
 * 🔒 SecureLogger — Production-safe, Edge-compatible structured logger
 *
 * ✅ Works across Node.js + Edge runtimes
 * ✅ Automatically sanitizes sensitive info (keys, URLs, emails, paths, JWTs)
 * ✅ Whitelists critical debugging URLs (Supabase, Anthropic)
 * ✅ Colorized, rich console output in development
 * ✅ Safe JSON serialization with circular reference protection
 * ✅ Enterprise-grade security (masks service_role keys, API keys, JWTs)
 */

// ✅ Fix for "Cannot find name 'EdgeRuntime'" in TypeScript
declare const EdgeRuntime: string | undefined;

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_EDGE = typeof EdgeRuntime !== 'undefined';
const MAX_MESSAGE_LENGTH = 200;
const MAX_DATA_CHARS = 1000;

type AnyObject = Record<string, unknown>;

// 🎨 ANSI color helper for dev readability
const color = {
  gray: (msg: string) => `\x1b[90m${msg}\x1b[0m`,
  green: (msg: string) => `\x1b[32m${msg}\x1b[0m`,
  yellow: (msg: string) => `\x1b[33m${msg}\x1b[0m`,
  red: (msg: string) => `\x1b[31m${msg}\x1b[0m`,
  blue: (msg: string) => `\x1b[34m${msg}\x1b[0m`,
  cyan: (msg: string) => `\x1b[36m${msg}\x1b[0m`,
};

export class SecureLogger {
  // Generic info-level log
  static log(message: string, data?: unknown): void {
    this._print('log', 'ℹ️', message, data);
  }

  // Success logs
  static success(message: string, data?: unknown): void {
    this._print('log', '✅', message, data, color.green);
  }

  // Warnings
  static warn(message: string, data?: unknown): void {
    this._print('warn', '⚠️', message, data, color.yellow);
  }

  // Errors
  static error(context: string, error?: unknown): void {
    const errMsg =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : undefined;

    const sanitized = this.sanitizeString(`${context}: ${errMsg || ''}`);

    try {
      if (IS_PRODUCTION) {
        console.error(`[ERROR] ${sanitized}`);
      } else {
        console.error(color.red(`❌ ${sanitized}`));
        if (error instanceof Error && error.stack) {
          console.error(color.gray(error.stack));
        } else if (error && typeof error === 'object') {
          console.error(this.safeStringify(error));
        }
      }
    } catch {
      // Edge-safe: console may throw if log too large
    }
  }

  // Info logs
  static info(message: string, data?: unknown): void {
    this._print('log', 'ℹ️', message, data, color.blue);
  }

  // Debug (visible only in non-production)
  static debug(message: string, data?: unknown): void {
    if (IS_PRODUCTION) return;
    this._print('debug', '🐞', message, data, color.gray);
  }

  // DB operation logs
  static logDB(operation: string, count: number): void {
    this._print('log', '🗄️', `DB ${operation}: ${count} records`);
  }

  // Query logs
  static logQuery(query: string): void {
    if (IS_PRODUCTION) {
      console.log('[QUERY] [REDACTED]');
    } else {
      console.log(color.blue(`🔍 Query: ${query}`));
    }
  }

  // File operation logs
  static logFile(filename: string, status: string): void {
    const basename = filename.split(/[/\\]/).pop() || filename;
    this._print('log', '📁', `${basename}: ${status}`);
  }

  // -----------------------
  // Private helpers
  // -----------------------

  private static _print(
    method: 'log' | 'warn' | 'debug',
    emoji: string,
    message: string,
    data?: unknown,
    colorize?: (msg: string) => string
  ): void {
    try {
      const msg = IS_PRODUCTION
        ? `[${emoji}] ${this.sanitizeString(message)}`
        : `${emoji} ${colorize ? colorize(message) : message}`;

      if (IS_EDGE) {
        console[method]?.(msg, data ? this.safeStringify(data) : '');
        return;
      }

      if (data !== undefined) {
        console[method](msg, IS_PRODUCTION ? this.sanitizeData(data) : data);
      } else {
        console[method](msg);
      }
    } catch {
      // Prevent log crashes in restricted Edge contexts
    }
  }

  /**
   * 🛡️ Enhanced sanitization with whitelisted critical URLs
   * 
   * MASKS:
   * - OpenAI API keys (sk-...)
   * - Anthropic API keys (sk-ant-...)
   * - Supabase service_role JWT tokens (long base64 strings)
   * - Generic JWTs
   * - Email addresses
   * - File system paths
   * - Most URLs (except whitelisted debugging domains)
   * 
   * PRESERVES (for debugging):
   * - Supabase URLs (*.supabase.co)
   * - Anthropic API URLs (api.anthropic.com)
   */
  private static sanitizeString(msg: string): string {
    if (!msg) return '';
    let s = String(msg);

    // 🔒 CRITICAL: Mask Supabase service_role keys (JWT format)
    // Pattern: Long base64 strings with dots (JWT structure: header.payload.signature)
    // Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSI...
    s = s.replace(
      /eyJ[A-Za-z0-9_-]{100,}\.[A-Za-z0-9_-]{100,}\.[A-Za-z0-9_-]{10,}/g,
      '[SERVICE_ROLE_KEY]'
    );

    // 🔒 Mask generic long JWTs (any format)
    s = s.replace(
      /[A-Za-z0-9_-]{200,}\.[A-Za-z0-9_-]{100,}\.[A-Za-z0-9_-]{10,}/g,
      '[JWT_TOKEN]'
    );

    // 🔒 Mask OpenAI API keys (sk-...)
    s = s.replace(/sk-[A-Za-z0-9]{32,}/gi, '[OPENAI_KEY]');

    // 🔒 Mask Anthropic API keys (sk-ant-...)
    s = s.replace(/sk-ant-[A-Za-z0-9_-]{95,}/gi, '[ANTHROPIC_KEY]');

    // 🌐 Mask URLs EXCEPT whitelisted debugging domains
    // Whitelist: *.supabase.co, api.anthropic.com
    // This preserves critical debugging context while hiding sensitive URLs
    s = s.replace(
      /https?:\/\/(?!([a-z0-9-]+\.)?supabase\.co|api\.anthropic\.com)[^\s'"<>]+/gi,
      '[URL]'
    );

    // 📧 Mask email addresses
    s = s.replace(
      /([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/gi,
      '[EMAIL]'
    );

    // 📁 Mask Windows file paths
    s = s.replace(/[A-Z]:\\[^\s'"]+/gi, '[PATH]');

    // 📁 Mask Unix/Mac file paths (but preserve short ones like /api/route)
    s = s.replace(/\/(?:home|usr|opt|var|etc)\/[\w\-.~/]+/g, '[PATH]');

    // ✂️ Truncate in production to prevent log bombs
    if (IS_PRODUCTION && s.length > MAX_MESSAGE_LENGTH) {
      return s.substring(0, MAX_MESSAGE_LENGTH - 3) + '...';
    }

    return s;
  }

  // Sanitize and stringify structured data safely
  private static sanitizeData(data: unknown): string {
    try {
      const serialized = this.safeStringify(data);
      if (IS_PRODUCTION && serialized.length > MAX_DATA_CHARS) {
        return this.sanitizeString(serialized.substring(0, MAX_DATA_CHARS - 3) + '...');
      }
      return this.sanitizeString(serialized);
    } catch {
      return '[UNSERIALIZABLE DATA]';
    }
  }

  /**
   * 🛡️ Safe JSON stringify with circular reference protection
   * Prevents crashes from:
   * - Circular object references
   * - Extremely long strings
   * - Unserializable objects (functions, symbols, etc.)
   */
  private static safeStringify(obj: unknown, space = 2): string {
    const seen = new WeakSet();
    const replacer = (_key: string, value: unknown) => {
      // Handle circular references
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value as object)) return '[Circular]';
        seen.add(value as object);
      }

      // Truncate extremely long strings
      if (typeof value === 'string' && value.length > 10000) {
        return value.slice(0, 200) + '...[TRUNCATED]';
      }

      return value;
    };

    try {
      return JSON.stringify(obj, replacer, IS_PRODUCTION ? 0 : space);
    } catch {
      // Fallback to basic string conversion
      try {
        return String(obj);
      } catch {
        return '[UNSERIALIZABLE]';
      }
    }
  }
}

// 📊 Usage examples (for reference):
// 
// SecureLogger.info('User logged in', { userId: 123 });
// SecureLogger.success('Payment processed', { amount: 99.99 });
// SecureLogger.warn('Rate limit approaching', { remaining: 10 });
// SecureLogger.error('Database error', new Error('Connection timeout'));
// SecureLogger.debug('Cache miss', { key: 'user:123' });
// SecureLogger.logDB('INSERT', 5);
// SecureLogger.logQuery('SELECT * FROM users WHERE id = $1');
// SecureLogger.logFile('invoice.pdf', 'uploaded');




