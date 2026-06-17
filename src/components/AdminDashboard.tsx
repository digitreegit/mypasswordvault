import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowPathIcon,
  CheckIcon,
  ChevronDownIcon,
  ClipboardDocumentIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../lib/auth";
import { subscribeLocaleChanged } from "../lib/appLocale";
import { translate } from "../lib/i18n/bundles";
import {
  detectBrowserLocale,
  normalizeLocale,
  persistStoredLocale,
  readStoredLocale,
  localeToHtmlLang,
  type Locale,
} from "../lib/i18n/locale";
import { notifyLocaleChanged } from "../lib/appLocale";
import { LanguageMenu } from "./LanguageMenu";
import {
  adminAddComplaint,
  adminDeleteUser,
  adminGrantComplimentary,
  adminRefund,
  adminResolveComplaint,
  adminRevokeComplimentary,
  fetchAdminComplaints,
  fetchAdminCustomers,
  fetchAdminStats,
  fetchComplimentaryGrants,
  type AdminComplaint,
  type AdminComplimentaryGrant,
  type AdminCustomerRow,
  type AdminStats,
} from "../lib/adminApi";
import { AdminRegionBarChart, AdminSalesBarChart } from "./AdminSalesBarChart";
import { ModalCloseButton } from "./ModalCloseButton";
import {
  nativeFixedHeaderClass,
  nativeMainScrollClass,
  nativeScreenRootClass,
} from "../lib/nativeLayout";

const EMPTY_STATS: AdminStats = {
  sales_today: 0,
  sales_amount_cents_today: 0,
  sales_total: 0,
  sales_amount_cents_total: 0,
  free_signups_today: 0,
  paid_members: 0,
  free_members: 0,
  open_complaints: 0,
  sales_by_platform: { web: 0, ios: 0, android: 0 },
  sales_by_country: [],
};

function normalizeAdminStats(raw: Partial<AdminStats>): AdminStats {
  return {
    ...EMPTY_STATS,
    ...raw,
    sales_by_platform: {
      ...EMPTY_STATS.sales_by_platform,
      ...(raw.sales_by_platform ?? {}),
    },
    sales_by_country: raw.sales_by_country ?? [],
  };
}

function regionStatsForDisplay(
  stats: AdminStats,
): { country: string; count: number }[] {
  if (stats.sales_by_country.length > 0) return stats.sales_by_country;
  const paid = stats.sales_total ?? 0;
  if (paid <= 0) return [];
  return [{ country: "unknown", count: paid }];
}

const LICENSE_AMOUNT_CENTS = 499;
const CUSTOMERS_PAGE_SIZE = 100;

const ADMIN_HEADER_ICON_BTN =
  "inline-flex h-8 w-8 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-600 hover:bg-ink-50 transition-colors shrink-0";

const ADMIN_BTN =
  "inline-flex items-center justify-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0";
const ADMIN_BTN_TABLE =
  "inline-flex items-center justify-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] leading-tight font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 whitespace-nowrap";
const ADMIN_BTN_FIELD =
  "inline-flex items-center justify-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 self-end";
const ADMIN_BTN_PRIMARY = `${ADMIN_BTN} bg-accent-600 text-white hover:bg-accent-700`;
const ADMIN_BTN_PRIMARY_FIELD = `${ADMIN_BTN_FIELD} bg-accent-600 text-white hover:bg-accent-700`;
const ADMIN_BTN_SECONDARY = `${ADMIN_BTN} bg-white text-ink-800 hover:bg-ink-50 border border-ink-200`;
const ADMIN_BTN_SECONDARY_TABLE = `${ADMIN_BTN_TABLE} bg-white text-ink-800 hover:bg-ink-50 border border-ink-200`;
const ADMIN_BTN_SECONDARY_DANGER = `${ADMIN_BTN_SECONDARY} text-red-700 border-red-200 hover:bg-red-50`;
const ADMIN_BTN_SECONDARY_DANGER_TABLE = `${ADMIN_BTN_SECONDARY_TABLE} text-red-700 border-red-200 hover:bg-red-50`;

function formatMoney(cents: number | null, currency: string) {
  if (cents == null) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.toUpperCase(),
      signDisplay: cents < 0 ? "always" : "auto",
    }).format(cents / 100);
  } catch {
    return cents < 0
      ? `-$${(Math.abs(cents) / 100).toFixed(2)}`
      : `$${(cents / 100).toFixed(2)}`;
  }
}

function rowAmount(row: AdminCustomerRow): number | null {
  if (row.isAdmin) return null;
  if (row.amountCents != null) return row.amountCents;
  if (!row.licenseKey && !row.purchasedAt && !row.refunded) return null;
  const base = LICENSE_AMOUNT_CENTS;
  return row.refunded ? -base : base;
}

