import { inventoryItemMatchesSearch } from '../inventorySearch';

describe('inventoryItemMatchesSearch', () => {
  const listing = {
    title: '2 BHK Apartment',
    projectName: 'Emerald Heights',
    locality: 'Vijay Nagar',
    city: 'Indore',
    price: 5500000,
  };

  it('matches case-insensitively across listing fields', () => {
    expect(inventoryItemMatchesSearch(listing, 'emerald', Object.keys(listing))).toBe(true);
    expect(inventoryItemMatchesSearch(listing, '2 bhk vijay', Object.keys(listing))).toBe(true);
  });

  it('matches nested requirement values such as budget and preferred location', () => {
    const requirement = {
      description: 'Client wants an apartment',
      budget: { min: 4000000, max: 6000000 },
      preferredLocation: { locality: 'Palasia', city: 'Indore' },
    };
    expect(inventoryItemMatchesSearch(requirement, 'palasia 6000000', Object.keys(requirement))).toBe(true);
  });

  it('returns all items for blank input and excludes unrelated items', () => {
    expect(inventoryItemMatchesSearch(listing, '  ', Object.keys(listing))).toBe(true);
    expect(inventoryItemMatchesSearch(listing, 'Pune villa', Object.keys(listing))).toBe(false);
  });
});
