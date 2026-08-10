// ⚡ lib/ai-generate.ts - PRODUCTION READY v8.1
// ✅ NEW: Source type awareness (official code vs. enhanced guides)
// ✅ NEW: Automatic disclaimers for cost estimates and practical tips
// ✅ Maintains: Temperature 0.0 for deterministic answers (100% reproducible)
// ✅ Maintains: Exact quotes from code sections (no paraphrasing)
// ✅ Maintains: Claude rates own confidence (not based on section count)
// ✅ Maintains: Full field intelligence support

import { CodeSection, GeneratedAnswer, EnhancedMetadata } from '@/types';
import { SecureLogger } from './logger';
import crypto from 'crypto';

// ============================================================================
// CONFIGURATION - SAFETY-CRITICAL DOMAIN
// ============================================================================

const CONFIG = {
  CACHE: {
    ENABLED: true,
    TTL_MS: 5 * 60 * 1000, // 5 minutes
    MAX_SIZE: 200,
  },
  LIMITS: {
    MAX_OUTPUT_LENGTH: 8000,
    MAX_SECTIONS_PER_CONTEXT: 12,
    MAX_QUESTION_LENGTH: 1000,
    AI_TIMEOUT_MS: 30000,
  },
  AI: {
    MODEL: 'claude-3-haiku-20240307',
    TEMPERATURE: 0.0, // ✅ CRITICAL: 0.0 = deterministic (no randomness)
    MAX_TOKENS: 2048,
    RETRIES: 3,
  },
} as const;

// ============================================================================
// TYPES
// ============================================================================

interface AIRawResponse {
  answer?: string;
  confidence?: 'high' | 'medium' | 'low' | 'invalid';
  confidenceReason?: string;
  foundInSections?: boolean;
  actionItems?: string[];
  inspectorTips?: string[];
}

// ============================================================================
// CACHE SYSTEM
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hash: string;
}

class SafeCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private ttlMs: number;

  constructor(maxSize: number, ttlMs: number) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  private generateKey(question: string, options: Record<string, any>): string {
    const optionsHash = crypto
      .createHash('md5')
      .update(JSON.stringify(options))
      .digest('hex')
      .slice(0, 8);
    return `${question.toLowerCase().slice(0, 100)}|${optionsHash}`;
  }

  get(question: string, options: Record<string, any>): T | null {
    const key = this.generateKey(question, options);
    const entry = this.store.get(key);

    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.store.delete(key);
      return null;
    }

    SecureLogger.info(`✓ Cache hit`);
    return entry.data;
  }

  set(question: string, options: Record<string, any>, data: T): void {
    if (this.store.size >= this.maxSize) {
      const firstKey = this.store.keys().next().value;
      if (firstKey) this.store.delete(firstKey);
    }

    const key = this.generateKey(question, options);
    const hash = crypto
      .createHash('md5')
      .update(JSON.stringify(data))
      .digest('hex')
      .slice(0, 8);

    this.store.set(key, { data, timestamp: Date.now(), hash });
  }

  clear(): void {
    this.store.clear();
  }

  stats(): { size: number; maxSize: number } {
    return { size: this.store.size, maxSize: this.maxSize };
  }
}

const answerCache = new SafeCache<GeneratedAnswer>(
  CONFIG.CACHE.MAX_SIZE,
  CONFIG.CACHE.TTL_MS
);

// ============================================================================
// SECURITY & VALIDATION
// ============================================================================

function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';

  return input
    .replace(/[{}<>]/g, '')
    .replace(/["'`]/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\r\n]+/g, ' ')
    .trim()
    .slice(0, CONFIG.LIMITS.MAX_QUESTION_LENGTH);
}

function validateInput(question: string): { valid: boolean; error?: string } {
  if (!question || question.trim().length === 0) {
    return { valid: false, error: 'Question cannot be empty' };
  }

  if (question.length > CONFIG.LIMITS.MAX_QUESTION_LENGTH) {
    return {
      valid: false,
      error: `Question too long (max ${CONFIG.LIMITS.MAX_QUESTION_LENGTH} chars)`,
    };
  }

  const injectionPatterns = [
    /ignore\s+(all\s+)?instructions?/i,
    /new\s+instructions?/i,
    /act\s+as\s+a/i,
    /forget\s+everything/i,
    /system\s+prompt/i,
    /you\s+are\s+(now|a)/i,
  ];

  if (injectionPatterns.some((p) => p.test(question))) {
    return { valid: false, error: 'Invalid query pattern detected' };
  }

  return { valid: true };
}

function safeJsonParse<T = any>(text: string): T | null {
  try {
    const safe = text.slice(0, CONFIG.LIMITS.MAX_OUTPUT_LENGTH);
    const clean = safe
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    return JSON.parse(clean) as T;
  } catch (error) {
    SecureLogger.warn(`JSON parse error: ${error instanceof Error ? error.message : 'unknown'}`);
    return null;
  }
}

// ============================================================================
// TIMEOUT & RETRY WRAPPERS
// ============================================================================

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timeout after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}

