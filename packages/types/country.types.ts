// ============================================================================
// COUNTRY ENUMS
// ============================================================================

export enum Country {
  // Africa
  RWANDA = 'RW',
  DEMOCRATIC_REPUBLIC_OF_CONGO = 'CD',
  KENYA = 'KE',
  UGANDA = 'UG',
  TANZANIA = 'TZ',
  SOUTH_AFRICA = 'ZA',
  NIGERIA = 'NG',
  EGYPT = 'EG',
  ETHIOPIA = 'ET',
  GHANA = 'GH',

  // North America
  UNITED_STATES = 'US',
  CANADA = 'CA',
  MEXICO = 'MX',

  // Europe
  UNITED_KINGDOM = 'GB',
  GERMANY = 'DE',
  FRANCE = 'FR',
  ITALY = 'IT',
  SPAIN = 'ES',
  NETHERLANDS = 'NL',
  BELGIUM = 'BE',
  SWITZERLAND = 'CH',
  AUSTRIA = 'AT',
  POLAND = 'PL',
  SWEDEN = 'SE',
  NORWAY = 'NO',
  DENMARK = 'DK',

  // Asia
  CHINA = 'CN',
  JAPAN = 'JP',
  INDIA = 'IN',
  SOUTH_KOREA = 'KR',
  SINGAPORE = 'SG',
  MALAYSIA = 'MY',
  THAILAND = 'TH',
  INDONESIA = 'ID',
  PHILIPPINES = 'PH',
  VIETNAM = 'VN',
  HONG_KONG = 'HK',

  // Middle East
  UNITED_ARAB_EMIRATES = 'AE',
  SAUDI_ARABIA = 'SA',
  TURKEY = 'TR',
  ISRAEL = 'IL',

  // Oceania
  AUSTRALIA = 'AU',
  NEW_ZEALAND = 'NZ',

  // South America
  BRAZIL = 'BR',
  ARGENTINA = 'AR',
  CHILE = 'CL',
  COLOMBIA = 'CO',
  PERU = 'PE',
}

export const COUNTRY_NAMES: Record<Country, string> = {
  [Country.RWANDA]: 'Rwanda',
  [Country.DEMOCRATIC_REPUBLIC_OF_CONGO]: 'Democratic Republic of Congo',
  [Country.KENYA]: 'Kenya',
  [Country.UGANDA]: 'Uganda',
  [Country.TANZANIA]: 'Tanzania',
  [Country.SOUTH_AFRICA]: 'South Africa',
  [Country.NIGERIA]: 'Nigeria',
  [Country.EGYPT]: 'Egypt',
  [Country.ETHIOPIA]: 'Ethiopia',
  [Country.GHANA]: 'Ghana',
  [Country.UNITED_STATES]: 'United States',
  [Country.CANADA]: 'Canada',
  [Country.MEXICO]: 'Mexico',
  [Country.UNITED_KINGDOM]: 'United Kingdom',
  [Country.GERMANY]: 'Germany',
  [Country.FRANCE]: 'France',
  [Country.ITALY]: 'Italy',
  [Country.SPAIN]: 'Spain',
  [Country.NETHERLANDS]: 'Netherlands',
  [Country.BELGIUM]: 'Belgium',
  [Country.SWITZERLAND]: 'Switzerland',
  [Country.AUSTRIA]: 'Austria',
  [Country.POLAND]: 'Poland',
  [Country.SWEDEN]: 'Sweden',
  [Country.NORWAY]: 'Norway',
  [Country.DENMARK]: 'Denmark',
  [Country.CHINA]: 'China',
  [Country.JAPAN]: 'Japan',
  [Country.INDIA]: 'India',
  [Country.SOUTH_KOREA]: 'South Korea',
  [Country.SINGAPORE]: 'Singapore',
  [Country.MALAYSIA]: 'Malaysia',
  [Country.THAILAND]: 'Thailand',
  [Country.INDONESIA]: 'Indonesia',
  [Country.PHILIPPINES]: 'Philippines',
  [Country.VIETNAM]: 'Vietnam',
  [Country.HONG_KONG]: 'Hong Kong',
  [Country.UNITED_ARAB_EMIRATES]: 'United Arab Emirates',
  [Country.SAUDI_ARABIA]: 'Saudi Arabia',
  [Country.TURKEY]: 'Turkey',
  [Country.ISRAEL]: 'Israel',
  [Country.AUSTRALIA]: 'Australia',
  [Country.NEW_ZEALAND]: 'New Zealand',
  [Country.BRAZIL]: 'Brazil',
  [Country.ARGENTINA]: 'Argentina',
  [Country.CHILE]: 'Chile',
  [Country.COLOMBIA]: 'Colombia',
  [Country.PERU]: 'Peru',
};

// ============================================================================
// COUNTRY HELPER FUNCTIONS
// ============================================================================

export function getCountryName(countryCode: Country): string {
  return COUNTRY_NAMES[countryCode] || countryCode;
}

export function isValidCountryCode(code: string): code is Country {
  return Object.values(Country).includes(code as Country);
}
