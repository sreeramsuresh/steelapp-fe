/**
 * LoadingStates Components
 *
 * Collection of loading indicators and skeleton loaders
 * with smooth animations and dark mode support.
 */

// React import removed (unused)

/**
 * Spinning loader with customizable size and color
 */
export const Spinner = ({ size = "md", color = "teal", className = "" }) => {
  const sizes = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  const colors = {
    teal: "text-teal-500",
    gray: "text-gray-400",
    white: "text-white",
    blue: "text-blue-500",
  };

  return (
    <svg
      className={`animate-spin ${sizes[size]} ${colors[color]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

/**
 * Pulsing dots loader
 */
export const PulsingDots = ({
  size = "md",
  color = "teal",
  className = "",
}) => {
  const sizes = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-3 h-3",
  };

  const colors = {
    teal: "bg-teal-500",
    gray: "bg-gray-400",
    white: "bg-white",
  };

  return (
    <div className={`flex items-center gap-1 ${className}`} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${sizes[size]} ${colors[color]} rounded-full animate-pulse`}
          style={{ animationDelay: `${i * 150}ms`, animationDuration: "1s" }}
        />
      ))}
    </div>
  );
};

/**
 * Skeleton loader for text/content
 */
export const Skeleton = ({
  width = "full",
  height = "4",
  rounded = "md",
  isDarkMode = false,
  className = "",
  animate = true,
}) => {
  const widthClasses = {
    full: "w-full",
    "3/4": "w-3/4",
    "1/2": "w-1/2",
    "1/3": "w-1/3",
    "1/4": "w-1/4",
  };

  return (
    <div
      className={`
        ${typeof width === "string" && widthClasses[width] ? widthClasses[width] : ""}
        h-${height} rounded-${rounded}
        ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}
        ${animate ? "animate-pulse" : ""} ${className}
      `}
      style={typeof width === "number" ? { width: `${width}px` } : undefined}
      aria-hidden="true"
    />
  );
};

/**
 * Table row skeleton
 */
export const TableRowSkeleton = ({
  columns = 5,
  isDarkMode = false,
  className = "",
}) => (
  <tr className={className}>
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="px-2 py-3">
        <Skeleton
          width={i === 0 ? "3/4" : "1/2"}
          height="4"
          isDarkMode={isDarkMode}
        />
      </td>
    ))}
  </tr>
);

/**
 * Card skeleton
 */
export const CardSkeleton = ({
  showImage = false,
  lines = 3,
  isDarkMode = false,
  className = "",
}) => (
  <div
    className={`p-4 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} ${className}`}
  >
    {showImage && (
      <Skeleton
        width="full"
        height="32"
        rounded="lg"
        isDarkMode={isDarkMode}
        className="mb-4"
      />
    )}
    <div className="space-y-3">
      <Skeleton width="3/4" height="5" isDarkMode={isDarkMode} />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 2 ? "1/2" : "full"}
          height="4"
          isDarkMode={isDarkMode}
        />
      ))}
    </div>
  </div>
);

/**
 * Page loader overlay
 */
export const PageLoader = ({ message = "Loading...", isDarkMode = false }) => (
  <div
    className={`fixed inset-0 z-50 flex items-center justify-center ${isDarkMode ? "bg-gray-900/80" : "bg-white/80"} backdrop-blur-sm`}
    role="status"
    aria-live="polite"
  >
    <div className="text-center">
      <Spinner size="xl" color="teal" className="mx-auto mb-4" />
      <p
        className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
      >
        {message}
      </p>
    </div>
  </div>
);

/**
 * Inline loader
 */
export const InlineLoader = ({
  message = "Loading...",
  size = "sm",
  isDarkMode = false,
  className = "",
}) => (
  <div
    className={`flex items-center gap-2 ${className}`}
    role="status"
    aria-live="polite"
  >
    <Spinner size={size} color={isDarkMode ? "white" : "teal"} />
    <span
      className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
    >
      {message}
    </span>
  </div>
);

/**
 * Progress bar
 */
export const ProgressBar = ({
  progress = 0,
  showPercentage = true,
  size = "md",
  color = "teal",
  isDarkMode = false,
  className = "",
}) => {
  const heights = { sm: "h-1", md: "h-2", lg: "h-3" };
  const colors = {
    teal: "bg-teal-500",
    blue: "bg-blue-500",
    green: "bg-green-500",
  };

  return (
    <div className={className}>
      <div
        className={`w-full rounded-full overflow-hidden ${heights[size]} ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`${heights[size]} ${colors[color]} transition-all duration-300 ease-out`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      {showPercentage && (
        <p
          className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
        >
          {Math.round(progress)}%
        </p>
      )}
    </div>
  );
};

/**
 * Saving indicator
 */
export const SavingIndicator = ({
  status = "idle",
  lastSaved = null,
  isDarkMode = false,
  className = "",
}) => {
  const configs = {
    idle: {
      icon: null,
      text: lastSaved ? `Last saved ${lastSaved}` : "Not saved",
      color: isDarkMode ? "text-gray-500" : "text-gray-400",
    },
    saving: {
      icon: <Spinner size="xs" color={isDarkMode ? "white" : "gray"} />,
      text: "Saving...",
      color: isDarkMode ? "text-gray-400" : "text-gray-500",
    },
    saved: {
      icon: (
        <svg
          className="w-3 h-3 text-green-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      ),
      text: "Saved",
      color: "text-green-500",
    },
    error: {
      icon: (
        <svg
          className="w-3 h-3 text-red-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      ),
      text: "Error saving",
      color: "text-red-500",
    },
  };
  const config = configs[status] || configs.idle;

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {config.icon}
      <span className={`text-xs ${config.color}`}>{config.text}</span>
    </div>
  );
};

export default {
  Spinner,
  PulsingDots,
  Skeleton,
  TableRowSkeleton,
  CardSkeleton,
  PageLoader,
  InlineLoader,
  ProgressBar,
  SavingIndicator,
};
