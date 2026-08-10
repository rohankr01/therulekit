'use client';

import { GeneratedAnswer } from '@/types';
import { AnswerDisplay } from './answer-display';

export interface Message {
  role: 'user' | 'assistant';
  content: string | GeneratedAnswer;
}

interface ChatMessageProps {
  message: Message;
}

const UserIcon = () => (
  <div
    className="w-8 h-8 rounded-md bg-blue-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
    aria-hidden="true"
    title="User"
  >
    U
  </div>
);

// kept compact — brand text shown in the author label below (therulekit)
const AIIcon = () => (
  <div
    className="w-8 h-8 rounded-md bg-gray-800 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
    aria-hidden="true"
    title="therulekit"
  >
    we
  </div>
);

export function ChatMessage({ message }: ChatMessageProps) {
  const isUserMessage = message.role === 'user';
  
  // ✅ FIXED: Properly assigned to const
  const isThinking =
    message.role === 'assistant' &&
    (message.content as GeneratedAnswer).answer === '...';

  return (
    <div className="flex items-start gap-4">
      {isUserMessage ? <UserIcon /> : <AIIcon />}

      <div className="flex-1 pt-1">
        {/* author label: hidden for user messages, shows 'therulekit' (lowercase) for assistant */}
        <div className={`font-semibold text-gray-900 mb-1 ${isUserMessage ? 'hidden' : ''}`}>
          {isUserMessage ? 'You' : 'therulekit'}
        </div>

        <div className="text-gray-800">
          {isUserMessage ? (
            <p className="text-base whitespace-pre-wrap">
              {message.content as string}
            </p>
          ) : isThinking ? (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" />
              <div
                className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"
                style={{ animationDelay: '0.2s' }}
              />
              <div
                className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"
                style={{ animationDelay: '0.4s' }}
              />
            </div>
          ) : (
            <AnswerDisplay response={message.content as GeneratedAnswer} />
          )}
        </div>
      </div>
    </div>
  );
}