async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  maxRetries: number = CONFIG.AI.RETRIES
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        throw new Error(`${label} failed after ${maxRetries} attempts: ${lastError.message}`);
      }

      const backoffMs = Math.min(Math.pow(2, attempt) * 500, 5000);
      SecureLogger.warn(
        `${label} failed (attempt ${attempt}/${maxRetries}), retrying in ${backoffMs}ms`
      );
      await new Promise((r) => setTimeout(r, backoffMs));
    }
  }

  throw lastError || new Error(`${label} failed`);
}

// ============================================================================
// FIELD INTELLIGENCE EXTRACTION
// ============================================================================

function extractFieldIntelligence(sections: CodeSection[]): {
  jurisdictionAmendments: string[];
  fieldTips: string[];
  costAnalysis: string[];
  commonFailures: string[];
  inspectorFocus: string[];
} {
  const intelligence = {
    jurisdictionAmendments: [] as string[],
    fieldTips: [] as string[],
    costAnalysis: [] as string[],
    commonFailures: [] as string[],
    inspectorFocus: [] as string[],
  };

  sections.forEach((section) => {
    if (!section.enhanced_metadata) return;

    const meta = section.enhanced_metadata as EnhancedMetadata;

    if (Array.isArray(meta.jurisdiction_amendments)) {
      intelligence.jurisdictionAmendments.push(...meta.jurisdiction_amendments);
    }
    if (Array.isArray(meta.field_tips)) {
      intelligence.fieldTips.push(...meta.field_tips);
    }
    if (Array.isArray(meta.cost_analysis)) {
      intelligence.costAnalysis.push(...meta.cost_analysis);
    }
    if (Array.isArray(meta.common_failures)) {
      intelligence.commonFailures.push(...meta.common_failures);
    }
    if (Array.isArray(meta.inspector_focus)) {
      intelligence.inspectorFocus.push(...meta.inspector_focus);
    }
  });

  intelligence.jurisdictionAmendments = [...new Set(intelligence.jurisdictionAmendments)];
  intelligence.fieldTips = [...new Set(intelligence.fieldTips)];
  intelligence.costAnalysis = [...new Set(intelligence.costAnalysis)];
  intelligence.commonFailures = [...new Set(intelligence.commonFailures)];
  intelligence.inspectorFocus = [...new Set(intelligence.inspectorFocus)];

  return intelligence;
}

// ============================================================================
// 🆕 SOURCE TYPE DETECTION
// ============================================================================

function detectPrimarySourceType(sections: CodeSection[]): 'official_code' | 'enhanced_guide' | 'mixed' {
  if (sections.length === 0) return 'official_code';
  
  const enhancedCount = sections.filter(s => s.source_type === 'enhanced_guide').length;
  const officialCount = sections.filter(s => !s.source_type || s.source_type === 'raw_code').length;
  
  if (enhancedCount === sections.length) return 'enhanced_guide';
  if (officialCount === sections.length) return 'official_code';
  return 'mixed';
}

// ============================================================================
// 🆕 SYSTEM PROMPT - SOURCE TYPE AWARE
// ============================================================================

