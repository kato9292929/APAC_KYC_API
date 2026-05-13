import { XMLParser } from "fast-xml-parser";
import type { KYCReport } from "@/types/kyc";

const DATA_SOURCE = "Australian Business Register (ABR) ABN Lookup";
const SOURCE_URL = "https://abr.business.gov.au/";
const SOURCE_LICENSE = "Creative Commons Attribution 3.0 Australia（商用利用可・帰属明示）";

const ABR_GUID = process.env.ABR_GUID ?? "";

interface AbnEntity {
  ABN?: { identifierValue?: string; identifierStatus?: string };
  entityStatus?: { entityStatusCode?: string; effectiveFrom?: string };
  ASICNumber?: string;
  entityType?: { entityTypeCode?: string; entityDescription?: string };
  goodsAndServicesTax?: { effectiveFrom?: string };
  mainName?: { organisationName?: string; effectiveFrom?: string };
  mainTradingName?: { organisationName?: string; effectiveFrom?: string };
  mainBusinessPhysicalAddress?: {
    stateCode?: string;
    postcode?: string;
    effectiveFrom?: string;
  };
  dateOfRegistration?: string;
}

function mapStatus(code?: string): KYCReport["registration_status"] {
  switch ((code ?? "").toUpperCase()) {
    case "ACT":
    case "ACTIVE":
      return "active";
    case "CAN":
    case "CANCELLED":
      return "dissolved";
    default:
      return "unknown";
  }
}

export async function fetchAustraliaKYC(abn: string): Promise<KYCReport> {
  const cleanAbn = abn.replace(/\s/g, "");
  const url = `https://abr.business.gov.au/abrxmlsearch/ABRXMLSearch.asmx/SearchByABNv202001?searchString=${encodeURIComponent(cleanAbn)}&includeHistoricalDetails=N&authenticationGuid=${encodeURIComponent(ABR_GUID)}`;

  const res = await fetch(url, {
    headers: { "Accept": "application/xml" },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`Australia ABR API returned ${res.status}`);
  }

  const xml = await res.text();
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });
  const parsed = parser.parse(xml);

  const response = parsed?.ABRPayloadSearchResults?.response;
  if (!response) throw new Error("Invalid ABR response");

  if (response.exception) {
    throw new Error(response.exception.exceptionDescription ?? "ABR error");
  }

  const entity: AbnEntity = response.businessEntity202001 ?? {};

  const orgName =
    entity.mainName?.organisationName ??
    entity.mainTradingName?.organisationName ??
    "";

  const address = [
    entity.mainBusinessPhysicalAddress?.stateCode,
    entity.mainBusinessPhysicalAddress?.postcode,
    "Australia",
  ]
    .filter(Boolean)
    .join(" ");

  const statusCode = entity.entityStatus?.entityStatusCode;

  return {
    company_id: cleanAbn,
    country: "AU",
    legal_name: orgName,
    legal_name_en: orgName,
    registration_status: mapStatus(statusCode),
    incorporation_date: entity.entityStatus?.effectiveFrom ?? null,
    registered_address: address,
    representative: null,
    capital: null,
    industry_code: entity.entityType?.entityTypeCode ?? null,
    last_updated: null,
    kyc_score: statusCode?.toUpperCase() === "ACT" ? 0.87 : 0.58,
    data_source: DATA_SOURCE,
    source_url: SOURCE_URL,
    source_license: SOURCE_LICENSE,
    flags: [],
  };
}
