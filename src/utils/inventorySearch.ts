const normalizeSearchValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map(normalizeSearchValue).join(' ');
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).map(normalizeSearchValue).join(' ');
  }
  return String(value).toLocaleLowerCase().replace(/\s+/g, ' ').trim();
};

export const inventoryItemMatchesSearch = (
  item: Record<string, unknown>,
  query: string,
  fields: string[],
): boolean => {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) return true;

  const searchableText = fields
    .map(field => normalizeSearchValue(item[field]))
    .join(' ');

  // Every word must occur, but the words may be in different fields. This
  // supports searches such as "2 bhk vijay" without requiring exact phrasing.
  return normalizedQuery.split(' ').every(term => searchableText.includes(term));
};
