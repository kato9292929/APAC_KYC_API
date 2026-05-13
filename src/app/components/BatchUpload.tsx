"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import type { BatchRequest, BatchResponse, CountryCode } from "@/types/kyc";

const SUPPORTED: CountryCode[] = ["JP", "SG", "HK", "AU", "KR"];

interface Props {
  onResult: (data: BatchResponse) => void;
  onError: (msg: string) => void;
  onLoading: (loading: boolean) => void;
}

export default function BatchUpload({ onResult, onError, onLoading }: Props) {
  const [entries, setEntries] = useState<{ country: string; id: string }[]>([]);
  const [checkType, setCheckType] = useState<"standard" | "aml">("standard");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    Papa.parse<string[]>(file, {
      complete: (results) => {
        const rows = results.data
          .slice(1)
          .map((row) => ({ country: (row[0] ?? "").trim().toUpperCase(), id: (row[1] ?? "").trim() }))
          .filter(
            (r) =>
              r.id && SUPPORTED.includes(r.country as CountryCode)
          );
        setEntries(rows);
      },
      error: () => onError("Failed to parse CSV"),
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (entries.length === 0) {
      onError("No valid entries. Upload a CSV with columns: country,company_id");
      return;
    }

    onLoading(true);
    onError("");

    const body: BatchRequest = {
      companies: entries.map((e) => ({
        country: e.country as CountryCode,
        id: e.id,
      })),
      check_type: checkType,
    };

    try {
      const res = await fetch("/api/kyc/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.status === 402) {
        onError(
          "Payment required (x402). Use an x402-enabled client or the API directly."
        );
        return;
      }

      if (!res.ok) {
        onError(data.error ?? `Request failed: ${res.status}`);
        return;
      }

      onResult(data as BatchResponse);
    } catch {
      onError("Network error. Please try again.");
    } finally {
      onLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div
        className="border-2 border-dashed border-dark-border rounded-xl p-8 text-center cursor-pointer hover:border-gold/50 transition-colors"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        <p className="text-gray-400 font-outfit text-sm">
          Drop CSV here or click to upload
        </p>
        <p className="text-gray-600 text-xs mt-1">
          Format: <code className="text-gold">country,company_id</code> (header row required)
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      {entries.length > 0 && (
        <div className="bg-dark-hover rounded-lg p-3">
          <p className="text-sm text-gray-400 font-outfit">
            <span className="text-gold font-semibold">{entries.length}</span> companies loaded
          </p>
          <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
            {entries.slice(0, 10).map((e, i) => (
              <p key={i} className="text-xs text-gray-500 font-mono">
                {e.country} · {e.id}
              </p>
            ))}
            {entries.length > 10 && (
              <p className="text-xs text-gray-600">...and {entries.length - 10} more</p>
            )}
          </div>
        </div>
      )}

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
            {type === "standard" ? "Standard KYC — $0.5" : "AML Screening — $0.5"}
          </button>
        ))}
      </div>

      <button
        type="submit"
        disabled={entries.length === 0}
        className="w-full py-3 rounded-lg bg-gold hover:bg-gold-light text-black font-semibold font-outfit transition-all active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Run Batch Check ({entries.length} companies)
      </button>
    </form>
  );
}
