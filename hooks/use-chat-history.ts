'use client';

import { useEffect, useMemo, useCallback } from 'react';
import useSWR from 'swr';
import { useAuth } from './use-auth';
import { Database } from '@/types';

/**
 * Type-safe shape for a single chat session.
 */
type ChatHistoryItem = Pick<
  Database['public']['Tables']['chats']['Row'],
  'id' | 'title' | 'created_at'
>;

/**
 * 🔧 A stable and reusable fetcher function for SWR.
 * Handles both success and error formats from your /api/chats route.
 */
const fetchChatHistory = async (url: string): Promise<ChatHistoryItem[]> => {
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // ✅ Include cookies for Supabase session
  });

  if (!res.ok) {
    let message = `Failed to fetch chat history (${res.status})`;
    try {
      const errData = await res.json();
      message = errData.error || message;
    } catch {
      message = `${message}: ${res.statusText}`;
    }
    const error = new Error(message);
    // @ts-ignore: custom status
    error.status = res.status;
    throw error;
  }

  const data = await res.json();

  // ✅ Handle both possible API response shapes: { chats: [] } or direct []
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.chats)) return data.chats;

  console.warn('⚠️ Unexpected /api/chats response format:', data);
  return [];
};

/**
 * 🚀 useChatHistory()
 * A long-term, production-grade hook for managing chat history.
 *
 * ✅ Features:
 * - Secure fetch (auth-aware)
 * - Intelligent caching with SWR
 * - Manual refresh capability
 * - Auto revalidation on new chat
 * - Error resilience with recovery
 * - Performance tuned for large chat lists
 */
export function useChatHistory() {
  const { user } = useAuth();

  /**
   * 🧠 Use SWR for caching, background revalidation, and stale-while-revalidate logic.
   * If no user, SWR won’t fetch (null key).
   */
  const {
    data: chats,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<ChatHistoryItem[]>(user ? '/api/chats' : null, fetchChatHistory, {
    revalidateOnFocus: false, // ✅ Prevent spam reloads on tab focus
    revalidateOnReconnect: true, // ✅ Refresh after reconnect
    shouldRetryOnError: true, // ✅ Retry transient network failures
    errorRetryCount: 2, // ✅ Max retries for flaky network
    errorRetryInterval: 3000, // ✅ 3s between retries
    dedupingInterval: 3000, // ✅ Avoid duplicate requests
    fallbackData: [], // ✅ Prevent undefined rendering
    onError: (err) => {
      console.error('💥 SWR useChatHistory Error:', {
        message: err.message,
        status: (err as any).status,
        user: user?.id || 'anonymous',
        time: new Date().toISOString(),
      });
    },
    onSuccess: (data) => {
      console.log(`✅ Loaded ${data?.length ?? 0} chat sessions for user:`, user?.id);
    },
  });

  /**
   * 🧩 Manual Refresh (used after creating or deleting a chat)
   */
  const refreshHistory = useCallback(async () => {
    console.log('🔄 Refreshing chat history...');
    try {
      await mutate();
      console.log('✅ Chat history refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing chat history:', error);
    }
  }, [mutate]);

  /**
   * 🧹 Cleanup and debug logging for dev builds
   */
  useEffect(() => {
    if (error) {
      console.error('🔴 Chat history fetch failed:', {
        message: error.message,
        status: (error as any).status,
        user: user?.email || 'no user',
        timestamp: new Date().toISOString(),
      });
    }
  }, [error, user]);

  /**
   * 🧠 Memoize derived values to prevent unnecessary re-renders
   */
  const chatHistory = useMemo(
    () =>
      (chats ?? [])
        .slice() // copy
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
    [chats]
  );

  const hasLoaded = !isLoading && !error;
  const isRefreshing = isValidating && !isLoading;

  return {
    chatHistory,
    isLoadingHistory: isLoading && !error,
    isRefreshing,
    historyError: error,
    refreshHistory,
    hasLoaded,
  };
}
