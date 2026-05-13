import { NextRequest, NextResponse } from "next/server";
import { buildDiscovery, declareDiscoveryExtension } from "@/lib/discovery";

export async function GET(req: NextRequest) {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    `${req.nextUrl.protocol}//${req.nextUrl.host}`;

  const discovery = buildDiscovery(baseUrl);
  const extensions = declareDiscoveryExtension(baseUrl);

  return NextResponse.json(
    { ...discovery, ...extensions },
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    }
  );
}
