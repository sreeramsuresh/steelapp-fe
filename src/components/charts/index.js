/**
 * Chart Components Index
 * Only export ChartSkeleton directly (small component)
 * LazyLineChart and LazyBarChart should be imported via React.lazy():
 *
 * Usage:
 * import { ChartSkeleton } from "../components/charts";
 * const LazyLineChart = lazy(() => import("../components/charts/LazyLineChart"));
 * const LazyBarChart = lazy(() => import("../components/charts/LazyBarChart"));
 */

export { default as ChartSkeleton } from './ChartSkeleton';
