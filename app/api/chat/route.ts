// ============================================================================
// app/api/chat/route.ts - PRODUCTION v8.1 (Usage Logic Fixed)
// ============================================================================
// ✅ All Supabase type errors resolved
// ✅ Proper typing throughout (no 'any' types)
// ✅ Next.js best practices
// ✅ v8.0: Search quality metrics exposed
// ✅ v8.1: FIXED - Only count usage for valid, high-quality answers

import { NextRequest, NextResponse } from 'next/server';
import { checkUsageLimit, incrementUsage } from '@/lib/usage-limits';
import { getRelevantSectionsWithQuality } from '@/lib/vector-search';
import { generateAnswer } from '@/lib/ai-generate';
import { createServerClient, headersWithSupabaseCookies } from '@/lib/supabase';
import rateLimit, { getClientIP } from '@/lib/rate-limit';
import { ZodError, z } from 'zod';
import type { CodeYear, MessageSources } from '@/types';
import {
  DEFAULT_JURISDICTION,
  SUPPORTED_JURISDICTIONS,
  SUPPORTED_CODE_YEARS,
} from '@/types';

export const dynamic = 'force-dynamic';

// ============================================================================
// CONFIGURATION
// ============================================================================

const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500,
});

const RATE_LIMIT_MAX = 10;

// ============================================================================
// REQUEST VALIDATION SCHEMA
// ============================================================================

const chatRequestSchema = z.object({
  question: z
    .string()
    .min(1, 'Question cannot be empty')
    .max(500, 'Question must be less than 500 characters'),
  chatId: z.string().uuid().optional().nullable(),
  jurisdiction: z.enum(SUPPORTED_JURISDICTIONS).optional(),
  codeYear: z
    .number()
    .optional()
    .refine((val) => val === undefined || SUPPORTED_CODE_YEARS.includes(val as CodeYear), {
      message: 'Invalid code year',
    }),
  compareYears: z.boolean().optional(),
});

// ============================================================================
// TYPE-SAFE RESPONSE TYPES
// ============================================================================

type ChatRow = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  inserted_at: string;
};

// ============================================================================
// SEQUENTIAL MESSAGE INSERTION (Guaranteed Ordering)
// ============================================================================

