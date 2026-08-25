import { resolveMatchSourceIds } from '../matchFilters';

describe('resolveMatchSourceIds', () => {
  it('uses listingId for a property drill-down', () => {
    expect(resolveMatchSourceIds({ id: '99', listingId: 73691 })).toEqual({ listingId: 73691 });
  });

  it('uses requirementId for a requirement drill-down', () => {
    expect(resolveMatchSourceIds({ id: '25186', requirementId: '25186', type: 'Requirement' })).toEqual({
      requirementId: 25186,
    });
  });

  it('never treats a typed requirement id as a listing id', () => {
    expect(resolveMatchSourceIds({ id: '25186', type: 'Requirement' })).toEqual({ requirementId: 25186 });
  });
});
