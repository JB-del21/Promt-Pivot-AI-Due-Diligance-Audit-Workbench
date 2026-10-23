# AI Due Diligence Audit Workbench – Rendszerdokumentáció
Forráskóddal egyeztetett kiadás (a feltöltött v4 zip alapján, 2026. október 23.)

## 1. Cél és pozicionálás
Az AI Due Diligence Audit Workbench átvilágítási gyakorló- és szimulációs webalkalmazás. Azt gyakoroltatja, hogy az elemző az AI-val vagy a menedzsment által írt M&A-összefoglalókban megtalálja a rejtett hibákat, és a teljes ellenőrzési láncot végigviszi:
1. Kijelölés: a gyanús állítás beazonosítása a dokumentumban.
2. Kategorizálás: számszaki hiba (NUMERIC_MISMATCH), logikai ellentmondás (LOGICAL_CONTRADICTION) vagy kitalált forrás (FABRICATED_SOURCE).
3. Indoklás: összefüggő szakmai érv a dokumentum konkrét adataira hivatkozva.
4. Helyesbítés: a korrigált tényadat vagy számszaki levezetés megadása.

A rendszer nem akkreditált vizsgarendszer. Nincs mögötte pszichometriai validáció, sem független, emberi minősítésekkel összevetett adat, ezért a minősítései tájékoztató jellegűek (lásd a 7. szakaszt).

## 2. Architektúra és fájlstruktúra
React 19, TypeScript, Tailwind CSS 4 és Vite 8 alapú egyoldalas alkalmazás. A kiértékelő mag (auditScoring.ts) csak típusimportot és natív, szabványos primitíveket használ (Web Crypto, JavaScript beépített függvények). A package.json az AI Studio sablonból további csomagokat is tartalmaz (például express, @google/genai, motion), ezeket a kiértékelő mag nem használja.

```
src/
├── App.tsx                          # Állapotkezelés, modálok, értékelés indítása
├── components/
│   ├── TopBar.tsx                   # Forgatókönyv címe, időzítő, gyorsműveletek
│   ├── DocumentViewer.tsx           # Dokumentumnéző, kattintható kijelölés
│   ├── AuditPanel.tsx               # Megállapítások szerkesztése, élő szerkezeti számláló
│   ├── AuditReportView.tsx          # Zárójelentés, pontbontás, SHA-256 összeg
│   ├── FinancialCalculatorModal.tsx # EBITDA, CAC, szorzók, Rule of 40
│   ├── ScenarioSelectorModal.tsx    # Forgatókönyv-választó
│   ├── PodcastContextModal.tsx      # Szakmai háttérkontextus
│   └── SystemDocumentationModal.tsx # Rendszerdokumentáció és tájékoztató modál
├── data/
│   ├── scenarios.ts                 # 3 forgatókönyv, 9 beültetett hiba, validációs adatok
│   └── podcastKnowledge.ts          # Háttéranyag
├── types/audit.ts                   # Típusdefiníciók
└── utils/
    ├── auditScoring.ts              # Pontozó- és validációs motor, RFC 8785, SHA-256
    └── auditScoring.test.ts         # 18 egységteszt (node:test)
```

## 3. A négydimenziós pontozás
Minden beültetett hibához tartozik egy pontérték (a három forgatókönyvben hibánként 35, 35 és 30 pont, összesen 100). A tétel pontjai négy részre oszlanak:

| Dimenzió | Súly | Szabály a kódban |
| :--- | :--- | :--- |
| **Kijelölés** | 35% | `checkPhraseMatchStrict`: a normalizált szöveg legalább 6 karakter és legalább 2 szó. Pontos egyezés elfogadva. Részsztring-találathoz legalább 10 karakter és legalább 50%-os hosszarány kell. Ezek híján a 2 karakternél hosszabb szavakon számolt Jaccard-hasonlóság legalább 0,65. |
| **Kategória** | 25% | A választott kategória egyezik a beültetett hibáéval. Téves kategóriánál ez a rész 0, a tétel nem lehet teljes értékű, és így Senior minősítés sem érhető el. |
| **Indoklás** | 25% | Lásd lent. |
| **Helyesbítés** | a maradék (15%, a 30 pontos tételnél 3 pont) | Lásd lent. |

A részpontok tételenként a tétel pontkeretén belül maradnak: az első három rész lekerekített érték, a helyesbítés a keret maradéka. Így a 30 pontos tétel 11 + 8 + 8 + 3, és a 102/100 típusú túlcsordulás kizárt.

