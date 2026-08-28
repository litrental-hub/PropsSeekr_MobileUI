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

export const appendUniqueInventoryItems = <T extends object>(
  current: T[],
  incoming: T[],
): T[] => {
  const itemId = (item: T) => {
    const keyedItem = item as Record<string, unknown>;
    const id = keyedItem.listingId ?? keyedItem.requirementId ?? keyedItem.id;
    return id === null || id === undefined ? null : String(id);
  };
  const seen = new Set(current.map(itemId).filter((id): id is string => id !== null));

  return current.concat(incoming.filter(item => {
    const id = itemId(item);
    if (id === null) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  }));
};
