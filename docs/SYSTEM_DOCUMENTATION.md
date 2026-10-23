# AI Due Diligence Audit Workbench – Rendszerdokumentáció
Forráskóddal egyeztetett enterprise kiadás (v2.4.0-enterprise, 2026. október 23.)

## 1. Cél és pozicionálás
Az AI Due Diligence Audit Workbench M&A átvilágítási gyakorló- és szimulációs enterprise webalkalmazás. Azt gyakoroltatja, hogy az elemző az AI-val vagy a menedzsment által írt M&A-összefoglalókban megtalálja a rejtett hibákat, és a teljes ellenőrzési láncot végigviszi:
1. Kijelölés: a gyanús állítás beazonosítása a dokumentumban.
2. Kategorizálás: számszaki hiba (NUMERIC_MISMATCH), logikai ellentmondás (LOGICAL_CONTRADICTION) vagy kitalált forrás (FABRICATED_SOURCE).
3. Indoklás: összefüggő szakmai érv a dokumentum konkrét adataira hivatkozva.
4. Helyesbítés: a korrigált tényadat vagy számszaki levezetés megadása.

A rendszer szimulációs és képzési eszköz. A kiállított digitális audit igazolások szerveroldali, determinisztikus RFC 8785 kanonikus JSON formátumon és SHA-256 kriptográfiai digeszten alapulnak.

## 2. Architektúra és fájlstruktúra
React 19, TypeScript 5.7, Tailwind CSS 4, Express server és Vite 6 alapú alkalmazás. A kiértékelő mag (`auditScoring.ts`) pure functions architektúrát használ, teljes mértékben mellékhatásmentes és tesztelhető.

```
/
├── server.ts                        # Express API szerver: B2B tenant szeparáció, rate limiting, szerveroldali pontozás, Gemini LLM integráció
├── schema.sql                       # PostgreSQL / Supabase adatbázis-séma (VARCHAR(128) SHA-256 hash, tenant_id)
├── src/
│   ├── App.tsx                      # Állapotkezelés, modálok, értékelés indítása
│   ├── components/
│   │   ├── TopBar.tsx               # Forgatókönyv címe, időzítő, gyorsműveletek
│   │   ├── DocumentViewer.tsx       # Dokumentumnéző, kattintható kijelölés
│   │   ├── AuditPanel.tsx           # Megállapítások szerkesztése, élő szerkezeti számláló
│   │   ├── AuditReportView.tsx      # Zárójelentés, pontbontás, SHA-256 összeg
│   │   ├── AIBenchmarkModal.tsx     # Dual Benchmark Aréna (Humán vs Gemini/Claude/GPT-4o)
│   │   ├── FinancialCalculatorModal.tsx # EBITDA, CAC, szorzók, Rule of 40
│   │   ├── ScenarioSelectorModal.tsx# Forgatókönyv-választó (4 M&A esettanulmány)
│   │   └── SystemDocumentationModal.tsx # Rendszerdokumentáció modál
│   ├── data/
│   │   └── scenarios.ts             # 4 M&A forgatókönyv, 12 beültetett hiba, validációs adatok
│   ├── db/
│   │   └── client.ts                # PostgreSQL adatbázis-kliens (szerveroldali perzisztencia)
│   ├── types/audit.ts               # Típusdefiníciók
│   └── utils/
│       ├── auditScoring.ts          # Pontozó- és validációs motor, RFC 8785, SHA-256
│       └── auditScoring.test.ts     # 20 egységteszt (node:test)
```

## 3. A négydimenziós pontozás
Minden beültetett hibához tartozik egy pontérték (a négy forgatókönyvben hibánként 35, 35 és 30 pont, összesen 100). A tétel pontjai négy részre oszlanak:

| Dimenzió | Súly | Szabály a kódban |
| :--- | :--- | :--- |
| **Kijelölés** | 35% | `checkPhraseMatchStrict`: a normalizált szöveg legalább 6 karakter és legalább 2 szó. Pontos egyezés elfogadva. Részsztring-találathoz legalább 10 karakter és legalább 50%-os hosszarány kell. |
| **Kategória** | 25% | A választott kategória egyezik a beültetett hibáéval. Téves kategóriánál ez a rész 0, a tétel nem lehet teljes értékű. |
| **Indoklás** | 25% | `evaluateJustification`: legalább 20 karakter, legalább 5 szó, legalább 2 kulcsfogalom és földelés a szöveg környezetéből. |
| **Helyesbítés** | a maradék (15%) | `evaluateCorrection`: számszaki hibánál a számértéknek a megadott tűrésen belül kell lennie. Szöveges hibánál legalább 3 szó és az elvárt tényállás. |

