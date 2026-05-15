import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useVault } from "../lib/vault";
import { newId, type VaultCategory } from "../lib/storage";
import { GripVertical, Trash } from "./Icons";

function reorderBeforeTarget(
  list: VaultCategory[],
  draggedId: string,
  targetId: string
): VaultCategory[] {
  if (draggedId === targetId) return list;
  const idxDrag = list.findIndex((x) => x.id === draggedId);
  const idxTarget = list.findIndex((x) => x.id === targetId);
  if (idxDrag === -1 || idxTarget === -1) return list;
  const item = list[idxDrag];
  const rest = list.filter((x) => x.id !== draggedId);
  const newTargetIdx = rest.findIndex((x) => x.id === targetId);
  if (newTargetIdx === -1) return list;
  const next = [...rest];
  next.splice(newTargetIdx, 0, item);
  return next;
}

export function CategoriesDialog({ onClose }: { onClose: () => void }) {
  const { categories, setCategories, deleteCategory, t } = useVault();
  const [draft, setDraft] = useState<VaultCategory[]>(categories);
  const [busy, setBusy] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const pendingFocusIdRef = useRef<string | null>(null);

  useEffect(() => {
    setDraft(categories);
  }, [categories]);

  useLayoutEffect(() => {
    const id = pendingFocusIdRef.current;
    if (!id) return;
    pendingFocusIdRef.current = null;
    queueMicrotask(() => {
      document.getElementById(`category-name-${id}`)?.focus();
    });
  }, [draft]);

  async function save() {
    setBusy(true);
    try {
      const trimmed = draft.map((c) => ({
        ...c,
        name: c.name.trim() || t("vault.newCategory"),
      }));
      await setCategories(trimmed);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm(t("vault.deleteCategoryConfirm"))) return;
    setBusy(true);
    try {
      await deleteCategory(id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40">
      <div
        className="card w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col shadow-lg"
        role="dialog"
        aria-labelledby="cat-dialog-title"
      >
        <div className="px-5 py-4 border-b border-ink-200 flex items-center justify-between gap-2">
          <h2 id="cat-dialog-title" className="text-lg font-semibold">
            {t("vault.categoriesTitle")}
          </h2>
          <button type="button" className="btn-ghost text-sm" onClick={onClose}>
            {t("common.cancel")}
          </button>
        </div>
        <div className="px-5 py-3 overflow-y-auto flex-1 space-y-2">
          <p className="text-sm text-ink-600 leading-snug">{t("vault.categoriesHint")}</p>
          <p className="text-xs text-ink-500 leading-snug">{t("vault.dragToReorder")}</p>
          <ul className="space-y-2">
            {draft.map((c) => (
              <li
                key={c.id}
                className={[
                  "flex items-center gap-1.5 rounded-md border border-transparent px-0.5 py-0.5 transition-colors",
                  draggingId === c.id ? "opacity-50" : "",
                  dragOverId === c.id && draggingId && draggingId !== c.id
                    ? "border-accent-300 bg-accent-50/60"
                    : "",
                ].join(" ")}
                onDragOver={(e) => {
                  if (busy || !draggingId || draggingId === c.id) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setDragOverId(c.id);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                    setDragOverId((cur) => (cur === c.id ? null : cur));
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const draggedId = e.dataTransfer.getData("text/plain");
                  setDragOverId(null);
                  setDraggingId(null);
                  if (!draggedId || draggedId === c.id) return;
                  setDraft((prev) => reorderBeforeTarget(prev, draggedId, c.id));
                }}
              >
                <span
                  draggable={!busy}
                  role="button"
                  tabIndex={0}
                  title={t("vault.dragToReorder")}
                  aria-label={t("vault.dragToReorder")}
                  className={[
                    "shrink-0 cursor-grab touch-none rounded p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-600 active:cursor-grabbing",
                    busy ? "cursor-not-allowed opacity-40" : "",
                  ].join(" ")}
                  onDragStart={(e) => {
                    if (busy) {
                      e.preventDefault();
                      return;
                    }
                    e.dataTransfer.setData("text/plain", c.id);
                    e.dataTransfer.effectAllowed = "move";
                    setDraggingId(c.id);
                  }}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setDragOverId(null);
                  }}
                  onKeyDown={(e) => {
                    if (busy) return;
                    const idx = draft.findIndex((x) => x.id === c.id);
                    if (idx === -1) return;
                    if (e.key === "ArrowUp" && idx > 0) {
                      e.preventDefault();
                      const prevId = draft[idx - 1].id;
                      setDraft((list) => reorderBeforeTarget(list, c.id, prevId));
                    } else if (e.key === "ArrowDown" && idx < draft.length - 1) {
                      e.preventDefault();
                      const below = draft[idx + 1];
                      const rest = draft.filter((x) => x.id !== c.id);
                      const belowIdx = rest.findIndex((x) => x.id === below.id);
                      const next = [...rest];
                      next.splice(belowIdx + 1, 0, draft[idx]);
                      setDraft(next);
                    }
                  }}
                >
                  <GripVertical />
                </span>
                <input
                  id={`category-name-${c.id}`}
                  className="input flex-1 min-w-0 text-sm placeholder:text-ink-400 placeholder:font-normal"
                  value={c.name}
                  placeholder={t("vault.newCategory")}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDraft((prev) =>
                      prev.map((x) => (x.id === c.id ? { ...x, name: v } : x))
                    );
                  }}
                  disabled={busy}
                  aria-label={t("vault.categoryName")}
                />
                <button
                  type="button"
                  className="btn-ghost p-2 text-ink-400 hover:text-red-600 shrink-0"
                  onClick={() => void onDelete(c.id)}
                  disabled={busy}
                  title={t("vault.deleteCategory")}
                >
                  <Trash />
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="btn-secondary text-sm w-full"
            disabled={busy}
            onClick={() => {
              const id = newId();
              pendingFocusIdRef.current = id;
              setDraft((d) => [...d, { id, name: "" }]);
            }}
          >
            {t("vault.addCategory")}
          </button>
        </div>
        <div className="px-5 py-3 border-t border-ink-100 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
            {t("common.cancel")}
          </button>
          <button type="button" className="btn-primary" onClick={() => void save()} disabled={busy}>
            {t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
