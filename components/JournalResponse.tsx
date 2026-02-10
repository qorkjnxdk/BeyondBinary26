'use client';

import { useState } from 'react';

interface JournalResponseProps {
  message: string;
  suggestions: string[] | null;
  sentiment: number | null;
  onDismiss?: () => void;
}

export default function JournalResponse({
  message,
  suggestions,
  sentiment,
  onDismiss,
}: JournalResponseProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Determine background color based on sentiment
  const getBackgroundClass = () => {
    if (sentiment === null || sentiment === 0) {
      return 'bg-gray-50 border-gray-200';
    } else if (sentiment < 0) {
      return 'bg-blue-50 border-blue-200';
    } else {
      return 'bg-amber-50 border-amber-200';
    }
  };

  // Determine text color for header
  const getHeaderColorClass = () => {
    if (sentiment === null || sentiment === 0) {
      return 'text-gray-700';
    } else if (sentiment < 0) {
      return 'text-blue-700';
    } else {
      return 'text-amber-700';
    }
  };

  if (!isExpanded) {
    return (
      <div className={`rounded-xl p-4 border ${getBackgroundClass()} mb-4`}>
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full flex items-center justify-between text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={getHeaderColorClass()}>💭 View Reflection</span>
          <svg
            className="w-5 h-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className={`rounded-xl p-5 border ${getBackgroundClass()} mb-4`}>
      <div className="flex items-start justify-between mb-3">
        <h3 className={`text-sm font-semibold ${getHeaderColorClass()} flex items-center gap-2`}>
          <span>💭</span>
          <span>Reflection</span>
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setIsExpanded(false)}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Collapse"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 15l7-7 7 7"
              />
            </svg>
          </button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Dismiss"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <p className="text-gray-800 text-sm leading-relaxed mb-3">{message}</p>

      {suggestions && suggestions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-600 mb-2">
            Gentle things that might help:
          </p>
          <ul className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-gray-400 mt-0.5">•</span>
                <span className="flex-1">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-4 italic">
        This reflection is not stored and is just for this moment.
      </p>
    </div>
  );
}
