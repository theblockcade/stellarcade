import { useCallback, useMemo, useState } from "react";

export interface BulkSelectionState {
  selectedIds: Set<string>;
  selectedCount: number;
  isAllSelected: boolean;
  isSomeSelected: boolean;
}

export interface BulkSelectionActions {
  select: (id: string) => void;
  deselect: (id: string) => void;
  toggle: (id: string) => void;
  selectAll: (itemIds: string[]) => void;
  deselectAll: () => void;
  toggleAll: (itemIds: string[]) => void;
  selectMultiple: (ids: string[]) => void;
  deselectMultiple: (ids: string[]) => void;
  clear: () => void;
  isSelected: (id: string) => boolean;
}

export interface UseBulkSelectionOptions {
  initialSelectedIds?: string[];
  onSelectionChange?: (selectedIds: Set<string>) => void;
}

export function useBulkSelection(
  options: UseBulkSelectionOptions = {}
): { state: BulkSelectionState; actions: BulkSelectionActions } {
  const { initialSelectedIds = [], onSelectionChange } = options;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(initialSelectedIds)
  );

  const state = useMemo<BulkSelectionState>(
    () => ({
      selectedIds,
      selectedCount: selectedIds.size,
      isAllSelected: false,
      isSomeSelected: selectedIds.size > 0,
    }),
    [selectedIds]
  );

  const select = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        if (prev.has(id)) return prev;
        const next = new Set(prev);
        next.add(id);
        onSelectionChange?.(next);
        return next;
      });
    },
    [onSelectionChange]
  );

  const deselect = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        onSelectionChange?.(next);
        return next;
      });
    },
    [onSelectionChange]
  );

  const toggle = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        onSelectionChange?.(next);
        return next;
      });
    },
    [onSelectionChange]
  );

  const selectAll = useCallback(
    (itemIds: string[]) => {
      const next = new Set(itemIds);
      setSelectedIds(next);
      onSelectionChange?.(next);
    },
    [onSelectionChange]
  );

  const deselectAll = useCallback(() => {
    const next = new Set<string>();
    setSelectedIds(next);
    onSelectionChange?.(next);
  }, [onSelectionChange]);

  const toggleAll = useCallback(
    (itemIds: string[]) => {
      setSelectedIds((prev) => {
        const allSelected = itemIds.every((id) => prev.has(id));
        const next = allSelected ? new Set<string>() : new Set(itemIds);
        onSelectionChange?.(next);
        return next;
      });
    },
    [onSelectionChange]
  );

  const selectMultiple = useCallback(
    (ids: string[]) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.add(id));
        onSelectionChange?.(next);
        return next;
      });
    },
    [onSelectionChange]
  );

  const deselectMultiple = useCallback(
    (ids: string[]) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        onSelectionChange?.(next);
        return next;
      });
    },
    [onSelectionChange]
  );

  const clear = useCallback(() => {
    const next = new Set<string>();
    setSelectedIds(next);
    onSelectionChange?.(next);
  }, [onSelectionChange]);

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  const actions: BulkSelectionActions = {
    select,
    deselect,
    toggle,
    selectAll,
    deselectAll,
    toggleAll,
    selectMultiple,
    deselectMultiple,
    clear,
    isSelected,
  };

  return { state, actions };
}

export default useBulkSelection;
