// The institution hierarchy — DATA, not logic, so Ritu can review and correct
// it without reading code (WA-43: validate and flag, never silently guess).
//
// THE RULE FOR PARENTHOOD — degree-granting identity, not brand similarity.
// Penn State Berks awards a Penn State degree; UTM awards a Toronto degree;
// the NMIMS schools award NMIMS degrees. All children.
// IIT Bombay does not award an "IIT" degree and NIT Trichy is not a campus of
// a national NIT — federated peers, each its own top-level institution.
//
// A raw sheet name is matched to a unit by `match` (case-insensitive substring
// on the normalised name). First match wins, so order the specific before the
// general. Anything unmatched stays a standalone institution and is reported.

export const HIERARCHY = [
  {
    parent: 'Narsee Monjee Institute of Management Studies (NMIMS)',
    country: 'India',
    units: [
      { name: 'Anil Surendra Modi School of Commerce', match: ['anil surendra modi', 'asmsoc'] },
      { name: 'School of Branding & Advertising', match: ['branding'] },
      { name: 'Pravin Dalal School of Entrepreneurship & Family Business', match: ['pravin dalal'] },
      { name: 'Balwant Sheth School of Architecture', match: ['balwant sheth'] },
      { name: 'School of Business Management', match: ['school of business management'] },
      { name: 'Kirit P. Mehta School of Law', match: ['kirit p. mehta', 'kirit p mehta'] },
      { name: 'Mukesh Patel School of Technology Management & Engineering', match: ['mukesh patel'] },
      { name: 'School of Mathematics, Applied Statistics & Analytics', match: ['mathematics, applied statistics', 'nsomasa'] },
      { name: 'Sarla Anil Modi School of Economics', match: ['sarla anil modi'] },
      { name: 'Jyoti Dalal School of Liberal Arts', match: ['jyoti dalal'] },
      { name: 'School of Hospitality Management', match: ['school of hospitality management'] },
      { name: 'Centre for International Studies', match: ['centre for international studies'] },
      { name: 'Centre for Distance & Online Education', match: ['distance learning', 'online education'] },
      { name: 'Navi Mumbai', match: ['navi mumbai'] },
      { name: 'Mumbai', match: ['nmims, mumbai', 'narsee monjee institute of management studies, mumbai'] },
    ],
    // Bare "NMIMS" / "Narsee Monjee Institute of Management Studies" with no
    // school named stays on the parent with no unit — genuinely unknown, not
    // guessed at.
    parentMatch: ['nmims', 'narsee monjee institute of management studies'],
  },
  {
    parent: 'University of Toronto',
    country: 'Canada',
    units: [
      { name: 'St. George (Downtown)', match: ['st. george', 'st george'] },
      { name: 'Mississauga', match: ['mississauga'] },
      { name: 'Scarborough', match: ['scarborough'] },
    ],
    parentMatch: ['university of toronto'],
  },
  {
    parent: 'Pennsylvania State University',
    country: 'USA',
    units: [
      { name: 'University Park', match: ['univ park', 'university park', ', park'] },
      { name: 'Berks', match: ['berks'] },
      { name: 'Erie — The Behrend College', match: ['behrend', 'erie'] },
      { name: 'Scranton', match: ['scranton'] },
      { name: 'Smeal College of Business', match: ['smeal'] },
    ],
    parentMatch: ['penn state', 'pennsylvania state'],
  },
  {
    parent: 'Rutgers University',
    country: 'USA',
    units: [
      { name: 'Newark', match: ['newark'] },
      { name: 'New Brunswick', match: ['new brunswick', 'brunswick'] },
      { name: 'Camden', match: ['camden'] },
    ],
    parentMatch: ['rutgers'],
  },
  {
    parent: 'University of Massachusetts',
    country: 'USA',
    units: [
      { name: 'Amherst', match: ['amherst'] },
      { name: 'Lowell', match: ['lowell'] },
      { name: 'Boston', match: ['boston'] },
    ],
    parentMatch: ['umass', 'university of massachusetts'],
  },
  {
    parent: 'University of British Columbia',
    country: 'Canada',
    units: [
      { name: 'Vancouver', match: ['vancouver'] },
      { name: 'Okanagan', match: ['okanagan'] },
    ],
    parentMatch: ['british columbia'],
  },
  {
    parent: 'Nirma University',
    country: 'India',
    units: [
      { name: 'Institute of Law', match: ['institute of law', 'institute Of law'] },
      { name: 'Institute of Design', match: ['institute of design'] },
      { name: 'Institute of Technology', match: ['institute of technology'] },
    ],
    parentMatch: ['nirma'],
  },
  {
    parent: 'Symbiosis International University',
    country: 'India',
    units: [
      { name: 'Symbiosis School of Liberal Arts', match: ['liberal arts'] },
      { name: 'Symbiosis Law School, Pune', match: ['law school'] },
      { name: 'Symbiosis Skills & Professional University', match: ['skills and professional', 'skills & professional', 'skills and professions'] },
      { name: 'Symbiosis Institute of Design', match: ['institute of design'] },
      { name: 'Symbiosis Institute of Computer Studies & Research', match: ['computer studies'] },
      { name: 'Symbiosis Centre for Management Studies', match: ['centre for management studies'] },
      { name: 'Symbiosis School of Economics', match: ['school of economics'] },
      { name: 'Symbiosis School of Culinary Arts', match: ['culinary arts'] },
      { name: 'Symbiosis School of Sports Sciences', match: ['sports sciences'] },
    ],
    parentMatch: ['symbiosis'],
  },
];

