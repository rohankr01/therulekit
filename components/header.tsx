'use client';

import React from 'react';
import { useAuth } from '@/hooks/use-auth';

/* -------------------------------------------------------------------------- */
/*                              ICON COMPONENTS                               */
/* -------------------------------------------------------------------------- */

// 🧩 Memoized icons for performance
const MenuIcon = React.memo(() => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
));

const PlusIcon = React.memo(() => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
));

/* -------------------------------------------------------------------------- */
/*                              HEADER PROPS                                  */
/* -------------------------------------------------------------------------- */
interface HeaderProps {
  onLoginClick: () => void;
  onMenuClick?: () => void;
  onNewChat?: () => void;
}

/* -------------------------------------------------------------------------- */
/*                              HEADER COMPONENT                              */
/* -------------------------------------------------------------------------- */
export function Header({ onLoginClick, onMenuClick, onNewChat }: HeaderProps) {
  const { user, loading } = useAuth();

  return (
    <header
      className="
        md:hidden
        fixed top-0 left-0 right-0
        flex items-center justify-between
        px-4 py-3
        border-b border-gray-200
        bg-white
        z-50 shadow-sm
      "
      role="banner"
    >
      {/* Left: Logo + Menu */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {user && onMenuClick && (
          <button
            onClick={onMenuClick}
            aria-label="Open sidebar menu"
            className="
              flex-shrink-0 p-2 rounded-lg
              hover:bg-gray-100 active:bg-gray-200
              focus:outline-none focus:ring-2 focus:ring-blue-400
              transition-colors active:scale-95
            "
          >
            <MenuIcon />
          </button>
        )}

        {/* Branding */}
        <div className="flex items-center gap-2 flex-shrink-0 select-none">
          <div
            className="
              w-8 h-8 bg-blue-600 rounded-lg
              flex items-center justify-center
              font-bold text-lg text-white
              shadow-md
            "
            aria-hidden="true"
          >
            E
          </div>
          <span className="font-semibold text-base text-gray-900 whitespace-nowrap">
            TheRuleKit
          </span>
        </div>
      </div>

      {/* Right: Action Button */}
      <div className="flex-shrink-0 ml-2">
        {loading ? (
          <div className="w-20 h-9 bg-gray-200 rounded-lg animate-pulse" aria-busy="true" />
        ) : user && onNewChat ? (
          <button
            onClick={onNewChat}
            aria-label="Start a new chat"
            className="
              p-2 rounded-lg
              bg-blue-600 hover:bg-blue-700 active:bg-blue-800
              text-white shadow-sm
              focus:outline-none focus:ring-2 focus:ring-blue-400
              transition-all active:scale-95
            "
          >
            <PlusIcon />
          </button>
        ) : (
          <button
            onClick={onLoginClick}
            className="
              bg-blue-600 hover:bg-blue-700 active:bg-blue-800
              text-white font-semibold
              py-2 px-4 rounded-lg text-sm shadow-sm whitespace-nowrap
              transition-all active:scale-95
              focus:outline-none focus:ring-2 focus:ring-blue-400
            "
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}

