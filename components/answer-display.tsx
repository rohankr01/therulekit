'use client';

import { GeneratedAnswer } from '@/types';
import { useState, memo, useCallback } from 'react';
import DOMPurify from 'isomorphic-dompurify';

// ========================================
// ICON COMPONENTS
// ========================================

const ClipboardIcon = memo(() => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
));
ClipboardIcon.displayName = 'ClipboardIcon';

const CheckIcon = memo(() => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
));
CheckIcon.displayName = 'CheckIcon';

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Safely formats markdown-like text to HTML
 * Uses DOMPurify to prevent XSS attacks
 */
function formatAnswer(text: string): string {
  if (!text || typeof text !== 'string') return '';

  const formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/•/g, '<br />&bull;')
    .replace(/\[(.*?)\]/g, '<strong>[$1]</strong>')
    .replace(/\n/g, '<br />');

  // Sanitize to prevent XSS - only allow safe tags
  return DOMPurify.sanitize(formatted, {
    ALLOWED_TAGS: ['strong', 'br', 'em', 'u', 'span'],
    ALLOWED_ATTR: [],
  });
}

// ========================================
// SUB-COMPONENTS (Memoized for Performance)
// ========================================

interface FieldBlockProps {
  title: string;
  icon: string;
  items: string[];
  colorScheme: 'red' | 'green' | 'blue' | 'orange' | 'yellow';
}

