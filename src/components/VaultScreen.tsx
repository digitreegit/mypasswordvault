import React, { useMemo, useState } from "react";
import { useVault, type DecryptedEntry } from "../lib/vault";
import { PasswordGenerator } from "./PasswordGenerator";
import { SettingsDialog } from "./SettingsDialog";
import {
  Copy,
  Eye,
  EyeOff,
  Lock,
  Plus,
  Refresh,
  Settings,
  Shield,
  Trash,
  ExternalLink,
  Check,
} from "./Icons";

type SortKey = "site" | "username" | "updatedAt";

type TFn = (key: string, vars?: Record<string, string | number>) => string;

export function VaultScreen() {
  const { entries, lock, upsertEntry, removeEntry, touchActivity, t } =
    useVault();

  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [generatorFor, setGeneratorFor] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const arr = entries.filter(
      (e) =>
        !q ||
        e.site.toLowerCase().includes(q) ||
        e.url.toLowerCase().includes(q) ||
        e.username.toLowerCase().includes(q) ||
        e.notes.toLowerCase().includes(q)
    );
    arr.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const va = sortKey === "updatedAt" ? a.updatedAt : (a as any)[sortKey];
      const vb = sortKey === "updatedAt" ? b.updatedAt : (b as any)[sortKey];
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
    return arr;
  }, [entries, query, sortKey, sortDir]);

  function toggleReveal(id: string) {
    setRevealed((prev) => {
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
    await upsertEntry({
      site: t("vault.newEntry"),
      url: "",
      username: "",
      password: "",
      notes: "",
    });
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
      className="min-h-screen flex flex-col bg-ink-50"
      onMouseMove={touchActivity}
      onKeyDown={touchActivity}
    >
      <header className="bg-white border-b border-ink-200 px-4 py-2.5 flex items-center gap-3 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Shield className="text-accent-600" />
          <span className="font-semibold">MyPasswordApp</span>
        </div>
        <div className="flex-1 max-w-md ml-4">
          <input
            className="input"
            placeholder={t("vault.search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="ml-auto flex items-center gap-2 flex-wrap justify-end">
          <button
            className="btn-secondary"
            onClick={() => setShowAll((v) => !v)}
            title={t("vault.ttPasswords")}
          >
            {showAll ? <EyeOff /> : <Eye />}
            {showAll ? t("vault.maskAll") : t("vault.revealAll")}
          </button>
          <button className="btn-primary" onClick={addEntry}>
            <Plus /> {t("vault.addRow")}
          </button>
          <button
            className="btn-ghost"
            onClick={() => setShowSettings(true)}
            title={t("vault.settings")}
          >
            <Settings />
          </button>
          <button className="btn-secondary" onClick={lock} title={t("vault.lock")}>
            <Lock /> {t("vault.lock")}
          </button>
        </div>
      </header>

      <main className="flex-1 p-4">
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <colgroup>
                <col style={{ width: "18%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "24%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "6%" }} />
              </colgroup>
              <thead className="bg-ink-100/70 text-ink-700">
                <tr className="text-left">
                  <Th
                    onClick={() => toggleSort("site")}
                    active={sortKey === "site"}
                    dir={sortDir}
                  >
                    {t("vault.colSite")}
                  </Th>
                  <th className="px-3 py-2 font-medium">{t("vault.colUrl")}</th>
                  <Th
                    onClick={() => toggleSort("username")}
                    active={sortKey === "username"}
                    dir={sortDir}
                  >
                    {t("vault.colUser")}
                  </Th>
                  <th className="px-3 py-2 font-medium">{t("vault.colPass")}</th>
                  <th className="px-3 py-2 font-medium">{t("vault.colNotes")}</th>
                  <th className="px-3 py-2 font-medium text-center">
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
                        className="text-accent-600 hover:underline"
                        onClick={addEntry}
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
                    revealed={showAll || revealed.has(e.id)}
                    toggleReveal={() => toggleReveal(e.id)}
                    onChange={(patch) => upsertEntry({ id: e.id, ...patch })}
                    onDelete={() => removeEntry(e.id)}
                    onGenerate={() => setGeneratorFor(e.id)}
                    onCopy={copyText}
                    copiedKey={copiedKey}
                    t={t}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-ink-500 mt-3">
          {t("vault.footer", { count: filtered.length })}
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
      {showSettings && (
        <SettingsDialog onClose={() => setShowSettings(false)} />
      )}
    </div>
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
      className="px-3 py-2 font-medium cursor-pointer select-none hover:bg-ink-200/60"
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

interface RowProps {
  entry: DecryptedEntry;
  revealed: boolean;
  toggleReveal: () => void;
  onChange: (patch: Partial<DecryptedEntry>) => void;
  onDelete: () => void;
  onGenerate: () => void;
  onCopy: (text: string, key: string) => void;
  copiedKey: string | null;
  t: TFn;
}

function Row({
  entry,
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
    <tr className="border-t border-ink-100 hover:bg-ink-50/60 group">
      <Cell value={entry.site} onChange={(v) => onChange({ site: v })} />
      <td className="px-0 py-0 align-middle">
        <div className="flex items-center">
          <input
            className="cell-input flex-1"
            value={entry.url}
            onChange={(e) => onChange({ url: e.target.value })}
            placeholder={t("vault.phUrl")}
          />
          {entry.url && (
            <a
              className="px-2 text-ink-400 hover:text-accent-600"
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
          )}
        </div>
      </td>
      <td className="px-0 py-0 align-middle">
        <div className="flex items-center">
          <input
            className="cell-input flex-1"
            value={entry.username}
            onChange={(e) => onChange({ username: e.target.value })}
            placeholder={t("vault.phUser")}
          />
          <button
            type="button"
            className="px-2 text-ink-400 hover:text-accent-600 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onCopy(entry.username, `un:${entry.id}`)}
            title={t("vault.ttCopyUser")}
          >
            {copiedKey === `un:${entry.id}` ? <Check /> : <Copy />}
          </button>
        </div>
      </td>
      <td className="px-0 py-0 align-middle">
        <div className="flex items-center">
          <input
            className="cell-input flex-1 font-mono"
            type={revealed ? "text" : "password"}
            value={entry.password}
            onChange={(e) => onChange({ password: e.target.value })}
            placeholder={t("vault.phPass")}
            spellCheck={false}
            autoComplete="off"
          />
          <button
            type="button"
            className="px-1.5 text-ink-400 hover:text-accent-600"
            onClick={toggleReveal}
            title={revealed ? t("vault.hide") : t("vault.show")}
          >
            {revealed ? <EyeOff /> : <Eye />}
          </button>
          <button
            type="button"
            className="px-1.5 text-ink-400 hover:text-accent-600"
            onClick={() => onCopy(entry.password, `pw:${entry.id}`)}
            title={t("vault.ttCopyPass")}
          >
            {copiedKey === `pw:${entry.id}` ? <Check /> : <Copy />}
          </button>
          <button
            type="button"
            className="px-1.5 text-ink-400 hover:text-accent-600"
            onClick={onGenerate}
            title={t("vault.ttGenPass")}
          >
            <Refresh />
          </button>
        </div>
      </td>
      <Cell value={entry.notes} onChange={(v) => onChange({ notes: v })} />
      <td className="px-2 py-1 text-center align-middle">
        {!confirmDel ? (
          <button
            type="button"
            className="text-ink-400 hover:text-red-600 p-1"
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
      </td>
    </tr>
  );
}

function Cell({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [local, setLocal] = useState(value);
  React.useEffect(() => setLocal(value), [value]);
  return (
    <td className="px-0 py-0 align-middle">
      <input
        className="cell-input"
        value={local}
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
