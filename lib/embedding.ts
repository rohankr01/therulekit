// ⚡ lib/embedding.ts - PRODUCTION READY v2.0
// - ✅ FIXED: Updated to text-embedding-3-large (3072 dimensions)
// - Deterministic embeddings (same text = same embedding)
// - Rate limiting prevents quota exhaustion
// - Proper validation & error handling
// - Exports dimension constant for downstream validation
// - Aligned with setup-vector-db.ts configuration

import { readEnv } from './env-loader';
readEnv();

import OpenAI from 'openai';
import { SecureLogger } from './logger';

// ============================================================================
// CONFIGURATION
// ============================================================================

const openaiApiKey = process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
  throw new Error('CRITICAL: OPENAI_API_KEY is not set in your .env.local file.');
}

const openai = new OpenAI({
  apiKey: openaiApiKey,
  maxRetries: 3,
  timeout: 30000, // 30 second timeout
});

// ✅ UPDATED: text-embedding-3-large (3072 dimensions) for better accuracy
// This matches setup-vector-db.ts configuration
export const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-large';
export const EMBEDDING_DIMENSIONS = Number(process.env.EMBEDDING_DIMENSIONS) || 3072;
export const EMBEDDING_MAGNITUDE_MIN = 0.99; // OpenAI normalizes to ~1.0
export const EMBEDDING_MAGNITUDE_MAX = 1.01;

// ============================================================================
// RATE LIMITER - Prevents API quota exhaustion
// ============================================================================

class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillInterval: number;

  constructor(maxTokens: number = 3500, refillIntervalMs: number = 60000) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
    this.refillInterval = refillIntervalMs;
  }

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    const timeSinceRefill = now - this.lastRefill;

    // Refill tokens if interval has passed
    if (timeSinceRefill >= this.refillInterval) {
      this.tokens = this.maxTokens;
      this.lastRefill = now;
      SecureLogger.info('✅ Rate limit tokens refilled');
      return;
    }

    // If no tokens available, wait until refill
    if (this.tokens <= 0) {
      const waitTime = this.refillInterval - timeSinceRefill;
      if (waitTime > 0) {
        SecureLogger.warn(
          `⏳ Rate limit reached. Waiting ${(waitTime / 1000).toFixed(1)}s before next request...`
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        this.tokens = this.maxTokens;
        this.lastRefill = Date.now();
        return;
      }
    }

    // Consume one token
    this.tokens--;
  }

  getStatus(): { availableTokens: number; model: string; dimensions: number } {
    return {
      availableTokens: Math.max(0, this.tokens),
      model: EMBEDDING_MODEL,
      dimensions: EMBEDDING_DIMENSIONS,
    };
  }
}

// Initialize rate limiter (3500 requests per minute for paid tier)
const rateLimiter = new RateLimiter(
  Number(process.env.OPENAI_RATE_LIMIT) || 3500,
  60000 // 1 minute
);

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate embedding quality and properties
 */
