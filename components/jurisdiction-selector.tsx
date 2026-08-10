'use client';

import { SUPPORTED_JURISDICTIONS, Jurisdiction } from '@/types';
import { useState, useEffect } from 'react';

interface JurisdictionSelectorProps {
  value: Jurisdiction;
  onChange: (jurisdiction: Jurisdiction) => void;
  disabled?: boolean;
}

export function JurisdictionSelector({
  value,
  onChange,
  disabled = false,
}: JurisdictionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Close dropdown on ESC key
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  // Prevent background scroll when dropdown is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-disabled={disabled}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium
          transition-all
          ${
            disabled
              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
              : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer'
          }
        `}
      >
        <svg
          className="w-4 h-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span className="hidden sm:inline">{value}</span>
        <span className="sm:hidden">{value.split(',')[0]}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && !disabled && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Dropdown - Scrollable with custom class for styling */}
          <div 
            className="jurisdiction-dropdown-scroll absolute top-full mt-2 left-0 right-0 sm:right-auto bg-white border border-gray-200 rounded-lg shadow-xl z-20 min-w-[280px] max-w-full sm:max-w-[320px] max-h-[240px] overflow-y-auto overscroll-contain scroll-smooth"
            role="listbox"
          >
            <div className="py-1">
              {SUPPORTED_JURISDICTIONS.map((jurisdiction) => (
                <button
                  key={jurisdiction}
                  onClick={() => {
                    onChange(jurisdiction);
                    setIsOpen(false);
                  }}
                  role="option"
                  aria-selected={value === jurisdiction}
                  className={`
                    w-full text-left px-4 py-3 text-sm transition-colors
                    ${
                      value === jurisdiction
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                    }
                  `}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex-1">{jurisdiction}</span>
                    {value === jurisdiction && (
                      <svg
                        className="w-5 h-5 text-blue-600 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Info Footer - Sticky */}
            <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 sticky bottom-0">
              <p className="text-xs text-gray-600 flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Answers are filtered to your selected jurisdiction's codes</span>
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
