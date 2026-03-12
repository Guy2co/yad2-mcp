export const SEARCH_PROPERTIES = {
  city: {
    type: 'string',
    description: 'City code (e.g. "5000" for Tel Aviv, "3000" for Haifa, "70" for Jerusalem)',
  },
  rooms: { type: 'string', description: 'Room range e.g. "2-4", "3", "1.5-3"' },
  priceMin: { type: 'number', description: 'Minimum price in ILS' },
  priceMax: { type: 'number', description: 'Maximum price in ILS' },
  sizeMin: { type: 'number', description: 'Minimum size in sqm' },
  sizeMax: { type: 'number', description: 'Maximum size in sqm' },
  floor: { type: 'string', description: 'Floor range e.g. "1-5", "0" for ground floor' },
  propertyType: {
    type: 'string',
    description: 'Property type',
    enum: [
      'apartment',
      'garden_apartment',
      'penthouse',
      'duplex',
      'roof_apartment',
      'unit',
      'storage',
      'parking',
    ],
  },
  page: { type: 'number', description: 'Page number (default: 1)' },
  pageSize: { type: 'number', description: 'Results per page (default: 20, max: 40)' },
};

export const TOOLS = [
  {
    name: 'search_rentals',
    description: 'Search rental property listings on yad2.co.il',
    inputSchema: { type: 'object', properties: SEARCH_PROPERTIES },
  },
  {
    name: 'search_for_sale',
    description: 'Search properties for sale on yad2.co.il',
    inputSchema: { type: 'object', properties: SEARCH_PROPERTIES },
  },
  {
    name: 'get_listing',
    description: 'Get full details of a specific yad2 listing by its token/ID',
    inputSchema: {
      type: 'object',
      properties: { token: { type: 'string', description: 'The listing token or ID' } },
      required: ['token'],
    },
  },
  {
    name: 'list_city_codes',
    description: 'List common Israeli city codes for use in searches',
    inputSchema: {
      type: 'object',
      properties: {
        filter: { type: 'string', description: 'Optional filter string to search city names' },
      },
    },
  },
];