### Indoklás (`evaluateJustification`)
• Legalább 20 karakter, legalább 5 szó (ebből legalább 4 különböző), és legalább 5 különböző karakter.  
• Legalább 2 különböző kulcsfogalom a hibához tartozó `required_keywords` listából. A szöveges kulcsszavak szóhatáron, ragozástűrően illeszkednek, a számokat számértékként keresi (így a „140” nem találja el a „40”-et, a „scarce” a „car”-t). A közel azonos számok (20.9, 21%, 21.0%) egy fogalomnak számítanak.  
• Földelés: az indoklásban szerepelnie kell a hiba környezetéből származó számnak, vagy legalább két olyan környezeti szónak, amely maga nem kulcsszó.  
• Ha nincs szöveges kulcsfogalom, a számok mellé legalább két környezeti szó kell. A puszta számsor nem érv.  

### Helyesbítés (`evaluateCorrection`)
• Számszaki hiba: kötelező szám. A válasz első vagy utolsó számának a megadott tűréssávba kell esnie (például 11,5–12,5% a 12,0%-os mutatónál). Így a levezetések is elfogadottak (12.4 - 9.8 = 2.6, azaz 20.97%). Kezeli a tizedesvesszőt, az ezres tagolást és az „M” jelölést. Hat számnál többet tartalmazó válasz elutasítva.  
• Szöveges hiba: legalább 3 szó, legalább 2 különböző fogalom (ebből egy az elvárt helyesbítésből), és legfeljebb 40%-nyi, a hibához nem kötődő szó.  
• Értelmetlen, ismétlődő karakterekből álló bejegyzés (például „aaaaaaaa”) elutasítva.  

### Téves riasztás és levágás
• Téves riasztás: minden olyan annotáció, amely egyetlen beültetett hibához sem párosul, -20 pont. Ugyanarra a hibára tett második annotáció is téves riasztás.  
• A tétel- és az összpontszám is a `[0, maxPossibleScore]` tartományra van vágva.  

### Minősítési szintek

| Minősítés (a felületen megjelenő név) | Feltétel |
| :--- | :--- |
| **Senior szintű elemzői teljesítmény** | Összpontszám ≥ 85%, az elemzési pontok (indoklás + helyesbítés) legalább 60%-a, és pontosan 0 téves riasztás |
| **Gyakorlott auditor (Associate szint)** | Összpontszám ≥ 55%, van érvényes elemzési pont, legfeljebb 1 téves riasztás |
| **Fokozott kockázat / Hiányos indoklás** | Minden egyéb eset |

## 4. Kijátszás elleni védelmek
A fejlesztési körökben ellenőrzött támadási minták, amelyek már nem érnek el Senior minősítést:
• kulcsszó-halmozás „lorem ipsum” töltelékkel és egyszavas helyesbítéssel (korábban 95/100, most legfeljebb 61–70/100),  
• egy kulcsszó és egy tetszőleges szám,  
• részsztring-ütközések (140 ≠ 40, scarce ≠ car),  
• szám nélküli vagy értelmetlen helyesbítés,  
• számlista a helyesbítés mezőben,  
• téves kategória minden tételnél,  
• a tételenkénti kerekítésből adódó pontszám-túlcsordulás.  
Jó, kifejtett válaszok mindhárom forgatókönyvben 100/100 pontot adnak.

## 5. A forgatókönyvek

| Forgatókönyv | Nehézség, idő | Számszaki hiba | Logikai ellentmondás | Kitalált forrás |
| :--- | :--- | :--- | :--- | :--- |
| **Project CloudPulse (B2B SaaS akvizíció)** | Haladó / M&A, 480 s | 35,2%-os EBITDA-árrés állítása $12,4M ARR és $9,8M működési költség mellett. A valós egyszerűsített Cash EBITDA $2,6M, vagyis 20,97% (tűrés: 20–22%). | 42%-os fejlesztői fluktuáció, miközben a szöveg szerint a kulcsemberi kockázat elhanyagolható. | „2025/Q3 CEE-SaaS Valuation & Retention Benchmark Report (Gartner-McKinsey Joint Index)”. |
| **Nordic Retail Group (e-commerce, D2C)** | Középhaladó, 420 s | €12,50-os CAC állítása, miközben €3,6M marketingköltség és 90 000 új vevő mellett a blended CAC €40 (tűrés: €38–42). | A készletforgási idő 24 napra csökken, a raktározási és logisztikai költségek mégis 65%-kal nőnek, ez méretgazdaságossági sikerként van beállítva. | „Shopify-Statista European Direct-to-Consumer Efficiency Standard 2026/Vol.4”. |
| **NovaPay Technologies (fintech, hitelkockázat)** | Haladó / M&A, 450 s | 24,5%-os tőkemegfelelési mutató állítása €5,4M tőke és €45,0M RWA mellett. A valós mutató 12,0% (tűrés: 11,5–12,5%). | Az NPL-arány 4,2%-ról 7,8%-ra ugrik, a szöveg ezt javulásnak mondja. | „EBA/GL/2026/994 sz. FinTech Likviditási Mentesítési Direktíva”. |

