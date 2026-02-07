/**
 * Country calling codes
 * Mapping of countries to their phone calling codes
 */

export interface CountryCode {
  country: string
  code: string
  dialCode: string
  flag: string
}

export const countryCodes: CountryCode[] = [
  { country: "Rwanda", code: "RW", dialCode: "+250", flag: "🇷🇼" },
  { country: "Kenya", code: "KE", dialCode: "+254", flag: "🇰🇪" },
  { country: "Uganda", code: "UG", dialCode: "+256", flag: "🇺🇬" },
  { country: "Tanzania", code: "TZ", dialCode: "+255", flag: "🇹🇿" },
  { country: "Burundi", code: "BI", dialCode: "+257", flag: "🇧🇮" },
  { country: "United States", code: "US", dialCode: "+1", flag: "🇺🇸" },
  { country: "United Kingdom", code: "GB", dialCode: "+44", flag: "🇬🇧" },
  { country: "France", code: "FR", dialCode: "+33", flag: "🇫🇷" },
  { country: "Germany", code: "DE", dialCode: "+49", flag: "🇩🇪" },
  { country: "Canada", code: "CA", dialCode: "+1", flag: "🇨🇦" },
  { country: "South Africa", code: "ZA", dialCode: "+27", flag: "🇿🇦" },
  { country: "Nigeria", code: "NG", dialCode: "+234", flag: "🇳🇬" },
  { country: "Ghana", code: "GH", dialCode: "+233", flag: "🇬🇭" },
  { country: "Ethiopia", code: "ET", dialCode: "+251", flag: "🇪🇹" },
  { country: "Democratic Republic of Congo", code: "CD", dialCode: "+243", flag: "🇨🇩" },
].sort((a, b) => a.country.localeCompare(b.country))

/**
 * Get country code by country name
 */
export const getCountryCodeByCountry = (country: string): CountryCode | undefined => {
  return countryCodes.find((cc) => cc.country.toLowerCase() === country.toLowerCase())
}

/**
 * Get country code by dial code
 */
export const getCountryCodeByDialCode = (dialCode: string): CountryCode | undefined => {
  return countryCodes.find((cc) => cc.dialCode === dialCode)
}

/**
 * Get default country code (Rwanda)
 */
export const getDefaultCountryCode = (): CountryCode => {
  return countryCodes.find((cc) => cc.code === "RW") || countryCodes[0]
}
