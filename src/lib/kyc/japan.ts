import { XMLParser } from "fast-xml-parser";
import type { KYCReport } from "@/types/kyc";

const DATA_SOURCE = "国税庁法人番号API";
const SOURCE_URL = "https://api.houjin-bangou.nta.go.jp/";
const SOURCE_LICENSE = "国税庁コーポレートナンバー・オープンデータ利用規約（商用利用可・帰属明示）";

interface HoujinRecord {
  sequenceNumber?: string;
  corporateNumber?: string;
  process?: string;
  correct?: string;
  updateDate?: string;
  changeDate?: string;
  name?: string;
  nameImageId?: string;
  kind?: string;
  prefectureName?: string;
  cityName?: string;
  streetNumber?: string;
  addressImageId?: string;
  prefectureCode?: string;
  cityCode?: string;
  postCode?: string;
  addressOutside?: string;
  addressOutsideImageId?: string;
  closeDate?: string;
  closeCause?: string;
  successorCorporateNumber?: string;
  changeReason?: string;
  assignmentDate?: string;
  latest?: string;
  enName?: string;
  enPrefectureName?: string;
  enCityName?: string;
  enAddressOutside?: string;
  furigana?: string;
  hihyoji?: string;
}

function buildAddress(rec: HoujinRecord): string {
  const parts = [
    rec.prefectureName,
    rec.cityName,
    rec.streetNumber,
  ].filter(Boolean);
  return parts.join("");
}

function detectStatus(rec: HoujinRecord): KYCReport["registration_status"] {
  if (rec.closeDate) return "dissolved";
  if (rec.closeCause) return "inactive";
  return "active";
}

function calcKycScore(rec: HoujinRecord): number {
  let score = 0.5;
  if (rec.name) score += 0.1;
  if (rec.assignmentDate) score += 0.1;
  if (rec.prefectureName && rec.cityName) score += 0.1;
  if (rec.enName) score += 0.05;
  if (!rec.closeDate && !rec.closeCause) score += 0.1;
  if (rec.updateDate) score += 0.05;
  return Math.min(1, score);
}

export async function fetchJapanKYC(corporateNumber: string): Promise<KYCReport> {
  const apiKey = process.env.HOUJIN_API_KEY;
  if (!apiKey) {
    throw new Error("HOUJIN_API_KEY is not configured");
  }

  const url = `https://api.houjin-bangou.nta.go.jp/4/num?id=${encodeURIComponent(apiKey)}&number=${encodeURIComponent(corporateNumber)}&type=01&history=0`;

  const res = await fetch(url, {
    headers: { "Accept": "application/xml" },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`Japan API returned ${res.status}`);
  }

  const xml = await res.text();
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });
  const parsed = parser.parse(xml);

  const corporations = parsed?.corporations;
  if (!corporations || corporations.count === "0" || corporations.count === 0) {
    throw new Error("Company not found");
  }

  const corp = Array.isArray(corporations.corporation)
    ? corporations.corporation[0]
    : corporations.corporation;

  const rec: HoujinRecord = corp ?? {};

  const flags: string[] = [];
  if (rec.hihyoji === "1") flags.push("表示対象外法人");
  if (rec.closeCause) flags.push(`廃業事由: ${rec.closeCause}`);

  return {
    company_id: corporateNumber,
    country: "JP",
    legal_name: rec.name ?? "",
    legal_name_en: rec.enName ?? "",
    registration_status: detectStatus(rec),
    incorporation_date: rec.assignmentDate ?? null,
    registered_address: buildAddress(rec),
    representative: null,
    capital: null,
    industry_code: null,
    last_updated: rec.updateDate ?? null,
    kyc_score: calcKycScore(rec),
    data_source: DATA_SOURCE,
    source_url: SOURCE_URL,
    source_license: SOURCE_LICENSE,
    flags,
  };
}