const SYSTEM_PROMPT = `You are an expert on Los Angeles County 2023 Electrical Code (based on California Electrical Code).
Your role is to provide clear, accurate guidance for electricians and inspectors.

CRITICAL RULES FOR 100% ACCURACY:

1. EXACT QUOTES ONLY
   - Quote directly from provided code sections
   - Format citations as: [SECTION_NUMBER]: "exact quote"
   - Never paraphrase or interpret
   - Never add personal expertise or outside knowledge

2. SOURCE TYPE HANDLING (CRITICAL FOR LIABILITY)
   
   A. For OFFICIAL CODE SECTIONS (source_type: raw_code or null):
      - Present as authoritative legal requirements
      - Use language: "must", "shall", "required by code"
      - Quote exact code text with confidence
   
   B. For ENHANCED GUIDES (source_type: enhanced_guide):
      - These are practical references, NOT official code
      - ALWAYS use estimate language: "typically", "generally", "estimated at"
      - For costs: ALWAYS say "estimated cost" or "approximate cost" 
      - For violations: Say "commonly cited violation" NOT "code violation"
      - ALWAYS add disclaimer: "Verify with official LA County code and inspector"
      - Never present as legal requirement - these are informational only
   
   C. For MIXED SOURCES:
      - Prioritize official code sections for legal requirements
      - Use enhanced guides for practical context only
      - Clearly distinguish which is which
   
   Example Responses:
   
   ✅ CORRECT (enhanced_guide):
   "Based on practical field experience, installation typically costs an estimated $100-200. This is a commonly observed requirement. However, you should verify specific requirements with official LA County electrical code and your local inspector."
   
   ❌ WRONG (enhanced_guide):
   "Installation costs $100-200. Code requires this."
   
   ✅ CORRECT (official code):
   [210.8(A)(2)]: "All 125-volt, single-phase, 15- and 20-ampere receptacles installed in garages shall have ground-fault circuit-interrupter protection." This is a mandatory code requirement.

3. ANSWER AVAILABILITY
   - If the answer IS in the provided sections, provide it with exact quotes
   - If the answer is NOT in the provided sections, respond ONLY with:
     {"answer": "This information is not covered in the provided code sections. Consult official LA County electrical code documentation.", "confidence": "invalid", "foundInSections": false, "actionItems": [], "inspectorTips": [], "confidenceReason": "Information not found in provided sections"}

4. CONFIDENCE RATING (YOU rate yourself, not based on section count)
   - "high": Information found directly in multiple official code sections with clear guidance
   - "medium": Information found but requires interpretation, OR comes from enhanced guides only
   - "low": Information implied but not explicitly stated
   - "invalid": Information NOT found in provided sections
   
   NOTE: Enhanced guide sources automatically cap confidence at "medium" (never "high")

5. RESPONSE FORMAT (MUST be valid JSON)
{
  "answer": "string - provide exact quotes with [SECTION] citations, using appropriate language based on source_type",
  "confidence": "high" | "medium" | "low" | "invalid",
  "confidenceReason": "explain your confidence rating and source types used",
  "foundInSections": true | false,
  "actionItems": ["string"],
  "inspectorTips": ["string - include 'Verify with LA County inspector' if using enhanced guides"]
}

6. OUTPUT REQUIREMENTS
   - Return ONLY the JSON object
   - No markdown, no code blocks, no commentary
   - No text before or after JSON
   - Temperature is 0.0: same question ALWAYS produces same answer`;

// ============================================================================
// AI ANSWER GENERATION
// ============================================================================

