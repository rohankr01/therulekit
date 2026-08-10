/**
 * types/index.ts - PRODUCTION TYPES v8.0
 * Single source of truth for all data structures
 * SUPPORTS: Raw codes (97-99% accuracy) + Enhanced guides (field intelligence)
 * 
 * ✅ v8.0 UPDATES:
 * - Added embedding_version column for zero-downtime re-embedding
 * - Made section_number and source_type nullable (matches DB reality)
 * - Removed 'invalid' from confidenceLevel (matches vector-search.ts)
 */

// ✅ Flexible Json type for complex nested objects
export type Json = 
  | string 
  | number 
  | boolean 
  | null 
  | { [key: string]: Json | undefined } 
  | Json[]
  | { [key: string]: any }
  | any[];

// ============================================================================
// ENHANCED METADATA - Field Intelligence
// ============================================================================

export interface EnhancedMetadata {
  jurisdiction_amendments?: string[];
  field_tips?: string[];
  cost_analysis?: string[];
  related_guides?: string[];
  common_failures?: string[];
  inspector_focus?: string[];
  // v8.0: Parent-section aggregation metadata
  parent_section?: string;
  chunk_index?: number;
  total_chunks?: number;
  is_chunked?: boolean;
}

// ============================================================================
// MESSAGE SOURCES - Citation Metadata
// ============================================================================

export interface MessageSources {
  citedSections: any[];
  actionItems?: string[];
  inspectorTips?: string[];
  confidence?: 'low' | 'medium' | 'high';
  relatedSections?: string[];
  jurisdiction?: string;
  searchedAt?: string;
  codeYear?: number | null;
  compareYears?: boolean;
  yearsCompared?: number[] | null;
  enhancedMetadata?: any;
  usedHybridSearch?: boolean;
}

// ============================================================================
// SEARCH QUALITY METRICS (from vector-search)
// ✅ CRITICAL FIX: Removed 'invalid' - now matches vector-search.ts
// ============================================================================

export interface SearchQuality {
  avgSimilarity: number;
  confidenceLevel: 'high' | 'medium' | 'low'; // ✅ FIXED: Removed 'invalid'
  dataSource: 
    | 'vector' 
    | 'fallback_threshold' 
    | 'california_state' 
    | 'text_search' 
    | 'none';
  resultCount: number;
  validSectionCount: number;
  warnings: string[];
}

export interface SearchResultWithQuality {
  sections: CodeSection[];
  quality: SearchQuality;
}

