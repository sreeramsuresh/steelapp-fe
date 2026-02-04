/**
 * Skeleton loader components for loading states
 * Fixes bug #17: Loading states now use skeleton UI instead of spinners
 *
 * Usage:
 *   <TableSkeleton rows={5} cols={4} />
 *   <CardSkeleton />
 *   <ListSkeleton />
 */

export const Skeleton = ({ className = "", width = "w-full", height = "h-4" }) => (
  <div className={`bg-gray-300 dark:bg-gray-700 rounded animate-pulse ${width} ${height} ${className}`} />
);

export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="space-y-3 p-4">
    {Array.from({ length: rows }).map((_row, i) => (
      <div key={_row} className="flex gap-4">
        {Array.from({ length: cols }).map((_col, j) => (
          <Skeleton key={`${i}-${j}`} width="flex-1" height="h-8" className="rounded-md" />
        ))}
      </div>
    ))}
  </div>
);

export const CardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
    <Skeleton width="w-1/2" height="h-6" className="rounded-md" />
    <Skeleton width="w-full" height="h-4" className="rounded-md" />
    <Skeleton width="w-full" height="h-4" className="rounded-md" />
    <Skeleton width="w-3/4" height="h-4" className="rounded-md" />
  </div>
);

export const ListSkeleton = ({ items = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: items }).map((_item, _i) => (
      <div key={_item} className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
        <Skeleton width="w-2/3" height="h-5" className="rounded-md" />
        <Skeleton width="w-full" height="h-3" className="rounded-md" />
        <Skeleton width="w-1/2" height="h-3" className="rounded-md" />
      </div>
    ))}
  </div>
);

export const FormSkeleton = () => (
  <div className="space-y-6 p-6">
    <div className="space-y-2">
      <Skeleton width="w-1/4" height="h-4" className="rounded-md" />
      <Skeleton width="w-full" height="h-10" className="rounded-md" />
    </div>
    <div className="space-y-2">
      <Skeleton width="w-1/4" height="h-4" className="rounded-md" />
      <Skeleton width="w-full" height="h-10" className="rounded-md" />
    </div>
    <div className="flex gap-3">
      <Skeleton width="w-24" height="h-10" className="rounded-md" />
      <Skeleton width="w-24" height="h-10" className="rounded-md" />
    </div>
  </div>
);

export default Skeleton;