async function generateAIAnswer(
  question: string,
  sections: CodeSection[],
  req?: Request | { headers?: any; cookies?: any }
): Promise<GeneratedAnswer> {
  // ────────────────────────────────────────────────────────────────
  // EARLY EXIT: No sections
  // ────────────────────────────────────────────────────────────────
  if (!sections.length) {
    return {
      answer: 'No relevant code sections found for your question. Please rephrase or try specific section numbers.',
      citedSections: [],
      confidence: 'low',
      actionItems: ['Try rephrasing with specific section numbers (e.g., "210.52")'],
      inspectorTips: ['Consult the official LA County electrical code'],
    };
  }

  // ────────────────────────────────────────────────────────────────
  // 🆕 DETECT SOURCE TYPES
  // ────────────────────────────────────────────────────────────────
  const sourceType = detectPrimarySourceType(sections);
  
  if (sourceType === 'enhanced_guide') {
    SecureLogger.info('📚 Answer will use enhanced guide sources (estimates only)');
  } else if (sourceType === 'official_code') {
    SecureLogger.info('📖 Answer will use official code sources (authoritative)');
  } else {
    SecureLogger.info('📊 Answer will use mixed sources (official + guides)');
  }

  // ────────────────────────────────────────────────────────────────
  // PREPARE CONTEXT
  // ────────────────────────────────────────────────────────────────
  const limitedSections = sections.slice(0, CONFIG.LIMITS.MAX_SECTIONS_PER_CONTEXT);
  const fieldIntelligence = extractFieldIntelligence(sections);

  // 🆕 Include source_type in context
  const technicalContext = limitedSections
    .map((s) => {
      const sourceLabel = s.source_type === 'enhanced_guide' 
        ? ' [ENHANCED_GUIDE - Practical reference only]' 
        : ' [OFFICIAL_CODE]';
      return `[${s.section_number}]${sourceLabel} (${s.code_year}): ${s.content.slice(0, 500)}`;
    })
    .join('\n\n---\n\n');

  const enhancedParts: string[] = [];
  if (fieldIntelligence.jurisdictionAmendments.length) {
    enhancedParts.push(
      `LA COUNTY AMENDMENTS (Informational):\n${fieldIntelligence.jurisdictionAmendments.slice(0, 3).join('\n')}`
    );
  }
  if (fieldIntelligence.fieldTips.length) {
    enhancedParts.push(`FIELD TIPS (Practical guidance):\n${fieldIntelligence.fieldTips.slice(0, 3).join('\n')}`);
  }
  if (fieldIntelligence.commonFailures.length) {
    enhancedParts.push(
      `COMMON FAILURES (Observed issues):\n${fieldIntelligence.commonFailures.slice(0, 2).join('\n')}`
    );
  }
  if (fieldIntelligence.inspectorFocus.length) {
    enhancedParts.push(
      `INSPECTOR FOCUS AREAS (Typical concerns):\n${fieldIntelligence.inspectorFocus.slice(0, 2).join('\n')}`
    );
  }

  const enhancedContext = enhancedParts.length
    ? `\n\nFIELD INTELLIGENCE (Use estimate language for these):\n${enhancedParts.join('\n\n')}`
    : '';

  const userPrompt = `Answer this LA County electrical code question:

QUESTION: ${question}

PROVIDED CODE SECTIONS:
${technicalContext}${enhancedContext}

IMPORTANT: Check each section's source type label and use appropriate language (authoritative for OFFICIAL_CODE, estimates for ENHANCED_GUIDE).`;

  // ────────────────────────────────────────────────────────────────
  // API CALL
  // ────────────────────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  try {
    const response = await withRetry(
      () =>
        withTimeout(
          fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: CONFIG.AI.MODEL,
              max_tokens: CONFIG.AI.MAX_TOKENS,
              temperature: CONFIG.AI.TEMPERATURE, // ✅ 0.0 = deterministic
              system: SYSTEM_PROMPT,
              messages: [{ role: 'user', content: userPrompt }],
            }),
          }),
          CONFIG.LIMITS.AI_TIMEOUT_MS,
          'AI API call'
        ),
      'AI generation',
      CONFIG.AI.RETRIES
    );

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();

    // ✅ Join all content blocks
    const responseText = data.content
      ?.map((block: any) => block.text || '')
      .join('')
      .trim();

    if (!responseText) {
      throw new Error('Invalid AI response structure');
    }

    // ────────────────────────────────────────────────────────────
    // PARSE & VALIDATE RESPONSE
    // ────────────────────────────────────────────────────────────
    const parsed = safeJsonParse<AIRawResponse>(responseText);

    if (!parsed) {
      SecureLogger.warn('❌ AI returned invalid JSON');
      return {
        answer:
          'AI service returned invalid response. Review the code sections below:\n\n' +
          limitedSections
            .map((s) => `**[${s.section_number}]**: ${s.content.slice(0, 300)}...`)
            .join('\n\n'),
        citedSections: limitedSections,
        confidence: 'low',
        actionItems: ['Verify information with official code documentation'],
        inspectorTips: ['When in doubt, consult official LA County electrical code'],
      };
    }

    // ✅ Handle "not found" case
    if (parsed.confidence === 'invalid' || !parsed.foundInSections) {
      SecureLogger.warn('ℹ️ Claude: Information not found in provided sections');
      return {
        answer:
          'This specific scenario is not covered in the provided code sections. Please consult the official LA County electrical code documentation.',
        citedSections: [],
        confidence: 'low',
        actionItems: ['Review official LA County electrical code'],
        inspectorTips: ['Contact local building department for guidance on this topic'],
      };
    }

    // ✅ Valid response with automatic inspector tip if using enhanced guides
    const inspectorTips = Array.isArray(parsed.inspectorTips) 
      ? parsed.inspectorTips.slice(0, 5) 
      : [];
    
    // 🆕 Auto-add verification tip for enhanced guide sources
    if (sourceType === 'enhanced_guide' || sourceType === 'mixed') {
      if (!inspectorTips.some(tip => tip.toLowerCase().includes('verify') || tip.toLowerCase().includes('confirm'))) {
        inspectorTips.unshift('Verify these requirements with your LA County inspector before proceeding');
      }
    }

    if (parsed.answer) {
      return {
        answer: parsed.answer.slice(0, CONFIG.LIMITS.MAX_OUTPUT_LENGTH),
        actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems.slice(0, 5) : [],
        inspectorTips,
        citedSections: limitedSections,
        confidence: parsed.confidence || 'medium',
        enhancedMetadata: fieldIntelligence,
      };
    }

    // Fallback if answer is missing
    SecureLogger.warn('⚠️ Claude response missing answer field');
    return {
      answer: 'Unable to generate answer from code sections. Please try rephrasing your question.',
      citedSections: limitedSections,
      confidence: 'low',
      actionItems: ['Rephrase your question'],
      inspectorTips: [],
    };
  } catch (error) {
    SecureLogger.error('AI generation failed', error);

    return {
      answer: `AI service temporarily unavailable. Review these relevant sections:\n\n${limitedSections
        .map((s) => `**[${s.section_number}]**: ${s.content.slice(0, 200)}...`)
        .join('\n\n')}`,
      citedSections: limitedSections,
      confidence: 'low',
      actionItems: ['Review the code sections above'],
      inspectorTips: ['Consult official LA County electrical code before proceeding'],
    };
  }
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Generate an answer from code sections
 * @param question - User's question
 * @param relevantSections - Code sections to base answer on
 * @param options - Additional options (jurisdiction, codeYear, etc.)
 * @returns Generated answer with citations and confidence rating
 */
