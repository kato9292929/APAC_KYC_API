"use client";

import { useState } from "react";
import type { CountryCode } from "@/types/kyc";

const COUNTRIES: { code: CountryCode; label: string; placeholder: string }[] = [
  { code: "JP", label: "🇯🇵 Japan", placeholder: "法人番号 (13桁)" },
  { code: "SG", label: "🇸🇬 Singapore", placeholder: "UEN (e.g. 202012345A)" },
  { code: "HK", label: "🇭🇰 Hong Kong", placeholder: "Company No. (e.g. 0123456)" },
  { code: "AU", label: "🇦🇺 Australia", placeholder: "ABN (11-digit)" },
  { code: "KR", label: "🇰🇷 Korea", placeholder: "사업자등록번호 (10자리)" },
];

interface Props {
  onResult: (data: unknown, type: "standard" | "aml") => void;
  onError: (msg: string) => void;
  onLoading: (loading: boolean) => void;
}

export default function KYCForm({ onResult, onError, onLoading }: Props) {
  const [country, setCountry] = useState<CountryCode>("JP");
  const [companyId, setCompanyId] = useState("");
  const [checkType, setCheckType] = useState<"standard" | "aml">("standard");

  const selectedCountry = COUNTRIES.find((c) => c.code === country)!;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyId.trim()) return;

    onLoading(true);
    onError("");

    const path =
      checkType === "aml"
        ? `/api/kyc/aml/${country}/${encodeURIComponent(companyId.trim())}`
        : `/api/kyc/${country}/${encodeURIComponent(companyId.trim())}`;

    try {
      const res = await fetch(path);
      const data = await res.json();

      if (res.status === 402) {
        onError(
          "Payment required (x402). This demo UI doesn't handle payments — use an x402-enabled client or the API directly."
        );
        return;
      }

      if (!res.ok) {
        onError(data.error ?? `Request failed: ${res.status}`);
        return;
      }

      onResult(data, checkType);
    } catch {
      onError("Network error. Please try again.");
    } finally {
      onLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">
            Country
          </label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value as CountryCode)}
            className="w-full bg-dark-hover border border-dark-border rounded-lg px-4 py-3 text-white font-outfit focus:outline-none focus:border-gold transition-colors"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">
            Company ID
          </label>
          <input
            type="text"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            placeholder={selectedCountry.placeholder}
            className="w-full bg-dark-hover border border-dark-border rounded-lg px-4 py-3 text-white font-outfit focus:outline-none focus:border-gold transition-colors placeholder-gray-600"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
          Check Type
        </label>
        <div className="flex gap-3">
          {(["standard", "aml"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setCheckType(type)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium font-outfit transition-all ${
                checkType === type
                  ? "bg-gold text-black"
                  : "bg-dark-hover border border-dark-border text-gray-400 hover:border-gold/50"
              }`}
            >
              {type === "standard" ? "Standard KYC — $1" : "AML Screening — $3"}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-3 rounded-lg bg-gold hover:bg-gold-light text-black font-semibold font-outfit transition-all active:scale-[0.99]"
      >
        Run KYC Check
      </button>
    </form>
  );
}
