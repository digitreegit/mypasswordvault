import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

function reorderAfterTarget(
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
  next.splice(newTargetIdx + 1, 0, item);
  return next;
}

const DROP_LINE_CLASS =
  "pointer-events-none absolute left-1 right-1 z-10 h-0.5 rounded-full bg-ink-200";

function categoriesDraftDirty(
  draft: VaultCategory[],
  saved: VaultCategory[]
): boolean {
  const savedById = new Map(saved.map((c) => [c.id, c.name.trim()]));

  for (const c of draft) {
    const trimmed = c.name.trim();
    const original = savedById.get(c.id);
    if (original === undefined) {
      if (trimmed.length > 0) return true;
      continue;
    }
    if (trimmed !== original) return true;
  }

  const draftExistingIds = draft
    .filter((c) => savedById.has(c.id))
    .map((c) => c.id);
  const savedIds = saved.map((c) => c.id);
  return draftExistingIds.join("|") !== savedIds.join("|");
}

export function CategoriesDialog({
  onClose,
  startWithNewCategory = false,
}: {
  onClose: () => void;
  startWithNewCategory?: boolean;
}) {
  const { categories, setCategories, deleteCategory, t } = useVault();
  const [draft, setDraft] = useState<VaultCategory[]>(categories);
  const [busy, setBusy] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{
    id: string;
    position: "before" | "after";
  } | null>(null);
  const pendingFocusIdRef = useRef<string | null>(null);
  const seededNewRef = useRef(false);

  useEffect(() => {
    if (startWithNewCategory && !seededNewRef.current) {
      seededNewRef.current = true;
      const id = newId();
      pendingFocusIdRef.current = id;
      setDraft([...categories, { id, name: "" }]);
      return;
    }
    if (!startWithNewCategory) {
      seededNewRef.current = false;
      setDraft(categories);
    }
  }, [categories, startWithNewCategory]);

  useEffect(
    () => () => {
      seededNewRef.current = false;
    },
    [],
  );

  useLayoutEffect(() => {
    const id = pendingFocusIdRef.current;
    if (!id) return;
    pendingFocusIdRef.current = null;
    queueMicrotask(() => {
      document.getElementById(`category-name-${id}`)?.focus();
    });
  }, [draft]);

  const canSave = useMemo(
    () => categoriesDraftDirty(draft, categories),
    [draft, categories]
  );

  const deleteTarget = useMemo(
    () => (deleteTargetId ? draft.find((c) => c.id === deleteTargetId) : undefined),
    [deleteTargetId, draft],
  );

  useEffect(() => {
    if (!deleteTargetId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) setDeleteTargetId(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [deleteTargetId, busy]);

  async function confirmDelete() {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setBusy(true);
    try {
      if (categories.some((c) => c.id === id)) {
        await deleteCategory(id);
      }
      setDraft((prev) => prev.filter((c) => c.id !== id));
      setDeleteTargetId(null);
    } finally {
      setBusy(false);
    }
  }

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

  return createPortal(
    <>
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/40">
      <div
        className="card w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col shadow-lg"
        role="dialog"
        aria-labelledby="cat-dialog-title"
      >
        <div className="px-5 py-3 border-b border-ink-200">
          <div className="flex items-center justify-between gap-2">
            <h1
              id="cat-dialog-title"
              className="font-sans text-xl font-semibold text-ink-900 tracking-tight leading-tight"
            >
              {t("vault.categoriesTitle")}
            </h1>
            <button
              type="button"
              className="shrink-0 rounded-md px-2 py-1 text-sm font-medium text-ink-600 hover:bg-ink-100 hover:text-ink-900"
              onClick={onClose}
            >
              {t("common.close")}
            </button>
          </div>
        </div>
        <div className="px-5 py-3 overflow-y-auto flex-1 space-y-2">
          <p className="text-sm text-ink-600 leading-snug">{t("vault.categoriesHint")}</p>
          <p className="text-xs text-ink-500 leading-snug">{t("vault.dragToReorder")}</p>
          <ul className="space-y-2">
            {draft.map((c) => {
              const showDropLineBefore =
                dropIndicator?.id === c.id &&
                dropIndicator.position === "before" &&
                draggingId !== null &&
                draggingId !== c.id;
              const showDropLineAfter =
                dropIndicator?.id === c.id &&
                dropIndicator.position === "after" &&
                draggingId !== null &&
                draggingId !== c.id;
              return (
              <li
                key={c.id}
                className={[
                  "relative flex items-center gap-1.5 rounded-md border border-transparent px-0.5 py-0.5 transition-colors",
                  draggingId === c.id ? "opacity-50" : "",
                ].join(" ")}
                onDragOver={(e) => {
                  if (busy || !draggingId || draggingId === c.id) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  const rect = e.currentTarget.getBoundingClientRect();
                  const position =
                    e.clientY - rect.top > rect.height / 2 ? "after" : "before";
                  setDropIndicator({ id: c.id, position });
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                    setDropIndicator((cur) => (cur?.id === c.id ? null : cur));
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const draggedId = e.dataTransfer.getData("text/plain");
                  const position =
                    dropIndicator?.id === c.id ? dropIndicator.position : "before";
                  setDropIndicator(null);
                  setDraggingId(null);
                  if (!draggedId || draggedId === c.id) return;
                  setDraft((prev) =>
                    position === "after"
                      ? reorderAfterTarget(prev, draggedId, c.id)
                      : reorderBeforeTarget(prev, draggedId, c.id)
                  );
                }}
              >
                {showDropLineBefore ? (
                  <div className={`${DROP_LINE_CLASS} -top-1`} aria-hidden />
                ) : null}
                {showDropLineAfter ? (
                  <div className={`${DROP_LINE_CLASS} -bottom-1`} aria-hidden />
                ) : null}
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
                    setDropIndicator(null);
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
                  className="input flex-1 min-w-0 text-sm placeholder:text-ink-300 placeholder:font-normal"
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
                  onClick={() => setDeleteTargetId(c.id)}
                  disabled={busy}
                  title={t("vault.deleteCategory")}
                >
                  <Trash />
                </button>
              </li>
              );
            })}
          </ul>
        </div>
        <div className="px-5 py-3 border-t border-ink-100 flex items-center justify-between gap-2">
          <button
            type="button"
            className="btn-secondary text-sm shrink-0"
            disabled={busy}
            onClick={() => {
              const id = newId();
              pendingFocusIdRef.current = id;
              setDraft((d) => [...d, { id, name: "" }]);
            }}
          >
            {t("vault.addCategory")}
          </button>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
              {t("common.cancel")}
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => void save()}
              disabled={busy || !canSave}
            >
              {t("common.save")}
            </button>
          </div>
        </div>
      </div>
    </div>

    {deleteTarget ? (
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/40"
        role="presentation"
        onClick={() => {
          if (!busy) setDeleteTargetId(null);
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cat-delete-title"
          className="card w-full max-w-md shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-5 py-3 border-b border-ink-200">
            <h2
              id="cat-delete-title"
              className="font-sans text-lg font-semibold text-ink-900 tracking-tight leading-tight"
            >
              {t("vault.deleteCategory")}
            </h2>
          </div>
          <div className="px-5 py-4 space-y-3">
            <p className="text-sm text-ink-700 leading-snug">
              {t("vault.deleteCategoryConfirm")}
            </p>
            {deleteTarget.name.trim() ? (
              <p className="text-sm font-medium text-ink-900 leading-snug">
                {deleteTarget.name.trim()}
              </p>
            ) : null}
          </div>
          <div className="px-5 py-3 border-t border-ink-100 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <button
              type="button"
              className="btn-secondary text-sm w-full sm:w-auto"
              onClick={() => setDeleteTargetId(null)}
              disabled={busy}
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              className="btn-danger text-sm w-full sm:w-auto"
              disabled={busy}
              onClick={() => void confirmDelete()}
            >
              {t("vault.deleteCategoryConfirmAction")}
            </button>
          </div>
        </div>
      </div>
    ) : null}
    </>,
    document.body
  );
}