export async function generateAnswer(
  question: string,
  relevantSections: CodeSection[],
  options?: {
    jurisdiction?: string;
    codeYear?: number;
    includeFieldIntelligence?: boolean;
    req?: Request | { headers?: any; cookies?: any };
    compareYears?: boolean;
  }
): Promise<GeneratedAnswer> {
  const { codeYear = 2023, req } = options || {};

  // ────────────────────────────────────────────────────────────────
  // INPUT VALIDATION
  // ────────────────────────────────────────────────────────────────
  const cleanQuestion = sanitizeInput(question);
  const validation = validateInput(cleanQuestion);

  if (!validation.valid) {
    SecureLogger.warn(`❌ Input validation failed: ${validation.error}`);
    return {
      answer: `⚠️ ${validation.error}`,
      citedSections: [],
      confidence: 'low',
      actionItems: [],
      inspectorTips: [],
    };
  }

  // ────────────────────────────────────────────────────────────────
  // CACHE CHECK
  // ────────────────────────────────────────────────────────────────
  const cacheKey = {
    question: cleanQuestion,
    codeYear,
    sections: relevantSections.length,
  };

  if (CONFIG.CACHE.ENABLED) {
    const cached = answerCache.get(cleanQuestion, cacheKey);
    if (cached) return cached;
  }

  try {
    let answer: GeneratedAnswer;

    if (!relevantSections.length) {
      answer = {
        answer:
          'No matching code sections found. Try rephrasing with specific section numbers (e.g., "210.52").',
        citedSections: [],
        confidence: 'low',
        actionItems: ['Use specific code section numbers'],
        inspectorTips: [],
      };
    } else {
      answer = await generateAIAnswer(cleanQuestion, relevantSections, req);
    }

    if (CONFIG.CACHE.ENABLED) {
      answerCache.set(cleanQuestion, cacheKey, answer);
    }

    return answer;
  } catch (error) {
    SecureLogger.error('❌ generateAnswer() critical error', error);

    return {
      answer: 'An unexpected error occurred. Please try again or contact support.',
      citedSections: relevantSections,
      confidence: 'low',
      actionItems: ['Please try rephrasing your question'],
      inspectorTips: ['If this persists, verify code sections manually'],
    };
  }
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export { SafeCache };

export function clearCaches(): void {
  answerCache.clear();
  SecureLogger.info('Answer cache cleared');
}

export function getCacheStats(): { size: number; maxSize: number } {
  return answerCache.stats();
}

