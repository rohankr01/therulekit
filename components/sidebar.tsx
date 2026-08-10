'use client';

import { useEffect, useMemo, useCallback, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

// --- ICONS ---
const NewChatIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const MessageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

// --- TYPES ---
interface ChatEntry {
  id: string;
  title: string;
  created_at: string;
}

interface SidebarProps {
  onLoginClick: () => void;
  onNewChat: () => void;
  onChatSelect: (chatId: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

// --- COMPONENT ---
export function Sidebar({ onLoginClick, onNewChat, onChatSelect, isOpen = false, onClose }: SidebarProps) {
  const { user, supabase, loading: authLoading } = useAuth();

  const [chats, setChats] = useState<ChatEntry[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * ✅ Fetch chats from secure API route
   * Uses server-side session via middleware
   */
  const fetchChats = useCallback(async () => {
    if (!user) return;
    setLoadingChats(true);
    setError(null);

    try {
      const res = await fetch('/api/chats', {
        method: 'GET',
        credentials: 'include', // important for Supabase cookie auth
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Failed to fetch chats');

      setChats(json.chats || []);
    } catch (err: any) {
      console.error('Error fetching chats:', err);
      setError('Failed to load chats');
      toast.error('Failed to load chat history.');
    } finally {
      setLoadingChats(false);
    }
  }, [user]);

  /**
   * 🔄 Fetch latest chats when user logs in
   */
  useEffect(() => {
    if (user) fetchChats();
  }, [user, fetchChats]);

  /**
   * 💬 Realtime updates via Supabase channel
   * (still client-side for instant UI updates)
   */
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`realtime-chats-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Realtime update:', payload);
          if (payload.eventType === 'INSERT') {
            setChats((prev) => [payload.new as ChatEntry, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setChats((prev) =>
              prev.map((chat) => (chat.id === payload.new.id ? (payload.new as ChatEntry) : chat))
            );
          } else if (payload.eventType === 'DELETE') {
            setChats((prev) => prev.filter((chat) => chat.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  /**
   * 🚪 Logout handler
   */
  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
      setChats([]);
      onClose?.();
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to sign out');
    }
  }, [supabase, onClose]);

  const handleChatSelect = useCallback(
    (chatId: string) => {
      onChatSelect(chatId);
      onClose?.();
    },
    [onChatSelect, onClose]
  );

  const handleNewChat = useCallback(() => {
    onNewChat();
    onClose?.();
  }, [onNewChat, onClose]);

  // --- UI ---
  const sidebarContent = useMemo(
    () => (
      <div className="flex flex-col h-full bg-gray-900 text-white overflow-hidden relative">
        {/* Close Button (Mobile) */}
        <button
          onClick={onClose}
          className="md:hidden absolute top-3 right-3 p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors z-50"
          aria-label="Close sidebar"
        >
          <CloseIcon />
        </button>

        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg flex-shrink-0">
              E
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-base leading-tight">TheRuleKit</span>
              <span className="text-[10px] text-gray-400">California Code AI</span>
            </div>
          </div>

          <button
            onClick={handleNewChat}
            disabled={!user || authLoading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-3 rounded-xl transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <NewChatIcon /> New Chat
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-3" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4B5563 transparent' }}>
          <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
            Recent Chats
          </h3>

          <ul className="space-y-1">
            {loadingChats &&
              [1, 2, 3].map((i) => <li key={i} className="h-11 bg-gray-800/50 rounded-lg animate-pulse" />)}

            {error && <li className="px-2 py-2 text-[11px] text-red-400 bg-red-900/20 rounded-lg">{error}</li>}

            {!loadingChats && !user && (
              <li className="px-2 py-3 text-[11px] text-gray-500 text-center">Sign in to view history</li>
            )}

            {!loadingChats && user && chats.length === 0 && (
              <li className="px-2 py-3 text-[11px] text-gray-500 text-center">No chats yet. Start a conversation!</li>
            )}

            {!loadingChats &&
              user &&
              chats.map((chat) => (
                <li key={chat.id}>
                  <button
                    onClick={() => handleChatSelect(chat.id)}
                    className="w-full text-left flex items-center gap-2 p-2.5 rounded-lg text-[13px] text-gray-300 hover:bg-gray-800 hover:text-white transition-all group"
                    title={chat.title}
                  >
                    <MessageIcon />
                    <span className="truncate flex-1 group-hover:text-white">{chat.title || 'Untitled Chat'}</span>
                  </button>
                </li>
              ))}
          </ul>
        </div>

        {/* User Section */}
        <div className="border-t border-gray-800 p-3 flex-shrink-0">
          {authLoading ? (
            <div className="flex items-center gap-2 p-2">
              <div className="w-8 h-8 rounded-full bg-gray-800 animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 bg-gray-800 rounded animate-pulse w-3/4" />
                <div className="h-2 bg-gray-800 rounded animate-pulse w-1/2" />
              </div>
            </div>
          ) : user ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-800/50">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <UserIcon />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-white truncate" title={user.email}>
                    {user.email}
                  </p>
                  <p className="text-[10px] text-gray-400">Beta User</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-[13px] text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
              >
                <LogoutIcon />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2.5 px-3 rounded-lg text-[13px] transition-all shadow-md"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    ),
    [user, chats, loadingChats, error, handleLogout, handleChatSelect, handleNewChat, onClose, authLoading]
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-gray-900 flex-shrink-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      {isOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={onClose} />
          <aside
            className="md:hidden fixed inset-y-0 left-0 w-[280px] z-50 shadow-2xl bg-gray-900 transition-transform duration-300"
            style={{ transform: isOpen ? 'translateX(0)' : 'translateX(-100%)' }}
          >
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}



