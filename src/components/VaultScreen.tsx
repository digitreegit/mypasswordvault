import React, { useMemo, useState } from "react";
import { ChevronDownIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { useVault, type DecryptedEntry } from "../lib/vault";
import type { VaultCategory } from "../lib/storage";
import { PasswordGenerator } from "./PasswordGenerator";
import { SettingsDialog } from "./SettingsDialog";
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
  Settings,
  Shield,
  Trash,
  ExternalLink,
  Check,
} from "./Icons";
import { LanguageMenu } from "./LanguageMenu";
import { privacyPolicyUrl } from "../lib/privacyPolicyUrl";
import { isAppError } from "../lib/errors";

type SortKey = "category" | "site" | "username" | "updatedAt";

type TFn = (key: string, vars?: Record<string, string | number>) => string;

/** Mobile entry card: single column, full-width fields */
const MOBILE_CARD_STACK = "flex flex-col gap-3 min-w-0 w-full";

/** Sort dropdown: compact gray chevron toward the trailing edge */
const heroChevronSort =
  "pointer-events-none absolute right-2 top-1/2 h-4 w-4 shrink-0 -translate-y-1/2 text-ink-400";
/** Category-style selects inside cards */
const heroChevronField =
  "pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 shrink-0 -translate-y-1/2 text-ink-400";