### Téves riasztás és levágás
• Téves riasztás (False Positive): minden olyan annotáció, amely egyetlen beültetett hibához sem párosul, -20 pont.  
• A pontszám szigorúan a `[0, maxPossibleScore]` tartományra van vágva.

### Minősítési szintek
| Minősítés | Feltétel |
| :--- | :--- |
| **Senior szintű elemzői teljesítmény** | Összpontszám ≥ 85%, az elemzési pontok ≥ 60%-a, és pontosan 0 téves riasztás |
| **Gyakorlott auditor (Associate szint)** | Összpontszám ≥ 55%, van érvényes elemzési pont, legfeljebb 1 téves riasztás |
| **Fokozott kockázat / Hiányos indoklás** | Minden egyéb eset |

## 4. A 4 M&A Forgatókönyv

| Forgatókönyv | Nehézség | Számszaki hiba | Logikai ellentmondás | Kitalált forrás |
| :--- | :--- | :--- | :--- | :--- |
| **Project CloudPulse (B2B SaaS akvizíció)** | Haladó / M&A | 35,2%-os EBITDA-árrés állítása $12,4M ARR és $9,8M opex mellett. A valós Cash EBITDA $2,6M (20,97%). | 42%-os fejlesztői fluktuáció, miközben a szöveg szerint a kulcsemberi kockázat elhanyagolható. | Gartner-McKinsey Joint Index (két független cég fiktív közös indexe). |
| **Nordic Retail Group (E-Commerce D2C)** | Középhaladó | €12,50-os CAC állítása €3,6M marketingköltség és 90 000 új vevő mellett. A valódi blended CAC €40,00. | A készletforgási idő 24 napra csökken, a raktározási és logisztikai költségek mégis 65%-kal nőnek. | Shopify-Statista European Direct-to-Consumer Efficiency Standard. |
| **NovaPay Technologies (FinTech & CAR)** | Haladó / M&A | 24,5%-os Tier 1 CAR állítása €5,4M Tier 1 tőke és €45,0M RWA mellett. A valódi Tier 1 CAR 12,0%. | Az NPL-arány 4,2%-ról 7,8%-ra ugrik, a szöveg ezt javulásnak mondja. | EBA/GL/2026/994 sz. FinTech Likviditási Mentesítési Direktíva. |
| **Project GenAI IP (DeepTech & IP Royalty)** | Haladó / M&A | 81,2%-os IP árrés állítása $8,5M árbevétel mellett $1,5M OSS jogdíj és $3,1M R&D levonása után ($8,5M - $1,5M - $3.1M = $3,9M). A valós IP árrés 45,88%. | Proprietary Copyleft kifejezés (a Copyleft GPLv3 nyílt nyilvánosságot ír elő, ellentmond a zárt kóddal). | WIPO-EPO Joint European DeepTech Patent & AI Royalty Benchmark. |

## 5. Riport-integritás & Szerveroldali Hitelesítés (RFC 8785 + SHA-256)
A zárójelentés szerveroldalon kerül kiértékelésre. A szerver lefutatja az `evaluateAudit()` motort, majd elkészíti a determinisztikus RFC 8785 kanonikus JSON-t, amelyből `SHA256:...` formátumú kriptográfiai digesztet számol. A `/api/reports/verify` végpont kizárólag a perzisztált adatbázis-rekordok megléte és egyezősége esetén igazolja a riport sértetlenségét.

## 6. Verifikációs és Tesztfuttatási Állapot

| Ellenőrzés | Állapot |
| :--- | :--- |
| `npm test` (`tsx --test src/utils/auditScoring.test.ts`) | **20/20 PASS** |
| TypeScript típusellenőrzés (`npm run lint`) | **0 hiba (`tsc --noEmit`)** |
| Production Build (`npm run build`) | **Sikeres Vite bundle fordítás** |
