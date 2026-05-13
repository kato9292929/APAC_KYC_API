import type { KYCReport } from "@/types/kyc";

const DATA_SOURCE = "공정거래위원회 기업정보 / 공공데이터포털 사업자등록정보";
const SOURCE_URL = "https://www.data.go.kr/";
const SOURCE_LICENSE = "공공누리 제1유형（商用利用可・帰属明示）";

interface KrBizEntity {
  bizrno?: string;
  crprNm?: string;
  enpBsadr?: string;
  enpTlno?: string;
  enpEstbDt?: string;
  enpSlspAmt?: string;
  enpEmpeCnt?: string;
  enpRprFnm?: string;
  smenpYn?: string;
  enpMainBizNm?: string;
  enpStacNm?: string;
  korSecnNm?: string;
  asstAmt?: string;
  crrtRt?: string;
  bsnStCd?: string;
  hm_url?: string;
}

function mapStatus(code?: string): KYCReport["registration_status"] {
  switch (code) {
    case "01":
      return "active";
    case "02":
      return "dissolved";
    default:
      return "unknown";
  }
}

export async function fetchKoreaKYC(bizNumber: string): Promise<KYCReport> {
  const apiKey = process.env.KR_DATA_API_KEY;
  if (!apiKey) {
    throw new Error("KR_DATA_API_KEY is not configured");
  }

  const cleanNum = bizNumber.replace(/[-\s]/g, "");
  const url = `https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=${encodeURIComponent(apiKey)}&b_no=${encodeURIComponent(cleanNum)}&type=json`;

  const res = await fetch(url, {
    headers: { "Accept": "application/json" },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`Korea data API returned ${res.status}`);
  }

  const data = await res.json();
  const items: KrBizEntity[] = data?.data ?? [];

  if (items.length === 0) {
    throw new Error("Company not found");
  }

  const entity = items[0];
  const flags: string[] = [];
  if (entity.smenpYn === "Y") flags.push("중소기업 (SME)");

  return {
    company_id: cleanNum,
    country: "KR",
    legal_name: entity.crprNm ?? "",
    legal_name_en: entity.korSecnNm ?? "",
    registration_status: mapStatus(entity.bsnStCd),
    incorporation_date: entity.enpEstbDt ?? null,
    registered_address: entity.enpBsadr ?? "",
    representative: entity.enpRprFnm ?? null,
    capital: null,
    industry_code: null,
    last_updated: null,
    kyc_score: entity.bsnStCd === "01" ? 0.84 : 0.55,
    data_source: DATA_SOURCE,
    source_url: SOURCE_URL,
    source_license: SOURCE_LICENSE,
    flags,
  };
}
