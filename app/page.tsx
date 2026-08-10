'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useChat } from '@/hooks/use-chat';
import { Sidebar } from '@/components/sidebar';
import { ChatInput } from '@/components/chat-input';
import { ChatMessage, Message } from '@/components/chat-message';
import { ExampleQuestions } from '@/components/example-questions';
import { AuthModal } from '@/components/auth-modal';
import { Header } from '@/components/header';
import { UsageMeter } from '@/components/usage-meter';
import { BETA_QUERY_LIMIT } from '@/lib/usage-config';
import { DEFAULT_JURISDICTION, Jurisdiction } from '@/types';
import { toast } from 'sonner';

// ==================== ICON COMPONENTS ====================
const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const SparkleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

// ==================== PREMIUM LANDING PAGE COMPONENT ====================
interface LandingPageProps {
  onStartFreeClick: () => void;
}

const PremiumLandingPage = ({ onStartFreeClick }: LandingPageProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 -z-10">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgb(59, 130, 246, 0.15) 1px, transparent 0)`,
          backgroundSize: '48px 48px'
        }} />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">TheRuleKit</span>
            </div>
            <button
              onClick={onStartFreeClick}
              className="hidden sm:block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1">
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          
          {/* Beta Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2">
              <SparkleIcon />
              <span className="text-blue-700 font-medium text-sm">Free Beta • {BETA_QUERY_LIMIT} Questions Included</span>
            </div>
          </div>

          {/* Hero Section */}
          <div className="text-center max-w-5xl mx-auto mb-16">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 mb-6 leading-tight">
              California Electrical Code
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-clip-text text-transparent">
                Answers with Citations
              </span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed mb-8">
              Stop searching through code books. Get verified answers with exact section references — built for electricians, by electricians.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <button
                onClick={onStartFreeClick}
                className="group w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-lg px-10 py-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <span className="flex items-center gap-2 justify-center">
                  Start Free - {BETA_QUERY_LIMIT} Questions
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-3">
              {[
                'Free Beta Access',
                'Exact Code Citations',
                'Mobile Ready',
                'No Credit Card'
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
                  <CheckIcon />
                  <span className="text-gray-700 font-medium text-sm">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Demo Section */}
          <div className="max-w-5xl mx-auto mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-3">
              See How It Works
            </h2>
            <p className="text-center text-gray-600 text-lg mb-10">
              Real questions answered with verified code sections
            </p>

            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              {/* Demo Question */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                    U
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-lg font-semibold text-gray-900">
                      Do all garage outlets need GFCI protection?
                    </p>
                  </div>
                </div>
              </div>

              {/* Demo Answer */}
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                    AI
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-blue-600 mb-4 uppercase tracking-wide">
                      California Code Assistant
                    </p>
                    <div className="space-y-4">
                      <p className="text-base text-gray-800 leading-relaxed">
                        <strong className="text-gray-900">
                          Yes, ALL 125V through 250V receptacles in residential garages MUST be GFCI protected
                        </strong>{' '}
                        — with no exceptions for dedicated appliance circuits like freezers.{' '}
                        <span className="inline-flex items-center bg-blue-100 border border-blue-300 text-blue-800 px-2 py-0.5 rounded text-sm font-mono font-semibold">
                          [210.8(A)(2)]
                        </span>
                      </p>

                      <p className="text-base text-gray-800 leading-relaxed">
                        Additionally, you must install at least one receptacle for general use in each garage, separate from any dedicated appliance outlets.{' '}
                        <span className="inline-flex items-center bg-blue-100 border border-blue-300 text-blue-800 px-2 py-0.5 rounded text-sm font-mono font-semibold">
                          [210.52(G)(1)]
                        </span>
                      </p>

                      <div className="grid md:grid-cols-2 gap-4 mt-6">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                          <p className="font-bold text-emerald-800 text-sm mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            ✅ Action Items
                          </p>
                          <ul className="text-sm text-emerald-900 space-y-2">
                            <li className="flex items-start gap-2">
                              <span className="text-emerald-600 mt-0.5">•</span>
                              <span>Confirm GFCI protection on freezer circuit</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-emerald-600 mt-0.5">•</span>
                              <span>Install general-use GFCI in accessible location</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-emerald-600 mt-0.5">•</span>
                              <span>Ensure proper wiring and grounding</span>
                            </li>
                          </ul>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                          <p className="font-bold text-amber-800 text-sm mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            🔍 Inspector Tips
                          </p>
                          <ul className="text-sm text-amber-900 space-y-2">
                            <li className="flex items-start gap-2">
                              <span className="text-amber-600 mt-0.5">•</span>
                              <span>Inspector will test BOTH receptacles</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-amber-600 mt-0.5">•</span>
                              <span>Requires minimum two outlets if one is dedicated</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-amber-600 mt-0.5">•</span>
                              <span>No exceptions for appliance circuits</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA in Demo */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-center">
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  Ready to Get Answers Like This?
                </h3>
                <p className="text-blue-100 mb-6 text-lg">
                  Sign up free and get {BETA_QUERY_LIMIT} questions to test TheRuleKit
                </p>
                <button
                  onClick={onStartFreeClick}
                  className="bg-white hover:bg-gray-100 text-blue-600 font-bold text-lg px-10 py-4 rounded-xl shadow-xl transition-all transform hover:scale-105"
                >
                  Create Free Account
                </button>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {[
              {
                icon: (
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: 'Verified Citations',
                description: 'Every answer includes exact California Electrical Code section references you can trust'
              },
              {
                icon: (
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: 'Fast Answers',
                description: 'Get comprehensive answers in seconds. No more flipping through hundreds of code book pages'
              },
              {
                icon: (
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                ),
                title: 'Job Site Ready',
                description: 'Mobile-first design that works perfectly on your phone. Access code answers anywhere'
              }
            ].map((feature, i) => (
              <div key={i} className="group bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="font-semibold text-lg text-white">TheRuleKit</span>
              </div>
              <p className="text-sm text-gray-400">
                California Electrical Code answers with verified citations. Built for electricians.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-3">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-3">Contact</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="mailto:therulekitassistant@gmail.com" className="hover:text-white transition-colors">
                    therulekitassistant@gmail.com
                  </a>
                </li>
                <li className="text-gray-500">Beta Version • January 2026</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 text-center text-sm text-gray-500">
            <p>
              © {new Date().getFullYear()} TheRuleKit. All rights reserved.
              <span className="mx-2">•</span>
              Beta testing in California
            </p>
            <p className="mt-2 text-xs">
              AI-generated content is for reference only. Always verify with official code books.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// ==================== MAIN HOME COMPONENT (ALL ORIGINAL FUNCTIONALITY PRESERVED) ====================
export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const { 
    messages, 
    isLoading, 
    startNewChat, 
    loadChat,
    sendMessage, 
    currentChatId,
    cooldownRemaining
  } = useChat();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [usageData, setUsageData] = useState({ used: 0, remaining: BETA_QUERY_LIMIT });
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<Jurisdiction>(DEFAULT_JURISDICTION);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const usageFetchedRef = useRef(false);
  const lastMessageCountRef = useRef(0);

  // ==================== ALL ORIGINAL LOGIC PRESERVED ====================
  const fetchUsage = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/usage', {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' },
      });
      
      if (response.ok) {
        const data = await response.json();
        const queryCount = data.queryCount || 0;
        setUsageData({
          used: queryCount,
          remaining: Math.max(0, BETA_QUERY_LIMIT - queryCount),
        });
      } else {
        setUsageData({ used: 0, remaining: BETA_QUERY_LIMIT });
      }
    } catch (error) {
      console.error('Error fetching usage:', error);
      setUsageData({ used: 0, remaining: BETA_QUERY_LIMIT });
    }
  }, [user]);

  useEffect(() => {
    if (user && !usageFetchedRef.current) {
      fetchUsage();
      usageFetchedRef.current = true;
    }
  }, [user, fetchUsage]);

  useEffect(() => {
    if (!user || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    const isNewAssistantMessage = 
      lastMessage?.role === 'assistant' && 
      messages.length > lastMessageCountRef.current;

    if (isNewAssistantMessage) {
      fetchUsage();
      lastMessageCountRef.current = messages.length;
    }
  }, [messages, user, fetchUsage]);

  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    };
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages, isLoading]);

  const messageList = useMemo(() => {
    return messages.map((msg, index) => {
      const messageId = 'id' in msg && msg.id ? String(msg.id) : null;
      const key: string = messageId || `${currentChatId || 'new'}-${index}-${msg.role}`;
      return <ChatMessage key={key} message={msg} />;
    });
  }, [messages, currentChatId]);

  const handleSendMessage = useCallback((question: string) => {
    if (!user) {
      setShowAuthModal(true);
      toast.error('Please sign in to ask questions');
      return;
    }

    if (usageData.remaining <= 0) {
      toast.error('You have reached your question limit for the beta period');
      return;
    }

    sendMessage(question, { jurisdiction: selectedJurisdiction });
  }, [user, usageData.remaining, sendMessage, selectedJurisdiction]);

  const handleChatSelect = useCallback(async (chatId: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    try {
      await loadChat(chatId);
      setShowMobileSidebar(false);
    } catch (error) {
      console.error('Failed to load chat:', error);
      toast.error('Failed to load chat. Please try again.');
    }
  }, [user, loadChat]);

  const handleNewChat = useCallback(() => {
    startNewChat();
    setShowMobileSidebar(false);
    lastMessageCountRef.current = 0;
  }, [startNewChat]);

  const handleAuthSuccess = useCallback(() => {
    setShowAuthModal(false);
    toast.success(`Welcome to TheRuleKit! You have ${BETA_QUERY_LIMIT} free questions.`);
    usageFetchedRef.current = false;
    fetchUsage();
  }, [fetchUsage]);

  const isEmptyChat = messages.length === 0 && !currentChatId;
  const isDisabled = !user || authLoading || usageData.remaining <= 0 || cooldownRemaining > 0;

  // ==================== LOADING STATE ====================
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg mx-auto animate-pulse">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // ==================== PREMIUM LANDING PAGE (NON-AUTHENTICATED) ====================
  if (!user) {
    return (
      <>
        <PremiumLandingPage onStartFreeClick={() => setShowAuthModal(true)} />
        {showAuthModal && (
          <AuthModal
            onClose={() => setShowAuthModal(false)}
            onSuccess={handleAuthSuccess}
          />
        )}
      </>
    );
  }

  // ==================== FULL APP (AUTHENTICATED - ALL ORIGINAL FUNCTIONALITY) ====================
  return (
    <>
      <div className="flex h-screen w-screen text-gray-800 bg-white overflow-hidden">
        <Sidebar
          onLoginClick={() => setShowAuthModal(true)}
          onNewChat={handleNewChat}
          onChatSelect={handleChatSelect}
          isOpen={showMobileSidebar}
          onClose={() => setShowMobileSidebar(false)}
        />

        <div className="flex flex-col flex-1 w-full relative min-w-0">
          <Header
            onLoginClick={() => setShowAuthModal(true)}
            onMenuClick={() => setShowMobileSidebar(true)}
            onNewChat={handleNewChat}
          />

          <main 
            className="flex-1 overflow-y-auto overscroll-contain touch-pan-y bg-gray-50 pt-[60px] md:pt-0"
            role="main"
            aria-label="Chat messages"
          >
            <div
              className={`max-w-4xl mx-auto p-4 md:p-6 ${
                isEmptyChat
                  ? 'pb-[480px] sm:pb-[400px]'
                  : 'pb-[200px] sm:pb-[180px]'
              } md:pb-[280px] min-h-[60vh]`}
            >
              {isEmptyChat && !isLoading && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center text-white text-4xl font-bold mb-6 shadow-xl">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">Electrical Code AI</h1>
                  <p className="text-lg text-gray-600 mb-8">
                    Reference assistant for California electrical code questions
                  </p>
                </div>
              )}

              {messages.length > 0 && (
                <div className="space-y-8" role="log" aria-live="polite" aria-atomic="false">
                  {messageList}
                </div>
              )}

              <div ref={messagesEndRef} aria-hidden="true" />
            </div>
          </main>

          <footer 
            className="fixed bottom-0 left-0 md:left-64 right-0 bg-white border-t border-gray-200 shadow-2xl z-40"
            role="contentinfo"
          >
            <div className="max-w-4xl mx-auto px-3 py-2 sm:px-4 sm:py-3 space-y-2">
              {isEmptyChat && (
                <div className="mb-2">
                  <ExampleQuestions
                    onQuestionClick={handleSendMessage}
                    disabled={isDisabled}
                  />
                </div>
              )}

              <ChatInput
                onSend={handleSendMessage}
                isLoading={isLoading}
                disabled={isDisabled}
                cooldownRemaining={cooldownRemaining}
                jurisdictionValue={selectedJurisdiction}
                onJurisdictionChange={setSelectedJurisdiction}
              />

              <div className="space-y-1">
                <UsageMeter used={usageData.used} remaining={usageData.remaining} />
                <p className="text-[9px] sm:text-xs text-center text-gray-400 leading-tight px-2">
                  ⚠️ Verify with official books TheRuleKit is Not liable for incorrect answers
                </p>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </>
  );
}
