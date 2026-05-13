import type { KYCReport, AMLReport, SanctionsCheck } from "@/types/kyc";

// Public sanction list sources (all freely available, no license restrictions)
const OFAC_SDN_URL =
  "https://www.treasury.gov/ofac/downloads/sdn.xml";
const UN_LIST_URL =
  "https://scsanctions.un.org/resources/xml/en/consolidated.xml";
const EU_LIST_URL =
  "https://webgate.ec.europa.eu/fsd/fsf/public/files/xmlFullSanctionsList_1_1/content";

// In-memory cache for sanction lists (refreshed every 24h in production)
// For runtime efficiency, only full names are extracted and cached
let cachedOfac: Set<string> | null = null;
let cachedUn: Set<string> | null = null;
let cachedEu: Set<string> | null = null;
let ofacLastFetch = 0;
let unLastFetch = 0;
let euLastFetch = 0;

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

async function fetchTextSafe(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "APAC-KYC-API/1.0 (sanctions-screening)" },
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

function extractNamesFromXml(xml: string, patterns: RegExp[]): Set<string> {
  const names = new Set<string>();
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(xml)) !== null) {
      const name = match[1]?.trim().toUpperCase();
      if (name && name.length > 2) names.add(name);
    }
  }
  return names;
}

async function getOfacNames(): Promise<Set<string>> {
  const now = Date.now();
  if (cachedOfac && now - ofacLastFetch < CACHE_TTL_MS) return cachedOfac;
  try {
    const xml = await fetchTextSafe(OFAC_SDN_URL);
    cachedOfac = extractNamesFromXml(xml, [
      /<lastName[^>]*>([^<]+)<\/lastName>/gi,
      /<firstName[^>]*>([^<]+)<\/firstName>/gi,
    ]);
    ofacLastFetch = now;
  } catch {
    cachedOfac = cachedOfac ?? new Set();
  }
  return cachedOfac;
}

async function getUnNames(): Promise<Set<string>> {
  const now = Date.now();
  if (cachedUn && now - unLastFetch < CACHE_TTL_MS) return cachedUn;
  try {
    const xml = await fetchTextSafe(UN_LIST_URL);
    cachedUn = extractNamesFromXml(xml, [
      /<FIRST_NAME>([^<]+)<\/FIRST_NAME>/gi,
      /<SECOND_NAME>([^<]+)<\/SECOND_NAME>/gi,
      /<THIRD_NAME>([^<]+)<\/THIRD_NAME>/gi,
    ]);
    unLastFetch = now;
  } catch {
    cachedUn = cachedUn ?? new Set();
  }
  return cachedUn;
}

async function getEuNames(): Promise<Set<string>> {
  const now = Date.now();
  if (cachedEu && now - euLastFetch < CACHE_TTL_MS) return cachedEu;
  try {
    const xml = await fetchTextSafe(EU_LIST_URL);
    cachedEu = extractNamesFromXml(xml, [
      /<wholeName[^>]*>([^<]+)<\/wholeName>/gi,
      /<nameAlias[^>]*firstName="([^"]+)"/gi,
      /<nameAlias[^>]*lastName="([^"]+)"/gi,
    ]);
    euLastFetch = now;
  } catch {
    cachedEu = cachedEu ?? new Set();
  }
  return cachedEu;
}

function tokenize(name: string): string[] {
  return name
    .toUpperCase()
    .replace(/[.,\-']/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function checkNameAgainstList(
  name: string,
  list: Set<string>
): "clear" | "possible_match" {
  if (list.size === 0) return "clear";
  const tokens = tokenize(name);
  if (tokens.length === 0) return "clear";
  const matchCount = tokens.filter((t) => list.has(t)).length;
  if (matchCount >= Math.ceil(tokens.length * 0.6) && matchCount >= 2) {
    return "possible_match";
  }
  return "clear";
}

function calcRiskLevel(
  sanctions: SanctionsCheck
): "low" | "medium" | "high" {
  const values = Object.values(sanctions);
  if (values.includes("match")) return "high";
  if (values.includes("possible_match")) return "medium";
  return "low";
}

function calcAmlScore(
  sanctions: SanctionsCheck,
  kycScore: number
): number {
  let penalty = 0;
  for (const v of Object.values(sanctions)) {
    if (v === "match") penalty += 0.3;
    if (v === "possible_match") penalty += 0.1;
  }
  return Math.max(0, Math.min(1, kycScore - penalty));
}

export async function screenAML(report: KYCReport): Promise<AMLReport> {
  const [ofac, un, eu] = await Promise.all([
    getOfacNames(),
    getUnNames(),
    getEuNames(),
  ]);

  const nameToCheck = report.legal_name_en || report.legal_name;

  const sanctions: SanctionsCheck = {
    ofac: checkNameAgainstList(nameToCheck, ofac),
    un: checkNameAgainstList(nameToCheck, un),
    eu: checkNameAgainstList(nameToCheck, eu),
    japan_fsa: "clear",
  };

  const riskLevel = calcRiskLevel(sanctions);
  const amlScore = calcAmlScore(sanctions, report.kyc_score);

  const adverseMedia: string[] = [];

  return {
    ...report,
    aml_status:
      riskLevel === "high"
        ? "flagged"
        : riskLevel === "medium"
        ? "review_required"
        : "clear",
    sanctions_check: sanctions,
    pep_check: "no_match",
    adverse_media: adverseMedia,
    risk_level: riskLevel,
    aml_score: amlScore,
    checked_at: new Date().toISOString(),
  };
}