const FieldBlock = memo(({ title, icon, items, colorScheme }: FieldBlockProps) => {
  const colors = {
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      title: 'text-red-800',
      text: 'text-red-700',
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      title: 'text-green-800',
      text: 'text-green-700',
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      title: 'text-blue-800',
      text: 'text-blue-700',
    },
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      title: 'text-orange-800',
      text: 'text-orange-700',
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      title: 'text-yellow-800',
      text: 'text-yellow-700',
    },
  };

  const scheme = colors[colorScheme];

  return (
    <div className={`${scheme.bg} border ${scheme.border} rounded-lg p-4`}>
      <h4 className={`font-semibold ${scheme.title} mb-2 flex items-center gap-2`}>
        <span role="img" aria-label={title}>
          {icon}
        </span>{' '}
        {title}
      </h4>
      <ul className={`list-disc list-inside space-y-1 text-sm ${scheme.text}`}>
        {items.map((item, i) => (
          <li key={`${colorScheme}-${i}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
});
FieldBlock.displayName = 'FieldBlock';

interface CopyButtonProps {
  text: string;
  sectionKey: string;
  isCopied: boolean;
  onCopy: (text: string, sectionKey: string) => void;
}

const CopyButton = memo(({ text, sectionKey, isCopied, onCopy }: CopyButtonProps) => {
  const handleClick = useCallback(() => {
    onCopy(text, sectionKey);
  }, [text, sectionKey, onCopy]);

  return (
    <button
      onClick={handleClick}
      className="absolute top-2 right-2 p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      aria-label={isCopied ? 'Copied!' : 'Copy code section'}
      disabled={isCopied}
    >
      {isCopied ? <CheckIcon /> : <ClipboardIcon />}
    </button>
  );
});
CopyButton.displayName = 'CopyButton';

interface CitationItemProps {
  source: any;
  sectionKey: string;
  isExpanded: boolean;
  isCopied: boolean;
  onToggle: (sectionKey: string) => void;
  onCopy: (text: string, sectionKey: string) => void;
}

const CitationItem = memo(
  ({ source, sectionKey, isExpanded, isCopied, onToggle, onCopy }: CitationItemProps) => {
    const isEnhanced = source.source_type === 'enhanced_guide' || !!source.enhanced_metadata;
    const borderColor = isEnhanced ? 'border-green-200' : 'border-blue-200';
    const bgColor = isEnhanced ? 'bg-green-50 hover:bg-green-100' : 'bg-blue-50 hover:bg-blue-100';
    const textColor = isEnhanced ? 'text-green-600' : 'text-blue-600';
    const dotColor = isEnhanced ? 'bg-green-500' : 'bg-blue-500';

    const handleToggle = useCallback(() => {
      onToggle(sectionKey);
    }, [onToggle, sectionKey]);

    return (
      <div className={`border ${borderColor} rounded-lg overflow-hidden bg-white`}>
        <button
          onClick={handleToggle}
          className={`w-full text-left p-3 ${bgColor} flex justify-between items-center transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          aria-expanded={isExpanded}
        >
          <span className={`font-medium ${textColor} text-sm flex items-center gap-2`}>
            <span className={`w-2 h-2 ${dotColor} rounded-full`} aria-hidden="true"></span>
            {source.code_book} {source.section_number ?? 'Unknown Section'}
            {source.code_year && ` (${source.code_year})`}
            {isEnhanced && (
              <span className="text-xs bg-green-200 px-1.5 py-0.5 rounded">+ Field Intel</span>
            )}
          </span>
          <span
            className="text-gray-500 text-xs transform transition-transform duration-200"
            style={{
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
            aria-hidden="true"
          >
            ▼
          </span>
        </button>

        {isExpanded && (
          <div className="p-4 border-t border-gray-200 relative">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed pr-10">
              {source.content}
            </pre>
            <CopyButton
              text={source.content}
              sectionKey={sectionKey}
              isCopied={isCopied}
              onCopy={onCopy}
            />

            {source.enhanced_metadata?.related_guides &&
              source.enhanced_metadata.related_guides.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                  <p className="text-xs font-semibold text-gray-600 uppercase">Enhanced Context</p>
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">Source Guide:</span>{' '}
                    {source.enhanced_metadata.related_guides[0]}
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
    );
  }
);
CitationItem.displayName = 'CitationItem';

// ========================================
// MAIN COMPONENT
// ========================================

export function AnswerDisplay({ response }: { response: GeneratedAnswer }) {
  const [expandedSource, setExpandedSource] = useState<string | null>(null);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  // Safe defaults
  const safeAnswer = response?.answer || "Sorry, I couldn't generate a valid response.";
  const {
    actionItems = [],
    inspectorTips = [],
    citedSections = [],
    confidence,
    yearsCompared = [],
    enhancedMetadata,
  } = response || {};

  const handleCopy = useCallback((text: string, sectionKey: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopiedStates((prev) => ({ ...prev, [sectionKey]: true }));
        setTimeout(() => {
          setCopiedStates((prev) => ({ ...prev, [sectionKey]: false }));
        }, 2000);
      })
      .catch((err) => console.error('Failed to copy text:', err));
  }, []);

  const handleToggle = useCallback((sectionKey: string) => {
    setExpandedSource((prev) => (prev === sectionKey ? null : sectionKey));
  }, []);

  // Check if enhanced metadata exists and has content
  const hasEnhancedMetadata = enhancedMetadata && Object.keys(enhancedMetadata).length > 0;
  const hasAmendments =
    enhancedMetadata?.jurisdictionAmendments && enhancedMetadata.jurisdictionAmendments.length > 0;
  const hasFieldTips = enhancedMetadata?.fieldTips && enhancedMetadata.fieldTips.length > 0;
  const hasCosts = enhancedMetadata?.costAnalysis && enhancedMetadata.costAnalysis.length > 0;
  const hasFailures =
    enhancedMetadata?.commonFailures && enhancedMetadata.commonFailures.length > 0;
  const hasInspectorFocus =
    enhancedMetadata?.inspectorFocus && enhancedMetadata.inspectorFocus.length > 0;

  return (
    <div className="space-y-6">
      {/* Multi-Year Comparison Indicator */}
      {yearsCompared.length > 1 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3" role="status">
          <p className="text-sm text-purple-700 font-medium">
            📊 Multi-Year Analysis: Comparing {yearsCompared.join(' vs ')}
          </p>
        </div>
      )}

      {/* Main Answer with XSS Protection */}
      <div
        className="prose prose-base max-w-none text-gray-800"
        dangerouslySetInnerHTML={{ __html: formatAnswer(safeAnswer) }}
      />

      {/* Field Intelligence Section - Enhanced Guides Only */}
      {hasEnhancedMetadata && (
        <div className="space-y-4">
          {hasAmendments && (
            <FieldBlock
              title="Jurisdiction-Specific Amendments"
              icon="🚨"
              items={enhancedMetadata?.jurisdictionAmendments ?? []}
              colorScheme="red"
            />
          )}

          {hasFieldTips && (
            <FieldBlock
              title="Field Intelligence"
              icon="💡"
              items={enhancedMetadata?.fieldTips ?? []}
              colorScheme="green"
            />
          )}

          {hasCosts && (
            <FieldBlock
              title="Cost Considerations"
              icon="💰"
              items={enhancedMetadata?.costAnalysis ?? []}
              colorScheme="blue"
            />
          )}

          {hasFailures && (
            <FieldBlock
              title="Common Inspection Failures"
              icon="⚠️"
              items={enhancedMetadata?.commonFailures ?? []}
              colorScheme="orange"
            />
          )}

          {hasInspectorFocus && (
            <FieldBlock
              title="What Inspectors Look For"
              icon="🔍"
              items={enhancedMetadata?.inspectorFocus ?? []}
              colorScheme="yellow"
            />
          )}
        </div>
      )}

      {/* Standard Action Items & Inspector Tips */}
      {(actionItems.length > 0 || inspectorTips.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {actionItems.length > 0 && (
            <FieldBlock title="Action Items" icon="✅" items={actionItems} colorScheme="blue" />
          )}
          {inspectorTips.length > 0 && (
            <FieldBlock
              title="Inspector Tips"
              icon="🕵️"
              items={inspectorTips}
              colorScheme="yellow"
            />
          )}
        </div>
      )}

      {/* Source Citations - The Trust Engine */}
      {citedSections.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
            <h4 className="font-semibold text-sm text-gray-600">Source References:</h4>

            {/* Source Type Legend */}
            <div className="flex gap-2 text-xs flex-wrap">
              <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-1" aria-hidden="true"></span>
                Raw Code (98% Accuracy)
              </span>
              <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1" aria-hidden="true"></span>
                Enhanced Guide
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {citedSections.map((source, index) => {
              // Create a safe, stable string key for each citation
              const sectionKey = source.section_number ?? `section-${index}`;
              
              return (
                <CitationItem
                  key={sectionKey}
                  source={source}
                  sectionKey={sectionKey}
                  isExpanded={expandedSource === sectionKey}
                  isCopied={!!copiedStates[sectionKey]}
                  onToggle={handleToggle}
                  onCopy={handleCopy}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
