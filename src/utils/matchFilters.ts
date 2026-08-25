export interface MatchSourceIds {
  listingId?: number;
  requirementId?: number;
}

const positiveNumber = (value: unknown): number | undefined => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

export const resolveMatchSourceIds = (source?: any): MatchSourceIds => {
  if (!source) return {};

  const explicitListingId = positiveNumber(source.listingId);
  if (explicitListingId) return { listingId: explicitListingId };

  if (source.type === 'Requirement' || source.requirementId) {
    return { requirementId: positiveNumber(source.requirementId ?? source.id) };
  }

  return { listingId: positiveNumber(source.id) };
};
