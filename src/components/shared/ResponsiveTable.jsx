/**
 * Responsive table wrapper with horizontal scroll indicator
 * Fixes bugs #28, #30: Horizontal scroll affordance and card spacing consistency
 *
 * Usage:
 *   <ResponsiveTable>
 *     <table>...</table>
 *   </ResponsiveTable>
 */
const ResponsiveTable = ({ children, className = '' }) => {
  return (
    <div className={`overflow-x-auto relative ${className}`}>
      {/* Scroll indicator gradient */}
      <div className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none bg-gradient-to-l from-gray-900/10 dark:from-gray-900/30 to-transparent" />

      {children}

      {/* Scroll hint text */}
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-right pr-2">
        ← Scroll right for more
      </div>
    </div>
  );
};

export default ResponsiveTable;
