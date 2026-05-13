import type { KYCReport } from "@/types/kyc";

const DATA_SOURCE = "ACRA BizFile+ (Singapore)";
const SOURCE_URL = "https://www.acra.gov.sg/";
const SOURCE_LICENSE = "Singapore Open Data Licence v1.0（商用利用可・帰属明示）";

interface AcraEntity {
  entity_name?: string;
  uen?: string;
  entity_type?: string;
  entity_status?: string;
  registration_date?: string;
  reg_street_name?: string;
  reg_postal_code?: string;
  primary_ssic_code?: string;
  primary_ssic_description?: string;
  issuance_agency_id?: string;
}

function mapStatus(status?: string): KYCReport["registration_status"] {
  switch ((status ?? "").toLowerCase()) {
    case "live":
    case "registered":
      return "active";
    case "cancelled":
    case "struck off":
    case "dissolved":
      return "dissolved";
    case "suspended":
      return "suspended";
    default:
      return "unknown";
  }
}

export async function fetchSingaporeKYC(uen: string): Promise<KYCReport> {
  const apiKey = process.env.ACRA_API_KEY;

  const url = `https://data.gov.sg/api/action/datastore_search?resource_id=5ab68aac-91f6-4f39-9b21-698610bdf3f7&filters={"uen":"${encodeURIComponent(uen)}"}`;

  const headers: Record<string, string> = {
    "Accept": "application/json",
  };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const res = await fetch(url, {
    headers,
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`Singapore ACRA API returned ${res.status}`);
  }

  const data = await res.json();
  const records: AcraEntity[] = data?.result?.records ?? [];

  if (records.length === 0) {
    throw new Error("Company not found");
  }

  const entity = records[0];
  const address = [
    entity.reg_street_name,
    entity.reg_postal_code ? `Singapore ${entity.reg_postal_code}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    company_id: uen,
    country: "SG",
    legal_name: entity.entity_name ?? "",
    legal_name_en: entity.entity_name ?? "",
    registration_status: mapStatus(entity.entity_status),
    incorporation_date: entity.registration_date ?? null,
    registered_address: address,
    representative: null,
    capital: null,
    industry_code: entity.primary_ssic_code ?? null,
    last_updated: null,
    kyc_score: entity.entity_status?.toLowerCase() === "live" ? 0.88 : 0.6,
    data_source: DATA_SOURCE,
    source_url: SOURCE_URL,
    source_license: SOURCE_LICENSE,
    flags: [],
  };
}
