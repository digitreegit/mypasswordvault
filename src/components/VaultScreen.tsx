import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDownIcon,
  ChevronUpDownIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useVault, type DecryptedEntry } from "../lib/vault";
import { newId, type VaultCategory } from "../lib/storage";
import { PasswordGenerator } from "./PasswordGenerator";
import { CategoriesDialog } from "./CategoriesDialog";
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

/** New rows stay pinned until site, username, and password are all filled. */
function isEntryDraftComplete(e: DecryptedEntry): boolean {
  return (
    e.site.trim() !== "" &&
    e.username.trim() !== "" &&
    e.password.trim() !== ""
  );
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
    const c0 = sortBucket(sa).localeCompare(sortBucket(sb), undefined, {
      sensitivity: "base",
    });
    const groupDir = sortKey === "category" ? (sortDir === "asc" ? 1 : -1) : 1;
    if (c0 !== 0) return c0 * groupDir;
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortKey === "category") {
      return sa.site.localeCompare(sb.site, undefined, { sensitivity: "base" });
    }
    if (sortKey === "updatedAt") {
      if (sa.updatedAt < sb.updatedAt) return -1 * dir;
      if (sa.updatedAt > sb.updatedAt) return 1 * dir;
      return 0;
    }
    if (sortKey === "site") {
      return sa.site.localeCompare(sb.site, undefined, { sensitivity: "base" }) * dir;
    }
    if (sortKey === "username") {
      return sa.username.localeCompare(sb.username, undefined, {
        sensitivity: "base",
      }) * dir;
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

type TFn = (key: string, vars?: Record<string, string | number>) => string;

/** Mobile entry card: single column, full-width fields */
const MOBILE_CARD_STACK = "flex flex-col gap-3 min-w-0 w-full";

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
        aria-label={t("vault.colCategory")}
      >
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <ChevronDownIcon
          className="h-3.5 w-3.5 shrink-0 text-ink-400"
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
const VAULT_TOOLBAR_BTN =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-800 shadow-sm hover:bg-ink-50 transition-colors disabled:opacity-50 disabled:pointer-events-none shrink-0";
const VAULT_TOOLBAR_BTN_PRIMARY =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-accent-600 bg-accent-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-accent-700 transition-colors disabled:opacity-50 disabled:pointer-events-none shrink-0";
const VAULT_TOOLBAR_BTN_ICON =
  "inline-flex items-center justify-center rounded-lg border border-ink-200 bg-white p-2 text-ink-600 shadow-sm hover:bg-ink-50 transition-colors shrink-0 min-w-[2.5rem] min-h-[2.5rem]";

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
    locale,
    setLocale,
  } = useVault();

  const [query, setQuery] = useState("");
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
  const [entryLimitBannerDismissed, setEntryLimitBannerDismissed] = useState(
    () => readEntryLimitBannerDismissed(user?.id)
  );
  /** Entry ids still being created — kept at top until draft is complete. */
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

  const unpinEntry = useCallback(
    (id: string) => {
      const next = pinEntryIdsRef.current.filter((x) => x !== id);
      if (next.length === pinEntryIdsRef.current.length) return;
      pinEntryIdsRef.current = next;
      pinSortSnapshotsRef.current.delete(id);
      const clearingSession = next.length === 0;
      if (clearingSession) {
        editDisplayOrderRef.current = null;
        pinSortSnapshotsRef.current.clear();
      }
      setPinEntryIds(next);
      setDraftEntryIds((prev) => {
        const entry = entries.find((e) => e.id === id);
        if (!entry || !isEntryDraftComplete(entry)) return prev;
        const without = prev.filter((x) => x !== id);
        return without.length === prev.length ? prev : without;
      });
      if (clearingSession) {
        setSortRevision((r) => r + 1);
      }
    },
    [entries]
  );

  const pinEntryRow = useCallback(
    (id: string) => {
      cancelScheduledUnpin(id);
      if (!pinSortSnapshotsRef.current.has(id)) {
        const entry = entries.find((e) => e.id === id);
        if (entry) pinSortSnapshotsRef.current.set(id, { ...entry });
      }
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
      if (!pinEntryIdsRef.current.includes(id)) {
        pinEntryIdsRef.current = [...pinEntryIdsRef.current, id];
        setPinEntryIds([...pinEntryIdsRef.current]);
      }
    },
    [
      cancelScheduledUnpin,
      entries,
      query,
      sortKey,
      sortDir,
      categories,
      draftEntryIds,
    ]
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

  useEffect(() => {
    setDraftEntryIds((prev) => {
      const next = prev.filter((id) => {
        const e = entries.find((x) => x.id === id);
        if (!e) return false;
        if (!isEntryDraftComplete(e)) return true;
        return pinEntryIds.includes(id);
      });
      return next.length === prev.length ? prev : next;
    });
  }, [entries, pinEntryIds]);

  const filtered = useMemo(() => {
    const arr = filterEntriesByQuery(entries, query, categories);

    if (pinEntryIdsRef.current.length > 0 && editDisplayOrderRef.current) {
      const byId = new Map(arr.map((e) => [e.id, e]));
      const ordered: DecryptedEntry[] = [];
      const seen = new Set<string>();
      for (const id of editDisplayOrderRef.current) {
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

  async function addEntry() {
    const id = newId();
    setDraftEntryIds((prev) => [id, ...prev.filter((x) => x !== id)]);
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
    } catch (e) {
      setDraftEntryIds((prev) => prev.filter((x) => x !== id));
      if (isAppError(e) && e.code === "errors.entryLimitReached") {
        setEntryLimitModalOpen(true);
        return;
      }
      console.error(e);
    }
  }

  async function handleRemoveEntry(id: string) {
    setDraftEntryIds((prev) => prev.filter((x) => x !== id));
    cancelScheduledUnpin(id);
    unpinEntry(id);
    await removeEntry(id);
  }

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir(k === "updatedAt" ? "desc" : "asc");
    }
  }

  const showEntryLimitBanner =
    atEntryLimit && !licensed && !entryLimitBannerDismissed;
  const showHeaderUpgrade = atEntryLimit && !licensed && entitlementLoaded;

  function goToPricing(e?: React.MouseEvent) {
    e?.preventDefault();
    window.location.hash = "#/pricing";
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
    setCategoriesStartWithNew(true);
    setShowCategories(true);
  }, []);

  const closeCategoriesDialog = useCallback(() => {
    setShowCategories(false);
    setCategoriesStartWithNew(false);
  }, []);

  return (
    <div
      className="min-h-screen min-h-[100dvh] flex flex-col bg-white"
      onMouseMove={touchActivity}
      onTouchStart={touchActivity}
      onKeyDown={touchActivity}
    >
      <div className="sticky top-0 z-10 w-full">
        {showEntryLimitBanner && (
          <div
            role="status"
            className="vault-entry-limit-banner pt-[env(safe-area-inset-top,0px)]"
          >
            <div
              className={`${VAULT_PAGE} flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between`}
            >
              <div className="flex min-w-0 gap-3">
                <InformationCircleIcon
                  className="vault-entry-limit-banner__icon mt-0.5 h-5 w-5 shrink-0"
                  aria-hidden
                />
                <p className="vault-entry-limit-banner__text min-w-0 text-sm leading-snug">
                  {t("vault.entryLimitBanner", { limit: freeEntryLimit })}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                <a
                  href="#/pricing"
                  className="vault-entry-limit-banner__cta"
                  onClick={goToPricing}
                >
                  {t("vault.entryLimitUpgrade")}
                </a>
                <button
                  type="button"
                  className="vault-entry-limit-banner__close"
                  onClick={dismissEntryLimitBanner}
                  aria-label={t("vault.entryLimitBannerDismiss")}
                >
                  <XMarkIcon className="h-5 w-5" aria-hidden />
                </button>
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
                      <a
                        href="#/pricing"
                        className="vault-header-upgrade-btn"
                        onClick={goToPricing}
                      >
                        {t("vault.entryLimitUpgrade")}
                      </a>
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 mb-1">
          <h1 className="font-sans text-xl sm:text-2xl font-semibold text-ink-900 tracking-tight shrink-0">
            {t("vault.pageTitle")}
          </h1>
          <div className="relative w-full min-w-0 sm:w-[25rem] sm:max-w-[25rem] shrink-0">
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
          <div className="flex items-center gap-2 shrink-0 self-end sm:ml-auto sm:self-auto">
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
              aria-label={t("vault.addRow")}
            >
              <Plus />
              <span>{t("vault.addShort")}</span>
            </button>
            <button
              type="button"
              className={VAULT_TOOLBAR_BTN}
              onClick={lock}
              title={t("vault.lock")}
              aria-label={t("vault.lock")}
            >
              <Lock />
              <span>{t("vault.lock")}</span>
            </button>
          </div>
        </div>
        <p className="mt-2 sm:mt-2.5 mb-1 text-right text-xs text-ink-500 tabular-nums leading-snug">
          {t("vault.totalItems", { count: filtered.length })}
          {categorySummaryParts.length > 0 && (
            <span>{` (${categorySummaryParts.join(", ")})`}</span>
          )}
        </p>
        <div className="md:hidden flex items-center gap-2 mb-3 min-w-0">
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
                setSortKey(k);
                setSortDir(k === "updatedAt" ? "desc" : "asc");
              }}
            >
              <option value="category">{t("vault.colCategory")}</option>
              <option value="updatedAt">{t("vault.sortRecent")}</option>
              <option value="site">{t("vault.colSite")}</option>
              <option value="username">{t("vault.colUser")}</option>
            </select>
            <ChevronDownIcon className={heroChevronSort} aria-hidden />
          </div>
          <button
            type="button"
            className="btn-secondary text-sm px-2.5 min-w-[2.5rem] shrink-0"
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            aria-label={sortDir === "asc" ? "Ascending" : "Descending"}
          >
            <ChevronUpDownIcon className="h-3.5 w-3.5" />
          </button>
        </div>

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
                <MobileEntryCard
                  entry={e}
                  expanded={expandedIds.has(e.id)}
                  onToggleExpand={() => toggleExpanded(e.id)}
                  revealed={showAll || revealed.has(e.id)}
                  toggleReveal={() => toggleReveal(e.id)}
                  onChange={(patch) => upsertEntry({ id: e.id, ...patch })}
                  onDelete={() => void handleRemoveEntry(e.id)}
                  onGenerate={() => setGeneratorFor(e.id)}
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
              </li>
            ))
          )}
        </ul>

        <div className="overflow-hidden rounded-lg border border-ink-200 bg-white shadow-sm hidden md:block">
          <div className="overflow-x-auto overscroll-x-contain">
            <table className="w-full text-sm min-w-[56rem]">
              <colgroup>
                <col style={{ width: "10%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "30%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "10%" }} />
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
                  <th className="px-3 py-1 sm:px-4 font-medium">
                    {t("vault.colNote")}
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
                      colSpan={6}
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
                    onGenerate={() => setGeneratorFor(e.id)}
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
          onClose={() => setGeneratorFor(null)}
          onUse={async (pw) => {
            await upsertEntry({ id: generatorFor, password: pw });
            setGeneratorFor(null);
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
              <a
                href="#/pricing"
                className="btn-primary text-sm w-full sm:w-auto text-center"
                onClick={(e) => {
                  e.preventDefault();
                  setEntryLimitModalOpen(false);
                  window.location.hash = "#/pricing";
                }}
              >
                {t("vault.entryLimitModalCta")}
              </a>
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
  }, [entryId, onCancelScheduledUnpinEntryRow]);

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