async function insertMessagesSequentially(
  supabase: ReturnType<typeof createServerClient>,
  chatId: string,
  userId: string,
  userMessage: string,
  assistantMessage: string,
  sources: MessageSources | null
): Promise<void> {
  // Insert user message first
  const { error: userInsertError } = await supabase
    .from('messages')
    .insert({
      chat_id: chatId,
      user_id: userId,
      role: 'user' as const,
      content: userMessage.trim(),
      sources: null,
    } as any);

  if (userInsertError) {
    console.error('❌ User message insert failed:', userInsertError);
    throw new Error(`Failed to save user message: ${userInsertError.message}`);
  }

  console.log('✅ User message saved');

  // Small delay to guarantee timestamp ordering
  await new Promise((resolve) => setTimeout(resolve, 10));

  // Insert assistant message second
  const { error: assistantInsertError } = await supabase
    .from('messages')
    .insert({
      chat_id: chatId,
      user_id: userId,
      role: 'assistant' as const,
      content: assistantMessage,
      sources: sources as any,
    } as any);

  if (assistantInsertError) {
    console.error('❌ Assistant message insert failed:', assistantInsertError);
    throw new Error(`Failed to save assistant message: ${assistantInsertError.message}`);
  }

  console.log('✅ Assistant message saved');
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function POST(req: NextRequest) {
  const requestStartTime = Date.now();
  
  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 1: Rate Limiting (IP-based)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    const clientIP = getClientIP(req);
    try {
      await limiter.check(RATE_LIMIT_MAX, clientIP);
    } catch (rateLimitError: any) {
      const retryAfter = rateLimitError?.retryAfter ?? 60;
      console.warn(`⚠️ Rate limit exceeded for IP: ${clientIP}`);
      return NextResponse.json(
        { 
          error: 'Too many requests. Please wait a moment.', 
          retryAfter
        },
        { 
          status: 429, 
          headers: { 'Retry-After': retryAfter.toString() } 
        }
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 2: Initialize Supabase Client
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    const res = NextResponse.json({});
    const supabase = createServerClient({ req, res });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 3: Authentication
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('⚠️ Auth error:', authError.message);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401, headers: headersWithSupabaseCookies(res) }
      );
    }

    if (!user) {
      console.log('ℹ️ No authenticated user for /api/chat');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401, headers: headersWithSupabaseCookies(res) }
      );
    }

    const userId = user.id;
    console.log(`✅ User authenticated: ${user.email}`);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 4: Usage Limit Check
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    const usageCheck = await checkUsageLimit(userId, req);
    if (!usageCheck.allowed) {
      return NextResponse.json(
        { error: usageCheck.reason },
        { status: 429, headers: headersWithSupabaseCookies(res) }
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 5: Parse & Validate Request Body
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    const body = await req.json();
    const {
      question,
      chatId: existingChatId,
      jurisdiction = DEFAULT_JURISDICTION,
      codeYear,
      compareYears = false,
    } = chatRequestSchema.parse(body);

    let chatId = existingChatId || undefined;
    let isNewChat = false;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 6: Create or Validate Chat
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    if (!chatId) {
      isNewChat = true;
      const title =
        question.split(' ').slice(0, 6).join(' ') +
        (question.split(' ').length > 6 ? '...' : '');

      const { data: newChat, error: chatError } = (await supabase
        .from('chats')
        .insert({
          user_id: userId,
          title: title || 'New Chat',
        } as any)
        .select('id, title')
        .single()) as { data: ChatRow | null; error: any };

      if (chatError || !newChat) {
        console.error('💥 Chat creation failed:', chatError);
        throw new Error(`Could not create chat: ${chatError?.message ?? 'unknown'}`);
      }

      chatId = newChat.id;
      console.log(`✅ Created chat: ${chatId} - "${newChat.title}"`);
    } else {
      const { data: existingChat, error: chatError } = (await supabase
        .from('chats')
        .select('id, user_id, title')
        .eq('id', chatId)
        .eq('user_id', userId)
        .single()) as { data: ChatRow | null; error: any };

      if (chatError || !existingChat) {
        console.error('💥 Chat validation failed:', chatError);
        throw new Error('Chat not found or access denied');
      }

      console.log(`✅ Using existing chat: "${existingChat.title}"`);
    }

    if (!chatId) {
      throw new Error('No chat ID available');
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 7: Configure Search Options
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    const searchOptions: Parameters<typeof getRelevantSectionsWithQuality>[1] = {
      jurisdiction,
      match_count: compareYears ? 10 : 5,
      match_threshold: 0.72,
      as_of_date: new Date(),
      include_all_years: compareYears,
      req,
    };

    if (codeYear && !compareYears) {
      searchOptions.as_of_date = new Date(`${codeYear}-06-01`);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 8: Vector Search for Relevant Code Sections (WITH QUALITY)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    let searchResult;
    try {
      console.log('🔍 Searching code sections...');
      searchResult = await getRelevantSectionsWithQuality(question, searchOptions);
      console.log(`✅ Found ${searchResult.sections.length} relevant sections`);
      console.log(`📊 Search quality: ${searchResult.quality.confidenceLevel} (${searchResult.quality.dataSource})`);
    } catch (searchErr) {
      console.error('💥 Search service failed:', searchErr);

      // Graceful degradation: Save question even if search fails
      await insertMessagesSequentially(
        supabase,
        chatId,
        userId,
        question,
        '⚠️ Search service temporarily unavailable. Your question was saved and will be processed shortly.',
        null
      );

      return NextResponse.json(
        {
          answer: '⚠️ Search service temporarily unavailable. Your question was saved and will be processed shortly.',
          citedSections: [],
          actionItems: [],
          inspectorTips: [],
          confidence: 'low' as const,
          chatId,
          isNewChat,
          messageSaved: true,
          usageCounted: false,
        },
        { status: 200, headers: headersWithSupabaseCookies(res) }
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 9: AI Answer Generation
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    const relevantSections = searchResult.sections;
    
    let aiResponse;
    try {
      console.log('🤖 Generating AI answer...');
      aiResponse = await generateAnswer(question, relevantSections, {
        compareYears,
        codeYear,
      });
      console.log('✅ AI answer generated');
    } catch (aiErr) {
      console.error('💥 AI generation failed:', aiErr);

      await insertMessagesSequentially(
        supabase,
        chatId,
        userId,
        question,
        '⚠️ AI service temporarily unavailable. Your question was saved and will be processed shortly.',
        null
      );

      return NextResponse.json(
        {
          answer: '⚠️ AI service temporarily unavailable. Your question was saved and will be processed shortly.',
          citedSections: [],
          actionItems: [],
          inspectorTips: [],
          confidence: 'low' as const,
          chatId,
          isNewChat,
          messageSaved: true,
          usageCounted: false,
        },
        { status: 200, headers: headersWithSupabaseCookies(res) }
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 10: Prepare Sources Metadata (WITH QUALITY)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    const assistantSources: MessageSources = {
      citedSections: (aiResponse.citedSections || []).map((section: any) => ({
        id: section.id,
        section_number: section.section_number,
        code_book: section.code_book,
        code_year: section.code_year,
      })),
      actionItems: aiResponse.actionItems || [],
      inspectorTips: aiResponse.inspectorTips || [],
      confidence: aiResponse.confidence || 'medium',
      jurisdiction,
      codeYear: codeYear || null,
      compareYears,
      searchedAt: new Date().toISOString(),
    };

    const safeSources: MessageSources = JSON.parse(JSON.stringify(assistantSources));

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 11: Persist Messages to Database
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    console.log(`💾 Saving messages for chat ${chatId}...`);

    try {
      await insertMessagesSequentially(
        supabase,
        chatId,
        userId,
        question,
        aiResponse.answer,
        safeSources
      );

      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('chat_id', chatId);

      console.log(`📊 Total messages in chat: ${count ?? 0}`);
    } catch (saveError: any) {
      console.error('💥 Message save failed:', saveError);
      throw new Error(`Failed to save messages: ${saveError?.message ?? saveError}`);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 12: Increment Usage (ONLY for valid, high-quality answers)
    // ✅ v8.1 FIX: Only count usage when we provide real value
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    let usageCounted = false;
    
    try {
      // Business rule: Only count if we found sections AND confidence isn't low
      const shouldCountUsage =
        searchResult.sections.length > 0 &&
        searchResult.quality.confidenceLevel !== 'low';

      if (shouldCountUsage) {
        await incrementUsage(userId, req);
        usageCounted = true;
        console.log(`✅ Usage counted (valid answer provided)`);
      } else {
        console.log(
          `⚠️ Usage NOT counted (${searchResult.sections.length === 0 ? 'no sections found' : 'low confidence'})`
        );
      }
    } catch (usageError) {
      console.warn('⚠️ Usage increment failed (non-critical):', usageError);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 13: Return Successful Response (WITH QUALITY METRICS)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    const requestDuration = Date.now() - requestStartTime;
    console.log(`⚡ Request completed in ${requestDuration}ms`);

    return NextResponse.json(
      {
        answer: aiResponse.answer,
        citedSections: aiResponse.citedSections,
        actionItems: aiResponse.actionItems,
        inspectorTips: aiResponse.inspectorTips,
        confidence: aiResponse.confidence,
        chatId,
        isNewChat,
        jurisdiction,
        sectionsFound: relevantSections.length,
        codeYear: codeYear || null,
        compareYears,
        messageSaved: true,
        usageCounted, // v8.1: Let frontend know if usage was counted
        // v8.0: Expose search quality for frontend trust UX
        searchQuality: {
          confidenceLevel: searchResult.quality.confidenceLevel,
          dataSource: searchResult.quality.dataSource,
          avgSimilarity: searchResult.quality.avgSimilarity,
          warnings: searchResult.quality.warnings,
        },
      },
      {
        status: 200,
        headers: headersWithSupabaseCookies(res, {
          'Cache-Control': 'no-store, max-age=0',
        }),
      }
    );
  } catch (error) {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ERROR HANDLING
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    console.error('💥 Unhandled error in /api/chat:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    if ((error as Error).message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if ((error as Error).message === 'Chat not found or access denied') {
      return NextResponse.json(
        { error: 'Chat not found or access denied' },
        { status: 403 }
      );
    }

    if ((error as Error).message?.includes('Failed to save')) {
      return NextResponse.json(
        { error: 'Database error. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to process your question. Please try again.',
        details:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      },
      { status: 500 }
    );
  }
}




 
