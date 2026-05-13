"use client";

import type { KYCReport, AMLReport } from "@/types/kyc";

function ScoreBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 80 ? "text-green-400" : pct >= 60 ? "text-yellow-400" : "text-red-400";
  return (
    <span className={`text-2xl font-bold font-outfit ${color}`}>{pct}</span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-green-900/40 text-green-400 border-green-800",
    inactive: "bg-yellow-900/40 text-yellow-400 border-yellow-800",
    dissolved: "bg-red-900/40 text-red-400 border-red-800",
    suspended: "bg-orange-900/40 text-orange-400 border-orange-800",
    unknown: "bg-gray-900/40 text-gray-400 border-gray-700",
  };
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${map[status] ?? map.unknown}`}
    >
      {status}
    </span>
  );
}

function SanctionBadge({ result }: { result: string }) {
  if (result === "clear")
    return (
      <span className="text-green-400 text-xs font-medium">✓ clear</span>
    );
  if (result === "possible_match")
    return (
      <span className="text-yellow-400 text-xs font-medium">⚠ possible match</span>
    );
  return <span className="text-red-400 text-xs font-medium">✗ match</span>;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between py-2.5 border-b border-dark-border last:border-0">
      <span className="text-gray-400 text-sm font-outfit">{label}</span>
      <span className="text-white text-sm font-outfit text-right max-w-[60%]">
        {value}
      </span>
    </div>
  );
}

function isAML(report: KYCReport | AMLReport): report is AMLReport {
  return "aml_status" in report;
}

export default function KYCReportView({
  report,
}: {
  report: KYCReport | AMLReport;
}) {
  const aml = isAML(report) ? report : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white font-outfit">
              {report.legal_name}
            </h2>
            {report.legal_name_en && report.legal_name_en !== report.legal_name && (
              <p className="text-gray-400 text-sm mt-0.5">{report.legal_name_en}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-500 font-outfit">
                {report.country} · {report.company_id}
              </span>
              <StatusBadge status={report.registration_status} />
            </div>
          </div>
          <div className="text-center shrink-0">
            <div className="text-xs text-gray-400 font-outfit mb-0.5">
              {aml ? "AML Score" : "KYC Score"}
            </div>
            <ScoreBadge score={aml ? aml.aml_score : report.kyc_score} />
            <div className="text-xs text-gray-500">/100</div>
          </div>
        </div>

        {report.flags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {report.flags.map((f, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-yellow-900/30 border border-yellow-800 text-yellow-400 text-xs rounded-full"
              >
                ⚠ {f}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Company Details */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Company Details
        </h3>
        <Row label="Registered Address" value={report.registered_address} />
        <Row label="Representative" value={report.representative} />
        <Row
          label="Capital"
          value={
            report.capital
              ? `¥${report.capital.toLocaleString()}`
              : null
          }
        />
        <Row label="Industry Code" value={report.industry_code} />
        <Row label="Incorporation Date" value={report.incorporation_date} />
        <Row label="Last Updated" value={report.last_updated} />
      </div>

      {/* AML Section */}
      {aml && (
        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            AML Screening
          </h3>
          <div className="mb-3">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium font-outfit ${
                aml.aml_status === "clear"
                  ? "bg-green-900/40 text-green-400 border border-green-800"
                  : aml.aml_status === "review_required"
                  ? "bg-yellow-900/40 text-yellow-400 border border-yellow-800"
                  : "bg-red-900/40 text-red-400 border border-red-800"
              }`}
            >
              {aml.aml_status.replace("_", " ").toUpperCase()}
            </span>
            <span
              className={`ml-2 px-2.5 py-1 rounded-full text-xs font-outfit border ${
                aml.risk_level === "low"
                  ? "bg-green-900/20 text-green-500 border-green-900"
                  : aml.risk_level === "medium"
                  ? "bg-yellow-900/20 text-yellow-500 border-yellow-900"
                  : "bg-red-900/20 text-red-500 border-red-900"
              }`}
            >
              Risk: {aml.risk_level}
            </span>
          </div>

          <div className="space-y-2">
            {(
              [
                ["OFAC SDN List", aml.sanctions_check.ofac],
                ["UN Consolidated", aml.sanctions_check.un],
                ["EU Consolidated", aml.sanctions_check.eu],
                ["Japan FSA", aml.sanctions_check.japan_fsa],
              ] as [string, string][]
            ).map(([label, result]) => (
              <div
                key={label}
                className="flex justify-between items-center py-2 border-b border-dark-border last:border-0"
              >
                <span className="text-gray-400 text-sm">{label}</span>
                <SanctionBadge result={result} />
              </div>
            ))}
          </div>

          <Row label="PEP Check" value={aml.pep_check.replace("_", " ")} />
          <Row label="Checked At" value={new Date(aml.checked_at).toLocaleString()} />
        </div>
      )}

      {/* Data Provenance */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Data Provenance
        </h3>
        <Row label="Source" value={report.data_source} />
        <Row
          label="Source URL"
          value={
            <a
              href={report.source_url}
              target="_blank"
              rel="noreferrer"
              className="text-gold hover:text-gold-light underline text-xs"
            >
              {report.source_url}
            </a>
          }
        />
        <Row label="License" value={report.source_license} />
      </div>
    </div>
  );
}