function MobileEntryCard({
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
  const rowRef = useRef<HTMLElement>(null);
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
    <article
      ref={rowRef}
      data-vault-entry-id={entry.id}
      className={`rounded-xl border border-ink-200 bg-white p-3 sm:p-4 min-w-0 w-full shadow-sm ${MOBILE_CARD_STACK}`}
      onMouseEnter={onRowMouseEnter}
      onMouseLeave={onRowMouseLeave}
    >
      <BlurInput
        id={`m-site-${entry.id}`}
        className="input w-full min-w-0 font-medium text-base"
        value={entry.site}
        placeholder={t("vault.newEntry")}
        onCommit={(site) => onChange({ site })}
        onEditFocus={onEditFocus}
        onEditBlur={onEditBlur}
      />

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
            className="input min-w-0 flex-1 w-0 font-mono text-sm"
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

      <div className="space-y-1 w-full min-w-0">
        <label
          className="text-xs font-medium text-ink-600 block"
          htmlFor={`m-notes-${entry.id}`}
        >
          {t("vault.colNotes")}
        </label>
        <BlurInput
          id={`m-notes-${entry.id}`}
          className="input w-full min-w-0"
          value={entry.notes}
          onCommit={(notes) => onChange({ notes })}
          onEditFocus={onEditFocus}
          onEditBlur={onEditBlur}
        />
      </div>

      {expanded ? (
        <div className="w-full border-t border-ink-100 pt-3 space-y-3">
          <div className="flex w-full min-w-0 items-start gap-3">
            <label
              className="w-14 shrink-0 pt-2 text-xs font-medium text-ink-600 sm:w-16"
              htmlFor={`m-url-${entry.id}`}
            >
              {t("vault.colUrl")}
            </label>
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
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
                  className="inline-flex shrink-0 self-start rounded-md border border-ink-200 bg-white p-2.5 text-ink-400 touch-manipulation hover:text-accent-600"
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
          <div className="flex w-full min-w-0 items-start gap-3">
            <label
              className="w-14 shrink-0 pt-2 text-xs font-medium text-ink-600 sm:w-16"
              htmlFor={`m-memo-${entry.id}`}
            >
              {t("vault.colMemo")}
            </label>
            <div className="min-w-0 flex-1">
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
      ) : null}

      <div className="flex w-full items-center justify-between gap-2 pt-1 border-t border-ink-100">
        {!confirmDel ? (
          <button
            type="button"
            className="text-sm text-red-600 hover:text-red-700 inline-flex items-center gap-1.5 py-2 touch-manipulation"
            onClick={() => setConfirmDel(true)}
          >
            <Trash />
            {t("vault.ttDelete")}
          </button>
        ) : (
          <div className="flex items-center gap-2 text-sm">
            <button
              type="button"
              className="text-ink-500 hover:text-ink-700 px-2 py-1"
              onClick={() => setConfirmDel(false)}
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              className="text-red-600 font-medium px-2 py-1"
              onClick={onDelete}
            >
              {t("common.confirm")}
            </button>
          </div>
        )}
        <button
          type="button"
          className="text-xs text-accent-600 hover:underline py-2 touch-manipulation shrink-0"
          onClick={onToggleExpand}
        >
          {expanded ? t("vault.ttCollapseRow") : t("vault.ttExpandRow")}
        </button>
      </div>
    </article>
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
        <Cell
          value={entry.notes}
          onChange={(v) => onChange({ notes: v })}
          onEditFocus={onEditFocus}
          onEditBlur={onEditBlur}
        />
        <td className="pl-2 pr-3 sm:pr-4 py-1 align-middle">
          <div className="flex w-full items-center justify-end gap-2.5">
            {!confirmDel ? (
              <button
                type="button"
                className="text-ink-400 hover:text-red-600 p-2 sm:p-1 touch-manipulation min-w-8 min-h-8 inline-flex items-center justify-center"
                onClick={() => setConfirmDel(true)}
                title={t("vault.ttDelete")}
              >
                <Trash />
              </button>
            ) : (
              <div className="inline-flex items-center gap-1">
                <button
                  type="button"
                  className="text-xs text-ink-500 hover:text-ink-700 px-1"
                  onClick={() => setConfirmDel(false)}
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  className="text-xs text-red-600 hover:text-red-700 px-1 font-medium"
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
          <td colSpan={6} className="px-3 py-3 sm:px-4 sm:py-3 align-top">
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
