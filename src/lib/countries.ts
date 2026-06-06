export type Country = {
  iso: string; // ISO 3166-1 alpha-2
  name: string;
  dial: string; // dial code without "+"
  flag: string; // emoji flag
};

/** A practical subset of countries; extend freely. */
export const COUNTRIES: Country[] = [
  { iso: "NG", name: "Nigeria", dial: "234", flag: "🇳🇬" },
  { iso: "IN", name: "India", dial: "91", flag: "🇮🇳" },
  { iso: "US", name: "United States", dial: "1", flag: "🇺🇸" },
  { iso: "GB", name: "United Kingdom", dial: "44", flag: "🇬🇧" },
  { iso: "CA", name: "Canada", dial: "1", flag: "🇨🇦" },
  { iso: "AU", name: "Australia", dial: "61", flag: "🇦🇺" },
  { iso: "ZA", name: "South Africa", dial: "27", flag: "🇿🇦" },
  { iso: "KE", name: "Kenya", dial: "254", flag: "🇰🇪" },
  { iso: "GH", name: "Ghana", dial: "233", flag: "🇬🇭" },
  { iso: "DE", name: "Germany", dial: "49", flag: "🇩🇪" },
  { iso: "FR", name: "France", dial: "33", flag: "🇫🇷" },
  { iso: "ES", name: "Spain", dial: "34", flag: "🇪🇸" },
  { iso: "IT", name: "Italy", dial: "39", flag: "🇮🇹" },
  { iso: "NL", name: "Netherlands", dial: "31", flag: "🇳🇱" },
  { iso: "IE", name: "Ireland", dial: "353", flag: "🇮🇪" },
  { iso: "AE", name: "United Arab Emirates", dial: "971", flag: "🇦🇪" },
  { iso: "SA", name: "Saudi Arabia", dial: "966", flag: "🇸🇦" },
  { iso: "PK", name: "Pakistan", dial: "92", flag: "🇵🇰" },
  { iso: "BD", name: "Bangladesh", dial: "880", flag: "🇧🇩" },
  { iso: "LK", name: "Sri Lanka", dial: "94", flag: "🇱🇰" },
  { iso: "NP", name: "Nepal", dial: "977", flag: "🇳🇵" },
  { iso: "SG", name: "Singapore", dial: "65", flag: "🇸🇬" },
  { iso: "MY", name: "Malaysia", dial: "60", flag: "🇲🇾" },
  { iso: "ID", name: "Indonesia", dial: "62", flag: "🇮🇩" },
  { iso: "PH", name: "Philippines", dial: "63", flag: "🇵🇭" },
  { iso: "CN", name: "China", dial: "86", flag: "🇨🇳" },
  { iso: "JP", name: "Japan", dial: "81", flag: "🇯🇵" },
  { iso: "KR", name: "South Korea", dial: "82", flag: "🇰🇷" },
  { iso: "BR", name: "Brazil", dial: "55", flag: "🇧🇷" },
  { iso: "MX", name: "Mexico", dial: "52", flag: "🇲🇽" },
  { iso: "RU", name: "Russia", dial: "7", flag: "🇷🇺" },
  { iso: "TR", name: "Turkey", dial: "90", flag: "🇹🇷" },
  { iso: "EG", name: "Egypt", dial: "20", flag: "🇪🇬" },
];

export const DEFAULT_ISO = "NG";

export function countryByIso(iso: string): Country {
  return COUNTRIES.find((c) => c.iso === iso) ?? COUNTRIES[0];
}

export function dialFor(iso: string): string {
  return countryByIso(iso).dial;
}