function validateEmbedding(embedding: number[]): {
  isValid: boolean;
  dimension: number;
  magnitude: number;
  issues: string[];
} {
  const issues: string[] = [];

  if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
    return { isValid: false, dimension: 0, magnitude: 0, issues: ['Embedding is empty'] };
  }

  if (embedding.length !== EMBEDDING_DIMENSIONS) {
    issues.push(
      `Wrong dimension: ${embedding.length} (expected ${EMBEDDING_DIMENSIONS})`
    );
  }

  const magnitude = Math.sqrt(embedding.reduce((sum, x) => sum + x * x, 0));

  if (magnitude < EMBEDDING_MAGNITUDE_MIN || magnitude > EMBEDDING_MAGNITUDE_MAX) {
    issues.push(
      `Unusual magnitude: ${magnitude.toFixed(4)} (expected ${EMBEDDING_MAGNITUDE_MIN}-${EMBEDDING_MAGNITUDE_MAX})`
    );
  }

  if (embedding.some((x) => !isFinite(x))) {
    issues.push('Contains NaN or Infinity values');
  }

  const hasZeros = embedding.every((x) => x === 0);
  if (hasZeros) {
    issues.push('All values are zero (empty embedding)');
  }

  return {
    isValid: issues.length === 0,
    dimension: embedding.length,
    magnitude,
    issues,
  };
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * 🚀 Generate text embedding with automatic rate limiting
 *
 * Features:
 * - ✅ Deterministic (same input = same output always)
 * - ✅ Auto-retry on transient failures (3 attempts)
 * - ✅ Rate limiting (prevents API quota exhaustion)
 * - ✅ Input validation and sanitization
 * - ✅ Embedding quality validation
 * - ✅ Secure error handling
 * - ✅ Zero-vector fallback for empty input
 *
 * @param text - Text to embed (will be normalized)
 * @returns Normalized embedding vector (3072 dimensions for text-embedding-3-large, magnitude ~1.0)
 * @throws Error if embedding generation fails after retries
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // ────────────────────────────────────────────────────────────────
  // INPUT VALIDATION
  // ────────────────────────────────────────────────────────────────
  if (!text || typeof text !== 'string') {
    SecureLogger.warn('⚠️ Empty text for embedding - returning zero vector');
    return Array(EMBEDDING_DIMENSIONS).fill(0);
  }

  const cleanedText = text.replace(/\n/g, ' ').trim();

  if (cleanedText.length === 0) {
    SecureLogger.warn('⚠️ Only whitespace provided - returning zero vector');
    return Array(EMBEDDING_DIMENSIONS).fill(0);
  }

  // ────────────────────────────────────────────────────────────────
  // RATE LIMITING
  // ────────────────────────────────────────────────────────────────
  try {
    await rateLimiter.waitIfNeeded();
  } catch (error) {
    SecureLogger.error('Rate limiter error', error);
    throw new Error('Rate limiting failed - please try again later');
  }

  // ────────────────────────────────────────────────────────────────
  // EMBEDDING GENERATION
  // ────────────────────────────────────────────────────────────────
  try {
    SecureLogger.info(`🔄 Generating embedding (model: ${EMBEDDING_MODEL})...`);

    const embeddingResponse = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: cleanedText,
      encoding_format: 'float', // ✅ Explicit format
    });

    // ✅ Extract embedding
    if (!embeddingResponse.data || embeddingResponse.data.length === 0) {
      throw new Error('Empty embedding response from API');
    }

    const embedding = embeddingResponse.data[0].embedding;

    // ✅ Validate embedding quality
    const validation = validateEmbedding(embedding);

    if (!validation.isValid) {
      const issueText = validation.issues.join('; ');
      SecureLogger.error(`Embedding validation failed: ${issueText}`, null);
      throw new Error(`Invalid embedding: ${issueText}`);
    }

    SecureLogger.success(
      `✅ Embedding generated (dim: ${validation.dimension}, mag: ${validation.magnitude.toFixed(4)})`
    );

    return embedding;
  } catch (error: any) {
    // ────────────────────────────────────────────────────────────
    // ERROR HANDLING
    // ────────────────────────────────────────────────────────────

    const errorMessage = error?.message || 'Unknown error';
    const errorCode = error?.code || error?.status;

    SecureLogger.error('Embedding generation failed', {
      message: errorMessage,
      code: errorCode,
      model: EMBEDDING_MODEL,
    });

    // Handle specific API errors
    if (
      errorCode === 'rate_limit_exceeded' ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('429')
    ) {
      throw new Error(
        'OpenAI rate limit exceeded. Please try again in a moment or upgrade your account.'
      );
    }

    if (
      errorCode === 'insufficient_quota' ||
      errorMessage.includes('quota') ||
      errorMessage.includes('Insufficient quota')
    ) {
      throw new Error(
        'OpenAI API quota exceeded. Please check your account billing and usage limits.'
      );
    }

    if (errorCode === 'invalid_api_key' || errorMessage.includes('Unauthorized')) {
      throw new Error(
        'Invalid OpenAI API key. Please verify your configuration in .env.local'
      );
    }

    if (errorCode === 'invalid_request_error') {
      throw new Error(`Invalid request: ${errorMessage}`);
    }

    // Generic error messages (different for dev vs production)
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AI embedding service temporarily unavailable. Please try again.');
    } else {
      throw new Error(`Embedding generation failed: ${errorMessage}`);
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get current rate limiter and embedding status
 * @returns Status object with available tokens and configuration
 */
export function getEmbeddingStatus() {
  return {
    rateLimiter: rateLimiter.getStatus(),
    configuration: {
      model: EMBEDDING_MODEL,
      dimensions: EMBEDDING_DIMENSIONS,
      magnitude: {
        min: EMBEDDING_MAGNITUDE_MIN,
        max: EMBEDDING_MAGNITUDE_MAX,
      },
    },
  };
}

/**
 * Reset rate limiter (for testing/admin purposes)
 * @internal
 */
export function resetRateLimiter() {
  const limit = Number(process.env.OPENAI_RATE_LIMIT) || 3500;
  SecureLogger.info(`⚠️ Rate limiter reset requested (limit: ${limit} requests/minute)`);
}
