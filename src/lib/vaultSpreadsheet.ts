import { AppError } from "./errors";

/** Stable English headers so CSV round-trips across UI locales. */
export const SPREADSHEET_HEADERS = [
  "Category",
  "Site",
  "Username",
  "Password",
  "URL",
  "Memo",
] as const;

export type SpreadsheetRow = {
  category: string;
  site: string;
  username: string;
  password: string;
  url: string;
  memo: string;
};

function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Excel (EU) often exports `;` — pick delimiter from the header row. */
function sniffDelimiter(headerLine: string): "," | ";" {
  let commas = 0;
  let semis = 0;
  let inQuotes = false;
  for (let i = 0; i < headerLine.length; i++) {
    const ch = headerLine[i];
    if (ch === '"') {
      if (inQuotes && headerLine[i + 1] === '"') {
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }
    if (inQuotes) continue;
    if (ch === ",") commas++;
    else if (ch === ";") semis++;
  }
  return semis > commas ? ";" : ",";
}

function parseCsvLine(line: string, delimiter: "," | ";" = ","): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === delimiter) {
      fields.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  fields.push(cur);
  return fields;
}

/** Split CSV text into rows, respecting quoted newlines. */
function splitCsvRows(text: string): string[] {
  const rows: string[] = [];
  let cur = "";
  let inQuotes = false;
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    if (inQuotes) {
      if (ch === '"') {
        if (normalized[i + 1] === '"') {
          cur += '""';
          i++;
        } else {
          inQuotes = false;
          cur += ch;
        }
      } else {
        cur += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      cur += ch;
      continue;
    }
    if (ch === "\n") {
      rows.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  if (cur.length > 0) rows.push(cur);
  return rows;
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, "");
}

/**
 * Headers from our export plus common Chrome / Safari / Bitwarden / 1Password CSVs.
 * normalizeHeader lowercases and strips spaces — keep spaced and underscored forms.
 */
const HEADER_ALIASES: Record<keyof SpreadsheetRow, string[]> = {
  category: ["category", "folder", "group", "vault", "tags"],
  site: [
    "site",
    "title",
    "name",
    "service",
    "account",
    "item",
    "loginname",
    "login_name",
  ],
  username: [
    "username",
    "user",
    "login",
    "email",
    "login_username",
    "loginusername",
    "usernamevalue",
  ],
  password: [
    "password",
    "pass",
    "secret",
    "login_password",
    "loginpassword",
    "passwd",
  ],
  url: [
    "url",
    "website",
    "link",
    "uri",
    "login_uri",
    "loginuri",
    "web",
    "urls",
    "websiteurl",
  ],
  memo: [
    "memo",
    "notes",
    "note",
    "comment",
    "otpauth",
    "login_totp",
    "logintotp",
    "totp",
    "onetimepassword",
  ],
};

function mapHeaders(headers: string[]): Partial<Record<keyof SpreadsheetRow, number>> {
  const map: Partial<Record<keyof SpreadsheetRow, number>> = {};
  headers.forEach((raw, index) => {
    const key = normalizeHeader(raw);
    for (const [field, aliases] of Object.entries(HEADER_ALIASES) as [
      keyof SpreadsheetRow,
      string[],
    ][]) {
      if (aliases.includes(key) && map[field] == null) {
        map[field] = index;
      }
    }
  });
  return map;
}

export function buildSpreadsheetCsv(
  rows: SpreadsheetRow[],
): string {
  const lines = [
    SPREADSHEET_HEADERS.join(","),
    ...rows.map((r) =>
      [
        escapeCsvField(r.category),
        escapeCsvField(r.site),
        escapeCsvField(r.username),
        escapeCsvField(r.password),
        escapeCsvField(r.url),
        escapeCsvField(r.memo),
      ].join(","),
    ),
  ];
  // UTF-8 BOM helps Excel open Unicode correctly.
  return `\uFEFF${lines.join("\n")}\n`;
}

export function parseSpreadsheetCsv(text: string): SpreadsheetRow[] {
  const raw = text.trim();
  if (!raw) throw new AppError("errors.invalidSpreadsheet");
  const lines = splitCsvRows(raw);
  if (lines.length < 2) throw new AppError("errors.invalidSpreadsheet");

  const delimiter = sniffDelimiter(lines[0]!);
  const headerFields = parseCsvLine(lines[0]!, delimiter);
  const col = mapHeaders(headerFields);
  if (col.site == null && col.username == null && col.password == null) {
    throw new AppError("errors.invalidSpreadsheet");
  }

  const rows: SpreadsheetRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!;
    if (!line.trim()) continue;
    const fields = parseCsvLine(line, delimiter);
    const get = (key: keyof SpreadsheetRow) => {
      const idx = col[key];
      return idx == null ? "" : (fields[idx] ?? "").trim();
    };
    const row: SpreadsheetRow = {
      category: get("category"),
      site: get("site"),
      username: get("username"),
      password: get("password"),
      url: get("url"),
      memo: get("memo"),
    };
    if (
      !row.category &&
      !row.site &&
      !row.username &&
      !row.password &&
      !row.url &&
      !row.memo
    ) {
      continue;
    }
    rows.push(row);
  }
  if (rows.length === 0) throw new AppError("errors.invalidSpreadsheet");
  return rows;
}
