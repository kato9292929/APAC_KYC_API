export type CountryCode = "JP" | "SG" | "HK" | "AU" | "KR";

export interface KYCReport {
  company_id: string;
  country: CountryCode;
  legal_name: string;
  legal_name_en: string;
  registration_status: "active" | "inactive" | "dissolved" | "suspended" | "unknown";
  incorporation_date: string | null;
  registered_address: string;
  representative: string | null;
  capital: number | null;
  industry_code: string | null;
  last_updated: string | null;
  kyc_score: number;
  data_source: string;
  source_url: string;
  source_license: string;
  flags: string[];
}

export interface SanctionsCheck {
  ofac: "clear" | "match" | "possible_match";
  un: "clear" | "match" | "possible_match";
  eu: "clear" | "match" | "possible_match";
  japan_fsa: "clear" | "match" | "possible_match";
}

export interface AMLReport extends KYCReport {
  aml_status: "clear" | "flagged" | "review_required";
  sanctions_check: SanctionsCheck;
  pep_check: "no_match" | "match" | "possible_match";
  adverse_media: string[];
  risk_level: "low" | "medium" | "high";
  aml_score: number;
  checked_at: string;
}

export interface BatchCompany {
  country: CountryCode;
  id: string;
}

export interface BatchRequest {
  companies: BatchCompany[];
  check_type: "standard" | "aml";
}

export interface BatchResult {
  company_id: string;
  country: CountryCode;
  status: "success" | "error" | "not_found";
  report?: KYCReport | AMLReport;
  error?: string;
}

export interface BatchResponse {
  total: number;
  successful: number;
  failed: number;
  results: BatchResult[];
  processed_at: string;
}

export interface PaymentRequirements {
  scheme: "exact";
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
  extra?: Record<string, string>;
}

export interface X402Response {
  x402Version: number;
  error: string;
  accepts: PaymentRequirements[];
}

export interface FacilitatorVerifyRequest {
  x402Version: number;
  scheme: string;
  network: string;
  payload: Record<string, unknown>;
  requirements: PaymentRequirements;
}

export interface FacilitatorVerifyResponse {
  isValid: boolean;
  invalidReason?: string;
  payer?: string;
}

export interface FacilitatorSettleResponse {
  success: boolean;
  txHash?: string;
  errorReason?: string;
}

export interface DiscoveryEndpoint {
  path: string;
  method: string;
  price_usd: number;
  description: string;
  data_source: string;
  source_license: string;
  update_frequency: string;
  countries: CountryCode[];
  payment: {
    network: string;
    asset: string;
    asset_address: string;
  };
}
