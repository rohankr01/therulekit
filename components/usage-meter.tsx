'use client';

import { BETA_QUERY_LIMIT } from '@/lib/usage-limits';

interface UsageMeterProps {
  used: number;
  remaining: number;
}

export function UsageMeter({ used, remaining }: UsageMeterProps) {
  const total = BETA_QUERY_LIMIT; // Single source of truth

  // Calculate percentage with edge case protection
  const percentage = total > 0 ? (used / total) * 100 : 0;

  // Dynamic color based on usage thresholds
  let barColor = 'bg-green-500'; // Plenty remaining (0-50% used)
  let statusText = 'text-green-700';

  if (percentage > 50 && percentage <= 80) {
    barColor = 'bg-yellow-500'; // Getting low (51-80% used)
    statusText = 'text-yellow-700';
  } else if (percentage > 80) {
    barColor = 'bg-red-500'; // Critical (81-100% used)
    statusText = 'text-red-700';
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      {/* Header with usage stats */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-gray-900">Beta Usage</h3>
        <span className="text-sm font-medium">
          <span className={statusText}>{used}</span>
          <span className="text-gray-400 mx-1">/</span>
          <span className="text-gray-700">{total}</span>
          <span className="text-gray-500 font-normal ml-1">used</span>
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
          role="progressbar"
          aria-valuenow={used}
          aria-valuemin={0}
          aria-valuemax={total}
        ></div>
      </div>

      {/* Footer with remaining queries */}
      <p className="text-xs text-gray-500 mt-2">
        <span className="font-medium text-gray-700">{remaining}</span> questions remaining
        <span className="mx-1">•</span>
        Free beta includes {total} questions
      </p>
    </div>
  );
}
