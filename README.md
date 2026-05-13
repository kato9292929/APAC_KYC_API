# APAC KYC API

APAC各国の公的法人データベースを横断して、標準化されたKYCレポートを [x402](https://x402.org) 決済で提供するAPIです。

**対応国:** 🇯🇵 Japan / 🇸🇬 Singapore / 🇭🇰 Hong Kong / 🇦🇺 Australia / 🇰🇷 Korea

---

## エンドポイント

| Method | Path | Price | 概要 |
|--------|------|-------|------|
| `GET` | `/api/kyc/{country}/{company_id}` | $1/call | 標準KYCレポート |
| `GET` | `/api/kyc/aml/{country}/{company_id}` | $3/call | AMLスクリーニング付きレポート |
| `POST` | `/api/kyc/batch` | $0.5/call | 最大50社一括照合 |
| `GET` | `/.well-known/x402.json` | 無料 | Discovery / 自動検出 |

### country コード

| Code | 国 | ID形式 |
|------|----|--------|
| `JP` | Japan | 法人番号（13桁） |
| `SG` | Singapore | UEN（例: `202012345A`） |
| `HK` | Hong Kong | 会社番号（例: `0123456`） |
| `AU` | Australia | ABN（11桁、例: `51824753556`） |
| `KR` | Korea | 사업자등록번호（10桁） |

---

## クイックスタート

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

```bash
cp .env.example .env.local
```

`.env.local` を編集して各APIキーとウォレットアドレスを設定します（後述）。

### 3. 開発サーバー起動

```bash
npm run dev
```

`http://localhost:3000` でアクセスできます。

---

## 環境変数

| 変数 | 必須 | 説明 |
|------|------|------|
| `WALLET_ADDRESS` | ✅ | USDC受け取りアドレス（Base mainnet） |
| `NETWORK_ID` | ✅ | `eip155:8453`（Base mainnet固定） |
| `HOUJIN_API_KEY` | ✅ (JP) | 国税庁法人番号APIキー |
| `KR_DATA_API_KEY` | ✅ (KR) | 공공데이터포털 APIキー |
| `ACRA_API_KEY` | ☐ (SG) | Singapore ACRA APIキー（未設定時は公開エンドポイントを使用） |
| `X402_FACILITATOR_URL` | ☐ | x402ファシリテーターURL（デフォルト: `https://x402.org/facilitator`） |
| `NEXT_PUBLIC_BASE_URL` | ☐ | デプロイURL（例: `https://apac-kyc-api.vercel.app`） |

### APIキーの取得

- **国税庁法人番号API:** [https://www.houjin-bangou.nta.go.jp/webapi/](https://www.houjin-bangou.nta.go.jp/webapi/) で申請
- **公공데이터포털 (KR):** [https://www.data.go.kr/](https://www.data.go.kr/) でアカウント作成・申請
- **ACRA BizFile+ (SG):** [https://www.acra.gov.sg/](https://www.acra.gov.sg/) で申請

---

## APIの使い方

### x402 決済フロー

1. クライアントがリクエストを送信
2. サーバーが `402 Payment Required` と支払い要件を返す
3. クライアントがBase上でUSDCを支払い
4. `X-Payment` ヘッダー付きでリトライ
5. サーバーがファシリテーターで検証し、レポートを返す

```bash
# 1. まず 402 レスポンスで支払い要件を確認
curl https://apac-kyc-api.vercel.app/api/kyc/JP/1234567890123

# 2. x402 対応クライアントで支払い付きリクエスト
curl -H "X-Payment: <base64-encoded-payment-proof>" \
  https://apac-kyc-api.vercel.app/api/kyc/JP/1234567890123
```

### Standard KYC

```bash
GET /api/kyc/JP/1234567890123
```

**レスポンス例:**

```json
{
  "company_id": "1234567890123",
  "country": "JP",
  "legal_name": "株式会社サンプル",
  "legal_name_en": "Sample Corporation",
  "registration_status": "active",
  "incorporation_date": "2010-04-01",
  "registered_address": "東京都千代田区...",
  "representative": null,
  "capital": null,
  "industry_code": null,
  "last_updated": "2026-03-31",
  "kyc_score": 0.92,
  "data_source": "国税庁法人番号API",
  "source_url": "https://api.houjin-bangou.nta.go.jp/",
  "source_license": "国税庁コーポレートナンバー・オープンデータ利用規約（商用利用可・帰属明示）",
  "flags": []
}
```

### AML Screening

```bash
GET /api/kyc/aml/JP/1234567890123
```

**レスポンス例:**

```json
{
  "company_id": "1234567890123",
  "country": "JP",
  "legal_name": "株式会社サンプル",
  "aml_status": "clear",
  "sanctions_check": {
    "ofac": "clear",
    "un": "clear",
    "eu": "clear",
    "japan_fsa": "clear"
  },
  "pep_check": "no_match",
  "adverse_media": [],
  "risk_level": "low",
  "aml_score": 0.92,
  "checked_at": "2026-05-13T15:00:00.000Z",
  "kyc_score": 0.92,
  "data_source": "国税庁法人番号API",
  "source_license": "国税庁コーポレートナンバー・オープンデータ利用規約（商用利用可・帰属明示）",
  "flags": []
}
```

### Batch Lookup

```bash
POST /api/kyc/batch
Content-Type: application/json

{
  "companies": [
    { "country": "JP", "id": "1234567890123" },
    { "country": "SG", "id": "202012345A" },
    { "country": "AU", "id": "51824753556" }
  ],
  "check_type": "standard"
}
```

**レスポンス例:**

```json
{
  "total": 3,
  "successful": 3,
  "failed": 0,
  "results": [...],
  "processed_at": "2026-05-13T15:00:00.000Z"
}
```

---

## Discovery

`/.well-known/x402.json` でエンドポイント一覧・価格・データソース・ライセンスを動的生成します。x402対応エージェントが自動的にAPIを発見・利用できます。

```bash
curl https://apac-kyc-api.vercel.app/.well-known/x402.json
```

[Agentic.market Bazaar](https://agentic.market) への自動登録用メタデータも含みます。

---

## エージェントとしての利用

このAPIはエージェント（AI）からの自律的な利用を想定して設計されています。

```typescript
// Claude エージェントから使う例
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const response = await client.messages.create({
  model: "claude-opus-4-7",
  max_tokens: 1024,
  tools: [
    {
      name: "kyc_check",
      description: "Check KYC status of an APAC company. Supports JP/SG/HK/AU/KR.",
      input_schema: {
        type: "object" as const,
        properties: {
          country: { type: "string", enum: ["JP", "SG", "HK", "AU", "KR"] },
          company_id: { type: "string", description: "Corporate registration number" },
          check_type: { type: "string", enum: ["standard", "aml"] },
        },
        required: ["country", "company_id"],
      },
    },
  ],
  messages: [
    {
      role: "user",
      content: "法人番号 1234567890123 の企業をKYCチェックして",
    },
  ],
});
```

---

## データソースとライセンス

| 国 | データソース | ライセンス |
|----|-------------|-----------|
| 🇯🇵 JP | [国税庁法人番号API](https://www.houjin-bangou.nta.go.jp/webapi/) | 国税庁コーポレートナンバー・オープンデータ利用規約（商用利用可） |
| 🇸🇬 SG | [ACRA BizFile+ / data.gov.sg](https://data.gov.sg/) | Singapore Open Data Licence v1.0 |
| 🇭🇰 HK | [Companies Registry ICRIS](https://www.cr.gov.hk/) | 香港政府開放數據授權協議 |
| 🇦🇺 AU | [ABR ABN Lookup](https://abr.business.gov.au/) | Creative Commons Attribution 3.0 Australia |
| 🇰🇷 KR | [공공데이터포털](https://www.data.go.kr/) | 공공누리 제1유형 |

**AMLスクリーニング用制裁リスト（全て公開データ）:**

| リスト | 提供元 |
|--------|--------|
| OFAC SDN List | [US Department of the Treasury](https://www.treasury.gov/ofac/downloads/sdn.xml) |
| UN Consolidated List | [UN Security Council](https://scsanctions.un.org/) |
| EU Consolidated List | [European Commission](https://webgate.ec.europa.eu/fsd/fsf) |

> **ポリシー:** AMLスクリーニングは上記の公開制裁リストのみ使用します。非公開の反社チェックリストは使用しません。全レスポンスに `data_source` と `source_license` を含め、データ来歴の透明性を確保します。

---

## Vercelデプロイ

```bash
# Vercel CLI でデプロイ
npx vercel

# 本番デプロイ
npx vercel --prod
```

Vercelダッシュボードで環境変数を設定してください。

---

## 技術スタック

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Payment:** x402 (Base / USDC)
- **Styling:** Tailwind CSS + Outfit font
- **Deploy:** Vercel
- **XML Parsing:** fast-xml-parser
- **CSV Parsing:** papaparse (batch UI)

---

## ライセンス

MIT