**Módszertani megjegyzés (CloudPulse):** az elemzés egyszerűsített éves Cash EBITDA modellt használ (szerződött ARR mínusz működési ráfordítások), ami nem azonos a GAAP/IFRS szerinti, elhatárolt árbevételből számolt EBITDA-val. A forgatókönyv ezt kifejezetten jelzi.  
**Szakmai pontosság (NovaPay):** A banki szabályozás (CRR / Basel III) szigorúan elválasztja a Tier 1 tőkét és a teljes szavatoló tőkét (Own Funds). A forgatókönyv következetesen „Tier 1 tőke” és „Tier 1 tőkemegfelelési mutató (Tier 1 CAR)” megnevezést használ, így €5,4M Tier 1 tőke és €45,0M RWA aránya egzaktan 12,0%.

## 6. Riport-integritás (RFC 8785 + SHA-256)
A zárójelentés kanonikus JSON-t készít (kulcsok UTF-16 kódrend szerint rendezve, undefined mezők elhagyva, NaN és Infinity esetén hiba), majd ebből SHA-256 lenyomatot számol a Web Crypto API-val (SHA256: előtaggal). A lenyomat fedi:
• a forgatókönyv azonosítóját, az időbélyeget és az eltelt időt,  
• az összpontszámot, a rész- és elemzési pontszámokat, a pontosságot és a lefedettséget,  
• a minősítést és a találatok számát,  
• az összes annotáció szövegét, kategóriáját, indoklását és helyesbítését,  
• a tételes találatok azonosítóját, státuszát és pontját.  

**Fontos korlát:** ez kliensoldali sértetlenségi ellenőrző összeg. A véletlen vagy utólagos módosítást kimutatja, de szándékos hamisítás ellen nem véd, mert a kliens forráskódjának ismeretében a lenyomat újraszámolható. Jogi vagy hatósági bizonyító erőhöz szerveroldali, titkos kulcsos HMAC vagy aszimmetrikus digitális aláírás szükséges.

## 7. Ismert korlátok
• **Gyakorló célú, nem akkreditált eszköz.** Nincs pszichometriai megbízhatósági vizsgálat és emberi referenciaadat. Összesen 9 beültetett hiba van 3 dokumentumban, ez kevés ahhoz, hogy egyéni képességről megbízhatóan lehessen következtetni.  
• **Kliensoldali megoldókulcs.** A hibák definíciója, a kulcsszavak, az elvárt számok és a tűrések a kliens csomagjában vannak (scenarios.ts), a böngésző fejlesztői eszközeivel kiolvashatók. Gyakorláshoz ez elfogadható, versenyvizsgához szerveroldali pontozás kell.  
• **Didaktikai hibajelölés.** A mintadokumentumokban a hibás állítások (és egy csalétek) félkövérrel vannak szedve, ami a felületen kattintható kijelölést ad. Éles gyakorlati vizsgához ezt el kell rejteni, hogy a szöveg átnézése is feladat legyen.  
• **Heurisztikus kiértékelés.** A motor token- és számalapú szabályokkal dolgozik. A naiv kijátszást kizárja, de a dokumentumból mechanikusan átvett, releváns szavak ettől még pontot érhetnek. A tartalmi minőség végső megítéléséhez emberi vagy modell alapú értékelő is kell.  
• **Idézetek forráskritikája.** A riportnézet a kapcsolódó podcast (Világgazdaság, 2024; Dr. Dietz Ferenc, Dr. Aczél Petra) gondolatait tematikus szintézisként jeleníti meg, elkerülve a nem ellenőrzött szó szerinti idézőjeles állításokat.

## 8. Ellenőrzési állapot

| Ellenőrzés | Állapot |
| :--- | :--- |
| `node --test src/utils/auditScoring.test.ts` | 18/18 zöld. |
| A motor típusellenőrzése (`tsc --strict`) | Hibátlan. |
| Teljes `npm run build` | 0 hiba, tiszta Vite bundle fordítás. |

## 9. Új forgatókönyv írásának irányelve
A földelés és a helyesbítés ellenőrzése a hibadefiníció mezőire épül, ezért minden új hibánál:
• az explanation legyen tartalmas, a hiba okát és a releváns számokat tartalmazza,  
• a target_phrase pontosan egyezzen a dokumentumban szereplő szöveggel,  
• az expected_correction legyen konkrét, számszaki hibánál numeric_tolerance is tartozzon hozzá,  
• a required_keywords ne csak számokból álljon, és a rövid számkulcsszavakat (például „40”, „45”) csak akkor vedd fel, ha tényleg külön fogalmat jelölnek,  
• készíts legalább egy, kézzel írt „jó válasz” tesztet, amely az új tételen TRUE_POSITIVE-ot kap, és egy kulcsszó-halmozási tesztet, amely nem kaphat Senior minősítést.
