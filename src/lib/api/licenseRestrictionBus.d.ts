export const LICENSE_RESTRICTION_EVENT: string;

export type LicenseRestrictionPayload = {
  code: string;
  feature: string;
};

export function parseLicenseRestrictionPayload(payload: unknown): LicenseRestrictionPayload | null;
export function emitLicenseRestriction(restriction: LicenseRestrictionPayload | null | undefined): void;
