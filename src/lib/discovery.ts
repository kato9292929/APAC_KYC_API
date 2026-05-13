import type { DiscoveryEndpoint } from "@/types/kyc";

const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

export function buildDiscovery(baseUrl: string) {
  const endpoints: DiscoveryEndpoint[] = [
    {
      path: "/api/kyc/{country}/{company_id}",
      method: "GET",
      price_usd: 1.0,
      description:
        "Standard KYC report for a corporate entity in JP/SG/HK/AU/KR. Returns registration status, address, representative, and KYC score.",
      data_source:
        "国税庁法人番号API (JP) / ACRA BizFile+ (SG) / Companies Registry (HK) / ABR ABN Lookup (AU) / 공공데이터포털 (KR)",
      source_license: "各国オープンデータライセンス（商用利用可・帰属明示）",
      update_frequency: "Daily (JP: real-time)",
      countries: ["JP", "SG", "HK", "AU", "KR"],
      payment: {
        network: "base",
        asset: "USDC",
        asset_address: USDC_BASE,
      },
    },
    {
      path: "/api/kyc/aml/{country}/{company_id}",
      method: "GET",
      price_usd: 3.0,
      description:
        "AML screening report. Includes standard KYC data plus sanctions check against OFAC SDN List, UN Consolidated List, and EU Consolidated List. Only public sanction lists are used.",
      data_source:
        "KYCデータソース + OFAC SDN List + UN Consolidated List + EU Consolidated List",
      source_license:
        "各国オープンデータライセンス + US Treasury (public) + UN (public) + EU (public)",
      update_frequency: "KYC: daily / Sanctions lists: daily",
      countries: ["JP", "SG", "HK", "AU", "KR"],
      payment: {
        network: "base",
        asset: "USDC",
        asset_address: USDC_BASE,
      },
    },
    {
      path: "/api/kyc/batch",
      method: "POST",
      price_usd: 0.5,
      description:
        "Batch KYC lookup for up to 50 companies across multiple countries in a single call.",
      data_source: "全対応国データソース（上記と同様）",
      source_license: "各国オープンデータライセンス（商用利用可・帰属明示）",
      update_frequency: "Daily",
      countries: ["JP", "SG", "HK", "AU", "KR"],
      payment: {
        network: "base",
        asset: "USDC",
        asset_address: USDC_BASE,
      },
    },
  ];

  return {
    name: "APAC KYC API",
    description:
      "APAC各国の公的法人データベースを横断した標準化KYCレポートをx402決済で提供するAPI。AMLスクリーニング（公開制裁リストのみ）対応。",
    version: "1.0.0",
    baseUrl,
    network: "base",
    asset: "USDC",
    asset_address: USDC_BASE,
    facilitator: "https://x402.org/facilitator",
    supported_countries: ["JP", "SG", "HK", "AU", "KR"],
    data_transparency: {
      policy: "全レスポンスにdata_source・source_licenseを含めます（来歴の透明性）",
      aml_note:
        "AMLスクリーニングは公開制裁リスト（OFAC・UN・EU）のみ使用。非公開の反社チェックリストは使用しません。",
    },
    endpoints,
  };
}

export function declareDiscoveryExtension(baseUrl: string) {
  return {
    "x-agentic-market": {
      bazaar: {
        category: "kyc",
        tags: ["kyc", "aml", "compliance", "apac", "japan", "singapore", "korea"],
        agentUsage: {
          description:
            "This API is designed for agent use. Pass company ID and country code to get a structured KYC or AML report. Ideal for automated compliance workflows.",
          examplePrompt:
            "Check the KYC status of Japanese company 1234567890123",
          outputFormat: "application/json",
        },
      },
    },
  };
}
