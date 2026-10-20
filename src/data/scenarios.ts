import type { Scenario } from '../types/audit';

export const SCENARIOS: Scenario[] = [
  {
    scenario_id: 'mna-saas-cloudpulse-2026',
    meta: {
      title: 'Project CloudPulse – SaaS Akvizíciós Vezetői Összefoglaló',
      domain: 'Pénzügy / M&A Due Diligence',
      difficulty: 'Haladó / M&A',
      time_limit_sec: 480,
      summary: 'Egy európai private equity alap számára készült AI-generált előzetes átvilágítási összefoglaló, amely a CloudPulse Analytics B2B SaaS akvizícióját értékeli.',
    },
    context: {
      target_name: 'CloudPulse Analytics Kft.',
      arr: '$12.4M',
      opex: '$9.8M',
      headcount: 68,
      churn_metric: '94% Enterprise Megtartás (NDR: 112%)',
      additional_kpis: {
        'Bruttó árrés': '76.4%',
        'Ügyfélszám': '142 enterprise ügyfél',
        'Kutatás-Fejlesztés (R&D)': '$3.9M (Opex 39.8%-a)',
        'Készpénzállomány': '$2.1M (Runway: ~10 hónap)',
      },
    },
    document_markdown: `### Vezetői Összefoglaló: Project CloudPulse Akvizíció

A célvállalat kiemelkedő stabilitást mutat az enterprise ügyfélkörben. A **kulcsemberi kockázat elhanyagolható**, a vezetés és a mérnökcsapat magja lojális, a szervezeti kultúra kifejezetten megtartó jellegű, ami megteremti az alapját a zökkenőmentes poszt-akvizíciós integrációnak.

Pénzügyi szempontból a társaság 12.4 millió dolláros ARR mellett 9.8 millió dolláros működési költséggel zárt. Ez a jelenlegi struktúrában kiemelkedő, **35.2%-os EBITDA árrést** biztosít a záró negyedévben, ami lényegesen meghaladja a versenytársak átlagát és azonnali osztalékfizetési fedezetet nyújt a vevőnek.

A humántőke vizsgálatakor megállapítható, hogy a termékfejlesztési részlegen a **fejlesztői fluktuáció elérte a 42%-ot az elmúlt 12 hónapban**, ami a menedzsment szerint csupán az iparági benchmarkinghoz való természetes igazodás, így nem veszélyezteti a technológiai roadmap végrehajtását.

Az árazási szorzók értékelésekor a friss **2025/Q3 CEE-SaaS Valuation & Retention Benchmark Report (Gartner-McKinsey Joint Index)** 14.2x EV/ARR medián szorzóját alkalmaztuk az indikatív ajánlati sáv meghatározásához, ami alátámasztja a $175M körüli indikatív cégértéket.`,
    injected_errors: [
      {
        id: 'err-01',
        type: 'NUMERIC_MISMATCH',
        target_phrase: '35.2%-os EBITDA árrést',
        explanation: 'Matematikai / Számítási hiba: $12.4M ARR és $9.8M opex mellett az EBITDA $2.6M, ami pontosan 20.97% (kerekítve 21.0%), nem 35.2%. Az AI vagy a bruttó fedezettel keverte össze, vagy egyszerűen hallucinált egy vonzóbb pénzügyi mutatót.',
        severity: 'CRITICAL',
        points: 35,
      },
      {
        id: 'err-02',
        type: 'LOGICAL_CONTRADICTION',
        target_phrase: 'fejlesztői fluktuáció elérte a 42%-ot az elmúlt 12 hónapban',
        conflicts_with_phrase: 'kulcsemberi kockázat elhanyagolható',
        explanation: 'Belső logikai ellentmondás: A 42%-os éves fejlesztői elvándorlás súlyos kulcsemberi és kódfejlesztési kockázatot jelent egy szoftvercégnél. Ez homlokegyenest üti az 1. bekezdés állítását, miszerint a kulcsemberi kockázat elhanyagolható és a csapat lojális.',
        severity: 'HIGH',
        points: 35,
      },
      {
        id: 'err-03',
        type: 'FABRICATED_SOURCE',
        target_phrase: '2025/Q3 CEE-SaaS Valuation & Retention Benchmark Report (Gartner-McKinsey Joint Index)',
        explanation: 'Nem létező forrás / Hallucinált referencia: A Gartner és a McKinsey független, rivális tanácsadó cégek, soha nem adnak ki közös „Joint Index” CEE felmérést. Az indikatív szorzó fiktív alapra épül, amelynek elfogadása félrevezeti a befektetési bizottságot.',
        severity: 'MEDIUM',
        points: 30,
      },
    ],
    benchmark_notes: [
      'Valós EBITDA fedezet: $2.60M (20.97%)',
      'Iparági fejlesztői fluktuációs norma CEE térségben: 14-18% (a 42% kritikus vészjelzés)',
      'Hivatalos B2B SaaS források: Bessemer Cloud Index, OpenView Expansion SaaS Benchmarks',
    ],
  },
  {
    scenario_id: 'ecommerce-nordic-retail-2026',
    meta: {
      title: 'Nordic Retail Group – E-Commerce Skálázási & Unit Economics Jelentés',
      domain: 'E-Commerce / Digitális Marketing & Logisztika',
      difficulty: 'Középhaladó',
      time_limit_sec: 420,
      summary: 'D2C divat- és lakberendezési e-kereskedelmi csoport növekedési jelentése a befektetők felé a CAC/LTV arányról és készletforgásról.',
    },
    context: {
      target_name: 'Nordic Brands D2C Holding',
      gmv: '€18.2M',
      marketing_spend: '€3.60M',
      headcount: 44,
      additional_kpis: {
        'Új vásárlók száma': '90 000 fő',
        'Átlagos kosárérték (AOV)': '€85.20',
        'Visszaküldési arány': '28.4%',
        'Készletérték': '€4.1M',
      },
    },
    document_markdown: `### Növekedési Jelentés: Nordic Brands D2C Unit Economics

A digitális kampányok optimalizálása révén a Meta és Google Performance Max csatornákon az **akvizíciós költség (CAC) rekordalacsony, mindössze €12.50 vásárlónként**, ami kiemelkedő LTV/CAC megtérülést eredményez az évi €85-ös kosárérték mellett.

A logisztikai hatékonyság terén a központi automata fulfillment központ üzembe állításával **a készletforgási idő 24 napra csökkent, miközben a raktározási és logisztikai költségek 65%-kal nőttek**, ami igazolja a méretgazdaságossági előnyök gyors érvényesülését.

A regionális konverziós benchmarkok összehasonlításakor a jelentés a **Shopify-Statista European Direct-to-Consumer Efficiency Standard 2026/Vol.4** adatait vette alapul, amely szerint a 2.4%-os webáruházi konverzió a skandináv felső decilisbe tartozik.`,
    injected_errors: [
      {
        id: 'err-01',
        type: 'NUMERIC_MISMATCH',
        target_phrase: 'akvizíciós költség (CAC) rekordalacsony, mindössze €12.50 vásárlónként',
        explanation: 'Számítási hiba: €3,600,000 marketing költés mellett 90,000 új vevőnél a valódi blended CAC = €40.00 (€3.6M / 90k). Az AI a kampány szintű kattintási költséget (CPC/CPA) keverte össze a tényleges vevőakvizíciós költséggel, ami 3.2-szeres torzítás!',
        severity: 'CRITICAL',
        points: 35,
      },
      {
        id: 'err-02',
        type: 'LOGICAL_CONTRADICTION',
        target_phrase: 'a készletforgási idő 24 napra csökkent, miközben a raktározási és logisztikai költségek 65%-kal nőttek',
        explanation: 'Koncepcionális ellentmondás: A gyorsabb készletforgás (24 napra csökkenés) kevesebb bent álló készletet és csökkenő raktározási fajlagos költségeket kellene eredményezzen, nem 65%-os drágulást. A szöveg indokolatlanul „méretgazdaságossági előnyként” aposztrofálja a felrobbanó költségeket.',
        severity: 'HIGH',
        points: 35,
      },
      {
        id: 'err-03',
        type: 'FABRICATED_SOURCE',
        target_phrase: 'Shopify-Statista European Direct-to-Consumer Efficiency Standard 2026/Vol.4',
        explanation: 'Fiktív forrás / Hallucináció: Nincs ilyen közös kiadvány. A Shopify nem publikál a Statistával közös hivatalos európai hatékonysági szabványkötetet ebben a megnevezésben.',
        severity: 'MEDIUM',
        points: 30,
      },
    ],
    benchmark_notes: [
      'Valós Blended CAC: €40.00 (€3.6M / 90,000)',
      'Valós LTV/CAC arány: 2.13x (nem 6.8x ahogy az elszámolt CAC sugallná)',
      'Iparági készletforgási átlag D2C divatban: 45-60 nap',
    ],
  },
  {
    scenario_id: 'fintech-novapay-risk-2026',
    meta: {
      title: 'NovaPay Technologies – FinTech Hitelkockázat & Tőkemegfelelés',
      domain: 'FinTech / Kockázatkezelés & Banki Szabályozás',
      difficulty: 'Haladó / M&A',
      time_limit_sec: 450,
      summary: 'Közép-európai digitális hitelezési platform szabályozói tőkemegfelelési (CAR) és nem-teljesítő hitel (NPL) kockázati auditja.',
    },
    context: {
      target_name: 'NovaPay Micro-Lending Platform',
      arr: '€6.8M',
      headcount: 52,
      additional_kpis: {
        'Kihelyezett hitelállomány (RWA)': '€45.0M',
        'Szavatoló tőke (Tier 1)': '€5.40M',
        'Nem-teljesítő hitelek (NPL)': '7.8%',
        'Céltartalék fedezettség': '62.0%',
      },
    },
    document_markdown: `### Kockázatkezelési és Tőkemegfelelési Jelentés: NovaPay

A társaság prudens kockázatvállalási politikája és a gépi tanuláson alapuló scoring modell eredményeként a **I. pilléres tőkemegfelelési mutató eléri a 24.5%-ot**, ami kétszeresen meghaladja a Magyar Nemzeti Bank által elvárt minimális szintet.

A portfólió egészségi állapotát elemezve rögzíthető, hogy **a hitelportfólió minősége példátlanul javult, a nem-teljesítő hitelek aránya 7.8%-ra ugrott** a korábbi 4.2%-ról, köszönhetően az agresszív kintlévőség-kezelési stratégiának.

A likviditási pufferek allokációjához a menedzsment a legújabb **EBA/GL/2026/994 sz. FinTech Likviditási Mentesítési Direktíva** könnyített tőkekövetelményi szabályait alkalmazta, amely felmentést ad a teljes fedezeti tartalékolás alól.`,
    injected_errors: [
      {
        id: 'err-01',
        type: 'NUMERIC_MISMATCH',
        target_phrase: 'I. pilléres tőkemegfelelési mutató eléri a 24.5%-ot',
        explanation: 'Számítási hiba: €5.4M szavatoló tőke és €45.0M kockázattal súlyozott eszközállomány (RWA) mellett a valódi Tőkemegfelelési Mutató (CAR) = 12.0% (€5.4M / €45.0M), nem 24.5%. A modell több mint a duplájára fújta a tőkeerőt.',
        severity: 'CRITICAL',
        points: 35,
      },
      {
        id: 'err-02',
        type: 'LOGICAL_CONTRADICTION',
        target_phrase: 'a hitelportfólió minősége példátlanul javult, a nem-teljesítő hitelek aránya 7.8%-ra ugrott',
        explanation: 'Koncepcionális ellentmondás: Az NPL (nem-teljesítő hitelek) 4.2%-ról 7.8%-ra ugrása drasztikus minőségromlást jelent a banki terminológiában, nem „példátlan javulást”. A szöveg pozitív sikerként tálal egy aggasztó hitelromlást.',
        severity: 'HIGH',
        points: 35,
      },
      {
        id: 'err-03',
        type: 'FABRICATED_SOURCE',
        target_phrase: 'EBA/GL/2026/994 sz. FinTech Likviditási Mentesítési Direktíva',
        explanation: 'Hallucináció / Fiktív forrás: Nem létezik ilyen EBA (Európai Bankhatóság) direktíva, amely tőkementesítést biztosítana fintech cégeknek. A banki tőkekövetelmények a CRR/CRD rendeleten alapulnak.',
        severity: 'MEDIUM',
        points: 30,
      },
    ],
    benchmark_notes: [
      'Valódi CAR (Tőkemegfelelés): 12.0% (€5.4M / €45.0M)',
      'NPL 7.8% jelentése: High Risk felügyeleti kategória',
      'Valós szabályozói keret: Basel III / CRR III rendelet',
    ],
  },
];
