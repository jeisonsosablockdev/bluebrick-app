import { COUNTRIES } from "@/lib/countries";

export type AdminCollectionLocationFormInput = {
  country: unknown;
  stateProvince?: unknown;
  postalCode?: unknown;
  city: unknown;
  address: unknown;
  geoLat?: unknown;
  geoLng?: unknown;
};

export type AdminCollectionLocationForm = {
  country: string;
  stateProvince: string | null;
  postalCode: string | null;
  city: string;
  address: string;
  geoLat: number | null;
  geoLng: number | null;
};

export class AdminCollectionLocationFormError extends Error {
  readonly field: keyof AdminCollectionLocationFormInput;

  constructor(field: keyof AdminCollectionLocationFormInput, message: string) {
    super(message);
    this.name = "AdminCollectionLocationFormError";
    this.field = field;
  }
}

type CountryLookupEntry = {
  code: string;
  canonicalName: string;
  divisionsByCode: Map<string, string>;
};

const COUNTRY_LOOKUP = new Map<string, CountryLookupEntry>();

for (const country of COUNTRIES) {
  const entry: CountryLookupEntry = {
    code: country.code,
    canonicalName: country.nameEn,
    divisionsByCode: new Map(
      (country.divisions ?? []).map((division) => [normalizeKey(division.code), division.name])
    )
  };

  const aliases = [country.code, country.nameEn, country.nameEs, country.namePt];
  for (const alias of aliases) {
    COUNTRY_LOOKUP.set(normalizeKey(alias), entry);
  }
}

function normalizeKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

function readRequiredText(
  value: unknown,
  field: keyof AdminCollectionLocationFormInput,
  label: string
): string {
  if (typeof value !== "string") {
    throw new AdminCollectionLocationFormError(field, `${label} must be a string.`);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new AdminCollectionLocationFormError(field, `${label} is required.`);
  }

  return normalized;
}

function readOptionalText(value: unknown, field: keyof AdminCollectionLocationFormInput, label: string): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new AdminCollectionLocationFormError(field, `${label} must be a string when provided.`);
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function parseCoordinate(
  value: unknown,
  field: "geoLat" | "geoLng",
  min: number,
  max: number
): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = typeof value === "number"
    ? value
    : typeof value === "string"
      ? Number(value.trim())
      : Number.NaN;

  if (!Number.isFinite(parsed)) {
    throw new AdminCollectionLocationFormError(field, `${field} must be a valid decimal number.`);
  }

  if (parsed < min || parsed > max) {
    throw new AdminCollectionLocationFormError(
      field,
      `${field} must be between ${min} and ${max}.`
    );
  }

  return parsed;
}

export function normalizeAdminCollectionCountryCode(country: unknown): string {
  const raw = readRequiredText(country, "country", "country");
  const lookup = COUNTRY_LOOKUP.get(normalizeKey(raw));

  if (!lookup) {
    throw new AdminCollectionLocationFormError(
      "country",
      "country must be a supported ISO-2 code or deterministic country name."
    );
  }

  return lookup.code;
}

export function normalizeAdminCollectionStateProvince(
  country: string,
  stateProvince: unknown
): string | null {
  const normalized = readOptionalText(stateProvince, "stateProvince", "stateProvince");
  if (normalized === null) {
    return null;
  }

  const lookup = COUNTRY_LOOKUP.get(normalizeKey(country));
  if (!lookup) {
    return normalized;
  }

  const divisionName = lookup.divisionsByCode.get(normalizeKey(normalized));
  return divisionName ?? normalized;
}

export function normalizeAdminCollectionLocationForm(
  input: AdminCollectionLocationFormInput
): AdminCollectionLocationForm {
  const country = normalizeAdminCollectionCountryCode(input.country);

  return {
    country,
    stateProvince: normalizeAdminCollectionStateProvince(country, input.stateProvince),
    postalCode: readOptionalText(input.postalCode, "postalCode", "postalCode"),
    city: readRequiredText(input.city, "city", "city"),
    address: readRequiredText(input.address, "address", "address"),
    geoLat: parseCoordinate(input.geoLat, "geoLat", -90, 90),
    geoLng: parseCoordinate(input.geoLng, "geoLng", -180, 180)
  };
}