function displayPlatform(
  row: AdminCustomerRow,
): AdminCustomerRow["purchasePlatform"] {
  if (row.purchasePlatform) return row.purchasePlatform;
  if (row.licenseKey || row.purchasedAt || row.complimentary) return "web";
  if (row.isAdmin || row.plan === "pro") return "web";
  return null;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function platformLabel(
  platform: AdminCustomerRow["purchasePlatform"],
  t: (key: string) => string,
): string | null {
  if (!platform) return null;
  switch (platform) {
    case "web":
      return t("admin.platformWeb");
    case "ios":
      return t("admin.platformIos");
    case "android":
      return t("admin.platformAndroid");
    default:
      return null;
  }
}

function countryStatLabel(country: string, locale: Locale, t: (key: string) => string): string {
  if (country === "unknown") return t("admin.statsCountryUnknown");
  try {
    const name = new Intl.DisplayNames([localeToHtmlLang(locale)], {
      type: "region",
    }).of(country);
    return name ? `${name} (${country})` : country;
  } catch {
    return country;
  }
}

function AdminEmptyMark() {
  return <span className="text-ink-300">—</span>;
}

function AdminCustomerPlanBadges({
  row,
  planBadge,
  t,
}: {
  row: AdminCustomerRow;
  planBadge: { pro: string; free: string };
  t: (key: string) => string;
}) {
  if (row.isAdmin) {
    return (
      <span className="inline-flex rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800">
        {t("admin.badgeAdmin")}
      </span>
    );
  }
  if (row.refunded) {
    return (
      <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
        {t("admin.badgeRefunded")}
      </span>
    );
  }
  if (row.plan === "pro") {
    return (
      <span className="inline-flex flex-wrap items-center gap-1">
        <span className="inline-flex rounded-full border border-ink-200 bg-white px-2 py-0.5 text-xs font-medium text-ink-700">
          {planBadge.pro}
        </span>
        {row.complimentary ? (
          <span className="inline-flex rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800">
            {t("admin.badgeComplimentary")}
          </span>
        ) : null}
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-ink-100 px-2 py-0.5 text-xs text-ink-600">
      {planBadge.free}
    </span>
  );
}

function AdminCustomerActions({
  row,
  sessionUserId,
  busyId,
  t,
  onComplaint,
  onRefund,
  onDelete,
  className = "",
  compact = false,
}: {
  row: AdminCustomerRow;
  sessionUserId: string | undefined;
  busyId: string | null;
  t: (key: string) => string;
  onComplaint: (row: AdminCustomerRow) => void;
  onRefund: (row: AdminCustomerRow) => void;
  onDelete: (row: AdminCustomerRow) => void;
  className?: string;
  compact?: boolean;
}) {
  const btnSecondary = compact ? ADMIN_BTN_SECONDARY_TABLE : ADMIN_BTN_SECONDARY;
  const btnDanger = compact ? ADMIN_BTN_SECONDARY_DANGER_TABLE : ADMIN_BTN_SECONDARY_DANGER;
  const deleteBtnClass = compact
    ? "inline-flex shrink-0 items-center justify-center rounded-md p-1 text-ink-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
    : "inline-flex shrink-0 items-center justify-center rounded-md p-1.5 text-ink-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:pointer-events-none";

  return (
    <div
      className={`admin-customers-actions flex flex-row flex-nowrap gap-0.5 justify-end items-center ${className}`.trim()}
    >
      {!row.isAdmin ? (
        <button
          type="button"
          className={btnSecondary}
          disabled={busyId === `complaint-${row.userId}`}
          onClick={() => onComplaint(row)}
        >
          {t("admin.complaint")}
        </button>
      ) : null}
      {row.licenseKey && !row.refunded && !row.isAdmin && row.plan === "pro" ? (
        <button
          type="button"
          className={btnDanger}
          disabled={busyId === row.userId}
          onClick={() => void onRefund(row)}
        >
          {t("admin.refund")}
        </button>
      ) : null}
      <button
        type="button"
        className={deleteBtnClass}
        disabled={
          busyId === `delete-${row.userId}` || row.userId === sessionUserId
        }
        title={t("admin.deleteUser")}
        aria-label={t("admin.deleteUser")}
        onClick={() => onDelete(row)}
      >
        <TrashIcon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} aria-hidden />
      </button>
    </div>
  );
}

function AdminCustomerMobileCard({
  row,
  planBadge,
  sessionUserId,
  busyId,
  t,
  onComplaint,
  onRefund,
  onDelete,
}: {
  row: AdminCustomerRow;
  planBadge: { pro: string; free: string };
  sessionUserId: string | undefined;
  busyId: string | null;
  t: (key: string, vars?: Record<string, string | number>) => string;
  onComplaint: (row: AdminCustomerRow) => void;
  onRefund: (row: AdminCustomerRow) => void;
  onDelete: (row: AdminCustomerRow) => void;
}) {
  const amount = rowAmount(row);
  const platform = platformLabel(displayPlatform(row), t);

  return (
    <li className="px-4 py-4 space-y-3">
      <div className="min-w-0">
        {row.email ? (
          <p className="font-medium text-ink-900 break-all">{row.email}</p>
        ) : (
          <AdminEmptyMark />
        )}
        <div className="mt-2">
          <AdminCustomerPlanBadges row={row} planBadge={planBadge} t={t} />
        </div>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
        <dt className="text-ink-500">{t("admin.colPlatform")}</dt>
        <dd className="text-ink-800 min-w-0">
          {platform ?? <AdminEmptyMark />}
        </dd>

        <dt className="text-ink-500">{t("admin.colPurchased")}</dt>
        <dd className="text-ink-800 min-w-0">
          {row.purchasedAt ? formatDate(row.purchasedAt) : <AdminEmptyMark />}
        </dd>

        <dt className="text-ink-500">{t("admin.colAmount")}</dt>
        <dd
          className={`tabular-nums min-w-0 ${
            row.refunded && !row.isAdmin
              ? "text-red-700 font-medium"
              : amount != null
                ? "text-emerald-600 font-medium"
                : "text-ink-800"
          }`}
        >
          {amount != null ? (
            formatMoney(amount, row.currency)
          ) : (
            <AdminEmptyMark />
          )}
        </dd>

        {row.licenseKey ? (
          <>
            <dt className="text-ink-500 self-center">{t("admin.colLicenseKey")}</dt>
            <dd className="min-w-0">
              <LicenseKeyCell licenseKey={row.licenseKey} t={t} />
            </dd>
          </>
        ) : null}
      </dl>

      <AdminCustomerActions
        row={row}
        sessionUserId={sessionUserId}
        busyId={busyId}
        t={t}
        onComplaint={onComplaint}
        onRefund={onRefund}
        onDelete={onDelete}
        className="justify-start pt-1 border-t border-ink-100"
      />
    </li>
  );
}

function adminErrorLabel(
  code: string,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  const key = `admin.err.${code}`;
  const translated = t(key);
  if (translated !== key) return translated;
  if (/non-2xx/i.test(code)) return t("admin.err.function_error");
  return code;
}

function StatBox({
  label,
  value,
  amount,
  amountClassName = "text-emerald-600",
}: {
  label: string;
  value: string | number;
  amount?: string;
  amountClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
        {label}
      </p>
      <div className="mt-2 flex items-baseline justify-between gap-3">
        <p className="text-2xl font-semibold text-ink-900 tabular-nums">{value}</p>
        {amount ? (
          <p
            className={`text-base font-medium tabular-nums shrink-0 ${amountClassName}`}
          >
            {amount}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function LicenseKeyCell({
  licenseKey,
  t,
}: {
  licenseKey: string;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(licenseKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  const label = copied ? t("admin.licenseKeyCopied") : t("admin.copyLicenseKey");

  return (
    <div className="admin-license-key-cell flex items-center gap-1 min-w-0 w-full max-w-full overflow-hidden">
      <span
        className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs font-mono text-ink-700"
        title={licenseKey}
      >
        {licenseKey}
      </span>
      <button
        type="button"
        className="admin-license-key-copy inline-flex shrink-0 items-center justify-center rounded-md p-1 text-ink-600 hover:bg-ink-100 hover:text-ink-900 transition-colors disabled:opacity-50"
        aria-label={label}
        title={label}
        onClick={() => void handleCopy()}
      >
        {copied ? (
          <CheckIcon className="h-4 w-4 text-emerald-600" aria-hidden />
        ) : (
          <ClipboardDocumentIcon className="h-4 w-4" aria-hidden />
        )}
      </button>
    </div>
  );
}

function AdminPortalDialog({
  titleId,
  title,
  closeLabel,
  onClose,
  children,
  footer,
}: {
  titleId: string;
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="card w-full max-w-md shadow-lg max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="action-modal__header px-5 py-3 border-b border-ink-200">
          <div className="flex items-center justify-between gap-2">
            <h2
              id={titleId}
              className="font-sans text-lg font-semibold text-ink-900 tracking-tight leading-tight"
            >
              {title}
            </h2>
            <ModalCloseButton onClick={onClose} ariaLabel={closeLabel} />
          </div>
        </div>
        <div className="px-5 py-4 space-y-3 keyboard-scroll-root min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
        <div className="action-modal__footer px-5 py-3 border-t border-ink-100 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          {footer}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function AdminSelect({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label text-xs" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          className="input text-sm w-full appearance-none bg-white pr-10"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {children}
        </select>
        <span
          className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-ink-400"
          aria-hidden
        >
          <ChevronDownIcon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const { session, signOut } = useAuth();
  const [locale, setLocale] = useState<Locale>(
    () => readStoredLocale() ?? normalizeLocale(detectBrowserLocale()),
  );
  const t = useCallback(
    (k: string, v?: Record<string, string | number>) => translate(locale, k, v),
    [locale],
  );

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [rows, setRows] = useState<AdminCustomerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [complaints, setComplaints] = useState<AdminComplaint[]>([]);
  const [grants, setGrants] = useState<AdminComplimentaryGrant[]>([]);
  const [grantEmail, setGrantEmail] = useState("");
  const [grantNote, setGrantNote] = useState("");
  const [grantMsg, setGrantMsg] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [plan, setPlan] = useState<"all" | "pro" | "free">("all");
  const [refunded, setRefunded] = useState<"all" | "yes" | "no">("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [complaintTarget, setComplaintTarget] = useState<AdminCustomerRow | null>(
    null,
  );
  const [complaintNote, setComplaintNote] = useState("");
  const [complaintError, setComplaintError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCustomerRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [refundTarget, setRefundTarget] = useState<AdminCustomerRow | null>(null);
  const [refundError, setRefundError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(
    null,
  );

  useEffect(() => subscribeLocaleChanged(setLocale), []);

  const changeLocale = useCallback((next: Locale) => {
    const L = normalizeLocale(next);
    setLocale(L);
    persistStoredLocale(L);
    notifyLocaleChanged(L);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadingMore(false);
    setError(null);

    const [statsR, listR, compR, grantsR] = await Promise.all([
      fetchAdminStats(),
      fetchAdminCustomers({
        q,
        plan,
        refunded,
        limit: CUSTOMERS_PAGE_SIZE,
        offset: 0,
      }),
      fetchAdminComplaints(),
      fetchComplimentaryGrants(),
    ]);

    const fatalCode =
      (!statsR.ok &&
        (statsR.error === "forbidden" ||
          statsR.error === "admin_not_configured")) ||
      (!listR.ok &&
        (listR.error === "forbidden" ||
          listR.error === "admin_not_configured"))
        ? !statsR.ok
          ? statsR.error
          : !listR.ok
            ? listR.error
            : "forbidden"
        : null;

    if (fatalCode) {
      setError(fatalCode);
      setLoading(false);
      return;
    }

    const errors: string[] = [];

    if (statsR.ok) setStats(normalizeAdminStats(statsR.data.stats));
    else if (listR.ok) setStats(EMPTY_STATS);
    else errors.push(adminErrorLabel(statsR.error, t));

    if (listR.ok) {
      setRows(listR.data.rows);
      setTotal(listR.data.total);
    } else errors.push(adminErrorLabel(listR.error, t));

    if (compR.ok) setComplaints(compR.data.complaints);
    if (grantsR.ok) setGrants(grantsR.data.grants);

    setError(errors.length ? errors.join(" · ") : null);
    setLoading(false);
  }, [q, plan, refunded, t]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore) return;
    setLoadingMore(true);
    setError(null);

    const listR = await fetchAdminCustomers({
      q,
      plan,
      refunded,
      limit: CUSTOMERS_PAGE_SIZE,
      offset: rows.length,
    });

    if (!listR.ok) {
      setError(adminErrorLabel(listR.error, t));
      setLoadingMore(false);
      return;
    }

    setRows((prev) => [...prev, ...listR.data.rows]);
    setTotal(listR.data.total);
    setLoadingMore(false);
  }, [loading, loadingMore, q, plan, refunded, rows.length, t]);

  const hasMore = rows.length < total;
  const listSentinelEl = useRef<HTMLElement | null>(null);
  const setListSentinelRef = useCallback((el: HTMLLIElement | HTMLTableRowElement | null) => {
    listSentinelEl.current = el;
  }, []);
  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;

  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;
    const el = listSentinelEl.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMoreRef.current();
      },
      { root: null, rootMargin: "240px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, rows.length]);

  useEffect(() => {
    void load();
  }, [load]);

  const planBadge = useMemo(
    () => ({
      pro: t("settings.planBadgePro"),
      free: t("settings.planBadgeFree"),
    }),
    [t],
  );

  const regionStats = useMemo(
    () => (stats ? regionStatsForDisplay(stats) : []),
    [stats],
  );

  function openRefundModal(row: AdminCustomerRow) {
    if (!row.licenseKey || row.refunded) return;
    setRefundError(null);
    setRefundTarget(row);
  }

  function closeRefundModal() {
    setRefundTarget(null);
    setRefundError(null);
  }

  async function submitRefund() {
    if (!refundTarget?.licenseKey || refundTarget.refunded) return;
    const row = refundTarget;
    const sessionId = row.licenseKey;
    if (!sessionId) return;
    setRefundError(null);
    setBusyId(row.userId);
    const r = await adminRefund(sessionId);
    setBusyId(null);
    if (!r.ok) {
      setRefundError(adminErrorLabel(r.error, t));
      return;
    }
    closeRefundModal();
    void load();
  }

  async function handleRefund(row: AdminCustomerRow) {
    openRefundModal(row);
  }

  useEffect(() => {
    if (!complaintTarget && !deleteTarget && !refundTarget && !notice) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (notice) setNotice(null);
        else if (refundTarget) closeRefundModal();
        else if (deleteTarget) closeDeleteModal();
        else closeComplaintModal();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [complaintTarget, deleteTarget, refundTarget, notice]);

  function openComplaintModal(row: AdminCustomerRow) {
    setComplaintError(null);
    setComplaintTarget(row);
    setComplaintNote("");
  }

  function closeComplaintModal() {
    setComplaintTarget(null);
    setComplaintNote("");
    setComplaintError(null);
  }

  async function submitComplaint() {
    if (!complaintTarget) return;
    const row = complaintTarget;
    setComplaintError(null);
    setBusyId(`complaint-${row.userId}`);
    const r = await adminAddComplaint({
      sessionId: row.licenseKey ?? undefined,
      userId: row.userId,
      email: row.email || undefined,
      note: complaintNote.trim() || undefined,
    });
    setBusyId(null);
    if (!r.ok) {
      setComplaintError(adminErrorLabel(r.error, t));
      return;
    }
    closeComplaintModal();
    void load();
  }

  async function submitDeleteUser() {
    if (!deleteTarget) return;
    const row = deleteTarget;
    setDeleteError(null);
    setBusyId(`delete-${row.userId}`);
    const r = await adminDeleteUser(row.userId);
    setBusyId(null);
    if (!r.ok) {
      setDeleteError(adminErrorLabel(r.error, t));
      return;
    }
    closeDeleteModal();
    void load();
  }

  function openDeleteModal(row: AdminCustomerRow) {
    if (row.userId === session?.user?.id) return;
    setDeleteError(null);
    setDeleteTarget(row);
  }

  function closeDeleteModal() {
    setDeleteTarget(null);
    setDeleteError(null);
  }

  async function handleResolveComplaint(id: string) {
    setBusyId(`resolve-${id}`);
    const r = await adminResolveComplaint(id);
    setBusyId(null);
    if (!r.ok) {
      setNotice({
        title: t("admin.noticeTitle"),
        message: t("admin.resolveFailed", {
          error: adminErrorLabel(r.error, t),
        }),
      });
      return;
    }
    void load();
  }

  async function handleGrantComplimentary(e: React.FormEvent) {
    e.preventDefault();
    const email = grantEmail.trim();
    if (!email) return;
    setGrantMsg(null);
    setBusyId("grant-complimentary");
    const r = await adminGrantComplimentary({
      email,
      note: grantNote.trim() || undefined,
    });
    setBusyId(null);
    if (!r.ok) {
      setGrantMsg(
        t("admin.complimentaryGrantFailed", {
          error: adminErrorLabel(r.error, t),
        }),
      );
      return;
    }
    setGrantEmail("");
    setGrantNote("");
    setGrantMsg(
      r.data.applied
        ? t("admin.complimentaryGranted", { email: r.data.grant.email })
        : t("admin.complimentaryGrantedPending", { email: r.data.grant.email }),
    );
    void load();
  }

  async function handleRevokeComplimentary(id: string) {
    setBusyId(`revoke-grant-${id}`);
    const r = await adminRevokeComplimentary(id);
    setBusyId(null);
    if (!r.ok) {
      setNotice({
        title: t("admin.noticeTitle"),
        message: t("admin.complimentaryRevokeFailed", {
          error: adminErrorLabel(r.error, t),
        }),
      });
      return;
    }
    void load();
  }

  const grantEmailsWithAccount = useMemo(() => {
    const set = new Set(rows.map((r) => r.email.trim().toLowerCase()).filter(Boolean));
    return set;
  }, [rows]);

  if (error === "forbidden") {
    return (
      <div className="min-h-screen min-h-[100dvh] flex items-center justify-center px-4 bg-ink-50">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-lg font-semibold text-ink-900">
            {t("admin.forbiddenTitle")}
          </h1>
          <p className="text-sm text-ink-600">{t("admin.forbiddenBody")}</p>
          <a href="#/" className="btn-primary inline-block">
            {t("admin.backToApp")}
          </a>
        </div>
      </div>
    );
  }

  if (error === "admin_not_configured") {
    return (
      <div className="min-h-screen min-h-[100dvh] flex items-center justify-center px-4 bg-ink-50">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-lg font-semibold text-ink-900">
            {t("admin.notConfiguredTitle")}
          </h1>
          <p className="text-sm text-ink-600">{t("admin.notConfiguredBody")}</p>
          <a href="#/" className="btn-primary inline-block">
            {t("admin.backToApp")}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={nativeScreenRootClass("bg-ink-50 text-ink-900")}>
      <header
        className={`${nativeFixedHeaderClass()} border-b border-ink-200 bg-white`}
      >
        <div className="admin-page max-w-7xl mx-auto w-full min-w-0 box-border py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">{t("admin.title")}</h1>
            <p className="text-xs text-ink-500 mt-0.5">
              {session?.user?.email ?? "—"} · {t("admin.subtitle")}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <button
              type="button"
              className="btn-secondary p-2"
              aria-label={t("admin.refresh")}
              title={t("admin.refresh")}
              onClick={() => void load()}
            >
              <ArrowPathIcon className="h-5 w-5" aria-hidden />
            </button>
            <a href="#/" className="btn-primary text-sm">
              {t("admin.app")}
            </a>
            <button
              type="button"
              className="btn-ghost text-sm"
              onClick={() => void signOut()}
            >
              {t("admin.signOut")}
            </button>
            <LanguageMenu
              value={locale}
              onChange={changeLocale}
              ariaLabel={t("settings.language")}
              align="right"
              triggerClassName={ADMIN_HEADER_ICON_BTN}
            />
          </div>
        </div>
      </header>

      <main
        className={nativeMainScrollClass(
          "admin-page max-w-7xl mx-auto w-full min-w-0 box-border py-6 space-y-6"
        )}
      >
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {t("admin.errorPrefix")}: {error}
          </div>
        ) : null}

        {stats ? (
          <div className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <StatBox
                label={t("admin.statsFreeSignupsToday")}
                value={stats.free_signups_today}
              />
              <StatBox
                label={t("admin.statsSalesProToday")}
                value={stats.sales_today}
                amount={formatMoney(stats.sales_amount_cents_today, "usd")}
              />
              <StatBox
                label={t("admin.statsSalesProTotal")}
                value={stats.sales_total ?? 0}
                amount={formatMoney(stats.sales_amount_cents_total ?? 0, "usd")}
              />
            </div>
            <AdminSalesBarChart stats={stats} t={t} formatMoney={formatMoney} />
            {regionStats.length > 0 ? (
              <AdminRegionBarChart
                title={t("admin.statsByRegion")}
                items={regionStats}
                labelForCountry={(country) => countryStatLabel(country, locale, t)}
                t={t}
              />
            ) : null}
          </div>
        ) : null}

        <section className="rounded-xl border border-violet-200 bg-violet-50/60 p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-violet-900">
            {t("admin.complimentaryTitle")}
          </h2>
          <p className="text-xs text-violet-800/80 mt-1 leading-snug">
            {t("admin.complimentaryHint")}
          </p>

          <form
            className="mt-4 flex flex-wrap items-end gap-3"
            onSubmit={(e) => void handleGrantComplimentary(e)}
          >
            <div className="flex-1 min-w-[12rem]">
              <label className="label text-xs" htmlFor="admin-grant-email">
                {t("admin.complimentaryEmailLabel")}
              </label>
              <input
                id="admin-grant-email"
                type="email"
                className="input w-full text-sm bg-white"
                value={grantEmail}
                onChange={(e) => setGrantEmail(e.target.value)}
                placeholder={t("admin.complimentaryEmailPlaceholder")}
                required
              />
            </div>
            <div className="flex-1 min-w-[10rem]">
              <label className="label text-xs" htmlFor="admin-grant-note">
                {t("admin.complimentaryNoteLabel")}
              </label>
              <input
                id="admin-grant-note"
                className="input w-full text-sm bg-white"
                value={grantNote}
                onChange={(e) => setGrantNote(e.target.value)}
                placeholder={t("admin.complimentaryNotePlaceholder")}
              />
            </div>
            <button
              type="submit"
              className={ADMIN_BTN_PRIMARY_FIELD}
              disabled={
                !grantEmail.trim() || busyId === "grant-complimentary"
              }
            >
              {t("admin.complimentaryGrant")}
            </button>
          </form>

          {grantMsg ? (
            <p className="mt-3 text-xs text-violet-900">{grantMsg}</p>
          ) : null}

          {grants.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {grants.map((g) => {
                const hasAccount = grantEmailsWithAccount.has(
                  g.email.trim().toLowerCase(),
                );
                return (
                  <li
                    key={g.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/90 px-3 py-2 text-sm border border-violet-100"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-ink-800 break-all">
                        {g.email}
                      </p>
                      {g.note ? (
                        <p className="text-ink-600 text-xs mt-0.5">{g.note}</p>
                      ) : null}
                      <p className="text-ink-400 text-xs mt-1">
                        {formatDate(g.granted_at)}
                        {!hasAccount ? (
                          <span className="ml-2 text-violet-600">
                            · {t("admin.complimentaryPending")}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={ADMIN_BTN_SECONDARY_DANGER}
                      disabled={busyId === `revoke-grant-${g.id}`}
                      onClick={() => void handleRevokeComplimentary(g.id)}
                    >
                      {t("admin.complimentaryRevoke")}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>

        {complaints.length > 0 ? (
          <section className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-amber-900 mb-3">
              {t("admin.openComplaints")}
            </h2>
            <ul className="space-y-2">
              {complaints.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-100 bg-white/90 px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-ink-800">
                      {c.account_email || c.stripe_checkout_session_id || c.user_id}
                    </p>
                    {c.note ? (
                      <p className="text-ink-600 text-xs mt-0.5">{c.note}</p>
                    ) : null}
                    <p className="text-ink-400 text-xs mt-1">
                      {formatDate(c.created_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={ADMIN_BTN_SECONDARY}
                    disabled={busyId === `resolve-${c.id}`}
                    onClick={() => void handleResolveComplaint(c.id)}
                  >
                    {t("admin.resolved")}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="rounded-xl border border-ink-200 bg-white shadow-sm overflow-hidden">
          <div className="p-4 border-b border-ink-100 space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[12rem]">
                <label className="label text-xs" htmlFor="admin-search">
                  {t("admin.searchLabel")}
                </label>
                <input
                  id="admin-search"
                  className="input w-full text-sm"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t("admin.searchPlaceholder")}
                />
              </div>
              <AdminSelect
                id="admin-plan"
                label={t("admin.planLabel")}
                value={plan}
                onChange={(v) => setPlan(v as typeof plan)}
              >
                <option value="all">{t("admin.filterAll")}</option>
                <option value="pro">{t("admin.filterPro")}</option>
                <option value="free">{t("admin.filterFree")}</option>
              </AdminSelect>
              <AdminSelect
                id="admin-refunded"
                label={t("admin.refundFilterLabel")}
                value={refunded}
                onChange={(v) => setRefunded(v as typeof refunded)}
              >
                <option value="all">{t("admin.filterAll")}</option>
                <option value="no">{t("admin.filterNotRefunded")}</option>
                <option value="yes">{t("admin.filterRefunded")}</option>
              </AdminSelect>
              <button
                type="button"
                className={ADMIN_BTN_PRIMARY_FIELD}
                disabled={!q.trim()}
                onClick={() => void load()}
              >
                {t("admin.apply")}
              </button>
            </div>
            <p className="text-xs text-ink-500">
              {loading
                ? t("admin.loading")
                : t("admin.totalCount", { total, shown: rows.length })}
            </p>
          </div>

          <ul className="md:hidden divide-y divide-ink-100 list-none m-0 p-0">
            {rows.length === 0 && !loading ? (
              <li className="px-4 py-8 text-center text-sm text-ink-500">
                {t("admin.noResults")}
              </li>
            ) : null}
            {rows.map((row) => (
              <AdminCustomerMobileCard
                key={row.userId}
                row={row}
                planBadge={planBadge}
                sessionUserId={session?.user?.id}
                busyId={busyId}
                t={t}
                onComplaint={openComplaintModal}
                onRefund={handleRefund}
                onDelete={openDeleteModal}
              />
            ))}
            {hasMore ? (
              <li
                ref={setListSentinelRef}
                className="px-4 py-4 text-center text-xs text-ink-500"
              >
                {loadingMore ? t("admin.loadingMore") : t("admin.scrollForMore")}
              </li>
            ) : null}
          </ul>

          <div className="hidden md:block overflow-x-auto overscroll-x-contain">
            <table className="admin-customers-table w-full table-fixed text-left">
              <colgroup>
                <col className="admin-customers-col-email" />
                <col className="admin-customers-col-plan" />
                <col className="admin-customers-col-platform" />
                <col className="admin-customers-col-purchased" />
                <col className="admin-customers-col-amount" />
                <col className="admin-customers-col-license" />
                <col className="admin-customers-col-actions" />
              </colgroup>
              <thead className="bg-ink-50 text-ink-500 text-xs">
                <tr>
                  <th className="px-4 py-2 font-medium text-xs text-ink-500">
                    {t("admin.colEmail")}
                  </th>
                  <th className="px-4 py-2 font-medium text-xs text-ink-500">
                    {t("admin.colPlan")}
                  </th>
                  <th className="px-4 py-2 font-medium text-xs text-ink-500">
                    {t("admin.colPlatform")}
                  </th>
                  <th className="px-4 py-2 font-medium text-xs text-ink-500">
                    {t("admin.colPurchased")}
                  </th>
                  <th className="px-4 py-2 font-medium text-xs text-ink-500">
                    {t("admin.colAmount")}
                  </th>
                  <th className="px-4 py-2 font-medium text-xs text-ink-500">
                    {t("admin.colLicenseKey")}
                  </th>
                  <th className="px-4 py-2 font-medium text-xs text-ink-500 text-right">
                    {t("admin.colActions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 text-sm">
                {rows.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-ink-500">
                      {t("admin.noResults")}
                    </td>
                  </tr>
                ) : null}
                {rows.map((row) => (
                  <tr key={row.userId} className="hover:bg-ink-50/50">
                    <td className="px-4 py-3 align-middle overflow-hidden">
                      {row.email ? (
                        <div
                          className="font-medium text-ink-800 truncate"
                          title={row.email}
                        >
                          {row.email}
                        </div>
                      ) : (
                        <AdminEmptyMark />
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle whitespace-nowrap overflow-hidden">
                      <AdminCustomerPlanBadges
                        row={row}
                        planBadge={planBadge}
                        t={t}
                      />
                    </td>
                    <td className="px-3 py-3 align-middle whitespace-nowrap overflow-hidden text-ink-700">
                      {platformLabel(displayPlatform(row), t) ?? (
                        <AdminEmptyMark />
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle whitespace-nowrap text-ink-700">
                      {row.purchasedAt ? (
                        formatDate(row.purchasedAt)
                      ) : (
                        <AdminEmptyMark />
                      )}
                    </td>
                    <td
                      className={`px-4 py-3 align-middle whitespace-nowrap tabular-nums ${
                        row.refunded && !row.isAdmin
                          ? "text-red-700 font-medium"
                          : rowAmount(row) != null
                            ? "text-emerald-600 font-medium"
                            : ""
                      }`}
                    >
                      {rowAmount(row) != null ? (
                        formatMoney(rowAmount(row), row.currency)
                      ) : (
                        <AdminEmptyMark />
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle overflow-hidden">
                      {row.licenseKey ? (
                        <LicenseKeyCell licenseKey={row.licenseKey} t={t} />
                      ) : (
                        <AdminEmptyMark />
                      )}
                    </td>
                    <td className="admin-customers-actions-cell px-3 py-3 align-middle text-right whitespace-nowrap">
                      <AdminCustomerActions
                        row={row}
                        sessionUserId={session?.user?.id}
                        busyId={busyId}
                        t={t}
                        compact
                        onComplaint={openComplaintModal}
                        onRefund={handleRefund}
                        onDelete={openDeleteModal}
                      />
                    </td>
                  </tr>
                ))}
                {hasMore ? (
                  <tr ref={setListSentinelRef}>
                    <td colSpan={7} className="px-4 py-4 text-center text-xs text-ink-500">
                      {loadingMore ? t("admin.loadingMore") : t("admin.scrollForMore")}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {complaintTarget
        ? createPortal(
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40"
              role="presentation"
              onClick={closeComplaintModal}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="admin-complaint-title"
                className="card w-full max-w-md shadow-lg max-h-[85vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="action-modal__header px-5 py-3 border-b border-ink-200">
                  <div className="flex items-center justify-between gap-2">
                    <h2
                      id="admin-complaint-title"
                      className="font-sans text-lg font-semibold text-ink-900 tracking-tight leading-tight"
                    >
                      {t("admin.complaintModalTitle")}
                    </h2>
                    <ModalCloseButton
                      onClick={closeComplaintModal}
                      ariaLabel={t("common.close")}
                    />
                  </div>
                </div>
                <div className="px-5 py-4 space-y-4 keyboard-scroll-root min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  <p className="text-sm text-ink-600 break-all">
                    {complaintTarget.email || complaintTarget.userId}
                  </p>
                  <div>
                    <label
                      className="label text-xs"
                      htmlFor="admin-complaint-note"
                    >
                      {t("admin.complaintNoteLabel")}
                    </label>
                    <textarea
                      id="admin-complaint-note"
                      className="input w-full min-h-[5.5rem] resize-y text-sm leading-snug"
                      value={complaintNote}
                      onChange={(e) => setComplaintNote(e.target.value)}
                      placeholder={t("admin.complaintNotePlaceholder")}
                      autoFocus
                    />
                  </div>
                  {complaintError ? (
                    <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                      {t("admin.complaintFailed", { error: complaintError })}
                    </p>
                  ) : null}
                </div>
                <div className="action-modal__footer px-5 py-3 border-t border-ink-100 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                  <button
                    type="button"
                    className="btn-secondary text-sm w-full sm:w-auto"
                    onClick={closeComplaintModal}
                    disabled={busyId === `complaint-${complaintTarget.userId}`}
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    type="button"
                    className="btn-primary text-sm w-full sm:w-auto"
                    disabled={busyId === `complaint-${complaintTarget.userId}`}
                    onClick={() => void submitComplaint()}
                  >
                    {t("admin.complaintSubmit")}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {refundTarget ? (
        <AdminPortalDialog
          titleId="admin-refund-title"
          title={t("admin.refundModalTitle")}
          closeLabel={t("common.close")}
          onClose={closeRefundModal}
          footer={
            <>
              <button
                type="button"
                className="btn-secondary text-sm w-full sm:w-auto"
                onClick={closeRefundModal}
                disabled={busyId === refundTarget.userId}
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                className="btn-danger text-sm w-full sm:w-auto"
                disabled={busyId === refundTarget.userId}
                onClick={() => void submitRefund()}
              >
                {t("admin.refundConfirmAction")}
              </button>
            </>
          }
        >
          <p className="text-sm text-ink-700 leading-snug">
            {t("admin.refundModalBody")}
          </p>
          <p className="text-sm font-medium text-ink-900 break-all">
            {refundTarget.email || refundTarget.userId}
          </p>
          <div>
            <p className="label text-xs mb-1">
              {t("admin.refundModalSessionLabel")}
            </p>
            <p className="text-xs font-mono text-ink-600 break-all rounded-md border border-ink-200 bg-ink-50 px-3 py-2">
              {refundTarget.licenseKey}
            </p>
          </div>
          {refundError ? (
            <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {t("admin.refundFailed", { error: refundError })}
            </p>
          ) : null}
        </AdminPortalDialog>
      ) : null}

      {notice ? (
        <AdminPortalDialog
          titleId="admin-notice-title"
          title={notice.title}
          closeLabel={t("common.close")}
          onClose={() => setNotice(null)}
          footer={
            <button
              type="button"
              className="btn-primary text-sm w-full sm:w-auto"
              onClick={() => setNotice(null)}
            >
              {t("common.confirm")}
            </button>
          }
        >
          <p className="text-sm text-ink-700 leading-snug whitespace-pre-wrap">
            {notice.message}
          </p>
        </AdminPortalDialog>
      ) : null}

      {deleteTarget
        ? createPortal(
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40"
              role="presentation"
              onClick={closeDeleteModal}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="admin-delete-title"
                className="card w-full max-w-md shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="action-modal__header px-5 py-3 border-b border-ink-200">
                  <div className="flex items-center justify-between gap-2">
                    <h2
                      id="admin-delete-title"
                      className="font-sans text-lg font-semibold text-ink-900 tracking-tight leading-tight"
                    >
                      {t("admin.deleteUser")}
                    </h2>
                    <ModalCloseButton
                      onClick={closeDeleteModal}
                      ariaLabel={t("common.close")}
                    />
                  </div>
                </div>
                <div className="px-5 py-4 space-y-3">
                  <p className="text-sm text-ink-700 leading-snug">
                    {t("admin.deleteUserModalBody", {
                      label: deleteTarget.email || deleteTarget.userId,
                    })}
                  </p>
                  <p className="text-sm text-red-700 leading-snug">
                    {t("admin.deleteUserModalWarning")}
                  </p>
                  {deleteError ? (
                    <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                      {t("admin.deleteUserFailed", { error: deleteError })}
                    </p>
                  ) : null}
                </div>
                <div className="action-modal__footer px-5 py-3 border-t border-ink-100 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                  <button
                    type="button"
                    className="btn-secondary text-sm w-full sm:w-auto"
                    onClick={closeDeleteModal}
                    disabled={busyId === `delete-${deleteTarget.userId}`}
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    type="button"
                    className="btn-danger text-sm w-full sm:w-auto"
                    disabled={busyId === `delete-${deleteTarget.userId}`}
                    onClick={() => void submitDeleteUser()}
                  >
                    {t("admin.deleteUserConfirmAction")}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
