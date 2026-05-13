import { NextRequest, NextResponse } from "next/server";
import { withX402Payment } from "@/lib/x402";
import { fetchKYC, SUPPORTED_COUNTRIES } from "@/lib/kyc";
import { screenAML } from "@/lib/aml/screening";
import type { CountryCode } from "@/types/kyc";

const PRICE_USD = 3.0;
const DESCRIPTION = "APAC AML Screening + KYC Report ($3/call)";

async function handler(
  req: NextRequest,
  country: string,
  companyId: string
): Promise<NextResponse> {
  const upperCountry = country.toUpperCase() as CountryCode;

  if (!SUPPORTED_COUNTRIES.includes(upperCountry)) {
    return NextResponse.json(
      {
        error: `Unsupported country: ${country}. Supported: ${SUPPORTED_COUNTRIES.join(", ")}`,
      },
      { status: 400 }
    );
  }

  if (!companyId || companyId.length < 3) {
    return NextResponse.json({ error: "Invalid company_id" }, { status: 400 });
  }

  try {
    const kycReport = await fetchKYC(upperCountry, companyId);
    const amlReport = await screenAML(kycReport);
    return NextResponse.json(amlReport);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.toLowerCase().includes("not found")) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to fetch AML data", detail: message },
      { status: 502 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ country: string; company_id: string }> }
) {
  const { country, company_id } = await params;
  const wrappedHandler = withX402Payment(
    (r) => handler(r, country, company_id),
    PRICE_USD,
    DESCRIPTION
  );
  return wrappedHandler(req);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
