'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Message, GeneratedAnswer, Jurisdiction, CodeYear } from '@/types';
import { mutate } from 'swr';

interface ChatApiResponse {
  answer: string;
  citedSections: any[];
  actionItems?: string[];
  inspectorTips?: string[];
  confidence?: 'low' | 'medium' | 'high';
  relatedSections?: any[];
  yearsCompared?: number[];
  codeYear?: number;
  compareYears?: boolean;
  isNewChat?: boolean;
  chatId?: string;
  sectionsFound?: number;
  retryAfter?: number;
  error?: string; // ✅ FIXED: Added error property for API error responses
}

export interface SendMessageOptions {
  jurisdiction?: Jurisdiction;
  codeYear?: CodeYear;
  compareYears?: boolean;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [currentChatId, setCurrentChatIdState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('currentChatId');
      } catch {
        return null;
      }
    }
    return null;
  });

  const setCurrentChatId = useCallback((chatId: string | null) => {
    try {
      if (typeof window !== 'undefined') {
        if (chatId) {
          localStorage.setItem('currentChatId', chatId);
        } else {
          localStorage.removeItem('currentChatId');
        }
      }
    } catch {}
    setCurrentChatIdState(chatId);
  }, []);

  const abortControllerRef = useRef<AbortController | null>(null);

  const cooldownRemaining = cooldownUntil
    ? Math.max(0, Math.ceil((cooldownUntil - now) / 1000))
    : 0;

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!cooldownUntil) return;

    const timer = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= cooldownUntil) {
        setCooldownUntil(null);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldownUntil]);

  const verifyChatExists = useCallback(async (chatId: string) => {
    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  const startNewChat = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setMessages([]);
    setCurrentChatId(null);
    // Refresh sidebar to show new chat will be created
    mutate('/api/chats');
    toast.success('✨ New chat started');
  }, [setCurrentChatId]);

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      toast.info('Request cancelled');
    }
  }, []);

  const loadChat = useCallback(
    async (chatId: string) => {
      if (isLoading) {
        toast.error('Please wait for the current operation to complete');
        return;
      }

      if (chatId === currentChatId) {
        return;
      }

      setIsLoading(true);
      const controller = new AbortController();
      const signal = controller.signal;

      abortControllerRef.current?.abort();
      abortControllerRef.current = controller;

      const toastId = toast.loading('Loading chat history...');

      try {
        const response = await fetch(`/api/chats/${chatId}`, {
          credentials: 'include',
          signal,
          headers: {
            'Cache-Control': 'no-cache',
          },
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || `Failed to load chat (${response.status})`);
        }

        const data = await response.json();

        if (!data || !Array.isArray(data.messages)) {
          throw new Error('Invalid server response: missing messages');
        }

        const loadedMessages: Message[] = data.messages.map((msg: any): Message => {
          if (msg.role === 'user') return { role: 'user', content: msg.content };

          const sources = msg.sources || {};
          const generatedAnswer: GeneratedAnswer = {
            answer: msg.content,
            citedSections: Array.isArray(sources.citedSections) ? sources.citedSections : [],
            actionItems: Array.isArray(sources.actionItems) ? sources.actionItems : [],
            inspectorTips: Array.isArray(sources.inspectorTips) ? sources.inspectorTips : [],
            confidence:
              sources.confidence === 'low' ||
              sources.confidence === 'medium' ||
              sources.confidence === 'high'
                ? sources.confidence
                : 'medium',
            relatedSections: Array.isArray(sources.relatedSections) ? sources.relatedSections : [],
            yearsCompared: Array.isArray(sources.yearsCompared) ? sources.yearsCompared : undefined,
            enhancedMetadata: sources.enhancedMetadata || undefined,
          };

          return { role: 'assistant', content: generatedAnswer };
        });

        setMessages(loadedMessages);
        setCurrentChatId(chatId);
        toast.success('Chat loaded successfully', { id: toastId });
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        console.error('Error loading chat:', err);
        toast.error(err.message || 'Failed to load chat history', { id: toastId });
      } finally {
        setIsLoading(false);
        if (abortControllerRef.current === controller) abortControllerRef.current = null;
      }
    },
    [isLoading, currentChatId, setCurrentChatId]
  );

  const sendMessage = useCallback(
    async (question: string, options?: SendMessageOptions) => {
      if (!question.trim()) return toast.error('Please enter a question');
      if (isLoading) return toast.error('Please wait for the current response to complete');
      if (cooldownRemaining > 0) {
        return toast.error(`Please wait ${cooldownRemaining}s before asking another question`);
      }

      if (currentChatId) {
        const ok = await verifyChatExists(currentChatId);
        if (!ok) {
          console.warn('Saved chatId is stale, clearing it');
          setCurrentChatId(null);
        }
      }

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const userMessage: Message = { role: 'user', content: question };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      const modeText = options?.compareYears
        ? '🔄 Comparing code changes across years...'
        : options?.codeYear
        ? `📘 Searching ${options.codeYear} California Electrical Code...`
        : '📖 Researching California Electrical Code...';

      const thinkingMessage: Message = {
        role: 'assistant',
        content: {
          answer: modeText,
          citedSections: [],
          confidence: 'low',
          actionItems: [],
          inspectorTips: [],
          relatedSections: [],
        } as GeneratedAnswer,
      };

      setMessages((prev) => [...prev, thinkingMessage]);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question,
            chatId: currentChatId,
            jurisdiction: options?.jurisdiction,
            codeYear: options?.codeYear,
            compareYears: options?.compareYears,
          }),
          signal: controller.signal,
          credentials: 'include',
        });

        if (controller.signal.aborted) return;

        const data: ChatApiResponse = await response.json().catch(() => ({} as ChatApiResponse));

        if (!response.ok) {
          if (response.status === 429) {
            const retryAfter = Number(response.headers.get('Retry-After') || data.retryAfter || 60);
            setCooldownUntil(Date.now() + Math.max(1, retryAfter) * 1000);
          }

          throw new Error(data.error || `Request failed (${response.status})`);
        }

        setCooldownUntil(null);

        // ✅ Always create an answer, even fallback or error
        const finalAnswer =
          data.answer || data.error || '⚠️ Search service temporarily unavailable. Your question was saved.';

        // ✅ Replace the "thinking" message with the real/fallback answer
        const answerMessage: Message = {
          role: 'assistant',
          content: {
            answer: finalAnswer,
            citedSections: data.citedSections || [],
            actionItems: data.actionItems || [],
            inspectorTips: data.inspectorTips || [],
            confidence: data.confidence || 'low',
            relatedSections: data.relatedSections || [],
            yearsCompared: data.yearsCompared,
          } as GeneratedAnswer,
        };

        // ✅ If it's a new chat, refresh sidebar
        if (data.isNewChat) mutate('/api/chats');
        if (data.chatId && data.chatId !== currentChatId) setCurrentChatId(data.chatId);

        setMessages((prev) => [...prev.slice(0, -1), answerMessage]);

        toast.success(
          data.compareYears
            ? '📊 Code comparison complete!'
            : data.codeYear
            ? `✅ Found ${data.sectionsFound || 0} sections from ${data.codeYear}`
            : '✅ Answer generated!'
        );
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        console.error('Chat error:', err);

        const msg =
          err instanceof Error
            ? err.message.includes('Server error')
              ? 'Service temporarily unavailable. Please try again.'
              : err.message
            : 'Network error. Please check your connection.';

        toast.error(msg);

        const errorMessage: Message = {
          role: 'assistant',
          content: {
            answer: `⚠️ I'm having trouble accessing the code database. ${msg}`,
            citedSections: [],
            confidence: 'low',
            actionItems: [],
            inspectorTips: [],
            relatedSections: [],
          } as GeneratedAnswer,
        };

        setMessages((prev) => [...prev.slice(0, -1), errorMessage]);
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [isLoading, cooldownRemaining, currentChatId, setCurrentChatId, verifyChatExists]
  );

  const clearMessages = useCallback(() => setMessages([]), []);

  // Auto-restore on mount
  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!mounted) return;

      try {
        const savedChatId =
          typeof window !== 'undefined' ? localStorage.getItem('currentChatId') : null;

        if (savedChatId && messages.length === 0 && !isLoading) {
          const ok = await verifyChatExists(savedChatId);
          if (ok && mounted) {
            loadChat(savedChatId);
          } else if (mounted) {
            setCurrentChatId(null);
          }
        }
      } catch {}
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    messages,
    isLoading,
    cooldownRemaining,
    currentChatId,
    startNewChat,
    loadChat,
    sendMessage,
    setMessages,
    clearMessages,
    cancelRequest,
  };
}
