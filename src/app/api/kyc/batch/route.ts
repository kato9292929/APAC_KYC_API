import { NextRequest, NextResponse } from "next/server";
import { withX402Payment } from "@/lib/x402";
import { fetchKYC, SUPPORTED_COUNTRIES } from "@/lib/kyc";
import { screenAML } from "@/lib/aml/screening";
import type { BatchRequest, BatchResponse, BatchResult, CountryCode } from "@/types/kyc";

const PRICE_USD = 0.5;
const DESCRIPTION = "APAC Batch KYC Lookup ($0.5/call, up to 50 companies)";
const MAX_BATCH = 50;

async function handler(req: NextRequest): Promise<NextResponse> {
  let body: BatchRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body.companies)) {
    return NextResponse.json(
      { error: "companies must be an array" },
      { status: 400 }
    );
  }

  if (body.companies.length === 0) {
    return NextResponse.json(
      { error: "companies array must not be empty" },
      { status: 400 }
    );
  }

  if (body.companies.length > MAX_BATCH) {
    return NextResponse.json(
      { error: `Maximum batch size is ${MAX_BATCH} companies` },
      { status: 400 }
    );
  }

  const checkType = body.check_type ?? "standard";

  const tasks = body.companies.map(async ({ country, id }): Promise<BatchResult> => {
    const upperCountry = country?.toUpperCase() as CountryCode;

    if (!SUPPORTED_COUNTRIES.includes(upperCountry)) {
      return {
        company_id: id,
        country: upperCountry,
        status: "error",
        error: `Unsupported country: ${country}`,
      };
    }

    try {
      const kycReport = await fetchKYC(upperCountry, id);
      if (checkType === "aml") {
        const amlReport = await screenAML(kycReport);
        return { company_id: id, country: upperCountry, status: "success", report: amlReport };
      }
      return { company_id: id, country: upperCountry, status: "success", report: kycReport };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      if (message.toLowerCase().includes("not found")) {
        return { company_id: id, country: upperCountry, status: "not_found" };
      }
      return { company_id: id, country: upperCountry, status: "error", error: message };
    }
  });

  const results = await Promise.allSettled(tasks);
  const resolved: BatchResult[] = results.map((r) =>
    r.status === "fulfilled"
      ? r.value
      : {
          company_id: "unknown",
          country: "JP",
          status: "error" as const,
          error: "Internal error",
        }
  );

  const successful = resolved.filter((r) => r.status === "success").length;

  const response: BatchResponse = {
    total: resolved.length,
    successful,
    failed: resolved.length - successful,
    results: resolved,
    processed_at: new Date().toISOString(),
  };

  return NextResponse.json(response);
}

export async function POST(req: NextRequest) {
  const wrappedHandler = withX402Payment(handler, PRICE_USD, DESCRIPTION);
  return wrappedHandler(req);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