export function VaultScreen() {
  const privacyHref = useMemo(() => privacyPolicyUrl(), []);
  const {
    entries,
    lock,
    upsertEntry,
    removeEntry,
    touchActivity,
    t,
    categories,
    locale,
    setLocale,
    atEntryLimit,
    freeEntryLimit,
  } = useVault();

  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [generatorFor, setGeneratorFor] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [entryLimitModalOpen, setEntryLimitModalOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cats = categories;
    const entryCategoryLabel = (e: DecryptedEntry): string => {
      if (!e.categoryId) return "";
      return cats.find((c) => c.id === e.categoryId)?.name ?? "";
    };
    const sortBucket = (e: DecryptedEntry): string => {
      if (!e.categoryId) return "";
      return cats.find((c) => c.id === e.categoryId)?.name ?? "\uFFFF";
    };
    const arr = entries.filter(
      (e) =>
        !q ||
        e.site.toLowerCase().includes(q) ||
        e.url.toLowerCase().includes(q) ||
        e.username.toLowerCase().includes(q) ||
        e.notes.toLowerCase().includes(q) ||
        e.memo.toLowerCase().includes(q) ||
        entryCategoryLabel(e).toLowerCase().includes(q)
    );
    arr.sort((a, b) => {
      const c0 = sortBucket(a).localeCompare(sortBucket(b), undefined, {
        sensitivity: "base",
      });
      const groupDir = sortKey === "category" ? (sortDir === "asc" ? 1 : -1) : 1;
      if (c0 !== 0) return c0 * groupDir;
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "category") {
        return a.site.localeCompare(b.site, undefined, { sensitivity: "base" });
      }
      if (sortKey === "updatedAt") {
        if (a.updatedAt < b.updatedAt) return -1 * dir;
        if (a.updatedAt > b.updatedAt) return 1 * dir;
        return 0;
      }
      if (sortKey === "site") {
        return a.site.localeCompare(b.site, undefined, { sensitivity: "base" }) * dir;
      }
      if (sortKey === "username") {
        return a.username.localeCompare(b.username, undefined, {
          sensitivity: "base",
        }) * dir;
      }
      return 0;
    });
    return arr;
  }, [entries, query, sortKey, sortDir, categories]);

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
    try {
      await upsertEntry({
        categoryId: "",
        site: "",
        url: "",
        username: "",
        password: "",
        notes: "",
        memo: "",
      });
    } catch (e) {
      if (isAppError(e) && e.code === "errors.entryLimitReached") {
        setEntryLimitModalOpen(true);
        return;
      }
      console.error(e);
    }
  }

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir(k === "updatedAt" ? "desc" : "asc");
    }
  }

  return (
    <div
      className="min-h-screen min-h-[100dvh] flex flex-col bg-ink-50"
      onMouseMove={touchActivity}
      onTouchStart={touchActivity}
      onKeyDown={touchActivity}
    >
      <header className="bg-white border-b border-ink-200 px-3 py-2.5 sm:px-4 flex flex-col gap-4 sm:gap-5 sticky top-0 z-10 pt-[max(0.625rem,env(safe-area-inset-top))] text-ink-600">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 overflow-visible">
            <Shield className="text-accent-500 w-8 sm:w-9 shrink-0" />
            <span className="font-brand font-semibold text-base sm:text-lg text-ink-800 tracking-tight truncate">
              {t("app.brandName")}
            </span>
          </div>
          <LanguageMenu
            value={locale}
            onChange={(l) => void setLocale(l)}
            ariaLabel={t("settings.language")}
            align="right"
          />
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4 w-full min-w-0">
          <h1 className="font-sans text-xl font-semibold text-ink-900 tracking-tight shrink-0">
            {t("vault.pageTitle")}
          </h1>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 w-full min-w-0 flex-1 lg:min-w-0">
          <div className="w-full sm:max-w-md lg:flex-1 lg:max-w-xl min-w-0">
            <input
              className="input"
              placeholder={t("vault.search")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              enterKeyHint="search"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end sm:ml-auto">
            <button
              type="button"
              className="btn-secondary text-sm shrink-0"
              onClick={() => setShowAll((v) => !v)}
              title={t("vault.ttPasswords")}
              aria-label={
                showAll ? t("vault.maskAll") : t("vault.revealAll")
              }
            >
              {showAll ? <EyeOff /> : <Eye />}
              <span className="hidden sm:inline" aria-hidden>
                {showAll ? t("vault.maskAll") : t("vault.revealAll")}
              </span>
            </button>
            <button
              type="button"
              className="btn-secondary shrink-0"
              onClick={() => setShowCategories(true)}
              title={t("vault.manageCategories")}
              aria-label={t("vault.manageCategories")}
            >
              <Folder />
            </button>
            <button
              type="button"
              className="btn-primary text-sm shrink-0 disabled:opacity-50 disabled:pointer-events-none"
              onClick={addEntry}
              disabled={atEntryLimit}
              aria-label={t("vault.addRow")}
            >
              <Plus />{" "}
              <span className="hidden sm:inline" aria-hidden>
                {t("vault.addRow")}
              </span>
            </button>
            <button
              type="button"
              className="btn-ghost shrink-0"
              onClick={() => setShowSettings(true)}
              title={t("vault.settings")}
              aria-label={t("vault.settings")}
            >
              <Settings />
            </button>
            <button
              type="button"
              className="btn-secondary text-sm shrink-0"
              onClick={lock}
              title={t("vault.lock")}
              aria-label={t("vault.lock")}
            >
              <Lock />{" "}
              <span className="hidden sm:inline" aria-hidden>
                {t("vault.lock")}
              </span>
            </button>
          </div>
        </div>
        </div>
      </header>

      <main className="flex-1 p-2 sm:p-4 min-w-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {atEntryLimit && (
          <div
            role="status"
            className="mb-4 rounded-lg border border-ink-200 bg-white px-3 py-3 sm:px-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between shadow-sm"
          >
            <div className="flex gap-3 min-w-0">
              <InformationCircleIcon
                className="h-5 w-5 shrink-0 text-ink-500 mt-0.5"
                aria-hidden
              />
              <p className="text-sm text-ink-800 leading-snug min-w-0">
                {t("vault.entryLimitBanner", { limit: freeEntryLimit })}
              </p>
            </div>
            <a
              href="#/pricing"
              className="btn-primary text-sm shrink-0 justify-center sm:min-w-[10rem]"
              onClick={(e) => {
                e.preventDefault();
                window.location.hash = "#/pricing";
              }}
            >
              {t("vault.entryLimitUpgrade")}
            </a>
          </div>
        )}
        <div className="mb-1.5 flex justify-end pl-0.5 pr-3 sm:pr-4">
          <p className="text-[11px] sm:text-xs text-ink-500 tabular-nums text-right max-w-full leading-snug">
            {t("vault.totalItems", { count: filtered.length })}
            {categorySummaryParts.length > 0 && (
              <span>{` (${categorySummaryParts.join(", ")})`}</span>
            )}
          </p>
        </div>
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
              <option value="updatedAt">{t("vault.sortRecent")}</option>
              <option value="site">{t("vault.colSite")}</option>
              <option value="username">{t("vault.colUser")}</option>
              <option value="category">{t("vault.colCategory")}</option>
            </select>
            <ChevronDownIcon className={heroChevronSort} aria-hidden />
          </div>
          <button
            type="button"
            className="btn-secondary text-sm px-2.5 min-w-[2.5rem] shrink-0"
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            aria-label={sortDir === "asc" ? "Ascending" : "Descending"}
          >
            {sortDir === "asc" ? "↑" : "↓"}
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
                  onDelete={() => removeEntry(e.id)}
                  onGenerate={() => setGeneratorFor(e.id)}
                  onCopy={copyText}
                  copiedKey={copiedKey}
                  categories={categories}
                  t={t}
                />
              </li>
            ))
          )}
        </ul>

        <div className="card overflow-hidden rounded-lg sm:rounded-xl hidden md:block">
          <div className="overflow-x-auto overscroll-x-contain">
            <table className="w-full text-sm min-w-[56rem]">
              <colgroup>
                <col style={{ width: "10%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "30%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
              </colgroup>
              <thead className="bg-ink-100/70 text-ink-600 text-xs">
                <tr className="text-left">
                  <th
                    className="px-2 py-2 sm:px-3 sm:py-2 font-medium cursor-pointer select-none hover:bg-ink-200/60"
                    onClick={() => toggleSort("category")}
                  >
                    {t("vault.colCategory")}
                  </th>
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
                  <th className="px-2 py-2 sm:px-3 sm:py-2 font-medium">
                    {t("vault.colPass")}
                  </th>
                  <th className="px-2 py-2 sm:px-3 sm:py-2 font-medium">
                    {t("vault.colNotes")}
                  </th>
                  <th className="pl-2 pr-3 sm:pl-3 sm:pr-4 py-2 font-medium text-right">
                    {t("vault.colActions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
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
                )}
                {filtered.map((e) => (
                  <Row
                    key={e.id}
                    entry={e}
                    expanded={expandedIds.has(e.id)}
                    onToggleExpand={() => toggleExpanded(e.id)}
                    revealed={showAll || revealed.has(e.id)}
                    toggleReveal={() => toggleReveal(e.id)}
                    onChange={(patch) => upsertEntry({ id: e.id, ...patch })}
                    onDelete={() => removeEntry(e.id)}
                    onGenerate={() => setGeneratorFor(e.id)}
                    onCopy={copyText}
                    copiedKey={copiedKey}
                    categories={categories}
                    t={t}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-ink-500 mt-2 sm:mt-3 px-0.5 leading-snug">
          <span>{t("vault.footer")}</span>{" "}
          <a
            href={privacyHref}
            className="text-accent-600 hover:underline whitespace-nowrap"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("legal.privacyPolicy")}
          </a>
        </p>
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
      {showSettings && (
        <SettingsDialog onClose={() => setShowSettings(false)} />
      )}
      {showCategories && (
        <CategoriesDialog onClose={() => setShowCategories(false)} />
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
  t: TFn;
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
  t,
}: RowProps) {
  const [confirmDel, setConfirmDel] = useState(false);

  return (
    <article className={`card rounded-lg p-3 sm:p-4 min-w-0 w-full ${MOBILE_CARD_STACK}`}>
      <BlurInput
        id={`m-site-${entry.id}`}
        className="input w-full min-w-0 font-medium text-base"
        value={entry.site}
        placeholder={t("vault.newEntry")}
        onCommit={(site) => onChange({ site })}
      />

      <div className="space-y-1 w-full">
        <span className="text-xs font-medium text-ink-600 block">
          {t("vault.colCategory")}
        </span>
        <div className="relative w-full min-w-0">
          <select
            className="input w-full cursor-pointer appearance-none pr-9"
            value={entry.categoryId}
            onChange={(e) => onChange({ categoryId: e.target.value })}
            aria-label={t("vault.colCategory")}
          >
            <option value="">{t("vault.uncategorized")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDownIcon className={heroChevronField} aria-hidden />
        </div>
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
        />
      </div>

      {expanded ? (
        <div className="w-full border-t border-ink-100 pt-3 space-y-3">
          <div className="space-y-1 w-full min-w-0">
            <label
              className="text-xs font-medium text-ink-600 block"
              htmlFor={`m-url-${entry.id}`}
            >
              {t("vault.colUrl")}
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center min-w-0 w-full">
              <ExpandTextInput
                id={`m-url-${entry.id}`}
                value={entry.url}
                onCommit={(url) => onChange({ url })}
                placeholder={t("vault.phUrl")}
              />
              {entry.url ? (
                <a
                  className="shrink-0 self-start p-2.5 text-ink-400 hover:text-accent-600 rounded-md border border-ink-200 bg-white touch-manipulation inline-flex"
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
            />
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
}: {
  id: string;
  className?: string;
  value: string;
  placeholder?: string;
  type?: string;
  spellCheck?: boolean;
  autoComplete?: string;
  onCommit: (v: string) => void;
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
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        if (local !== value) onCommit(local);
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
      className="px-2 py-2 sm:px-3 sm:py-2 font-medium cursor-pointer select-none hover:bg-ink-200/60"
      onClick={onClick}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {active && (
          <span className="text-ink-400">{dir === "asc" ? "▲" : "▼"}</span>
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
  t,
}: RowProps) {
  const [confirmDel, setConfirmDel] = useState(false);

  return (
    <>
      <tr className="border-t border-ink-100 hover:bg-ink-50/60 group">
        <td className="px-1.5 py-1.5 align-middle">
          <select
            className="cell-input w-full min-w-[5.5rem] max-w-[12rem] cursor-pointer appearance-none text-ink-800 bg-white"
            value={entry.categoryId}
            onChange={(e) => onChange({ categoryId: e.target.value })}
            aria-label={t("vault.colCategory")}
          >
            <option value="">{t("vault.uncategorized")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </td>
        <Cell
          value={entry.site}
          placeholder={t("vault.newEntry")}
          ariaLabel={t("vault.colSite")}
          onChange={(v) => onChange({ site: v })}
        />
        <td className="px-0 py-1.5 align-middle">
          <div className="flex items-center">
            <input
              className="cell-input flex-1"
              value={entry.username}
              onChange={(e) => onChange({ username: e.target.value })}
              placeholder={t("vault.phUser")}
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
        <td className="px-0 py-1.5 align-middle">
          <div className="flex items-center">
            <input
              className="cell-input flex-1"
              type={revealed ? "text" : "password"}
              value={entry.password}
              onChange={(e) => onChange({ password: e.target.value })}
              placeholder={t("vault.phPass")}
              spellCheck={false}
              autoComplete="off"
            />
            <button
              type="button"
              className="px-1.5 sm:px-1.5 text-ink-400 hover:text-accent-600 touch-manipulation min-w-[2.25rem] min-h-[2.25rem] inline-flex items-center justify-center"
              onClick={toggleReveal}
              title={revealed ? t("vault.hide") : t("vault.show")}
            >
              {revealed ? <EyeOff /> : <Eye />}
            </button>
            <button
              type="button"
              className="px-1.5 text-ink-400 hover:text-accent-600 touch-manipulation min-w-[2.25rem] min-h-[2.25rem] inline-flex items-center justify-center"
              onClick={() => onCopy(entry.password, `pw:${entry.id}`)}
              title={t("vault.ttCopyPass")}
            >
              {copiedKey === `pw:${entry.id}` ? <Check /> : <Copy />}
            </button>
            <button
              type="button"
              className="px-1.5 text-ink-400 hover:text-accent-600 touch-manipulation min-w-[2.25rem] min-h-[2.25rem] inline-flex items-center justify-center"
              onClick={onGenerate}
              title={t("vault.ttGenPass")}
            >
              <Refresh />
            </button>
          </div>
        </td>
        <Cell value={entry.notes} onChange={(v) => onChange({ notes: v })} />
        <td className="pl-2 pr-3 sm:pr-4 py-1.5 align-middle">
          <div className="flex w-full items-center justify-end gap-2.5">
            {!confirmDel ? (
              <button
                type="button"
                className="text-ink-400 hover:text-red-600 p-2 sm:p-1 touch-manipulation min-w-[2.25rem] min-h-[2.25rem] inline-flex items-center justify-center"
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
              className="inline-flex shrink-0 items-center justify-center leading-none text-ink-500 hover:text-ink-800 p-2 sm:p-1 rounded-md hover:bg-ink-100 touch-manipulation min-w-[2.25rem] min-h-[2.25rem]"
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
            <div className="space-y-3 max-w-4xl">
              <div>
                <label
                  className="text-xs font-medium text-ink-600 block mb-1"
                  htmlFor={`vault-url-${entry.id}`}
                >
                  {t("vault.colUrl")}
                </label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-1">
                  <ExpandTextInput
                    id={`vault-url-${entry.id}`}
                    value={entry.url}
                    onCommit={(url) => onChange({ url })}
                    placeholder={t("vault.phUrl")}
                  />
                  {entry.url ? (
                    <a
                      className="shrink-0 self-start sm:self-auto p-2.5 sm:p-2 text-ink-400 hover:text-accent-600 rounded-md border border-ink-200 bg-white touch-manipulation inline-flex"
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
              <div>
                <label
                  className="text-xs font-medium text-ink-600 block mb-1"
                  htmlFor={`vault-memo-${entry.id}`}
                >
                  {t("vault.colMemo")}
                </label>
                <ExpandMemoArea
                  id={`vault-memo-${entry.id}`}
                  value={entry.memo}
                  onCommit={(memo) => onChange({ memo })}
                  placeholder={t("vault.phMemo")}
                />
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

/** Single-line field with commit on blur (matches main grid cells). */
function ExpandTextInput({
  id,
  value,
  onCommit,
  placeholder,
}: {
  id: string;
  value: string;
  onCommit: (v: string) => void;
  placeholder: string;
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
      onBlur={() => {
        if (local !== value) onCommit(local);
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
}: {
  id: string;
  value: string;
  onCommit: (v: string) => void;
  placeholder: string;
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
      onBlur={() => {
        if (local !== value) onCommit(local);
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

function Cell({
  value,
  onChange,
  placeholder,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const [local, setLocal] = useState(value);
  React.useEffect(() => setLocal(value), [value]);
  return (
    <td className="px-0 py-1.5 align-middle">
      <input
        className="cell-input placeholder:text-ink-400 placeholder:font-normal"
        value={local}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          if (local !== value) onChange(local);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") {
            setLocal(value);
            (e.target as HTMLInputElement).blur();
          }
        }}
      />
    </td>
  );
}
