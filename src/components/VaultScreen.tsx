import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpDownIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useCheckoutReturn } from "../hooks/useCheckoutReturn";
import { confirmCheckoutSession } from "../lib/confirmCheckoutSession";
import {
  clearCheckoutPending,
  finalizeCheckoutAfterPayment,
  isCheckoutPending,
  type CheckoutReturn,
} from "../lib/checkoutReturn";
import { useVault, type DecryptedEntry } from "../lib/vault";
import { newId, type VaultCategory } from "../lib/storage";
import { PasswordGenerator } from "./PasswordGenerator";
import { CategoriesDialog } from "./CategoriesDialog";
import { PricingDrawer } from "./PricingDrawer";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  Folder,
  Lock,
  Plus,
  Refresh,
  Shield,
  Trash,
  ExternalLink,
  Check,
} from "./Icons";
import { LanguageMenu } from "./LanguageMenu";
import { PlanBadge } from "./PlanBadge";
import { UserMenuDropdown } from "./UserMenuDropdown";
import { isAppError } from "../lib/errors";
import { useAuth } from "../lib/auth";

type SortKey = "category" | "site" | "username" | "updatedAt";

function emptyDraftEntry(id: string): DecryptedEntry {
  return {
    id,
    categoryId: "",
    site: "",
    url: "",
    username: "",
    password: "",
    notes: "",
    memo: "",
    updatedAt: Date.now(),
  };
}

/** After editing ends and the pointer leaves the row, wait before re-sorting. */
const ROW_UNPIN_DELAY_MS = 1000;

const ENTRY_LIMIT_BANNER_DISMISSED_KEY = "mpv_entry_limit_banner_dismissed";

function readEntryLimitBannerDismissed(userId?: string | null): boolean {
  if (typeof window === "undefined" || !userId) return false;
  return (
    window.localStorage.getItem(`${ENTRY_LIMIT_BANNER_DISMISSED_KEY}:${userId}`) ===
    "1"
  );
}

function entryCategoryLabel(
  categoryId: string,
  categories: VaultCategory[],
  t: TFn
): string {
  if (!categoryId) return t("vault.uncategorized");
  return categories.find((c) => c.id === categoryId)?.name ?? t("vault.uncategorized");
}

function filterEntriesByQuery(
  entries: DecryptedEntry[],
  query: string,
  categories: VaultCategory[]
): DecryptedEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return entries;
  const entryCategoryLabel = (e: DecryptedEntry): string => {
    if (!e.categoryId) return "";
    return categories.find((c) => c.id === e.categoryId)?.name ?? "";
  };
  return entries.filter(
    (e) =>
      e.site.toLowerCase().includes(q) ||
      e.url.toLowerCase().includes(q) ||
      e.username.toLowerCase().includes(q) ||
      e.notes.toLowerCase().includes(q) ||
      e.memo.toLowerCase().includes(q) ||
      entryCategoryLabel(e).toLowerCase().includes(q)
  );
}

function sortVaultEntries(
  entries: DecryptedEntry[],
  query: string,
  sortKey: SortKey,
  sortDir: "asc" | "desc",
  categories: VaultCategory[],
  draftEntryIds: string[],
  pinEntryIds: string[] = [],
  pinSnapshots?: Map<string, DecryptedEntry>
): DecryptedEntry[] {
  const arr = filterEntriesByQuery(entries, query, categories);
  const sortBucket = (e: DecryptedEntry): string => {
    if (!e.categoryId) return "";
    return categories.find((c) => c.id === e.categoryId)?.name ?? "\uFFFF";
  };
  const entryForSort = (e: DecryptedEntry): DecryptedEntry => {
    if (pinEntryIds.includes(e.id)) {
      const snap = pinSnapshots?.get(e.id);
      if (snap) return snap;
    }
    return e;
  };
  const compare = (a: DecryptedEntry, b: DecryptedEntry): number => {
    const sa = entryForSort(a);
    const sb = entryForSort(b);
    const dir = sortDir === "asc" ? 1 : -1;

    if (sortKey === "category") {
      const c0 = sortBucket(sa).localeCompare(sortBucket(sb), undefined, {
        sensitivity: "base",
      });
      const groupDir = sortDir === "asc" ? 1 : -1;
      if (c0 !== 0) return c0 * groupDir;
      return sa.site.localeCompare(sb.site, undefined, { sensitivity: "base" });
    }

    if (sortKey === "updatedAt") {
      if (sa.updatedAt < sb.updatedAt) return -1 * dir;
      if (sa.updatedAt > sb.updatedAt) return 1 * dir;
      return sa.site.localeCompare(sb.site, undefined, { sensitivity: "base" });
    }

    if (sortKey === "site") {
      const siteCmp = sa.site.localeCompare(sb.site, undefined, {
        sensitivity: "base",
      });
      if (siteCmp !== 0) return siteCmp * dir;
      return sa.username.localeCompare(sb.username, undefined, {
        sensitivity: "base",
      });
    }

    if (sortKey === "username") {
      const userCmp = sa.username.localeCompare(sb.username, undefined, {
        sensitivity: "base",
      });
      if (userCmp !== 0) return userCmp * dir;
      return sa.site.localeCompare(sb.site, undefined, { sensitivity: "base" });
    }

    return 0;
  };

  const topIds = draftEntryIds.filter((id, i, a) => a.indexOf(id) === i);
  const pinnedSet = new Set(topIds);
  const pinned = topIds
    .map((id) => arr.find((e) => e.id === id))
    .filter((e): e is DecryptedEntry => !!e);
  const sortable = arr.filter((e) => !pinnedSet.has(e.id));
  sortable.sort(compare);
  return [...pinned, ...sortable];
}

function orderEntriesByIds(
  arr: DecryptedEntry[],
  orderIds: string[]
): DecryptedEntry[] {
  const byId = new Map(arr.map((e) => [e.id, e]));
  const ordered: DecryptedEntry[] = [];
  const seen = new Set<string>();
  for (const id of orderIds) {
    const e = byId.get(id);
    if (e) {
      ordered.push(e);
      seen.add(id);
    }
  }
  for (const e of arr) {
    if (!seen.has(e.id)) ordered.push(e);
  }
  return ordered;
}

/** Re-sort after one row is saved; rows still being edited stay at their anchor index. */
function resortKeepingPinnedAnchors(
  entries: DecryptedEntry[],
  query: string,
  sortKey: SortKey,
  sortDir: "asc" | "desc",
  categories: VaultCategory[],
  draftEntryIds: string[],
  pinnedIds: string[],
  anchorOrder: string[]
): string[] {
  const sorted = sortVaultEntries(
    entries,
    query,
    sortKey,
    sortDir,
    categories,
    draftEntryIds
  ).map((e) => e.id);
  if (pinnedIds.length === 0) return sorted;

  const result = [...sorted];
  for (const pinId of pinnedIds) {
    const anchorIdx = anchorOrder.indexOf(pinId);
    const currentIdx = result.indexOf(pinId);
    if (anchorIdx === -1 || currentIdx === -1) continue;
    result.splice(currentIdx, 1);
    result.splice(Math.min(anchorIdx, result.length), 0, pinId);
  }
  return result;
}

type TFn = (key: string, vars?: Record<string, string | number>) => string;