// Spelling/case variants that are the SAME entity — not a hierarchy, just
// noise in the source. Key = canonical name, values = raw spellings.
export const ALIASES = {
  'Auro University': ['auro university'],
  'FLAME University': ['flame university'],
  'ATLAS SkillTech University': ['atlas skilltech university'],
  'University of Waterloo': ['university of waterloo'],
  'University of Manchester': ['university of manchester', 'the university of manchester'],
  'The Ohio State University': ['ohio state university', 'the ohio state university'],
  'University of Mumbai': ['university of mumbai', 'mumbai university'],
  'Jain University': ['jain university', 'jain college'],
  'Ahmedabad University': ['ahmedabad university', 'ahemdabad university'],
  // Renamed from "Petroleum" to "Energy" in 2021 — one university, two eras.
  // No string-similarity rule finds this; it needs the domain fact.
  'Pandit Deendayal Energy University (PDEU)': [
    'pandit deendayal energy university- pdeu',
    'pandit deendayal energy university (pdeu)',
    'pandit deendayal energy university',
    'pandit deendayal petroleum university',
  ],
  'Fashion Institute of Technology': ['fashion institute of technology'],
  'Houston Community College': ['houston community college'],
  'Loughborough University': ['loughborough university'],
  'Georgia State University': ['georgia state university'],
  'University of California, San Diego': ['university of california san diego', 'university of california, san diego'],
  'Sarvajanik College of Engineering & Technology': [
    'sarvajanik college of engineering and technology',
    'sarvajanik college of engineering & technology',
  ],
  'ATLAS SkillTech University — ISDI': ['atlas skilltech university - isdi'],
  'ATLAS SkillTech University — ISME': [
    'atlas | isme - school of management & entrepreneurship',
    'atlas | isme school of management & entrepreneurship',
  ],
};

/** Non-university destinations — real outcomes, not missing data. */
export const NON_UNIVERSITY = {
  'gap-year': ['gap year', 'semester gap'],
  'family-business': ['joined family business', 'family business'],
};

/** Raw cluster string -> the 12-cluster deck taxonomy. */
export const CLUSTER_MAP = {
  'business management and administration/commerce/accounts': 'business-administration-commerce',
  finance: 'finance',
  'science, technology, engineering, and mathematics': 'stem',
  'arts, design, audio/video technology': 'arts-design-media',
  'information technology': 'information-technology',
  'human services': 'human-services',
  'architecture & construction': 'architecture-construction',
  'architecture and construction': 'architecture-construction',
  law: 'law',
  'mass media, journalism & communications': 'mass-media-journalism',
  'mass media,journalism & communications': 'mass-media-journalism',
  'government & public administration': 'government-public-administration',
  'government and public administration': 'government-public-administration',
  'sports and related careers': 'sports',
  'gap year': 'gap-year',
  // Present across the decade but absent from the 2026 deck (no student chose
  // them that year). Real clusters, not stray text.
  'health sciences': 'health-sciences',
  'hospitality & tourism': 'hospitality-tourism',
  'hospitality and tourism': 'hospitality-tourism',
  marketing: 'marketing',
  'transportation, distribution, and logistics': 'transportation-logistics',
};
