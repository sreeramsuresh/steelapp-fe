/**
 * useDragReorder Hook
 *
 * Provides drag-and-drop reordering functionality for lists using native HTML5 DnD API.
 * No external dependencies required.
 *
 * @example
 * const { dragHandlers, getDragItemProps, isDragging, dragOverIndex } = useDragReorder({
 *   items: invoice.items,
 *   onReorder: (newItems) => setInvoice(prev => ({ ...prev, items: newItems })),
 * });
 */

import { useCallback, useRef, useState } from "react";

/**
 * Custom hook for drag-and-drop reordering
 * @param {Object} options - Configuration options
 * @param {Array} options.items - Array of items to reorder
 * @param {Function} options.onReorder - Callback when items are reordered
 * @param {boolean} options.enabled - Whether drag is enabled (default: true)
 * @returns {Object} Drag handlers and state
 */
const useDragReorder = ({ items = [], onReorder, enabled = true } = {}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const dragNodeRef = useRef(null);
  const dragIndexRef = useRef(null);

  // Handle drag start
  const handleDragStart = useCallback(
    (e, index) => {
      if (!enabled) return;

      dragIndexRef.current = index;
      dragNodeRef.current = e.target;
      setDragIndex(index);
      setIsDragging(true);

      // Set drag image and data
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", index.toString());

      // Add slight delay for visual feedback
      setTimeout(() => {
        if (dragNodeRef.current) {
          dragNodeRef.current.style.opacity = "0.5";
        }
      }, 0);
    },
    [enabled]
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    (_e) => {
      if (!enabled) return;

      if (dragNodeRef.current) {
        dragNodeRef.current.style.opacity = "1";
      }

      setIsDragging(false);
      setDragIndex(null);
      setDragOverIndex(null);
      dragNodeRef.current = null;
      dragIndexRef.current = null;
    },
    [enabled]
  );

  // Handle drag over
  const handleDragOver = useCallback(
    (e, index) => {
      if (!enabled) return;

      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      if (index !== dragOverIndex) {
        setDragOverIndex(index);
      }
    },
    [enabled, dragOverIndex]
  );

  // Handle drag enter
  const handleDragEnter = useCallback(
    (e, index) => {
      if (!enabled) return;

      e.preventDefault();
      if (dragIndexRef.current !== index) {
        setDragOverIndex(index);
      }
    },
    [enabled]
  );

  // Handle drag leave
  const handleDragLeave = useCallback(
    (_e) => {
      if (!enabled) return;
      // Only clear if leaving the container entirely
    },
    [enabled]
  );

  // Handle drop
  const handleDrop = useCallback(
    (e, dropIndex) => {
      if (!enabled) return;

      e.preventDefault();

      const sourceIndex = dragIndexRef.current;

      if (sourceIndex === null || sourceIndex === dropIndex) {
        return;
      }

      // Create new array with reordered items
      const newItems = [...items];
      const [draggedItem] = newItems.splice(sourceIndex, 1);
      newItems.splice(dropIndex, 0, draggedItem);

      // Call the reorder callback
      if (onReorder) {
        onReorder(newItems);
      }

      // Reset state
      setDragOverIndex(null);
    },
    [enabled, items, onReorder]
  );

  // Get props for a draggable item
  const getDragItemProps = useCallback(
    (index) => {
      if (!enabled) {
        return {};
      }

      return {
        draggable: true,
        onDragStart: (e) => handleDragStart(e, index),
        onDragEnd: handleDragEnd,
        onDragOver: (e) => handleDragOver(e, index),
        onDragEnter: (e) => handleDragEnter(e, index),
        onDragLeave: handleDragLeave,
        onDrop: (e) => handleDrop(e, index),
      };
    },
    [enabled, handleDragStart, handleDragEnd, handleDragOver, handleDragEnter, handleDragLeave, handleDrop]
  );

  // Get drag handle props (for a specific drag handle element)
  const getDragHandleProps = useCallback(
    (index) => {
      if (!enabled) {
        return {};
      }

      return {
        draggable: true,
        onDragStart: (e) => {
          // Prevent the row from being dragged, only the handle
          e.stopPropagation();
          handleDragStart(e, index);
        },
        style: { cursor: "grab" },
        title: "Drag to reorder",
        "aria-label": `Drag to reorder item ${index + 1}`,
      };
    },
    [enabled, handleDragStart]
  );

  // Check if an index is being dragged over
  const isDropTarget = useCallback(
    (index) => {
      return dragOverIndex === index && dragIndex !== index;
    },
    [dragOverIndex, dragIndex]
  );

  // Check if an index is being dragged
  const isDragSource = useCallback(
    (index) => {
      return dragIndex === index;
    },
    [dragIndex]
  );

  // Move item up
  const moveItemUp = useCallback(
    (index) => {
      if (index <= 0 || !enabled) return;

      const newItems = [...items];
      [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];

      if (onReorder) {
        onReorder(newItems);
      }
    },
    [items, onReorder, enabled]
  );

  // Move item down
  const moveItemDown = useCallback(
    (index) => {
      if (index >= items.length - 1 || !enabled) return;

      const newItems = [...items];
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];

      if (onReorder) {
        onReorder(newItems);
      }
    },
    [items, onReorder, enabled]
  );

  return {
    // State
    isDragging,
    dragIndex,
    dragOverIndex,

    // Prop getters
    getDragItemProps,
    getDragHandleProps,

    // Utility functions
    isDropTarget,
    isDragSource,
    moveItemUp,
    moveItemDown,

    // Raw handlers (for custom implementations)
    handlers: {
      handleDragStart,
      handleDragEnd,
      handleDragOver,
      handleDragEnter,
      handleDragLeave,
      handleDrop,
    },
  };
};

export default useDragReorder;

/**
 * Drag handle icon component (GripVertical)
 * Inline SVG to avoid additional dependencies
 */
export const DragHandleIcon = ({ size = 16, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <title>Drag handle</title>
    <circle cx="9" cy="5" r="1" fill="currentColor" />
    <circle cx="9" cy="12" r="1" fill="currentColor" />
    <circle cx="9" cy="19" r="1" fill="currentColor" />
    <circle cx="15" cy="5" r="1" fill="currentColor" />
    <circle cx="15" cy="12" r="1" fill="currentColor" />
    <circle cx="15" cy="19" r="1" fill="currentColor" />
  </svg>
);
