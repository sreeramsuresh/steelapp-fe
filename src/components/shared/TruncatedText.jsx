import { useState } from 'react';

/**
 * Truncated text with hover tooltip showing full content
 * Fixes bug #1: Truncated customer names/emails now show full text on hover
 *
 * Usage:
 *   <TruncatedText text="Analytics Test Customer - 33156-1768915870210-1ufjwz" maxWidth="w-40" />
 */
const TruncatedText = ({
  text,
  maxWidth = 'w-40',
  className = '',
  tag = 'span',
  tooltipPosition = 'top', // 'top', 'bottom', 'left', 'right'
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!text) {
    return null;
  }

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  };

  const arrowClasses = {
    top: 'top-full border-t-4 border-l-4 border-r-4 border-gray-900 dark:border-gray-700 border-l-transparent border-r-transparent',
    bottom:
      'bottom-full border-b-4 border-l-4 border-r-4 border-gray-900 dark:border-gray-700 border-l-transparent border-r-transparent',
    left: 'left-full border-l-4 border-t-4 border-b-4 border-gray-900 dark:border-gray-700 border-t-transparent border-b-transparent',
    right:
      'right-full border-r-4 border-t-4 border-b-4 border-gray-900 dark:border-gray-700 border-t-transparent border-b-transparent',
  };

  const Component = tag;

  return (
    <div className="relative inline-block">
      <Component
        className={`${maxWidth} truncate ${className}`}
        title={text}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {text}
      </Component>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className={`absolute ${positionClasses[tooltipPosition]} px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap pointer-events-none z-50 dark:bg-gray-700 max-w-xs`}
        >
          {text}
          <div className={`absolute ${arrowClasses[tooltipPosition]}`} />
        </div>
      )}
    </div>
  );
};

export default TruncatedText;