// ============================================================================
// DATABASE SCHEMA v8.0
// ============================================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
        };
        Update: {
          full_name?: string | null;
        };
        Relationships: [];
      };
      code_sections: {
        Row: {
          id: string;
          content: string;
          section_number: string | null; // ✅ FIXED: Nullable (chunked sections use suffixes)
          code_book: string;
          embedding: number[];
          jurisdiction: string;
          effective_date: string | null;
          expires_date: string | null;
          is_amendment: boolean;
          code_year: number;
          enhanced_metadata?: Json | null;
          source_type?: 'raw_code' | 'enhanced_guide' | null; // ✅ FIXED: Nullable
          embedding_version?: string | null; // 🆕 v8.0: For zero-downtime re-embedding
        };
        Insert: {
          id?: string;
          content: string;
          section_number?: string | null;
          code_book: string;
          embedding: number[];
          jurisdiction?: string;
          effective_date?: string | null;
          expires_date?: string | null;
          is_amendment?: boolean;
          code_year?: number;
          enhanced_metadata?: Json | null;
          source_type?: 'raw_code' | 'enhanced_guide' | null;
          embedding_version?: string | null; // 🆕 v8.0: Track embedding model version
        };
        Update: {
          content?: string;
          section_number?: string | null;
          code_book?: string;
          embedding?: number[];
          jurisdiction?: string;
          effective_date?: string | null;
          expires_date?: string | null;
          is_amendment?: boolean;
          code_year?: number;
          enhanced_metadata?: Json | null;
          source_type?: 'raw_code' | 'enhanced_guide' | null;
          embedding_version?: string | null; // 🆕 v8.0
        };
        Relationships: [];
      };
      chats: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          created_at: string;
          inserted_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          created_at?: string;
          inserted_at?: string;
        };
        Update: {
          title?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          user_id: string;
          chat_id: string;
          role: 'user' | 'assistant';
          content: string;
          sources: Json | null;
          feedback: boolean | null;
          created_at: string;
          inserted_at?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          chat_id: string;
          role: 'user' | 'assistant';
          content: string;
          sources?: Json | null;
          feedback?: boolean | null;
          created_at?: string;
          inserted_at?: string;
        };
        Update: {
          feedback?: boolean | null;
        };
        Relationships: [];
      };
      user_usage: {
        Row: {
          user_id: string;
          query_count: number;
          last_query_at: string;
        };
        Insert: {
          user_id: string;
          query_count?: number;
          last_query_at?: string;
        };
        Update: {
          query_count?: number;
          last_query_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      match_code_sections: {
        Args: {
          query_embedding: number[];
          match_threshold: number;
          match_count: number;
          p_jurisdiction: string;
          p_as_of_date?: string;
        };
        Returns: {
          id: string;
          content: string;
          section_number: string | null; // ✅ FIXED: Nullable
          code_book: string;
          embedding: number[];
          similarity: number;
          jurisdiction: string;
          effective_date: string | null;
          expires_date: string | null;
          is_amendment: boolean;
          code_year: number;
          enhanced_metadata?: Json | null;
          source_type?: 'raw_code' | 'enhanced_guide' | null; // ✅ FIXED: Nullable
          embedding_version?: string | null; // 🆕 v8.0
        }[];
      };
      increment_user_usage: {
        Args: {
          p_user_id: string;
        };
        Returns: number;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// ============================================================================
// CODE SECTION - Main data structure
// ✅ FIXED: Now properly extends with nullable fields + v8.0 features
// ============================================================================

export interface CodeSection
  extends Omit<Database['public']['Tables']['code_sections']['Row'], 'enhanced_metadata'> {
  enhanced_metadata?: EnhancedMetadata;
}

// ============================================================================
// GENERATED ANSWER - AI output with citations
// ============================================================================

export interface GeneratedAnswer {
  answer: string;
  citedSections: CodeSection[];
  confidence: 'high' | 'medium' | 'low';
  actionItems?: string[];
  inspectorTips?: string[];
  relatedSections?: string[];
  yearsCompared?: number[];
  enhancedMetadata?: {
    jurisdictionAmendments?: string[];
    fieldTips?: string[];
    costAnalysis?: string[];
    commonFailures?: string[];
    inspectorFocus?: string[];
  };
}

// ============================================================================
// HYBRID SEARCH - Technical + Field Intelligence
// ============================================================================

export interface HybridSearchResult {
  technicalSections: CodeSection[];
  enhancedSections: CodeSection[];
  fieldIntelligence: {
    jurisdictionAmendments: string[];
    fieldTips: string[];
    costAnalysis: string[];
    commonFailures: string[];
    inspectorFocus: string[];
  };
}

// ============================================================================
// CHAT MESSAGE
// ============================================================================

export interface Message {
  role: 'user' | 'assistant';
  content: string | GeneratedAnswer;
}

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================

export const DEFAULT_JURISDICTION = 'Los Angeles County, CA';

// Current baseline (used internally)
export const DEFAULT_CODE_YEAR = 2023;

// Explicit selectable years ONLY (exclude current)
export const SUPPORTED_CODE_YEARS = [2026] as const;

export const SUPPORTED_JURISDICTIONS = [
  'California State',
  'Los Angeles County, CA',
  'San Francisco, CA',
  'San Diego County, CA',
  'Orange County, CA',
  'All California',
] as const;

export type Jurisdiction = (typeof SUPPORTED_JURISDICTIONS)[number];

// Only explicit years are selectable
export type CodeYear = (typeof SUPPORTED_CODE_YEARS)[number];

export const DATA_SOURCES = {
  RAW_CODES: 'raw-code-sections',
  ENHANCED_GUIDES: 'enhanced-guides',
} as const;

// v8.0: Embedding version tracking
export const EMBEDDING_VERSIONS = {
  V1: 'text-embedding-3-large-v1',
  CURRENT: 'text-embedding-3-large-v1',
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Safe JSON conversion for database storage
 */
export function safeJsonConvert(obj: any): Json {
  try {
    if (obj === undefined || obj === null) {
      return null;
    }

    if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
      return obj;
    }

    return JSON.parse(JSON.stringify(obj));
  } catch (error) {
    console.error('JSON conversion error:', error);
    return {
      error: 'JSON serialization failed',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Type guard for GeneratedAnswer
 */
export function isGeneratedAnswer(content: any): content is GeneratedAnswer {
  return (
    typeof content === 'object' &&
    content !== null &&
    'answer' in content &&
    'citedSections' in content &&
    'confidence' in content
  );
}

/**
 * Type guard for string content
 */
export function isStringContent(content: any): content is string {
  return typeof content === 'string';
}

/**
 * Type guard for CodeSection
 */
export function isCodeSection(obj: any): obj is CodeSection {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.content === 'string' &&
    (typeof obj.section_number === 'string' || obj.section_number === null)
  );
}

/**
 * Check if code section is active on a given date
 */
export function isCodeSectionActive(
  section: CodeSection,
  as_of_date: Date = new Date()
): boolean {
  const checkDate = formatDateForDatabase(as_of_date);

  // Must be effective
  if (section.effective_date && section.effective_date > checkDate) {
    return false;
  }

  // Must not be expired
  if (section.expires_date && section.expires_date <= checkDate) {
    return false;
  }

  return true;
}

/**
 * Format date for database queries (YYYY-MM-DD)
 */
export function formatDateForDatabase(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
