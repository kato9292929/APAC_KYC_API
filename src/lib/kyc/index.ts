import type { CountryCode, KYCReport } from "@/types/kyc";
import { fetchJapanKYC } from "./japan";
import { fetchSingaporeKYC } from "./singapore";
import { fetchHongKongKYC } from "./hongkong";
import { fetchAustraliaKYC } from "./australia";
import { fetchKoreaKYC } from "./korea";

export async function fetchKYC(
  country: CountryCode,
  companyId: string
): Promise<KYCReport> {
  switch (country) {
    case "JP":
      return fetchJapanKYC(companyId);
    case "SG":
      return fetchSingaporeKYC(companyId);
    case "HK":
      return fetchHongKongKYC(companyId);
    case "AU":
      return fetchAustraliaKYC(companyId);
    case "KR":
      return fetchKoreaKYC(companyId);
    default:
      throw new Error(`Unsupported country: ${country}`);
  }
}

export const SUPPORTED_COUNTRIES: CountryCode[] = ["JP", "SG", "HK", "AU", "KR"];

export const COUNTRY_INFO: Record<
  CountryCode,
  { name: string; dataSource: string; idFormat: string }
> = {
  JP: {
    name: "Japan",
    dataSource: "国税庁法人番号API",
    idFormat: "13-digit corporate number (法人番号)",
  },
  SG: {
    name: "Singapore",
    dataSource: "ACRA BizFile+",
    idFormat: "UEN (e.g. 202012345A)",
  },
  HK: {
    name: "Hong Kong",
    dataSource: "Companies Registry ICRIS",
    idFormat: "Company number (e.g. 0123456)",
  },
  AU: {
    name: "Australia",
    dataSource: "ABR ABN Lookup",
    idFormat: "ABN (11-digit, e.g. 51824753556)",
  },
  KR: {
    name: "Korea",
    dataSource: "공공데이터포털 사업자등록정보",
    idFormat: "사업자등록번호 (10-digit, e.g. 1234567890)",
  },
};
