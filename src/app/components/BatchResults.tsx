"use client";

import type { BatchResponse, BatchResult } from "@/types/kyc";

function StatusIcon({ status }: { status: BatchResult["status"] }) {
  if (status === "success") return <span className="text-green-400">✓</span>;
  if (status === "not_found") return <span className="text-yellow-400">?</span>;
  return <span className="text-red-400">✗</span>;
}

export default function BatchResults({ response }: { response: BatchResponse }) {
  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-6">
        <div>
          <p className="text-xs text-gray-400">Total</p>
          <p className="text-2xl font-bold text-white font-outfit">{response.total}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Successful</p>
          <p className="text-2xl font-bold text-green-400 font-outfit">{response.successful}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Failed</p>
          <p className="text-2xl font-bold text-red-400 font-outfit">{response.failed}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 uppercase tracking-wider">
              <th className="text-left py-2 pr-4">Status</th>
              <th className="text-left py-2 pr-4">Country</th>
              <th className="text-left py-2 pr-4">Company ID</th>
              <th className="text-left py-2 pr-4">Name</th>
              <th className="text-left py-2">Score</th>
            </tr>
          </thead>
          <tbody>
            {response.results.map((r, i) => (
              <tr key={i} className="border-t border-dark-border">
                <td className="py-2.5 pr-4">
                  <StatusIcon status={r.status} />
                </td>
                <td className="py-2.5 pr-4 text-gray-300 font-outfit">{r.country}</td>
                <td className="py-2.5 pr-4 text-gray-400 font-mono text-xs">{r.company_id}</td>
                <td className="py-2.5 pr-4 text-white font-outfit">
                  {r.report?.legal_name ?? r.error ?? "—"}
                </td>
                <td className="py-2.5 text-gold font-outfit">
                  {r.report ? Math.round(r.report.kyc_score * 100) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-600">
        Processed at {new Date(response.processed_at).toLocaleString()}
      </p>
    </div>
  );
}
