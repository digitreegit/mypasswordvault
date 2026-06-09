export const TOUCH_REORDER_HANDLE_CLASS = "touch-reorder-handle";
export const TOUCH_REORDER_ACTIVE_CLASS = "touch-reorder-active";

export type ListDropPosition = {
  id: string;
  position: "before" | "after";
};

/** Resolve drop target for a vertical touch/pointer drag over list rows. */
export function dropPositionFromPointer(
  clientY: number,
  draggedId: string,
  rowSelector: string,
  idAttribute = "data-category-id",
): ListDropPosition | null {
  const probeX = Math.min(
    window.innerWidth - 12,
    Math.max(12, window.innerWidth / 2),
  );
  const under = document.elementFromPoint(probeX, clientY);
  const row = under?.closest<HTMLElement>(rowSelector);
  if (!row) return null;

  const id = row.getAttribute(idAttribute);
  if (!id || id === draggedId) return null;

  const rect = row.getBoundingClientRect();
  const position: ListDropPosition["position"] =
    clientY - rect.top > rect.height / 2 ? "after" : "before";
  return { id, position };
}

export function setTouchReorderActive(active: boolean): void {
  document.documentElement.classList.toggle(TOUCH_REORDER_ACTIVE_CLASS, active);
}
