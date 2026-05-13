"use client";

import { useState } from "react";
import KYCForm from "./components/KYCForm";
import KYCReportView from "./components/KYCReport";
import BatchUpload from "./components/BatchUpload";
import BatchResults from "./components/BatchResults";
import type { KYCReport, AMLReport, BatchResponse } from "@/types/kyc";

type Tab = "single" | "batch";
type ReportData = { data: KYCReport | AMLReport; type: "standard" | "aml" } | null;

export default function HomePage() {
  const [tab, setTab] = useState<Tab>("single");
  const [report, setReport] = useState<ReportData>(null);
  const [batchResult, setBatchResult] = useState<BatchResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-20 pb-16 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(201,168,76,0.08),transparent)]" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gold/30 bg-gold/5 text-gold text-xs font-outfit mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            x402 · Base Network · USDC
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-outfit mb-4 leading-tight">
            APAC Corporate{" "}
            <span className="text-gold-gradient">KYC API</span>
          </h1>
          <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto font-outfit mb-8">
            APAC各国の公的法人データベースを横断した標準化KYCレポートを
            x402決済でオンデマンド提供。エージェント対応・AMLスクリーニング付き。
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            {[
              { label: "🇯🇵 Japan", sub: "国税庁法人番号" },
              { label: "🇸🇬 Singapore", sub: "ACRA BizFile+" },
              { label: "🇭🇰 Hong Kong", sub: "Companies Registry" },
              { label: "🇦🇺 Australia", sub: "ABR ABN Lookup" },
              { label: "🇰🇷 Korea", sub: "공공데이터포털" },
            ].map((c) => (
              <div
                key={c.label}
                className="px-4 py-2 bg-dark-card border border-dark-border rounded-xl text-center"
              >
                <div className="font-medium text-white">{c.label}</div>
                <div className="text-gray-500 text-xs mt-0.5">{c.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                name: "Standard KYC",
                price: "$1",
                per: "/call",
                endpoint: "GET /api/kyc/{country}/{id}",
                features: [
                  "法人名・登記住所",
                  "登録ステータス",
                  "KYCスコア",
                  "データ来歴明示",
                ],
                highlight: false,
              },
              {
                name: "AML Screening",
                price: "$3",
                per: "/call",
                endpoint: "GET /api/kyc/aml/{country}/{id}",
                features: [
                  "Standard KYC 全項目",
                  "OFAC SDN 照合",
                  "UN・EU 制裁リスト",
                  "リスクスコア",
                ],
                highlight: true,
              },
              {
                name: "Batch Lookup",
                price: "$0.5",
                per: "/call",
                endpoint: "POST /api/kyc/batch",
                features: [
                  "最大50社一括照合",
                  "CSV アップロード対応",
                  "Standard/AML 選択",
                  "並列処理",
                ],
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-5 border ${
                  plan.highlight
                    ? "border-gold/50 bg-gold/5"
                    : "border-dark-border bg-dark-card"
                }`}
              >
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-3xl font-bold text-gold font-outfit">
                    {plan.price}
                  </span>
                  <span className="text-gray-400 text-sm pb-1">{plan.per}</span>
                </div>
                <h3 className="font-semibold text-white font-outfit mb-1">
                  {plan.name}
                </h3>
                <code className="text-xs text-gray-500 block mb-3">
                  {plan.endpoint}
                </code>
                <ul className="space-y-1.5">
                  {plan.features.map((f) => (
                    <li key={f} className="text-sm text-gray-400 flex items-center gap-2">
                      <span className="text-gold text-xs">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Try It */}
      <section id="api" className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold font-outfit text-white mb-2">
            Try the API
          </h2>
          <p className="text-gray-400 text-sm mb-6 font-outfit">
            ※ 本番利用はx402対応クライアントからX-Paymentヘッダー付きでリクエストしてください
          </p>

          <div className="flex gap-2 mb-6">
            {(["single", "batch"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setReport(null);
                  setBatchResult(null);
                  setError("");
                }}
                className={`px-5 py-2 rounded-lg text-sm font-medium font-outfit transition-all ${
                  tab === t
                    ? "bg-gold text-black"
                    : "bg-dark-card border border-dark-border text-gray-400 hover:border-gold/50"
                }`}
              >
                {t === "single" ? "Single Lookup" : "Batch Upload"}
              </button>
            ))}
          </div>

          <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
            {tab === "single" ? (
              <KYCForm
                onResult={(data, type) =>
                  setReport({ data: data as KYCReport | AMLReport, type })
                }
                onError={setError}
                onLoading={setLoading}
              />
            ) : (
              <BatchUpload
                onResult={setBatchResult}
                onError={setError}
                onLoading={setLoading}
              />
            )}

            {loading && (
              <div className="mt-6 text-center text-gray-400 font-outfit text-sm">
                <div className="inline-block w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin mr-2" />
                Fetching data…
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-xl text-red-400 text-sm font-outfit">
                {error}
              </div>
            )}

            {report && !loading && (
              <div className="mt-6">
                <KYCReportView report={report.data} />
              </div>
            )}

            {batchResult && !loading && (
              <div className="mt-6">
                <BatchResults response={batchResult} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* API Reference */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold font-outfit text-white mb-6">
            API Reference
          </h2>
          <div className="space-y-4">
            {[
              {
                method: "GET",
                path: "/api/kyc/{country}/{company_id}",
                price: "$1",
                desc: "Standard KYC report. country = JP | SG | HK | AU | KR",
                example: `curl -H "X-Payment: <base64>" \\
  https://apac-kyc-api.vercel.app/api/kyc/JP/1234567890123`,
              },
              {
                method: "GET",
                path: "/api/kyc/aml/{country}/{company_id}",
                price: "$3",
                desc: "AML screening + KYC report with OFAC/UN/EU sanctions check",
                example: `curl -H "X-Payment: <base64>" \\
  https://apac-kyc-api.vercel.app/api/kyc/aml/JP/1234567890123`,
              },
              {
                method: "POST",
                path: "/api/kyc/batch",
                price: "$0.5",
                desc: "Batch lookup up to 50 companies",
                example: `curl -X POST -H "X-Payment: <base64>" \\
  -H "Content-Type: application/json" \\
  -d '{"companies":[{"country":"JP","id":"1234567890123"}],"check_type":"standard"}' \\
  https://apac-kyc-api.vercel.app/api/kyc/batch`,
              },
            ].map((ep) => (
              <div
                key={ep.path}
                className="bg-dark-card border border-dark-border rounded-xl p-5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-blue-900/40 text-blue-400 text-xs rounded font-mono">
                    {ep.method}
                  </span>
                  <code className="text-gold text-sm">{ep.path}</code>
                  <span className="ml-auto text-gold font-semibold text-sm">
                    {ep.price}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-3 font-outfit">{ep.desc}</p>
                <pre className="bg-dark rounded-lg p-3 text-xs text-gray-300 overflow-x-auto">
                  {ep.example}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agentic Usage */}
      <section id="agentic" className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold font-outfit text-white mb-2">
            このAPIをエージェントとして使う
          </h2>
          <p className="text-gray-400 text-sm mb-6 font-outfit">
            x402対応エージェントが自律的にKYCチェックを実行できます
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {[
              {
                title: "Discovery",
                desc: "/.well-known/x402.json でエンドポイント一覧・価格・データソースを自動検出",
                code: "GET /.well-known/x402.json",
              },
              {
                title: "自律決済",
                desc: "エージェントがx402プロトコルでUSDCを自動支払い。人間の承認不要",
                code: "X-Payment: <base64-payment-proof>",
              },
              {
                title: "構造化出力",
                desc: "全レスポンスがJSON。legal_name, kyc_score, aml_statusをそのままワークフローへ",
                code: `{ "kyc_score": 0.92, "aml_status": "clear" }`,
              },
              {
                title: "来歴透明性",
                desc: "全レスポンスにdata_source・source_licenseを含む。コンプライアンス監査対応",
                code: `{ "data_source": "国税庁法人番号API" }`,
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-dark-card border border-dark-border rounded-xl p-4"
              >
                <h3 className="font-semibold text-white font-outfit mb-1">
                  {item.title}
                </h3>
                <p className="text-gray-400 text-sm mb-2 font-outfit">{item.desc}</p>
                <code className="text-xs text-gold">{item.code}</code>
              </div>
            ))}
          </div>

          <div className="bg-dark-card border border-gold/20 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gold font-outfit mb-3">
              Example: Claude Agent での使い方
            </h3>
            <pre className="text-xs text-gray-300 overflow-x-auto">
{`import anthropic from "@anthropic-ai/sdk";

const client = new anthropic.Anthropic();

const result = await client.messages.create({
  model: "claude-opus-4-7",
  max_tokens: 1024,
  tools: [{
    name: "kyc_check",
    description: "Check KYC status of an APAC company via x402 API",
    input_schema: {
      type: "object",
      properties: {
        country: { type: "string", enum: ["JP", "SG", "HK", "AU", "KR"] },
        company_id: { type: "string" }
      },
      required: ["country", "company_id"]
    }
  }],
  messages: [{
    role: "user",
    content: "株式会社サンプル (法人番号: 1234567890123) のKYCチェックをしてください"
  }]
});`}
            </pre>
          </div>
        </div>
      </section>

      {/* Data Transparency */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
            <h2 className="text-lg font-bold font-outfit text-white mb-4">
              データ透明性・AMLポリシー
            </h2>
            <div className="space-y-3 text-sm text-gray-400 font-outfit">
              <p>
                ✓ 全レスポンスに <code className="text-gold">data_source</code> と{" "}
                <code className="text-gold">source_license</code> を含め、データ来歴を明示
              </p>
              <p>
                ✓ AMLスクリーニングは公開制裁リスト（OFAC SDN / UN Consolidated / EU
                Consolidated）のみ使用
              </p>
              <p>
                ✗ 非公開の反社チェックリストは使用しません
              </p>
              <p>
                ✓ 全データソースは無料・商用利用可のオープンデータ（各国政府提供）
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
