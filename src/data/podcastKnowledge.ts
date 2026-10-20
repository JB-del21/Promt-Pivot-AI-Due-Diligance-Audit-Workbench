export interface PodcastQuote {
  speaker: string;
  role: string;
  timestamp: string;
  quote: string;
  takeaway: string;
}

export interface PodcastPillar {
  number: string;
  title: string;
  timeCode: string;
  summary: string;
  keySkills: string[];
}

export const PODCAST_METADATA = {
  title: 'Mit ér a diploma, ha az AI már tudja a válaszokat?',
  show: 'Világgazdaság – A nagy AI-sztori podcast',
  guests: [
    { name: 'Dr. Dietz Ferenc', title: 'Egyetemi tanár, intézményvezető' },
    { name: 'Dr. Aczél Petra', title: 'Kommunikációkutató, egyetemi tanár' },
  ],
  coreThesis:
    'A generatív mesterséges intelligencia korában a lexikális tudás önmagában leértékelődött. A valódi érték a kritikus gondolkodásban, az adatok validálásában, a rejtett hibák kiszűrésében és a felelős döntéshozatalban rejlik.',
};

export const PODCAST_QUOTES: PodcastQuote[] = [
  {
    speaker: 'Dr. Dietz Ferenc',
    role: 'Gábor Dénes Egyetem',
    timestamp: '00:44',
    quote: 'A mesterséges intelligencia nem azért van, hogy kevesebbet gondolkodj, hanem hogy többet gondolkodjon az ember, csak minőségileg.',
    takeaway: 'Az AI nem helyettesíti az intellektust, hanem feljebb tolja a lécet: az automatikus kimenetek auditálása válik a legfontosabb szellemi munkává.',
  },
  {
    speaker: 'Dr. Aczél Petra',
    role: 'Kutató, egyetemi tanár',
    timestamp: '03:37',
    quote: 'A diploma nem egy készrejelentés, nincs vége pont... az embernek folyamatosan frissíteni kell a tudását.',
    takeaway: 'A diploma többé nem egy statikus tudásraktár papírja, hanem a tanulási képesség és a rendszerszemlélet hitelesítése.',
  },
  {
    speaker: 'Dr. Dietz Ferenc',
    role: 'Gábor Dénes Egyetem',
    timestamp: '31:47',
    quote: 'Az, hogy az ember a ChatGPT-ből átrakja a szöveget, abból soha nem lesz semmi, abból nem lesz fejlődés... A gyors válasz mögött akkor van ténylegesen jó válasz, hogyha az embernek van mögötte egy ítélőképessége.',
    takeaway: 'A copy-paste mentalitás intellektuális zsákutca. Az igazi szakember onnan ismerszik meg, hogy azonnal kiszúrja a generált anyag torzításait.',
  },
  {
    speaker: 'Dr. Aczél Petra',
    role: 'Kutató, egyetemi tanár',
    timestamp: '40:02',
    quote: 'Nulláról újra kéne építeni mindent: az egyetemnek a működését, az államnak a működését... A mesterséges intelligencia olyan szinten átírja az egészet, hogy mindenkinek kell egy közös kulturális nyelv, ez az AI alapműveltség.',
    takeaway: 'Az AI-írástudás nem programozási készség, hanem kritikai olvasási, validálási és etikai norma minden szakterületen.',
  },
];

export const PODCAST_PILLARS: PodcastPillar[] = [
  {
    number: '01',
    title: 'A hiányzó 3 szint a munkaerőpiacon',
    timeCode: '00:56',
    summary: '1. Kutató-fejlesztő mérnökök; 2. Integrátorok és céges alkalmazók (itt a legnagyobb lemaradás!); 3. Tudatos és felelős felhasználók.',
    keySkills: ['Hídépítés az AI és a valós üzleti folyamatok között', 'Integrációs audit', 'Felelős felhasználás'],
  },
  {
    number: '02',
    title: 'Poroszos modell vs. Jövőálló diploma',
    timeCode: '05:39',
    summary: 'A lexikális memorizálás helyett a munkaadók ma már az adatok validálására, a hibafelismerésre és a döntéshozatalra képes diplomásokat keresik.',
    keySkills: ['Adathitelesítés', 'Tényellenőrzés', 'Rejtett logikai rések azonosítása'],
  },
  {
    number: '03',
    title: 'A 2026-os Top Skillset & Junior automatizáció',
    timeCode: '09:53',
    summary: 'A repetitív junior feladatok 30-60%-a automatizálódik. Felértékelődik az a kolléga, aki észreveszi és kijavítja a modell tévedéseit.',
    keySkills: ['Kritikus gondolkodás', 'Összefüggések átlátása', 'Unit economics ellenőrzés'],
  },
  {
    number: '04',
    title: 'Tiltás helyett transzparencia: Az AI mint olvasott gyakornok',
    timeCode: '20:26',
    summary: 'A mesterséges intelligencia olyan, mint egy mindentudó, de kritikai gondolkodás nélküli gyakornok. A végső felelősség mindig az emberé.',
    keySkills: ['Humán-in-the-loop ellenőrzés', 'Dokumentált transzparencia', 'Szakmai felelősségvállalás'],
  },
  {
    number: '05',
    title: 'Elbutít vagy tanít az AI?',
    timeCode: '27:21',
    summary: 'Copy-paste használat esetén elbutít. Partnerként kezelve – visszakérdezve, vitatkozva és ellenőrizve – magasabb szintre emeli a gondolkodást.',
    keySkills: ['Konstruktív vita a szintetikus kimenettel', 'Perturbációs vizsgálat', 'Döntésvédelem'],
  },
];
