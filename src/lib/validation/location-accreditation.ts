export const LOCATION_ACREDITATION_MAP: Record<string, string> = {
  DXB: 'EIAC',
  AUH: 'ENAS',
};
export const LOCATION_NAMES: Record<string, string> = {
  DXB: 'Dubai',
  AUH: 'Abu Dhabi',
};
export const ACCREDITATION_NAMES: Record<string, string> = {
  EIAC: 'Emirates International Accreditation Centre',
  ENAS: 'Emirates National Accreditation System',
};
export function validateLocationAccreditation(
  locationCode: string | null | undefined,
  accreditationCode: string | null | undefined
): { valid: boolean; error?: string } {
  if (!locationCode || !accreditationCode) {
    return { valid: false, error: 'Location and accreditation must be provided' };
  }
const expected = LOCATION_ACREDITATION_MAP[locationCode.toUpperCase()];
  if (expected && expected !== accreditationCode.toUpperCase()) {
    return {
      valid: false,
      error: `Invalid accreditation for location ${LOCATION_NAMES[locationCode.toUpperCase()] || locationCode}. It only allows ${expected}, not ${accreditationCode.toUpperCase()}`,
    };
  }
  const locationFromAccred = 
    accreditationCode.toUpperCase() === 'EIAC' ? 'DXB' :
    accreditationCode.toUpperCase() === 'ENAS' ? 'AUH' : null;
  if (locationFromAccred && locationFromAccred !== locationCode.toUpperCase()) {
    return {
      valid: false,
      error: 'Invalid location/accreditation combination',
    };
  }
  return { valid: true };
}
export function getRequiredAccreditationForLocation(locationCode: string | null | undefined): string | null {
  if (!locationCode) return null;
  return LOCATION_ACREDITATION_MAP[locationCode.toUpperCase()] || null;
}
