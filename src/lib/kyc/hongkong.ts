import type { KYCReport } from "@/types/kyc";

const DATA_SOURCE = "Hong Kong Companies Registry (ICRIS)";
const SOURCE_URL = "https://www.cr.gov.hk/";
const SOURCE_LICENSE = "香港政府開放數據授權協議（商用利用可・帰属明示）";

interface CRCompany {
  companyName?: string;
  companyNameChi?: string;
  companyNumber?: string;
  dateOfIncorporation?: string;
  companyType?: string;
  companyStatus?: string;
  registeredOfficeAddress?: string;
  dateOfLastAnnualReturn?: string;
  industry?: string;
}

function mapStatus(status?: string): KYCReport["registration_status"] {
  switch ((status ?? "").toUpperCase()) {
    case "LIVE":
    case "REGISTERED":
      return "active";
    case "DISSOLVED":
    case "STRUCK OFF":
    case "DEREGISTERED":
      return "dissolved";
    default:
      return "unknown";
  }
}

export async function fetchHongKongKYC(companyNumber: string): Promise<KYCReport> {
  const url = `https://www.cr.gov.hk/en/e-services/querycr-api/company/${encodeURIComponent(companyNumber)}`;

  const res = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "APAC-KYC-API/1.0",
    },
    next: { revalidate: 3600 },
  });

  if (res.status === 404) {
    throw new Error("Company not found");
  }

  if (!res.ok) {
    throw new Error(`Hong Kong CR API returned ${res.status}`);
  }

  const data: CRCompany = await res.json();

  const flags: string[] = [];
  if (data.companyStatus && data.companyStatus.toUpperCase() !== "LIVE") {
    flags.push(`Status: ${data.companyStatus}`);
  }

  return {
    company_id: companyNumber,
    country: "HK",
    legal_name: data.companyNameChi ?? data.companyName ?? "",
    legal_name_en: data.companyName ?? "",
    registration_status: mapStatus(data.companyStatus),
    incorporation_date: data.dateOfIncorporation ?? null,
    registered_address: data.registeredOfficeAddress ?? "",
    representative: null,
    capital: null,
    industry_code: data.industry ?? null,
    last_updated: data.dateOfLastAnnualReturn ?? null,
    kyc_score: data.companyStatus?.toUpperCase() === "LIVE" ? 0.85 : 0.55,
    data_source: DATA_SOURCE,
    source_url: SOURCE_URL,
    source_license: SOURCE_LICENSE,
    flags,
  };
}