function CategorySelect({
  value,
  categories,
  onChange,
  onAddCategory,
  className,
  onEditFocus,
  onEditBlur,
  onOpenChange,
  t,
}: {
  value: string;
  categories: VaultCategory[];
  onChange: (categoryId: string) => void;
  onAddCategory: () => void;
  className?: string;
  onEditFocus?: () => void;
  onEditBlur?: () => void;
  onOpenChange?: (open: boolean) => void;
  t: TFn;
}) {
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const label = useMemo(() => {
    if (!value) return t("vault.uncategorized");
    return categories.find((c) => c.id === value)?.name ?? t("vault.uncategorized");
  }, [value, categories, t]);

  const closeMenu = useCallback(() => {
    onOpenChange?.(false);
    setOpen(false);
    onEditBlur?.();
  }, [onEditBlur, onOpenChange]);

  const openMenu = useCallback(() => {
    onEditFocus?.();
    onOpenChange?.(true);
    setOpen(true);
  }, [onEditFocus, onOpenChange]);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;

    const updatePosition = () => {
      const rect = buttonRef.current!.getBoundingClientRect();
      const gap = 4;
      const minWidth = Math.max(rect.width, 176);
      let left = rect.left;
      if (left + minWidth > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - 8 - minWidth);
      }
      setPanelStyle({
        position: "fixed",
        top: rect.bottom + gap,
        left,
        minWidth,
        width: "max-content",
        maxWidth: Math.min(320, window.innerWidth - 16),
        zIndex: 9999,
        maxHeight: "min(16rem, 50vh)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      closeMenu();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, closeMenu]);

  function pick(categoryId: string) {
    onChange(categoryId);
    closeMenu();
  }

  function handleAdd(e: React.PointerEvent | React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onAddCategory();
    closeMenu();
  }

  const itemClass = (selected: boolean) =>
    [
      "block w-full whitespace-nowrap text-left px-3 py-2 text-sm transition-colors",
      selected ? "bg-ink-50 text-ink-900" : "text-ink-800 hover:bg-ink-50",
    ].join(" ");

  return (
    <div ref={rootRef} className="relative min-w-0 w-full">
      <button
        ref={buttonRef}
        type="button"
        className={`flex w-full items-center gap-1 text-left ${className ?? ""}`.trim()}
        onClick={() => {
          if (open) closeMenu();
          else openMenu();
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={
          !value ? `${t("vault.colCategory")}: ${t("vault.uncategorized")}` : t("vault.colCategory")
        }
      >
        <span className="min-w-0 flex-1 truncate flex items-center">
          {!value ? (
            <span
              className="inline-block h-px w-2.5 shrink-0 rounded-full bg-ink-300"
              aria-hidden
            />
          ) : (
            label
          )}
        </span>
        <ChevronDownIcon
          className="ml-1.5 h-3.5 w-3.5 shrink-0 text-ink-400"
          aria-hidden
        />
      </button>
      {open &&
        createPortal(
          <div
            ref={panelRef}
            role="listbox"
            aria-label={t("vault.colCategory")}
            style={panelStyle}
            className="rounded-lg border border-ink-200 bg-white shadow-lg"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1">
            <button
              type="button"
              role="option"
              aria-selected={!value}
              className={itemClass(!value)}
              onClick={() => pick("")}
            >
              {t("vault.uncategorized")}
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                role="option"
                aria-selected={value === c.id}
                className={itemClass(value === c.id)}
                onClick={() => pick(c.id)}
              >
                {c.name}
              </button>
            ))}
            </div>
            <div className="shrink-0 border-t border-ink-200 bg-white">
            <button
              type="button"
              className="block w-full whitespace-nowrap px-3 py-2.5 text-left text-sm font-medium text-ink-800 hover:bg-ink-50"
              onPointerDown={handleAdd}
            >
              {t("vault.addCategoryMenu")}
            </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

/** Sort dropdown: compact gray chevron toward the trailing edge */
const heroChevronSort =
  "pointer-events-none absolute right-2 top-1/2 h-4 w-4 shrink-0 -translate-y-1/2 text-ink-400";

const VAULT_PAGE = "max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8";
/** Figma toolbar: white pill buttons with light border */
const VAULT_TOOLBAR_BTN_PRIMARY =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-accent-600 bg-accent-600 px-3 py-2 min-h-[2.5rem] text-sm font-medium text-white shadow-sm hover:bg-accent-700 transition-colors disabled:opacity-50 disabled:pointer-events-none shrink-0";
const VAULT_TOOLBAR_BTN_ICON =
  "inline-flex items-center justify-center rounded-lg border border-ink-200 bg-white h-10 min-w-10 text-ink-600 shadow-sm hover:bg-ink-50 transition-colors shrink-0";

const VAULT_HEADER_ICON_BTN =
  "inline-flex h-8 w-8 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-600 hover:bg-ink-50 transition-colors shrink-0";

export function VaultScreen() {
  const { configured, user } = useAuth();
  const {
    entries,
    lock,
    upsertEntry,
    removeEntry,
    touchActivity,
    t,
    categories,
    atEntryLimit,
    freeEntryLimit,
    licensed,
    entitlementLoaded,
    refreshEntitlements,
    locale,
    setLocale,
  } = useVault();

  const [checkoutPolling, setCheckoutPolling] = useState(false);

  const onCheckoutReturn = useCallback(
    ({ result, sessionId }: { result: CheckoutReturn; sessionId: string | null }) => {
      if (result === "cancel") {
        clearCheckoutPending();
        return;
      }
      setCheckoutPolling(true);
      void finalizeCheckoutAfterPayment(
        refreshEntitlements,
        confirmCheckoutSession,
        sessionId,
      ).finally(() => {
        setCheckoutPolling(false);
      });
    },
    [refreshEntitlements],
  );

  const { checkoutFlash, dismissCheckoutFlash } =
    useCheckoutReturn(onCheckoutReturn);

  useEffect(() => {
    if (licensed && checkoutFlash === "success") {
      dismissCheckoutFlash();
    }
  }, [licensed, checkoutFlash, dismissCheckoutFlash]);

  const [query, setQuery] = useState("");
  const [mobileDetailId, setMobileDetailId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [generatorFor, setGeneratorFor] = useState<string | null>(null);
  const [showCategories, setShowCategories] = useState(false);
  const [categoriesStartWithNew, setCategoriesStartWithNew] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("category");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [entryLimitModalOpen, setEntryLimitModalOpen] = useState(false);
  const [pricingDrawerOpen, setPricingDrawerOpen] = useState(false);
  const [entryLimitBannerDismissed, setEntryLimitBannerDismissed] = useState(
    () => readEntryLimitBannerDismissed(user?.id)
  );
  const [entryLimitBannerEntered, setEntryLimitBannerEntered] = useState(false);
  /** Entry ids still being created — kept at top until edit session ends. */
  const [draftEntryIds, setDraftEntryIds] = useState<string[]>([]);
  /** Rows being edited — sort position frozen until pointer leaves and delay elapses. */
  const [pinEntryIds, setPinEntryIds] = useState<string[]>([]);
  /** Bumped when edit session ends so filtered list re-sorts reliably. */
  const [sortRevision, setSortRevision] = useState(0);
  const unpinTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  /** Sort snapshot taken when editing starts so field updates do not re-order the row. */
  const pinSortSnapshotsRef = useRef<Map<string, DecryptedEntry>>(new Map());
  /** Row id order frozen for the duration of an edit session. */
  const editDisplayOrderRef = useRef<string[] | null>(null);
  /** Synchronous mirror of pinEntryIds — avoids re-sort before React state flushes. */
  const pinEntryIdsRef = useRef<string[]>([]);
  /** Synchronous mirror of draftEntryIds. */
  const draftEntryIdsRef = useRef<string[]>([]);
  /** Latest entries for pin/unpin handlers outside render. */
  const entriesRef = useRef(entries);
  entriesRef.current = entries;
  draftEntryIdsRef.current = draftEntryIds;
  /** Entry id whose category dropdown is open (suppresses premature unpin). */
  const categoryMenuOpenEntryIdRef = useRef<string | null>(null);

  useEffect(() => {
    setEntryLimitBannerDismissed(readEntryLimitBannerDismissed(user?.id));
  }, [user?.id]);

  const cancelScheduledUnpin = useCallback((id: string) => {
    const timer = unpinTimersRef.current.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      unpinTimersRef.current.delete(id);
    }
  }, []);

  const shouldKeepRowPinned = useCallback((id: string): boolean => {
    if (categoryMenuOpenEntryIdRef.current === id) return true;
    const row = document.querySelector<HTMLElement>(
      `[data-vault-entry-id="${CSS.escape(id)}"]`
    );
    if (!row) return false;
    if (row.matches(":hover")) return true;
    if (row.contains(document.activeElement)) return true;
    return false;
  }, []);

  const registerCategoryMenuOpen = useCallback(
    (entryId: string, open: boolean) => {
      if (open) {
        categoryMenuOpenEntryIdRef.current = entryId;
        cancelScheduledUnpin(entryId);
      } else if (categoryMenuOpenEntryIdRef.current === entryId) {
        categoryMenuOpenEntryIdRef.current = null;
      }
    },
    [cancelScheduledUnpin]
  );

  const captureEditDisplayOrder = useCallback(() => {
    if (!editDisplayOrderRef.current) {
      editDisplayOrderRef.current = sortVaultEntries(
        entriesRef.current,
        query,
        sortKey,
        sortDir,
        categories,
        draftEntryIdsRef.current
      ).map((e) => e.id);
    }
  }, [query, sortKey, sortDir, categories]);

  const unpinEntry = useCallback(
    (id: string) => {
      const wasPinned = pinEntryIdsRef.current.includes(id);
      const wasDraft = draftEntryIdsRef.current.includes(id);
      if (!wasPinned && !wasDraft && !editDisplayOrderRef.current) return;

      if (wasPinned) {
        const next = pinEntryIdsRef.current.filter((x) => x !== id);
        pinEntryIdsRef.current = next;
        pinSortSnapshotsRef.current.delete(id);
        if (next.length === 0) {
          pinSortSnapshotsRef.current.clear();
        }
        setPinEntryIds(next);
      }

      const nextDraft = draftEntryIdsRef.current.filter((x) => x !== id);
      if (nextDraft.length !== draftEntryIdsRef.current.length) {
        draftEntryIdsRef.current = nextDraft;
        setDraftEntryIds(nextDraft);
      }

      const remainingPins = pinEntryIdsRef.current;
      const anchor = editDisplayOrderRef.current;

      if (remainingPins.length > 0 && anchor) {
        editDisplayOrderRef.current = resortKeepingPinnedAnchors(
          entriesRef.current,
          query,
          sortKey,
          sortDir,
          categories,
          nextDraft,
          remainingPins,
          anchor
        );
      } else {
        editDisplayOrderRef.current = null;
      }

      setSortRevision((r) => r + 1);
    },
    [query, sortKey, sortDir, categories]
  );

  const pinEntryRow = useCallback(
    (id: string) => {
      cancelScheduledUnpin(id);
      if (!pinSortSnapshotsRef.current.has(id)) {
        const entry = entriesRef.current.find((e) => e.id === id);
        if (entry) pinSortSnapshotsRef.current.set(id, { ...entry });
      }
      captureEditDisplayOrder();
      if (!pinEntryIdsRef.current.includes(id)) {
        pinEntryIdsRef.current = [...pinEntryIdsRef.current, id];
        setPinEntryIds([...pinEntryIdsRef.current]);
      }
    },
    [cancelScheduledUnpin, captureEditDisplayOrder]
  );

  const scheduleUnpinRow = useCallback(
    (id: string) => {
      cancelScheduledUnpin(id);
      const timer = setTimeout(() => {
        unpinTimersRef.current.delete(id);
        if (shouldKeepRowPinned(id)) return;
        unpinEntry(id);
      }, ROW_UNPIN_DELAY_MS);
      unpinTimersRef.current.set(id, timer);
    },
    [cancelScheduledUnpin, unpinEntry, shouldKeepRowPinned]
  );

  useEffect(() => {
    return () => {
      for (const timer of unpinTimersRef.current.values()) clearTimeout(timer);
      unpinTimersRef.current.clear();
    };
  }, []);

  const filtered = useMemo(() => {
    const arr = filterEntriesByQuery(entries, query, categories);
    const hasActivePins = pinEntryIdsRef.current.length > 0;

    if (hasActivePins) {
      if (!editDisplayOrderRef.current) {
        editDisplayOrderRef.current = sortVaultEntries(
          entries,
          query,
          sortKey,
          sortDir,
          categories,
          draftEntryIds
        ).map((e) => e.id);
      }
      return orderEntriesByIds(arr, editDisplayOrderRef.current);
    }

    return sortVaultEntries(
      entries,
      query,
      sortKey,
      sortDir,
      categories,
      draftEntryIds
    );
  }, [entries, query, sortKey, sortDir, categories, draftEntryIds, pinEntryIds, sortRevision]);

  const categorySummaryParts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of filtered) {
      const validId =
        e.categoryId && categories.some((c) => c.id === e.categoryId)
          ? e.categoryId
          : "";
      counts.set(validId, (counts.get(validId) ?? 0) + 1);
    }
    const parts: string[] = [];
    for (const c of categories) {
      const n = counts.get(c.id) ?? 0;
      if (n > 0) parts.push(`${c.name}: ${n}`);
    }
    const unc = counts.get("") ?? 0;
    if (unc > 0) {
      parts.push(`${t("vault.summaryUncategorized")}: ${unc}`);
    }
    return parts;
  }, [filtered, categories, t]);

  const mobileDetailEntry = useMemo(() => {
    if (!mobileDetailId) return null;
    const found = entries.find((e) => e.id === mobileDetailId);
    if (found) return found;
    if (draftEntryIds.includes(mobileDetailId)) {
      return emptyDraftEntry(mobileDetailId);
    }
    return null;
  }, [entries, mobileDetailId, draftEntryIds]);

  useEffect(() => {
    if (
      mobileDetailId &&
      !entries.some((e) => e.id === mobileDetailId) &&
      !draftEntryIds.includes(mobileDetailId)
    ) {
      setMobileDetailId(null);
    }
  }, [entries, mobileDetailId, draftEntryIds]);

  useEffect(() => {
    if (!mobileDetailId) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileDetailId]);

  function toggleReveal(id: string) {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function copyText(text: string, key: string) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((cur) => (cur === key ? null : cur));
      }, 1200);
      if (key.startsWith("pw:")) {
        setTimeout(async () => {
          try {
            const current = await navigator.clipboard.readText();
            if (current === text) {
              await navigator.clipboard.writeText("");
            }
          } catch {
            /* ignore */
          }
        }, 20_000);
      }
    } catch {
      /* ignore */
    }
    touchActivity();
  }

  useEffect(() => {
    if (!mobileDetailId) return;
    pinEntryRow(mobileDetailId);
  }, [mobileDetailId, pinEntryRow]);

  async function addEntry() {
    const id = newId();
    const nextDraft = [id, ...draftEntryIdsRef.current.filter((x) => x !== id)];
    draftEntryIdsRef.current = nextDraft;
    setDraftEntryIds(nextDraft);
    setMobileDetailId(id);
    try {
      await upsertEntry({
        id,
        categoryId: "",
        site: "",
        url: "",
        username: "",
        password: "",
        notes: "",
        memo: "",
      });
      pinEntryRow(id);
    } catch (e) {
      const without = draftEntryIdsRef.current.filter((x) => x !== id);
      draftEntryIdsRef.current = without;
      setDraftEntryIds(without);
      setMobileDetailId((cur) => (cur === id ? null : cur));
      if (isAppError(e) && e.code === "errors.entryLimitReached") {
        setEntryLimitModalOpen(true);
        return;
      }
      console.error(e);
    }
  }

  async function handleRemoveEntry(id: string) {
    const without = draftEntryIdsRef.current.filter((x) => x !== id);
    draftEntryIdsRef.current = without;
    setDraftEntryIds(without);
    setMobileDetailId((cur) => (cur === id ? null : cur));
    cancelScheduledUnpin(id);
    unpinEntry(id);
    await removeEntry(id);
  }

  function toggleSort(k: SortKey) {
    editDisplayOrderRef.current = null;
    setSortRevision((r) => r + 1);
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir(k === "updatedAt" ? "desc" : "asc");
    }
  }

  const awaitingLicenseAfterPay =
    (checkoutFlash === "success" || isCheckoutPending() || checkoutPolling) &&
    !licensed &&
    entitlementLoaded;
  const showEntryLimitBanner =
    atEntryLimit &&
    !licensed &&
    !entryLimitBannerDismissed &&
    !awaitingLicenseAfterPay;
  const showHeaderUpgrade =
    atEntryLimit && !licensed && entitlementLoaded && !awaitingLicenseAfterPay;

  useEffect(() => {
    if (!showEntryLimitBanner) {
      setEntryLimitBannerEntered(false);
      return;
    }
    const id = requestAnimationFrame(() => setEntryLimitBannerEntered(true));
    return () => cancelAnimationFrame(id);
  }, [showEntryLimitBanner]);

  function openPricingDrawer(e?: React.MouseEvent) {
    e?.preventDefault();
    setPricingDrawerOpen(true);
  }

  function dismissEntryLimitBanner() {
    setEntryLimitBannerDismissed(true);
    if (user?.id) {
      window.localStorage.setItem(
        `${ENTRY_LIMIT_BANNER_DISMISSED_KEY}:${user.id}`,
        "1"
      );
    }
  }

  const openCategoriesAddNew = useCallback(() => {
    if (mobileDetailId) {
      cancelScheduledUnpin(mobileDetailId);
      pinEntryRow(mobileDetailId);
      registerCategoryMenuOpen(mobileDetailId, true);
    }
    setCategoriesStartWithNew(true);
    setShowCategories(true);
  }, [mobileDetailId, cancelScheduledUnpin, pinEntryRow, registerCategoryMenuOpen]);

  const closeCategoriesDialog = useCallback(() => {
    setShowCategories(false);
    setCategoriesStartWithNew(false);
    if (mobileDetailId) {
      registerCategoryMenuOpen(mobileDetailId, false);
    }
  }, [mobileDetailId, registerCategoryMenuOpen]);

  const openPasswordGenerator = useCallback(
    (entryId: string) => {
      cancelScheduledUnpin(entryId);
      pinEntryRow(entryId);
      registerCategoryMenuOpen(entryId, true);
      setGeneratorFor(entryId);
    },
    [cancelScheduledUnpin, pinEntryRow, registerCategoryMenuOpen]
  );

  const closePasswordGenerator = useCallback(() => {
    const entryId = generatorFor;
    setGeneratorFor(null);
    if (entryId) {
      registerCategoryMenuOpen(entryId, false);
    }
  }, [generatorFor, registerCategoryMenuOpen]);

  return (
    <div
      className="min-h-screen min-h-[100dvh] flex flex-col bg-white"
      onMouseMove={touchActivity}
      onTouchStart={touchActivity}
      onKeyDown={touchActivity}
    >
      <div className="sticky top-0 z-10 w-full">
        {awaitingLicenseAfterPay ? (
          <div
            role="status"
            className="border-b border-accent-200 bg-accent-50 px-4 py-2.5 sm:px-6"
          >
            <p className={`${VAULT_PAGE} text-sm text-accent-900 leading-snug`}>
              {t("vault.checkoutActivating")}
            </p>
          </div>
        ) : null}
        {checkoutFlash ? (
          <div
            role="status"
            className={`border-b px-4 py-2.5 sm:px-6 ${
              checkoutFlash === "success"
                ? "border-emerald-200 bg-emerald-50"
                : "border-ink-200 bg-ink-50"
            }`}
          >
            <div className={`${VAULT_PAGE} flex items-start gap-2`}>
              <p
                className={`min-w-0 flex-1 text-sm leading-snug ${
                  checkoutFlash === "success"
                    ? "text-emerald-900"
                    : "text-ink-700"
                }`}
              >
                {checkoutFlash === "success"
                  ? t("pricing.checkoutSuccess")
                  : t("pricing.checkoutCancel")}
              </p>
              <button
                type="button"
                className="shrink-0 rounded-md p-1 text-ink-500 hover:bg-black/5 hover:text-ink-800"
                onClick={dismissCheckoutFlash}
                aria-label={t("vault.entryLimitModalClose")}
              >
                <XMarkIcon className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        ) : null}
        {showEntryLimitBanner && (
          <div className="overflow-hidden">
            <div
              role="status"
              className={`vault-entry-limit-banner pt-[env(safe-area-inset-top,0px)] transition-transform duration-300 ease-out ${
                entryLimitBannerEntered ? "translate-y-0" : "-translate-y-full"
              }`}
            >
            <div
              className={`${VAULT_PAGE} flex items-center gap-2 py-1.5 sm:py-2`}
            >
              <div className="flex min-w-0 flex-1 items-start gap-2">
                <InformationCircleIcon
                  className="vault-entry-limit-banner__icon mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden
                />
                <p className="vault-entry-limit-banner__text min-w-0 flex-1 break-words text-xs leading-snug sm:text-sm">
                  {t("vault.entryLimitBanner", { limit: freeEntryLimit })}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  className="vault-entry-limit-banner__cta"
                  onClick={openPricingDrawer}
                >
                  {t("vault.entryLimitUpgrade")}
                </button>
                <button
                  type="button"
                  className="vault-entry-limit-banner__close"
                  onClick={dismissEntryLimitBanner}
                  aria-label={t("vault.entryLimitBannerDismiss")}
                >
                  <XMarkIcon className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
            </div>
          </div>
        )}
        <header
          className={`w-full bg-white ${
            showEntryLimitBanner
              ? ""
              : "pt-[max(0.375rem,env(safe-area-inset-top))]"
          }`}
        >
          <div className="w-full border-b border-ink-200">
            <div
              className={`${VAULT_PAGE} flex items-center justify-between gap-3 py-1 sm:py-1.5`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Shield className="w-7 h-auto text-accent-500 shrink-0" />
                <span
                  className="font-brand font-semibold text-base sm:text-[1.0625rem] text-ink-900 tracking-tight truncate leading-none -translate-y-0.5"
                  translate="no"
                >
                  {t("app.brandName")}
                </span>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                {configured && user?.id ? (
                  <>
                    {showHeaderUpgrade ? (
                      <button
                        type="button"
                        className="vault-header-upgrade-btn"
                        onClick={openPricingDrawer}
                      >
                        {t("vault.entryLimitUpgrade")}
                      </button>
                    ) : null}
                    {entitlementLoaded ? (
                      <PlanBadge
                        label={
                          licensed
                            ? t("vault.licenseBadgePro")
                            : t("vault.licenseBadgeFree")
                        }
                      />
                    ) : (
                      <span
                        className="h-[1.375rem] w-[2.75rem] rounded-full bg-ink-100 animate-pulse shrink-0"
                        aria-hidden
                      />
                    )}
                  </>
                ) : null}
                <UserMenuDropdown />
                <LanguageMenu
                  value={locale}
                  onChange={(l) => void setLocale(l)}
                  ariaLabel={t("settings.language")}
                  align="right"
                  triggerClassName={VAULT_HEADER_ICON_BTN}
                />
              </div>
            </div>
          </div>
        </header>
      </div>

      <main className="flex-1 min-w-0 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className={`${VAULT_PAGE} pt-3 pb-5 sm:pt-4 sm:pb-6`}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4 mb-1">
          <div className="relative w-full md:hidden">
            <MagnifyingGlassIcon
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
              aria-hidden
            />
            <input
              className="input w-full pl-9 shadow-sm"
              placeholder={t("vault.searchPlaceholder")}
              title={t("vault.search")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              enterKeyHint="search"
            />
          </div>
          <div className="relative hidden md:block w-full min-w-0 md:w-[25rem] md:max-w-[25rem] shrink-0">
            <MagnifyingGlassIcon
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
              aria-hidden
            />
            <input
              className="input w-full pl-9 shadow-sm"
              placeholder={t("vault.searchPlaceholder")}
              title={t("vault.search")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              enterKeyHint="search"
            />
          </div>
          <div className="md:hidden flex w-full flex-col gap-0 mb-1.5">
            <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-x-2 items-center">
            <div className="col-start-1 flex items-center gap-2 min-w-0">
              <label
                className="text-xs font-medium text-ink-600 shrink-0"
                htmlFor="vault-mobile-sort"
              >
                {t("vault.sortBy")}
              </label>
              <div className="relative min-w-0 flex-1">
                <select
                  id="vault-mobile-sort"
                  className="input w-full appearance-none py-1.5 pl-3 pr-9 text-sm min-w-0"
                  value={sortKey}
                  onChange={(e) => {
                    const k = e.target.value as SortKey;
                    editDisplayOrderRef.current = null;
                    setSortRevision((r) => r + 1);
                    setSortKey(k);
                    setSortDir(k === "updatedAt" ? "desc" : "asc");
                  }}
                >
                  <option value="updatedAt">{t("vault.sortRecent")}</option>
                  <option value="category">{t("vault.colCategory")}</option>
                  <option value="site">{t("vault.colSite")}</option>
                </select>
                <ChevronDownIcon className={heroChevronSort} aria-hidden />
              </div>
              <button
                type="button"
                className="btn-secondary text-sm px-2.5 min-w-[2.5rem] shrink-0 touch-manipulation"
                onClick={() => {
                  editDisplayOrderRef.current = null;
                  setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                  setSortRevision((r) => r + 1);
                }}
                aria-label={sortDir === "asc" ? "Ascending" : "Descending"}
              >
                <ChevronUpDownIcon className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="col-start-2 flex items-center gap-2 shrink-0">
              <button
                type="button"
                className={VAULT_TOOLBAR_BTN_ICON}
                onClick={() => {
                  setCategoriesStartWithNew(false);
                  setShowCategories(true);
                }}
                title={t("vault.manageCategories")}
                aria-label={t("vault.manageCategories")}
              >
                <Folder />
              </button>
              <button
                type="button"
                className={VAULT_TOOLBAR_BTN_PRIMARY}
                onClick={addEntry}
                disabled={atEntryLimit}
                title={t("vault.addRow")}
                aria-label={t("vault.addRow")}
              >
                <Plus />
                <span>{t("vault.addShort")}</span>
              </button>
              <button
                type="button"
                className={VAULT_TOOLBAR_BTN_ICON}
                onClick={lock}
                title={t("vault.lock")}
                aria-label={t("vault.lock")}
              >
                <Lock />
              </button>
            </div>
            </div>
            <p className="mt-2 mb-1 w-full min-w-0 text-left text-xs text-ink-500 tabular-nums leading-snug break-words">
              {t("vault.totalItems", { count: filtered.length })}
              {categorySummaryParts.length > 0 && (
                <span>{` (${categorySummaryParts.join(", ")})`}</span>
              )}
            </p>
          </div>
          <div className="hidden md:flex w-full items-center gap-2 ml-auto w-auto justify-end">
            <button
              type="button"
              className={VAULT_TOOLBAR_BTN_ICON}
              onClick={() => setShowAll((v) => !v)}
              title={t("vault.ttPasswords")}
              aria-label={showAll ? t("vault.maskAll") : t("vault.revealAll")}
            >
              {showAll ? <EyeOff /> : <Eye />}
            </button>
            <button
              type="button"
              className={VAULT_TOOLBAR_BTN_ICON}
              onClick={() => {
                setCategoriesStartWithNew(false);
                setShowCategories(true);
              }}
              title={t("vault.manageCategories")}
              aria-label={t("vault.manageCategories")}
            >
              <Folder />
            </button>
            <button
              type="button"
              className={VAULT_TOOLBAR_BTN_PRIMARY}
              onClick={addEntry}
              disabled={atEntryLimit}
              title={t("vault.addRow")}
              aria-label={t("vault.addRow")}
            >
              <Plus />
              <span>{t("vault.addShort")}</span>
            </button>
            <button
              type="button"
              className={VAULT_TOOLBAR_BTN_ICON}
              onClick={lock}
              title={t("vault.lock")}
              aria-label={t("vault.lock")}
            >
              <Lock />
            </button>
          </div>
        </div>
        <p className="hidden md:block mt-2 sm:mt-2.5 mb-1 text-right text-xs text-ink-500 tabular-nums leading-snug">
          {t("vault.totalItems", { count: filtered.length })}
          {categorySummaryParts.length > 0 && (
            <span>{` (${categorySummaryParts.join(", ")})`}</span>
          )}
        </p>

        <ul className="md:hidden space-y-3 list-none p-0 m-0">
          {filtered.length === 0 ? (
            <li className="card rounded-lg p-8 text-center text-ink-500 text-sm">
              {t("vault.empty")}{" "}
              <button
                type="button"
                className="text-accent-600 hover:underline disabled:opacity-50 disabled:pointer-events-none"
                onClick={addEntry}
                disabled={atEntryLimit}
              >
                {t("vault.emptyCta")}
              </button>
            </li>
          ) : (
            filtered.map((e) => (
              <li key={e.id}>
                <MobileEntryRow
                  entry={e}
                  categories={categories}
                  onOpen={() => setMobileDetailId(e.id)}
                  t={t}
                />
              </li>
            ))
          )}
        </ul>

        {mobileDetailEntry ? (
          <MobileEntryDetail
            entry={mobileDetailEntry}
            onClose={() => {
              cancelScheduledUnpin(mobileDetailEntry.id);
              unpinEntry(mobileDetailEntry.id);
              setMobileDetailId(null);
            }}
            revealed={showAll || revealed.has(mobileDetailEntry.id)}
            toggleReveal={() => toggleReveal(mobileDetailEntry.id)}
            onChange={(patch) =>
              upsertEntry({ id: mobileDetailEntry.id, ...patch })
            }
            onDelete={() => void handleRemoveEntry(mobileDetailEntry.id)}
            onGenerate={() => openPasswordGenerator(mobileDetailEntry.id)}
            onCopy={copyText}
            copiedKey={copiedKey}
            categories={categories}
            onPinEntryRow={pinEntryRow}
            onScheduleUnpinEntryRow={scheduleUnpinRow}
            onCancelScheduledUnpinEntryRow={cancelScheduledUnpin}
            onRegisterCategoryMenuOpen={registerCategoryMenuOpen}
            onOpenCategoriesAddNew={openCategoriesAddNew}
            t={t}
          />
        ) : null}

        <div className="overflow-hidden rounded-lg border border-ink-200 bg-white shadow-sm hidden md:block">
          <div className="overflow-x-auto overscroll-x-contain">
            <table className="w-full text-sm min-w-[48rem]">
              <colgroup>
                <col style={{ width: "10%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "24%" }} />
                <col style={{ width: "34%" }} />
                <col style={{ width: "12%" }} />
              </colgroup>
              <thead className="border-b border-ink-200 bg-white text-ink-400 text-xs">
                <tr className="text-left">
                  <Th
                    onClick={() => toggleSort("category")}
                    active={sortKey === "category"}
                    dir={sortDir}
                  >
                    {t("vault.colCategory")}
                  </Th>
                  <Th
                    onClick={() => toggleSort("site")}
                    active={sortKey === "site"}
                    dir={sortDir}
                  >
                    {t("vault.colSite")}
                  </Th>
                  <Th
                    onClick={() => toggleSort("username")}
                    active={sortKey === "username"}
                    dir={sortDir}
                  >
                    {t("vault.colUser")}
                  </Th>
                  <th className="px-3 py-1 sm:px-4 font-medium">
                    {t("vault.colPass")}
                  </th>
                  <th className="pl-3 pr-4 sm:pr-5 py-1 font-medium text-right">
                    {t("vault.colAction")}
                  </th>
                </tr>
              </thead>
              {filtered.length === 0 ? (
                <tbody>
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-16 text-ink-500"
                    >
                      {t("vault.empty")}{" "}
                      <button
                        type="button"
                        className="text-accent-600 hover:underline disabled:opacity-50 disabled:pointer-events-none"
                        onClick={addEntry}
                        disabled={atEntryLimit}
                      >
                        {t("vault.emptyCta")}
                      </button>
                    </td>
                  </tr>
                </tbody>
              ) : (
                filtered.map((e) => (
                  <Row
                    key={e.id}
                    entry={e}
                    expanded={expandedIds.has(e.id)}
                    onToggleExpand={() => toggleExpanded(e.id)}
                    revealed={showAll || revealed.has(e.id)}
                    toggleReveal={() => toggleReveal(e.id)}
                    onChange={(patch) => upsertEntry({ id: e.id, ...patch })}
                    onDelete={() => void handleRemoveEntry(e.id)}
                    onGenerate={() => openPasswordGenerator(e.id)}
                    onCopy={copyText}
                    copiedKey={copiedKey}
                    categories={categories}
                    onPinEntryRow={pinEntryRow}
                    onScheduleUnpinEntryRow={scheduleUnpinRow}
                    onCancelScheduledUnpinEntryRow={cancelScheduledUnpin}
                    onRegisterCategoryMenuOpen={registerCategoryMenuOpen}
                    onOpenCategoriesAddNew={openCategoriesAddNew}
                    t={t}
                  />
                ))
              )}
            </table>
          </div>
        </div>

        <p className="w-full text-left text-xs text-ink-400 leading-normal mt-2 sm:mt-4">
          {t("vault.footer")}
        </p>
        </div>
      </main>

      {generatorFor && (
        <PasswordGenerator
          onClose={closePasswordGenerator}
          onUse={async (pw) => {
            await upsertEntry({ id: generatorFor, password: pw });
            closePasswordGenerator();
          }}
        />
      )}
      {entryLimitModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45"
          role="presentation"
          onClick={() => setEntryLimitModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="vault-entry-limit-title"
            className="w-full max-w-md rounded-xl border border-ink-200 bg-white shadow-xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex gap-3">
              <InformationCircleIcon
                className="h-6 w-6 shrink-0 text-ink-500"
                aria-hidden
              />
              <div className="min-w-0 space-y-2">
                <h2
                  id="vault-entry-limit-title"
                  className="text-base font-semibold text-ink-900 leading-snug"
                >
                  {t("vault.entryLimitModalTitle")}
                </h2>
                <p className="text-sm text-ink-600 leading-snug">
                  {t("vault.entryLimitModalBody", { limit: freeEntryLimit })}
                </p>
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-1">
              <button
                type="button"
                className="btn-secondary text-sm w-full sm:w-auto"
                onClick={() => setEntryLimitModalOpen(false)}
              >
                {t("vault.entryLimitModalClose")}
              </button>
              <button
                type="button"
                className="btn-primary text-sm w-full sm:w-auto"
                onClick={() => {
                  setEntryLimitModalOpen(false);
                  setPricingDrawerOpen(true);
                }}
              >
                {t("vault.entryLimitModalCta")}
              </button>
            </div>
          </div>
        </div>
      )}
      {showCategories && (
        <CategoriesDialog
          onClose={closeCategoriesDialog}
          startWithNewCategory={categoriesStartWithNew}
        />
      )}
      <PricingDrawer
        open={pricingDrawerOpen}
        onClose={() => setPricingDrawerOpen(false)}
      />
    </div>
  );
}

interface RowProps {
  entry: DecryptedEntry;
  categories: VaultCategory[];
  expanded: boolean;
  onToggleExpand: () => void;
  revealed: boolean;
  toggleReveal: () => void;
  onChange: (patch: Partial<DecryptedEntry>) => void;
  onDelete: () => void;
  onGenerate: () => void;
  onCopy: (text: string, key: string) => void;
  copiedKey: string | null;
  onPinEntryRow: (id: string) => void;
  onScheduleUnpinEntryRow: (id: string) => void;
  onCancelScheduledUnpinEntryRow: (id: string) => void;
  onRegisterCategoryMenuOpen: (entryId: string, open: boolean) => void;
  onOpenCategoriesAddNew: () => void;
  t: TFn;
}

function useEntryRowEdit(
  entryId: string,
  rowRef: React.RefObject<HTMLElement | null>,
  onPinEntryRow: (id: string) => void,
  onScheduleUnpinEntryRow: (id: string) => void,
  onCancelScheduledUnpinEntryRow: (id: string) => void,
  onRegisterCategoryMenuOpen: (entryId: string, open: boolean) => void
) {
  const categoryMenuOpenRef = useRef(false);

  const onEditFocus = useCallback(() => {
    onPinEntryRow(entryId);
  }, [entryId, onPinEntryRow]);

  const onEditBlur = useCallback(() => {
    /* Re-sort is deferred until the pointer leaves the row (see onRowMouseLeave). */
  }, []);

  const onRowMouseLeave = useCallback(() => {
    if (categoryMenuOpenRef.current) return;
    onScheduleUnpinEntryRow(entryId);
  }, [entryId, onScheduleUnpinEntryRow]);

  const onRowMouseEnter = useCallback(() => {
    onCancelScheduledUnpinEntryRow(entryId);
    onPinEntryRow(entryId);
  }, [entryId, onCancelScheduledUnpinEntryRow, onPinEntryRow]);

  const onCategoryOpenChange = useCallback(
    (open: boolean) => {
      categoryMenuOpenRef.current = open;
      onRegisterCategoryMenuOpen(entryId, open);
      if (open) {
        onPinEntryRow(entryId);
      } else {
        requestAnimationFrame(() => {
          if (categoryMenuOpenRef.current) return;
          if (rowRef.current?.matches(":hover")) return;
          onScheduleUnpinEntryRow(entryId);
        });
      }
    },
    [
      entryId,
      onPinEntryRow,
      onRegisterCategoryMenuOpen,
      onScheduleUnpinEntryRow,
      rowRef,
    ]
  );

  return {
    onEditFocus,
    onEditBlur,
    onRowMouseLeave,
    onRowMouseEnter,
    onCategoryOpenChange,
  };
}

function MobileEntryRow({
  entry,
  categories,
  onOpen,
  t,
}: {
  entry: DecryptedEntry;
  categories: VaultCategory[];
  onOpen: () => void;
  t: TFn;
}) {
  const catLabel = entry.categoryId
    ? entryCategoryLabel(entry.categoryId, categories, t)
    : null;
  const siteLabel = entry.site.trim() || t("vault.newEntry");

  return (
    <button
      type="button"
      className="w-full rounded-xl border border-ink-200 bg-white px-3 py-3 flex items-center gap-2.5 text-left shadow-sm active:bg-ink-50 touch-manipulation"
      onClick={onOpen}
    >
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <span className="text-xs font-medium text-ink-500 truncate flex items-center min-h-[1rem]">
          {catLabel ?? (
            <span
              className="inline-block h-px w-2.5 shrink-0 rounded-full bg-ink-300"
              aria-hidden
            />
          )}
        </span>
        <span className="font-medium text-ink-900 truncate">{siteLabel}</span>
      </div>
      <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-400" aria-hidden />
    </button>
  );
}

function MobileEntryDetail({
  entry,
  onClose,
  categories,
  revealed,
  toggleReveal,
  onChange,
  onDelete,
  onGenerate,
  onCopy,
  copiedKey,
  onPinEntryRow,
  onScheduleUnpinEntryRow,
  onCancelScheduledUnpinEntryRow,
  onRegisterCategoryMenuOpen,
  onOpenCategoriesAddNew,
  t,
}: Omit<RowProps, "expanded" | "onToggleExpand"> & { onClose: () => void }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const {
    onEditFocus,
    onEditBlur,
    onRowMouseLeave,
    onRowMouseEnter,
    onCategoryOpenChange,
  } = useEntryRowEdit(
    entry.id,
    rowRef,
    onPinEntryRow,
    onScheduleUnpinEntryRow,
    onCancelScheduledUnpinEntryRow,
    onRegisterCategoryMenuOpen
  );

  const siteLabel = entry.site.trim() || t("vault.newEntry");

  return createPortal(
    <div
      ref={rowRef}
      data-vault-entry-id={entry.id}
      className="fixed inset-0 z-50 flex flex-col bg-white md:hidden"
      onMouseEnter={onRowMouseEnter}
      onMouseLeave={onRowMouseLeave}
    >
      <header className="shrink-0 flex items-center gap-2 border-b border-ink-200 px-3 py-2.5 pt-[max(0.625rem,env(safe-area-inset-top))]">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg p-2 text-ink-600 hover:bg-ink-100 touch-manipulation shrink-0"
          onClick={onClose}
          aria-label={t("vault.mobileBack")}
        >
          <ChevronLeftIcon className="h-5 w-5" aria-hidden />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-ink-500 truncate">
            {entryCategoryLabel(entry.categoryId, categories, t)}
          </p>
          <p className="font-semibold text-ink-900 truncate">{siteLabel}</p>
        </div>
        <div className="shrink-0">
          {!confirmDel ? (
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg p-2 text-ink-400 hover:text-red-600 hover:bg-red-50 touch-manipulation min-w-9 min-h-9"
              onClick={() => setConfirmDel(true)}
              title={t("vault.ttDelete")}
              aria-label={t("vault.ttDelete")}
            >
              <Trash />
            </button>
            ) : (
            <div className="inline-flex shrink-0 flex-nowrap items-center gap-1 whitespace-nowrap">
              <button
                type="button"
                className="shrink-0 whitespace-nowrap text-xs text-ink-500 hover:text-ink-700 px-2 py-1.5 touch-manipulation"
                onClick={() => setConfirmDel(false)}
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                className="shrink-0 whitespace-nowrap text-xs text-red-600 font-medium px-2 py-1.5 touch-manipulation"
                onClick={onDelete}
              >
                {t("common.confirm")}
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="space-y-1 w-full">
          <span className="text-xs font-medium text-ink-600 block">
            {t("vault.colSite")}
          </span>
          <BlurInput
            id={`m-site-${entry.id}`}
            className="input w-full min-w-0 font-medium"
            value={entry.site}
            placeholder={t("vault.newEntry")}
            onCommit={(site) => onChange({ site })}
            onEditFocus={onEditFocus}
            onEditBlur={onEditBlur}
          />
        </div>

        <div className="space-y-1 w-full">
          <span className="text-xs font-medium text-ink-600 block">
            {t("vault.colCategory")}
          </span>
          <CategorySelect
            className="input w-full cursor-pointer"
            value={entry.categoryId}
            categories={categories}
            onChange={(categoryId) => onChange({ categoryId })}
            onAddCategory={onOpenCategoriesAddNew}
            onEditFocus={onEditFocus}
            onEditBlur={onEditBlur}
            onOpenChange={onCategoryOpenChange}
            t={t}
          />
        </div>

        <div className="space-y-1 w-full min-w-0">
          <label
            className="text-xs font-medium text-ink-600 block"
            htmlFor={`m-user-${entry.id}`}
          >
            {t("vault.colUser")}
          </label>
          <div className="flex w-full min-w-0 items-center gap-0.5">
            <BlurInput
              id={`m-user-${entry.id}`}
              className="input min-w-0 flex-1 w-0"
              value={entry.username}
              placeholder={t("vault.phUser")}
              onCommit={(username) => onChange({ username })}
              onEditFocus={onEditFocus}
              onEditBlur={onEditBlur}
            />
            <IconBtn
              onClick={() => onCopy(entry.username, `un:${entry.id}`)}
              title={t("vault.ttCopyUser")}
            >
              {copiedKey === `un:${entry.id}` ? <Check /> : <Copy />}
            </IconBtn>
          </div>
        </div>

        <div className="space-y-1 w-full min-w-0">
          <label
            className="text-xs font-medium text-ink-600 block"
            htmlFor={`m-pass-${entry.id}`}
          >
            {t("vault.colPass")}
          </label>
          <div className="flex w-full min-w-0 items-center gap-0.5">
            <BlurInput
              id={`m-pass-${entry.id}`}
              className="input min-w-0 flex-1 w-0"
              type={revealed ? "text" : "password"}
              value={entry.password}
              placeholder={t("vault.phPass")}
              spellCheck={false}
              autoComplete="off"
              onCommit={(password) => onChange({ password })}
              onEditFocus={onEditFocus}
              onEditBlur={onEditBlur}
            />
            <IconBtn
              onClick={toggleReveal}
              title={revealed ? t("vault.hide") : t("vault.show")}
            >
              {revealed ? <EyeOff /> : <Eye />}
            </IconBtn>
            <IconBtn
              onClick={() => onCopy(entry.password, `pw:${entry.id}`)}
              title={t("vault.ttCopyPass")}
            >
              {copiedKey === `pw:${entry.id}` ? <Check /> : <Copy />}
            </IconBtn>
            <IconBtn onClick={onGenerate} title={t("vault.ttGenPass")}>
              <Refresh />
            </IconBtn>
          </div>
        </div>

        <div className="space-y-4">
              <div className="space-y-1 w-full min-w-0">
                <label
                  className="text-xs font-medium text-ink-600 block"
                  htmlFor={`m-url-${entry.id}`}
                >
                  {t("vault.colUrl")}
                </label>
                <div className="flex w-full min-w-0 items-center gap-0.5">
                  <ExpandTextInput
                    id={`m-url-${entry.id}`}
                    value={entry.url}
                    onCommit={(url) => onChange({ url })}
                    placeholder={t("vault.phUrl")}
                    onEditFocus={onEditFocus}
                    onEditBlur={onEditBlur}
                  />
                  {entry.url ? (
                    <a
                      className="inline-flex shrink-0 items-center justify-center rounded-md border border-ink-200 bg-white p-2 text-ink-400 touch-manipulation hover:text-accent-600 min-w-9 min-h-9"
                      href={
                        /^https?:\/\//i.test(entry.url)
                          ? entry.url
                          : `https://${entry.url}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      title={t("vault.ttOpenTab")}
                    >
                      <ExternalLink />
                    </a>
                  ) : null}
                </div>
              </div>
              <div className="space-y-1 w-full min-w-0">
                <label
                  className="text-xs font-medium text-ink-600 block"
                  htmlFor={`m-memo-${entry.id}`}
                >
                  {t("vault.colMemo")}
                </label>
                <ExpandMemoArea
                  id={`m-memo-${entry.id}`}
                  value={entry.memo}
                  onCommit={(memo) => onChange({ memo })}
                  placeholder={t("vault.phMemo")}
                  onEditFocus={onEditFocus}
                  onEditBlur={onEditBlur}
                />
              </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
function IconBtn({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      className="shrink-0 text-ink-400 hover:text-accent-600 touch-manipulation h-9 w-9 inline-flex items-center justify-center rounded-md"
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );
}

function BlurInput({
  id,
  className,
  value,
  placeholder,
  type = "text",
  spellCheck,
  autoComplete,
  onCommit,
  onEditFocus,
  onEditBlur,
}: {
  id: string;
  className?: string;
  value: string;
  placeholder?: string;
  type?: string;
  spellCheck?: boolean;
  autoComplete?: string;
  onCommit: (v: string) => void;
  onEditFocus?: () => void;
  onEditBlur?: () => void;
}) {
  const [local, setLocal] = useState(value);
  React.useEffect(() => setLocal(value), [value]);
  return (
    <input
      id={id}
      type={type}
      className={className}
      value={local}
      placeholder={placeholder}
      spellCheck={spellCheck}
      autoComplete={autoComplete}
      onFocus={onEditFocus}
      onPointerDown={(e) => {
        if (e.button === 0) onEditFocus?.();
      }}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        if (local !== value) onCommit(local);
        onEditBlur?.();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") {
          setLocal(value);
          (e.target as HTMLInputElement).blur();
        }
      }}
    />
  );
}

function Th({
  children,
  active,
  dir,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <th
      className="px-3 py-1 sm:px-4 font-medium cursor-pointer select-none hover:text-ink-600"
      onClick={onClick}
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : undefined}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {active && (
          <span className="inline-flex shrink-0 text-ink-400" aria-hidden>
            <ChevronUpDownIcon className="h-3 w-3" />
          </span>
        )}
      </span>
    </th>
  );
}

function Row({
  entry,
  categories,
  expanded,
  onToggleExpand,
  revealed,
  toggleReveal,
  onChange,
  onDelete,
  onGenerate,
  onCopy,
  copiedKey,
  onPinEntryRow,
  onScheduleUnpinEntryRow,
  onCancelScheduledUnpinEntryRow,
  onRegisterCategoryMenuOpen,
  onOpenCategoriesAddNew,
  t,
}: RowProps) {
  const [confirmDel, setConfirmDel] = useState(false);
  const rowRef = useRef<HTMLTableSectionElement>(null);
  const {
    onEditFocus,
    onEditBlur,
    onRowMouseLeave,
    onRowMouseEnter,
    onCategoryOpenChange,
  } = useEntryRowEdit(
    entry.id,
    rowRef,
    onPinEntryRow,
    onScheduleUnpinEntryRow,
    onCancelScheduledUnpinEntryRow,
    onRegisterCategoryMenuOpen
  );

  return (
    <tbody
      ref={rowRef}
      data-vault-entry-id={entry.id}
      className="group"
      onMouseEnter={onRowMouseEnter}
      onMouseLeave={onRowMouseLeave}
    >
      <tr className="border-t border-ink-100 hover:bg-ink-50/60 group">
        <td className="px-1.5 py-1 align-middle">
          <CategorySelect
            className="cell-input w-full min-w-[5.5rem] max-w-[12rem] cursor-pointer appearance-none text-ink-800 bg-white"
            value={entry.categoryId}
            categories={categories}
            onChange={(categoryId) => onChange({ categoryId })}
            onAddCategory={onOpenCategoriesAddNew}
            onEditFocus={onEditFocus}
            onEditBlur={onEditBlur}
            onOpenChange={onCategoryOpenChange}
            t={t}
          />
        </td>
        <Cell
          value={entry.site}
          placeholder={t("vault.newEntry")}
          ariaLabel={t("vault.colSite")}
          onChange={(v) => onChange({ site: v })}
          onEditFocus={onEditFocus}
          onEditBlur={onEditBlur}
        />
        <td className="px-0 py-1 align-middle">
          <div className="flex items-center">
            <BlurCellInput
              className="cell-input flex-1"
              value={entry.username}
              onCommit={(username) => onChange({ username })}
              placeholder={t("vault.phUser")}
              onEditFocus={onEditFocus}
              onEditBlur={onEditBlur}
            />
            <button
              type="button"
              className="px-2 sm:px-2 text-ink-400 hover:text-accent-600 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0 touch-manipulation"
              onClick={() => onCopy(entry.username, `un:${entry.id}`)}
              title={t("vault.ttCopyUser")}
            >
              {copiedKey === `un:${entry.id}` ? <Check /> : <Copy />}
            </button>
          </div>
        </td>
        <td className="px-0 py-1 align-middle">
          <div className="flex items-center">
            <BlurCellInput
              className="cell-input flex-1"
              type={revealed ? "text" : "password"}
              value={entry.password}
              onCommit={(password) => onChange({ password })}
              placeholder={t("vault.phPass")}
              spellCheck={false}
              autoComplete="off"
              onEditFocus={onEditFocus}
              onEditBlur={onEditBlur}
            />
            <button
              type="button"
              className="px-1.5 sm:px-1.5 text-ink-400 hover:text-accent-600 touch-manipulation min-w-8 min-h-8 inline-flex items-center justify-center"
              onClick={toggleReveal}
              title={revealed ? t("vault.hide") : t("vault.show")}
            >
              {revealed ? <EyeOff /> : <Eye />}
            </button>
            <button
              type="button"
              className="px-1.5 text-ink-400 hover:text-accent-600 touch-manipulation min-w-8 min-h-8 inline-flex items-center justify-center"
              onClick={() => onCopy(entry.password, `pw:${entry.id}`)}
              title={t("vault.ttCopyPass")}
            >
              {copiedKey === `pw:${entry.id}` ? <Check /> : <Copy />}
            </button>
            <button
              type="button"
              className="px-1.5 text-ink-400 hover:text-accent-600 touch-manipulation min-w-8 min-h-8 inline-flex items-center justify-center"
              onClick={onGenerate}
              title={t("vault.ttGenPass")}
            >
              <Refresh />
            </button>
          </div>
        </td>
        <td className="w-[1%] whitespace-nowrap pl-2 pr-3 sm:pr-4 py-1 align-middle">
          <div className="flex w-full flex-nowrap items-center justify-end gap-2.5">
            {!confirmDel ? (
              <>
                <span
                  className="h-5 w-px bg-ink-100 shrink-0 self-center"
                  aria-hidden
                />
                <button
                  type="button"
                  className="text-ink-400 hover:text-red-600 p-2 sm:p-1 touch-manipulation min-w-8 min-h-8 inline-flex items-center justify-center"
                  onClick={() => setConfirmDel(true)}
                  title={t("vault.ttDelete")}
                >
                  <Trash />
                </button>
              </>
            ) : (
              <div className="inline-flex shrink-0 flex-nowrap items-center gap-1 whitespace-nowrap">
                <button
                  type="button"
                  className="shrink-0 whitespace-nowrap text-xs text-ink-500 hover:text-ink-700 px-1"
                  onClick={() => setConfirmDel(false)}
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  className="shrink-0 whitespace-nowrap text-xs text-red-600 hover:text-red-700 px-1 font-medium"
                  onClick={onDelete}
                >
                  {t("common.confirm")}
                </button>
              </div>
            )}
            <button
              type="button"
              className="inline-flex shrink-0 items-center justify-center leading-none text-ink-500 hover:text-ink-800 p-2 sm:p-1 rounded-md hover:bg-ink-100 touch-manipulation min-w-8 min-h-8"
              onClick={onToggleExpand}
              aria-expanded={expanded}
              title={expanded ? t("vault.ttCollapseRow") : t("vault.ttExpandRow")}
            >
              {expanded ? <ChevronUp /> : <ChevronDown />}
            </button>
          </div>
        </td>
      </tr>
      {expanded ? (
        <tr className="bg-ink-50/90 border-t border-ink-100">
          <td colSpan={5} className="px-3 py-3 sm:px-4 sm:py-3 align-top">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <label
                  className="w-14 shrink-0 pt-2 text-xs font-medium text-ink-600 sm:w-16"
                  htmlFor={`vault-url-${entry.id}`}
                >
                  {t("vault.colUrl")}
                </label>
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <ExpandTextInput
                    id={`vault-url-${entry.id}`}
                    value={entry.url}
                    onCommit={(url) => onChange({ url })}
                    placeholder={t("vault.phUrl")}
                    onEditFocus={onEditFocus}
                    onEditBlur={onEditBlur}
                  />
                  {entry.url ? (
                    <a
                      className="inline-flex shrink-0 rounded-md border border-ink-200 bg-white p-2 text-ink-400 touch-manipulation hover:text-accent-600"
                      href={
                        /^https?:\/\//i.test(entry.url)
                          ? entry.url
                          : `https://${entry.url}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      title={t("vault.ttOpenTab")}
                    >
                      <ExternalLink />
                    </a>
                  ) : null}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <label
                  className="w-14 shrink-0 pt-2 text-xs font-medium text-ink-600 sm:w-16"
                  htmlFor={`vault-memo-${entry.id}`}
                >
                  {t("vault.colMemo")}
                </label>
                <div className="min-w-0 flex-1">
                  <ExpandMemoArea
                    id={`vault-memo-${entry.id}`}
                    value={entry.memo}
                    onCommit={(memo) => onChange({ memo })}
                    placeholder={t("vault.phMemo")}
                    onEditFocus={onEditFocus}
                    onEditBlur={onEditBlur}
                  />
                </div>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </tbody>
  );
}

/** Single-line field with commit on blur (matches main grid cells). */
function ExpandTextInput({
  id,
  value,
  onCommit,
  placeholder,
  onEditFocus,
  onEditBlur,
}: {
  id: string;
  value: string;
  onCommit: (v: string) => void;
  placeholder: string;
  onEditFocus?: () => void;
  onEditBlur?: () => void;
}) {
  const [local, setLocal] = useState(value);
  React.useEffect(() => {
    setLocal(value);
  }, [value]);
  return (
    <input
      id={id}
      className="input min-w-0 w-full flex-1"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      placeholder={placeholder}
      spellCheck={false}
      onFocus={onEditFocus}
      onPointerDown={(e) => {
        if (e.button === 0) onEditFocus?.();
      }}
      onBlur={() => {
        if (local !== value) onCommit(local);
        onEditBlur?.();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") {
          setLocal(value);
          (e.target as HTMLInputElement).blur();
        }
      }}
    />
  );
}

function ExpandMemoArea({
  id,
  value,
  onCommit,
  placeholder,
  onEditFocus,
  onEditBlur,
}: {
  id: string;
  value: string;
  onCommit: (v: string) => void;
  placeholder: string;
  onEditFocus?: () => void;
  onEditBlur?: () => void;
}) {
  const [local, setLocal] = useState(value);
  React.useEffect(() => {
    setLocal(value);
  }, [value]);
  return (
    <textarea
      id={id}
      className="input w-full min-h-[6.5rem] resize-y text-sm leading-snug"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      placeholder={placeholder}
      spellCheck={true}
      onFocus={onEditFocus}
      onBlur={() => {
        if (local !== value) onCommit(local);
        onEditBlur?.();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setLocal(value);
          (e.target as HTMLTextAreaElement).blur();
        }
      }}
    />
  );
}

function BlurCellInput({
  value,
  onCommit,
  placeholder,
  className = "",
  type = "text",
  spellCheck,
  autoComplete,
  onEditFocus,
  onEditBlur,
  "aria-label": ariaLabel,
}: {
  value: string;
  onCommit: (v: string) => void;
  placeholder?: string;
  className?: string;
  type?: string;
  spellCheck?: boolean;
  autoComplete?: string;
  onEditFocus?: () => void;
  onEditBlur?: () => void;
  "aria-label"?: string;
}) {
  const [local, setLocal] = useState(value);
  React.useEffect(() => setLocal(value), [value]);
  return (
    <input
      className={className}
      type={type}
      value={local}
      placeholder={placeholder}
      aria-label={ariaLabel}
      spellCheck={spellCheck}
      autoComplete={autoComplete}
      onFocus={onEditFocus}
      onPointerDown={(e) => {
        if (e.button === 0) onEditFocus?.();
      }}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        if (local !== value) onCommit(local);
        onEditBlur?.();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") {
          setLocal(value);
          (e.target as HTMLInputElement).blur();
        }
      }}
    />
  );
}

function Cell({
  value,
  onChange,
  placeholder,
  ariaLabel,
  onEditFocus,
  onEditBlur,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  onEditFocus?: () => void;
  onEditBlur?: () => void;
}) {
  return (
    <td className="px-0 py-1 align-middle">
      <BlurCellInput
        className="cell-input placeholder:text-ink-400 placeholder:font-normal"
        value={value}
        onCommit={onChange}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onEditFocus={onEditFocus}
        onEditBlur={onEditBlur}
      />
    </td>
  );
}
