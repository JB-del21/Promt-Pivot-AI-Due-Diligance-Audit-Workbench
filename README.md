# 🛡️ PROMPT & PIVOT — AI Due Diligence Workbench & Cohort Analytics

> **Enterprise B2B SaaS & EdTech Audit Platform** for training, evaluating, and benchmarking human analysts, junior auditors, and LLM AI agents on synthetic M&A due diligence reports, financial statements, and IP royalty disclosures.

![Version](https://img.shields.io/badge/version-2.4.0--enterprise-emerald)

[![Release Gate CI](https://github.com/JB-del21/Promt-Pivot-AI-Due-Diligance-Audit-Workbench/actions/workflows/release-gate.yml/badge.svg?branch=fix/v7-1-security-evidence-closure)](https://github.com/JB-del21/Promt-Pivot-AI-Due-Diligance-Audit-Workbench/actions/workflows/release-gate.yml)

![Platform](https://img.shields.io/badge/platform-Vercel%20Serverless%20%7C%20Supabase%20PostgreSQL-black)

---

## Release state: v7.1 draft / NO-GO production

The secured changes are on the `fix/v7-1-security-evidence-closure` Pull Request branch, **not** merged into production `main`. GitHub CI validates code and an isolated PostgreSQL database, but this does **not** attest to production tenant isolation, identity provider configuration or a live model deployment.

- Public synthetic practice is available without identity.
- `/api/reports`, `/api/reports/verify`, `/api/cohort/metrics`, and `/api/benchmark/run` require a short-lived RS256 JWT signed by a trusted issuer; missing auth configuration fails closed.
- The signed `tenant_id` claim must be assigned by a trusted identity provider; `x-tenant-id` is not accepted as authority.
- Server report integrity is a recomputed SHA-256 *content check*, not an external certificate, signature or legal attestation.
- Preset AI model ratings are **synthetic demonstrations**, not live empirical model comparisons.
- A real sign-in interface and trusted identity provider have not yet been configured. Therefore protected features will not be usable in a preview until identity setup is complete.
- Apply the `benchmark_rate_limits` SQL migration on a disposable test database before enabling authenticated endpoints. See [release gate plan](docs/RELEASE_GATE_V7_1.md).

## 🌐 Live Application Links

* **Web Workbench (Vercel Production):** [https://promt-pivot-ai-due-diligance-audit.vercel.app](https://promt-pivot-ai-due-diligance-audit.vercel.app)
* **Live Shared Preview App:** [https://ais-pre-mioi2tcc4buagq7rguuaha-209349474032.europe-west2.run.app](https://ais-pre-mioi2tcc4buagq7rguuaha-209349474032.europe-west2.run.app)

---

## 🎯 Executive Overview & Core Value Proposition

In the era of Generative AI, language models frequently output authoritative-sounding financial analyses, valuation multiples, and legal disclaimers containing **hallucinated sources**, **mathematical inconsistencies**, and **logical contradictions**.

**PROMPT & PIVOT** provides an adversarial, controlled synthetic audit training environment where human analysts and AI models are tested against calibrated seed faults.

### 🌟 Key Capabilities
* **Interactive Redlining Document Viewer:** Real-time text-selection annotation bubble supporting touch and mouse interactions.
* **4-Dimensional Deterministic Grading Engine:** Scores findings across 4 distinct pillars (Discovery 35%, Category Classification 25%, Professional Rationale 25%, Numerical Correction 15%) with severe False Positive penalties (-20 pts).
* **Strict Mode / Blind Worksheet (Didactic Difficulty):** Toggle mode that strips visual highlights, forcing analysts to independently discover hidden anomalies.
* **Dual Benchmark Arena (Human vs. AI):** Illustrative synthetic presets for **Gemini 3.8 Flash**, **Claude 3.5 Sonnet**, **GPT-4o**, and **Llama 3 70B**.
* **Cohort Analytics & Fault Heatmap Matrix:** Executive dashboard aggregating participant error rates, systemic blind spots, and team performance metrics.
* **Cryptographic Data Integrity (RFC 8785 + SHA-256):** Key-ordered canonical JSON generation and SHA-256 hashing for verifiable, content checksums (not independently signed certificates).
* **Omnichannel Mobile Integration:** Mobile-oriented interface previews and QR-code testing (no production bidirectional synchronization has been verified).
* **Stateful Serverless Storage:** PostgreSQL (Supabase / Neon) database persistence layer for audit submissions, cohort heatmaps, and verification checks.

---

## 📚 M&A Case Studies Test Bank

The platform features 4 high-stakes, domain-authentic due diligence scenarios:

| Scenario ID | Title & Domain | Target Company | Difficulty | Core Seed Faults & Injected Anomalies |
| :--- | :--- | :--- | :--- | :--- |
| `mna-saas-cloudpulse-2026` | **Project CloudPulse**<br>*(Pénzügy / SaaS M&A)* | CloudPulse Analytics Kft. | `Haladó / M&A` | 1. **Numeric:** $12.4M ARR & $9.8M Opex yields 20.97% Cash EBITDA (claimed 35.2%).<br>2. **Logic:** 42% developer churn vs. claimed "negligible key person risk".<br>3. **Fabricated Source:** Non-existent "Gartner-McKinsey Joint Index". |
| `ecommerce-nordic-retail-2026` | **Nordic Retail Group**<br>*(E-Commerce Unit Economics)* | Nordic Brands D2C Holding | `Középhaladó` | 1. **Numeric:** €3.6M marketing / 90k customers = €40.00 Blended CAC (claimed €12.50).<br>2. **Logic:** Inventory turnover down to 24 days while logistics costs jump 65%.<br>3. **Fabricated Source:** Hallucinated "Shopify-Statista European D2C Standard". |
| `fintech-novapay-risk-2026` | **NovaPay Technologies**<br>*(FinTech & Capital Adequacy)* | NovaPay Lending Platform | `Haladó / M&A` | 1. **Numeric:** €5.4M Tier 1 / €45M RWA = 12.0% Tier 1 CAR (claimed 24.5%).<br>2. **Logic:** NPL jump from 4.2% to 7.8% presented as "unprecedented quality improvement".<br>3. **Fabricated Source:** Fake "EBA/GL/2026/994 Liquidity Exemption Directive". |
| `mna-ai-startup-ip-royalty-2026` | **Project GenAI IP**<br>*(DeepTech Startup & IP Royalty)* | Cognitive Core AI Labs Kft. | `Haladó / M&A` | 1. **Numeric:** $8.5M ARR minus $1.5M OSS fees & $3.1M R&D = 45.88% IP Margin (claimed 81.2%).<br>2. **Logic:** Oxymoronic "Proprietary Copyleft" protection concealing GPLv3 viral copyleft risk.<br>3. **Fabricated Source:** Hallucinated "WIPO-EPO Joint AI Royalty Benchmark". |

---

## 🏗️ Technical Architecture & Stack

```
   ┌────────────────────────────────────────────────────────────────────────┐
   │                  PROMPT & PIVOT Omnichannel Platform                  │
   └────────────────────────────────────────────────────────────────────────┘
                                     │
         ┌───────────────────────────┴───────────────────────────┐
         ▼                                                       ▼
  ┌──────────────┐                                        ┌──────────────┐
  │ React + Vite │                                        │ Native App & │
  │ Web Frontend │                                        │ Android View │
  └──────┬───────┘                                        └──────┬───────┘
         │                                                       │
         └───────────────────────────┬───────────────────────────┘
                                     ▼
                     ┌───────────────────────────────┐
                     │ Express Serverless Kernel     │
                     │ (Vercel Serverless Functions) │
                     └───────────────┬───────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│ Deterministic    │       │ Google GenAI SDK │       │ Supabase / Neon  │
│ Audit Kernel     │       │ (Gemini 3.8 Live)│       │ PostgreSQL DB    │
│ (RFC 8785)       │       └──────────────────┘       └──────────────────┘
└──────────────────┘
```

### Stack Components
* **Frontend:** React 19, TypeScript 5.7, Tailwind CSS v4, Lucide Icons, Context API state store.
* **Backend:** Node.js, Express, tsx, Vercel Serverless Functions (`api/index.ts`).
* **AI Integration:** `@google/genai` TypeScript SDK (Gemini 3.8 Flash model with Anti-FDoS 10s race timeout and JSON schema enforcement).
* **Database:** PostgreSQL (`pg` connection pool with SSL handling) supporting Supabase / Neon / Vercel Postgres (`schema.sql`).
* **Cryptography:** Web Crypto API SHA-256 hashing (`auditScoring.ts`).

---

## 🗄️ Database Schema

The canonical database schema is [schema.sql](schema.sql). Do not copy obsolete SQL snippets from prior README versions. Database migrations are operator-controlled, not automatically run by a Vercel deployment. Server-side tenant filters and a verified JWT issuer are mandatory for persisted customer records.

---

## 🚀 Local Setup & Installation

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

### Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/JB-del21/Promt-Pivot-AI-Due-Diligance-Audit-Workbench.git
   cd Promt-Pivot-AI-Due-Diligance-Audit-Workbench
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the project root:
   ```env
   PORT=3000
   NODE_ENV=development
   GEMINI_API_KEY=your_gemini_api_key_here
   DATABASE_URL=postgres://user:password@db.supabase.co:5432/postgres
   ```

4. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

5. **Run Test Suite:**
   ```bash
   npm run test:unit  # no database required
   # npm test requires a disposable PostgreSQL prompt_pivot_test database
   ```

6. **Build for Production:**
   ```bash
   npm run build
   ```

---

## 🔌 API Reference Endpoints

| Method | Endpoint | Description | Sample Payload / Params |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Healthcheck & DB status | `?` |
| `GET` | `/api/benchmark/presets` | Pre-calibrated LLM arena benchmarks | `?scenarioId=mna-saas-cloudpulse-2026` |
| `POST` | `/api/benchmark/run` | Live Gemini 3.8 Flash adversarial audit | `{ "scenarioId": "...", "documentText": "..." }` |
| `POST` | `/api/reports` | Save audit report submission to DB | `{ "scenarioId": "...", "sha256Hash": "...", ... }` |
| `POST` | `/api/reports/verify` | Verify SHA-256 hash in DB | `{ "sha256Hash": "SHA256:..." }` |
| `GET` | `/api/cohort/metrics` | Cohort Analytics & Heatmap Matrix | `?scenarioId=...&group=M%26A+Trainees+2026%2FQ1` |

---

## 🧪 Quality Assurance & Verification

* **TypeScript Compilation:** `npm run lint` (`tsc --noEmit`) returns **0 errors**.
* **Tests:** `npm run test:unit` checks the local engine and unauthenticated API rejection; `npm run test:db` requires a disposable PostgreSQL 16 `prompt_pivot_test` instance. See GitHub Actions for exact passing counts.
* **RFC 8785 Compliance:** Tested against key-sorting, non-finite number rejections, and byte-exact SHA-256 digests.
* **Mobile Responsiveness:** Responsive UI is included; device/browser coverage is not independently certified.

---

## 📄 License & Attribution

**License pending confirmation:** some source files have Apache-2.0 SPDX headers, but the repository currently has no root LICENSE file. Do not assume unrestricted reuse.

Synthetic teaching scenarios. Any podcast attribution or named external source must be independently verified before being presented as a factual quotation.
