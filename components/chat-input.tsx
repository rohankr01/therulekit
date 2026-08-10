'use client';

import { useState, useRef, useEffect } from 'react';
import { Jurisdiction, CodeYear, SUPPORTED_CODE_YEARS } from '@/types';
import { JurisdictionSelector } from '@/components/jurisdiction-selector';

interface ChatInputProps {
  onSend: (
    message: string,
    options?: {
      codeYear?: CodeYear;
      compareYears?: boolean;
    }
  ) => void;
  isLoading: boolean;
  disabled: boolean;
  cooldownRemaining?: number;
  jurisdictionValue: Jurisdiction;
  onJurisdictionChange: (jurisdiction: Jurisdiction) => void;
}

export function ChatInput({
  onSend,
  isLoading,
  disabled,
  cooldownRemaining = 0,
  jurisdictionValue,
  onJurisdictionChange,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [selectedYear, setSelectedYear] = useState<CodeYear | 'current'>('current');
  const [compareMode, setCompareMode] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading && !disabled && cooldownRemaining <= 0) {
      const options: {
        codeYear?: CodeYear;
        compareYears?: boolean;
      } = {};

      if (compareMode) {
        options.compareYears = true;
      } else if (selectedYear !== 'current') {
        options.codeYear = selectedYear;
      }

      onSend(message.trim(), options);
      setMessage('');

      // Reset textarea height after sending
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [message]);

  // Get placeholder text based on mode
  const getPlaceholder = () => {
    if (compareMode) {
      return `Compare code changes in ${jurisdictionValue}...`;
    }
    if (selectedYear === 'current') {
      return `Ask about ${jurisdictionValue} electrical code...`;
    }
    return `Ask about ${selectedYear} ${jurisdictionValue} code...`;
  };

  return (
    <div className="space-y-2">
      {/* Controls Row - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 px-1">
        {/* Jurisdiction Selector */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="jurisdiction"
            className="text-[10px] sm:text-xs font-medium text-gray-700"
          >
            Jurisdiction:
          </label>
          <JurisdictionSelector
            value={jurisdictionValue}
            onChange={onJurisdictionChange}
            disabled={disabled || isLoading || cooldownRemaining > 0}
          />
        </div>

        {/* Code Year Selector - Custom Dropdown */}
        <div className="flex flex-col gap-1">
          <label htmlFor="codeYear" className="text-[10px] sm:text-xs font-medium text-gray-700">
            Code Year:
          </label>
          <div className="relative">
            <button
              type="button"
            disabled={disabled || isLoading || compareMode || cooldownRemaining > 0}
              onClick={() => setShowYearDropdown((v) => !v)}
              className="w-full text-left text-[11px] sm:text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 bg-white shadow-sm hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
            >
              {selectedYear === 'current' ? 'Current (2023)' : selectedYear}
            </button>

            {showYearDropdown && !compareMode && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowYearDropdown(false)}
                />

                <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl z-20 max-h-[220px] overflow-y-auto">
                  <button
                    className={`w-full px-4 py-3 text-left text-[11px] sm:text-sm ${
                      selectedYear === 'current'
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      setSelectedYear('current');
                      setShowYearDropdown(false);
                    }}
                  >
                    Current (2023)
                  </button>

                  {SUPPORTED_CODE_YEARS.map((year) => (
                    <button
                      key={year}
                      className={`w-full px-4 py-3 text-left text-[11px] sm:text-sm ${
                        selectedYear === year
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        setSelectedYear(year);
                        setCompareMode(false);
                        setShowYearDropdown(false);
                      }}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Compare Toggle */}
        <div className="flex flex-col gap-1">
          <label htmlFor="compareMode" className="text-[10px] sm:text-xs font-medium text-gray-700">
            Mode:
          </label>
          <label className="relative inline-flex items-center cursor-pointer h-[34px] sm:h-[42px] px-3 border border-gray-300 rounded-lg bg-white shadow-sm hover:border-gray-400 transition-colors">
            <input
              id="compareMode"
              type="checkbox"
              checked={compareMode}
              onChange={(e) => {
                setCompareMode(e.target.checked);
                // Reset to current when enabling compare mode
                if (e.target.checked) {
                  setSelectedYear('current');
                }
              }}
              disabled={disabled || isLoading || cooldownRemaining > 0}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            <span className="ml-2 text-[11px] sm:text-sm text-gray-700 font-medium">
              {compareMode ? '🔄 Compare' : '📖 Single'}
            </span>
          </label>
        </div>
      </div>

      {/* Info Banner - Shows when compare mode is active */}
      {compareMode && (
        <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-[10px] sm:text-xs text-blue-800">
            <strong>Compare Mode:</strong> I'll analyze code changes between{' '}
            {/* ✅ Dynamically shows all supported years from types.ts */}
            {SUPPORTED_CODE_YEARS.length > 0 
              ? SUPPORTED_CODE_YEARS.join(' and ') 
              : '2023 and 2026'} and explain what's different.
          </p>
        </div>
      )}

      {cooldownRemaining > 0 && (
        <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-[10px] sm:text-xs text-amber-800">
            Too many requests. You can ask again in {cooldownRemaining}s.
          </p>
        </div>
      )}

      {/* Message Input with Auto-resize */}
      <form onSubmit={handleSubmit} className="relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={getPlaceholder()}
          disabled={disabled || isLoading || cooldownRemaining > 0}
          className="w-full px-3 py-2 sm:px-4 sm:py-3 pr-12 sm:pr-14 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed shadow-sm transition-shadow hover:shadow-md text-xs sm:text-sm"
          rows={1}
          maxLength={500}
          style={{
            minHeight: '44px',
            maxHeight: '100px',
          }}
        />

        {/* Character Counter */}
        <div className="absolute left-2 sm:left-3 bottom-1.5 sm:bottom-2 text-[9px] sm:text-[10px] text-gray-400">
          {message.length}/500
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!message.trim() || isLoading || disabled || cooldownRemaining > 0}
          className="absolute right-2 sm:right-3 bottom-1.5 sm:bottom-2 p-1.5 sm:p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
          aria-label="Send message"
        >
          {isLoading ? (
            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : cooldownRemaining > 0 ? (
            <span className="text-[10px] font-semibold">{cooldownRemaining}s</span>
          ) : (
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 12h14M12 5l7 7-7 7"
              />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
