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
      accounting_methodology_note: 'Modellezési megjegyzés (SaaS M&A Simplification): Az elemzés egyszerűsített éves Cash EBITDA modellt alkalmaz (Szerződött ARR $12.4M - Működési ráfordítások $9.8M = $2.6M Cash EBITDA, 20.97%), eltekintve a bevételi elhatárolásoktól és az amortizációtól. A formális IFRS audit a GAAP szerinti elismert árbevételből indul ki.',
      additional_kpis: {
        'Bruttó árrés': '76.4%',
        'Ügyfélszám': '142 enterprise ügyfél',
        'Kutatás-Fejlesztés (R&D)': '$3.9M (Opex 39.8%-a)',
        'Készpénzállomány': '$2.1M (Likviditási tartalék)',
      },
    },
    document_markdown: `### Vezetői Összefoglaló: Project CloudPulse Akvizíció

A célvállalat kiemelkedő stabilitást mutat az enterprise ügyfélkörben. A kulcsemberi kockázat elhanyagolható, a vezetés és a mérnökcsapat magja lojális, a szervezeti kultúra kifejezetten megtartó jellegű, ami megteremti az alapját a zökkenőmentes poszt-akvizíciós integrációnak.

Pénzügyi szempontból a társaság 12.4 millió dolláros ARR mellett 9.8 millió dolláros működési költséggel zárt. Ez a jelenlegi struktúrában kiemelkedő, 35.2%-os EBITDA árrést biztosít a záró negyedévben, ami lényegesen meghaladja a versenytársak átlagát és azonnali osztalékfizetési fedezetet nyújt a vevőnek.

A humántőke vizsgálatakor megállapítható, hogy a termékfejlesztési részlegen a fejlesztői fluktuáció elérte a 42%-ot az elmúlt 12 hónapban, ami a menedzsment szerint csupán az iparági benchmarkinghoz való természetes igazodás, így nem veszélyezteti a technológiai roadmap végrehajtását.

Az árazási szorzók értékelésekor a friss 2025/Q3 CEE-SaaS Valuation & Retention Benchmark Report (Gartner-McKinsey Joint Index) 14.2x EV/ARR medián szorzóját alkalmaztuk az indikatív ajánlati sáv meghatározásához, ami alátámasztja a $175M körüli indikatív cégértéket.`,
    injected_errors: [
      {
        id: 'err-01',
        type: 'NUMERIC_MISMATCH',
        target_phrase: '35.2%-os EBITDA árrést',
        explanation: 'Matematikai / Számítási hiba: $12.4M ARR és $9.8M opex mellett a működési eredmény (Cash EBITDA) $2.6M, ami pontosan 20.97% (kerekítve 21.0%), nem pedig 35.2%. Az AI vagy a bruttó fedezettel keverte össze, vagy szintetikus túlzást alkalmazott.',
        severity: 'CRITICAL',
        points: 35,
        validation: {
          required_keywords: ['20.9', '21%', '21.0%', '2.6', 'működési', 'árbevétel', 'költség', 'különbség'],
          expected_correction: '20.97% valós EBITDA árrés ($2.6M)',
          numeric_tolerance: {
            expected: 20.97,
            min: 20.0,
            max: 22.0,
            unit: '%',
          },
          rationale_criteria: 'Az indoklásnak be kell mutatnia a $12.4M bevétel és $9.8M opex különbségét ($2.6M) és a ~21%-os valós rátát.',
        },
      },
      {
        id: 'err-02',
        type: 'LOGICAL_CONTRADICTION',
        target_phrase: 'fejlesztői fluktuáció elérte a 42%-ot az elmúlt 12 hónapban',
        conflicts_with_phrase: 'kulcsemberi kockázat elhanyagolható',
        explanation: 'Belső logikai ellentmondás: A 42%-os éves fejlesztői elvándorlás súlyos kulcsemberi és kódfejlesztési kockázatot jelent egy szoftvercégnél. Ez közvetlenül üti az 1. bekezdés állítását, miszerint a kulcsemberi kockázat elhanyagolható.',
        severity: 'HIGH',
        points: 35,
        validation: {
          required_keywords: ['kulcsember', 'kockázat', 'fluktuáció', 'fejleszt', 'stabilitás', 'ellentmond', 'csapat'],
          expected_correction: 'A 42%-os fejlesztői elvándorlás magas kulcsemberi kockázatot jelent, ami üti a stabilitási állítást.',
          rationale_criteria: 'Az indoklásnak hivatkoznia kell az 1. bekezdés stabilitási/kockázatmentességi állítására és a 42%-os elvándorlásra.',
        },
      },
      {
        id: 'err-03',
        type: 'FABRICATED_SOURCE',
        target_phrase: '2025/Q3 CEE-SaaS Valuation & Retention Benchmark Report (Gartner-McKinsey Joint Index)',
        explanation: 'Nem létező forrás / Hallucinált referencia: A Gartner és a McKinsey független, rivális tanácsadó cégek, soha nem adnak ki közös „Joint Index” CEE felmérést. Az indikatív szorzó fiktív alapra épül.',
        severity: 'MEDIUM',
        points: 30,
        validation: {
          required_keywords: ['gartner', 'mckinsey', 'nem létezik', 'fiktív', 'hallucináció', 'független', 'közös', 'rivális'],
          expected_correction: 'Nem létezik Gartner-McKinsey közös index; hivatalos forrásként a Bessemer Cloud Index használandó.',
          rationale_criteria: 'Az indoklásnak meg kell neveznie a két független cég fiktív összefonódását és a nem létező indexet.',
        },
      },
    ],
    benchmark_notes: [
      'Valós Cash EBITDA fedezet: $2.60M (20.97%)',
      'Iparági fejlesztői fluktuációs norma CEE térségben: 14-18% (a 42% kritikus vészjelzés)',
      'Hivatalos B2B SaaS források: Bessemer Cloud Index, SaaS Capital Benchmarks',
      'Számviteli tisztázás: A riport egyszerűsített Cash EBITDA-t számol; GAAP átvilágításnál a szerződéses elhatárolásokat kötelező auditálni.',
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
      accounting_methodology_note: 'Marketing & CAC módszertan: A blended CAC a teljes marketing büdzsé (€3.6M) és az összes megszerzett új vásárló (90 000 fő) hányadosa (€40/vásárló). Nem tévesztendő össze a kattintási árral vagy platform-szintű ROAS-szal.',
      additional_kpis: {
        'Új vásárlók száma': '90 000 fő',
        'Átlagos kosárérték (AOV)': '€85.20',
        'Visszaküldési arány': '28.4%',
        'Készletérték': '€4.1M',
      },
    },
    document_markdown: `### Növekedési Jelentés: Nordic Brands D2C Unit Economics

A digitális kampányok optimalizálása révén a Meta és Google Performance Max csatornákon az akvizíciós költség (CAC) rekordalacsony, mindössze €12.50 vásárlónként, ami kiemelkedő LTV/CAC megtérülést eredményez az évi €85-ös kosárérték mellett.

A logisztikai hatékonyság terén a központi automata fulfillment központ üzembe állításával a készletforgási idő 24 napra csökkent, miközben a raktározási és logisztikai költségek 65%-kal nőttek, ami igazolja a méretgazdaságossági előnyök gyors érvényesülését.

A regionális konverziós benchmarkok összehasonlításakor a jelentés a Shopify-Statista European Direct-to-Consumer Efficiency Standard 2026/Vol.4 adatait vette alapul, amely szerint a 2.4%-os webáruházi konverzió a skandináv felső decilisbe tartozik.`,
    injected_errors: [
      {
        id: 'err-01',
        type: 'NUMERIC_MISMATCH',
        target_phrase: 'akvizíciós költség (CAC) rekordalacsony, mindössze €12.50 vásárlónként',
        explanation: 'Számítási hiba: €3,600,000 marketing költés mellett 90,000 új vevőnél a valódi blended CAC = €40.00 (€3.6M / 90k). Az AI a kampány szintű kattintási költséget (CPC/CPA) keverte össze a tényleges vevőakvizíciós költséggel, ami 3.2-szeres torzítás!',
        severity: 'CRITICAL',
        points: 35,
        validation: {
          required_keywords: ['40', '3.6', '90', 'blended', 'vevőakvizíció', 'kattintás', 'cpa', 'költség'],
          expected_correction: '€40.00 valós blended CAC (€3.6M / 90 000)',
          numeric_tolerance: {
            expected: 40.0,
            min: 38.0,
            max: 42.0,
            unit: '€',
          },
          rationale_criteria: 'Az indoklásnak tartalmaznia kell a €3.6M költés és a 90 000 új vásárló helyes hányadosát (€40).',
        },
      },
      {
        id: 'err-02',
        type: 'LOGICAL_CONTRADICTION',
        target_phrase: 'a készletforgási idő 24 napra csökkent, miközben a raktározási és logisztikai költségek 65%-kal nőttek',
        explanation: 'Koncepcionális ellentmondás: A gyorsabb készletforgás kevesebb bent álló készletet és csökkenő raktározási fajlagos költségeket kellene eredményezzen, nem 65%-os drágulást. A szöveg indokolatlanul méretgazdaságossági előnyként tünteti fel a megugró költséget.',
        severity: 'HIGH',
        points: 35,
        validation: {
          required_keywords: ['készlet', 'forgás', 'raktár', 'drágul', 'költség', 'ellentmond', '65%', 'méretgazdaságosság'],
          expected_correction: 'A gyorsabb készletforgás nem okozhat 65%-os költségnövekedést a hatékonyság címén.',
          rationale_criteria: 'Az indoklásnak rá kell mutatnia a csökkenő forgási idő és a dráguló logisztika gazdasági ellentmondására.',
        },
      },
      {
        id: 'err-03',
        type: 'FABRICATED_SOURCE',
        target_phrase: 'Shopify-Statista European Direct-to-Consumer Efficiency Standard 2026/Vol.4',
        explanation: 'Fiktív forrás / Hallucináció: Nincs ilyen közös kiadvány. A Shopify nem publikál a Statistával közös hivatalos európai hatékonysági szabványkötetet ebben a formátumban.',
        severity: 'MEDIUM',
        points: 30,
        validation: {
          required_keywords: ['shopify', 'statista', 'nem létezik', 'fiktív', 'hallucináció', 'kiadvány', 'forrás'],
          expected_correction: 'Nem létező közös Shopify-Statista szabványjelentés.',
          rationale_criteria: 'Meg kell nevezni a forrás hallucinált természetét.',
        },
      },
    ],
    benchmark_notes: [
      'Valós Blended CAC: €40.00 (€3.6M / 90,000)',
      'Valós AOV/CAC arány: 2.13x (€85.20 / €40.00)',
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
      accounting_methodology_note: 'Tőkemegfelelési (Tier 1 CAR) kalkuláció: Az alapvető Tier 1 tőke (€5.4M) és a kockázattal súlyozott eszközérték (RWA: €45.0M) hányadosa pontosan 12.0%, amely nem azonos a modellben állított 24.5%-os szinttel.',
      additional_kpis: {
        'Kihelyezett hitelállomány (RWA)': '€45.0M',
        'Tier 1 tőke': '€5.40M',
        'Nem-teljesítő hitelek (NPL)': '7.8%',
        'Céltartalék fedezettség': '62.0%',
      },
    },
    document_markdown: `### Kockázatkezelési és Tőkemegfelelési Jelentés: NovaPay

A társaság prudens kockázatvállalási politikája és a gépi tanuláson alapuló scoring modell eredményeként a Tier 1 tőkemegfelelési mutató eléri a 24.5%-ot, ami kétszeresen meghaladja a Magyar Nemzeti Bank által elvárt minimális szintet.

A portfólió egészségi állapotát elemezve rögzíthető, hogy a hitelportfólió minősége példátlanul javult, a nem-teljesítő hitelek aránya 7.8%-ra ugrott a korábbi 4.2%-ról, köszönhetően az agresszív kintlévőség-kezelési stratégiának.

A likviditási pufferek allokációjához a menedzsment a legújabb EBA/GL/2026/994 sz. FinTech Likviditási Mentesítési Direktíva könnyített tőkekövetelményi szabályait alkalmazta, amely felmentést ad a teljes fedezeti tartalékolás alól.`,
    injected_errors: [
      {
        id: 'err-01',
        type: 'NUMERIC_MISMATCH',
        target_phrase: 'Tier 1 tőkemegfelelési mutató eléri a 24.5%-ot',
        explanation: 'Számítási hiba: €5.4M Tier 1 tőke és €45.0M kockázattal súlyozott eszközállomány (RWA) mellett a valódi Tier 1 tőkemegfelelési mutató (Tier 1 CAR) = 12.0% (€5.4M / €45.0M), nem 24.5%. A modell több mint a duplájára fújta a tőkeerőt.',
        severity: 'CRITICAL',
        points: 35,
        validation: {
          required_keywords: ['12%', '12.0%', '5.4', '45', 'szavatoló', 'tőkemegfelelés', 'car', 'rwa', 'tier 1'],
          expected_correction: '12.0% valós Tier 1 CAR (€5.4M Tier 1 / €45.0M RWA)',
          numeric_tolerance: {
            expected: 12.0,
            min: 11.5,
            max: 12.5,
            unit: '%',
          },
          rationale_criteria: 'Az indoklásnak be kell mutatnia a €5.4M tőke és €45M RWA 12%-os hányadosát.',
        },
      },
      {
        id: 'err-02',
        type: 'LOGICAL_CONTRADICTION',
        target_phrase: 'a hitelportfólió minősége példátlanul javult, a nem-teljesítő hitelek aránya 7.8%-ra ugrott',
        explanation: 'Koncepcionális ellentmondás: Az NPL 4.2%-ról 7.8%-ra ugrása súlyos minőségromlást jelent a banki terminológiában, nem javulást. A szöveg sikerként tálal egy hitelromlást.',
        severity: 'HIGH',
        points: 35,
        validation: {
          required_keywords: ['nem-teljesítő', 'npl', 'romlás', 'kockázat', 'ugrott', '7.8%', 'ellentmond', 'rosszabb'],
          expected_correction: 'Az NPL 7.8%-ra növekedése minőségromlást jelent, nem példátlan javulást.',
          rationale_criteria: 'Az indoklásnak jeleznie kell, hogy a növekvő NPL kockázati romlást jelent.',
        },
      },
      {
        id: 'err-03',
        type: 'FABRICATED_SOURCE',
        target_phrase: 'EBA/GL/2026/994 sz. FinTech Likviditási Mentesítési Direktíva',
        explanation: 'Hallucináció / Fiktív forrás: Nem létezik ilyen EBA direktíva, amely tőkementesítést biztosítana fintech cégeknek. A banki tőkekövetelmények a CRR/CRD rendeleten alapulnak.',
        severity: 'MEDIUM',
        points: 30,
        validation: {
          required_keywords: ['eba', 'direktíva', 'rendelet', 'nem létezik', 'fiktív', 'mentesítés', 'crr', 'jogszabály'],
          expected_correction: 'Fiktív EBA jogszabályi hivatkozás; az EBA nem ad ki egyedi tőkementesítési direktívát.',
          rationale_criteria: 'Meg kell jelölni a hivatkozott EBA direktíva kitalált voltát.',
        },
      },
    ],
    benchmark_notes: [
      'Valódi CAR (Tőkemegfelelés): 12.0% (€5.4M / €45.0M)',
      'NPL 7.8% jelentése: High Risk felügyeleti kategória',
      'Valós szabályozói keret: Basel III / CRR III rendelet',
    ],
  },
  {
    scenario_id: 'mna-ai-startup-ip-royalty-2026',
    meta: {
      title: 'Project GenAI IP – DeepTech Startup Akvizíció & Szellemi Tulajdon Audit',
      domain: 'DeepTech / AI Startup & IP Jogdíj Átvilágítás',
      difficulty: 'Haladó / M&A',
      time_limit_sec: 450,
      summary: 'AI-modell licencelési és szellemi tulajdon (IP) M&A átvilágítás, ahol az LLM finomhangolási kötelezettségeket, a GPL Copyleft kockázatokat és a jogdíj-árréseket vizsgálja az auditor.',
    },
    context: {
      target_name: 'Cognitive Core AI Labs Kft.',
      arr: '$8.5M',
      opex: '$4.6M',
      headcount: 36,
      accounting_methodology_note: 'IP Jogdíj és Licenc-árrés kalkuláció: A $8.5M árbevételből levonva a nyílt forráskódú licenc-terheket ($1.5M) és a fejlesztési R&D költségeket ($3.1M), a tiszta IP árrés $3.9M ($8.5M - $1.5M - $3.1M = $3.9M), ami 45.88%-os valós IP profitabilitás ($3.9M / $8.5M), nem pedig az állított 81.2%.',
      additional_kpis: {
        'Szabadalmi oltalom': '12 bejegyzett EU/US szabadalom',
        'Licencbevevő partnerek': '28 Enterprise ügyfél',
        'Nyílt forráskódú kitettség': 'GPLv3 / Apache 2.0 hibrid',
        'Kutatás-Fejlesztés (R&D)': '$3.1M (Opex 67.4%-a)',
      },
    },
    document_markdown: `### M&A Átvilágítási Jelentés: Cognitive Core AI Labs Szellemi Tulajdon & IP Jogdíj

A célvállalat tulajdonában lévő saját fejlesztésű LLM alapmodell és transzformer architektúra kiemelkedő pénzügyi hozamot biztosít. A $8.5M éves szoftver- és IP-licenc árbevétel mellett az IP-jogdíj által termelt tiszta árrés eléri a 81.2%-ot, ami azonnali, magas tőkerányos megtérülést (ROIC) garantál a befektetői konzorcium számára.

A szellemi tulajdon jogi védettségét és a nyílt forráskódú kitettséget vizsgálva megállapítható, hogy a core AI modell 100%-ban zárt forráskódú (Proprietary Copyleft) védelmet élvez, amely kizárja a GPLv3 licencáttételi kockázatot, így a társaság által használt nyílt kódok semmilyen módon nem kötelezik a vállalatot a proprietary kódkészlet nyilvánossá tételére.

A nemzetközi szellemi tulajdon értékeléshez az elemzés a legfrissebb WIPO-EPO Joint European DeepTech Patent & AI Royalty Benchmark 2026/Q2 hivatalos szabványában rögzített 18.5x IP-szorzóját alkalmazta, ami alátámasztja a $120M körüli vállalati értékelést (EV).`,
    injected_errors: [
      {
        id: 'err-01',
        type: 'NUMERIC_MISMATCH',
        target_phrase: 'IP-jogdíj által termelt tiszta árrés eléri a 81.2%-ot',
        explanation: 'Számítási hiba: A $8.5M árbevételből a $1.5M nyílt forráskódú licencdíj és a $3.1M R&D levonása után ($8.5M - $1.5M - $3.1M) a tiszta IP árrés $3.9M, ami 45.88% ($3.9M / $8.5M), nem pedig 81.2%. A szintetikus modell elfelejtette levonni az OSS jogdíjterheket!',
        severity: 'CRITICAL',
        points: 35,
        validation: {
          required_keywords: ['45.8', '45.9%', '3.9', '8.5', 'jogdíj', 'árrés', 'százalék', 'licenc'],
          expected_correction: '45.88% valós IP árrés ($3.9M / $8.5M)',
          numeric_tolerance: {
            expected: 45.88,
            min: 44.0,
            max: 47.0,
            unit: '%',
          },
          rationale_criteria: 'Az indoklásnak be kell mutatnia a $8.5M bevétel és az $1.5M licencdíj + $3.1M R&D levonása utáni $3.9M tiszta IP árrést (45.88%).',
        },
      },
      {
        id: 'err-02',
        type: 'LOGICAL_CONTRADICTION',
        target_phrase: 'core AI modell 100%-ban zárt forráskódú (Proprietary Copyleft) védelmet élvez, amely kizárja a GPLv3 licencáttételi kockázatot',
        conflicts_with_phrase: 'nyílt kódok',
        explanation: 'Koncepcionális és jogi ellentmondás: A "Copyleft" (GPLv3) pontosan azt jelenti, hogy a kód nyílt, és a származékos szoftvereket is NYÍLTÁ KELL TEENI. A "Proprietary Copyleft" egy önellentmondó kifejezés, amely hamisan zártként tünteti fel a súlyos GPL licencáttételi kockázatot.',
        severity: 'HIGH',
        points: 35,
        validation: {
          required_keywords: ['copyleft', 'gpl', 'zárt', 'nyílt', 'ellentmond', 'licenc', 'származékos', 'jog'],
          expected_correction: 'A Copyleft (GPLv3) pontosan a nyílt forráskódú nyilvánosságra hozatalt írja elő; a Proprietary Copyleft fából vaskarika ellentmondás.',
          rationale_criteria: 'Az indoklásnak rá kell mutatnia a Proprietary es Copyleft fogalmak összeférhetetlenségére.',
        },
      },
      {
        id: 'err-03',
        type: 'FABRICATED_SOURCE',
        target_phrase: 'WIPO-EPO Joint European DeepTech Patent & AI Royalty Benchmark 2026/Q2',
        explanation: 'Fiktív forrás / Hallucinált referencia: A WIPO (World Intellectual Property Organization) és az EPO (European Patent Office) két független nemzetközi szervezet, soha nem adnak ki közös "Joint AI Royalty Benchmark" értékelési szabványt.',
        severity: 'MEDIUM',
        points: 30,
        validation: {
          required_keywords: ['wipo', 'epo', 'nem létezik', 'fiktív', 'hallucináció', 'szabvány', 'szervezet'],
          expected_correction: 'Fiktív WIPO-EPO közös kiadvány; az IP értékeléshez az IVSC nemzetközi szabvány használandó.',
          rationale_criteria: 'Meg kell nevezni a WIPO-EPO közös kiadvány hallucinált jellegét.',
        },
      },
    ],
    benchmark_notes: [
      'Valós IP Árrés: 45.88% ($3.9M / $8.5M)',
      'GPLv3 Copyleft kockázat: A származékos művek nyílttá tételének kötelezettsége',
      'Hivatalos Nemzetközi IP Értékelési Szabvány: Valuation Standards (IVSC) / DIN 77100',
    ],
  },
];
