import { NextRequest, NextResponse } from "next/server";
import type {
  PaymentRequirements,
  X402Response,
  FacilitatorVerifyRequest,
  FacilitatorVerifyResponse,
  FacilitatorSettleResponse,
} from "@/types/kyc";

const USDC_BASE_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const NETWORK = "base";
const X402_VERSION = 1;
const FACILITATOR_URL =
  process.env.X402_FACILITATOR_URL ?? "https://x402.org/facilitator";

export function usdcAmount(dollars: number): string {
  return String(Math.round(dollars * 1_000_000));
}

export function buildPaymentRequirements(
  resource: string,
  amountUSD: number,
  description: string
): PaymentRequirements {
  return {
    scheme: "exact",
    network: NETWORK,
    maxAmountRequired: usdcAmount(amountUSD),
    resource,
    description,
    mimeType: "application/json",
    payTo: process.env.WALLET_ADDRESS ?? "",
    maxTimeoutSeconds: 300,
    asset: USDC_BASE_ADDRESS,
    extra: {
      name: "USDC",
      version: "2",
    },
  };
}

export function paymentRequired(requirements: PaymentRequirements): NextResponse {
  const body: X402Response = {
    x402Version: X402_VERSION,
    error: "Payment required",
    accepts: [requirements],
  };
  return NextResponse.json(body, { status: 402 });
}

export async function verifyPayment(
  payment: string,
  requirements: PaymentRequirements
): Promise<FacilitatorVerifyResponse> {
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(Buffer.from(payment, "base64").toString("utf-8"));
  } catch {
    return { isValid: false, invalidReason: "Invalid payment header encoding" };
  }

  const body: FacilitatorVerifyRequest = {
    x402Version: X402_VERSION,
    scheme: "exact",
    network: NETWORK,
    payload,
    requirements,
  };

  try {
    const res = await fetch(`${FACILITATOR_URL}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      return { isValid: false, invalidReason: `Facilitator returned ${res.status}` };
    }
    return (await res.json()) as FacilitatorVerifyResponse;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { isValid: false, invalidReason: `Facilitator unreachable: ${message}` };
  }
}

export async function settlePayment(
  payment: string,
  requirements: PaymentRequirements
): Promise<FacilitatorSettleResponse> {
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(Buffer.from(payment, "base64").toString("utf-8"));
  } catch {
    return { success: false, errorReason: "Invalid payment header encoding" };
  }

  const body: FacilitatorVerifyRequest = {
    x402Version: X402_VERSION,
    scheme: "exact",
    network: NETWORK,
    payload,
    requirements,
  };

  try {
    const res = await fetch(`${FACILITATOR_URL}/settle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      return { success: false, errorReason: `Facilitator returned ${res.status}` };
    }
    return (await res.json()) as FacilitatorSettleResponse;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, errorReason: `Facilitator unreachable: ${message}` };
  }
}

export function resourceUrl(req: NextRequest): string {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ?? `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  return `${base}${req.nextUrl.pathname}`;
}

export type Handler = (req: NextRequest) => Promise<NextResponse>;

export function withX402Payment(
  handler: Handler,
  amountUSD: number,
  description: string
): Handler {
  return async (req: NextRequest): Promise<NextResponse> => {
    const payment = req.headers.get("X-Payment");
    const requirements = buildPaymentRequirements(
      resourceUrl(req),
      amountUSD,
      description
    );

    if (!payment) {
      return paymentRequired(requirements);
    }

    const verification = await verifyPayment(payment, requirements);
    if (!verification.isValid) {
      return NextResponse.json(
        {
          error: "Payment verification failed",
          reason: verification.invalidReason,
        },
        { status: 402 }
      );
    }

    const response = await handler(req);

    const settlement = await settlePayment(payment, requirements);
    if (settlement.success && settlement.txHash) {
      response.headers.set(
        "X-Payment-Response",
        Buffer.from(JSON.stringify({ txHash: settlement.txHash, success: true })).toString(
          "base64"
        )
      );
    }

    return response;
  };
}
