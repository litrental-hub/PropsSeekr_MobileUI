export const APP_NAME = 'PropSeekr';

// Section Types
export const SECTION_TYPES = ['Buying', 'Selling', 'Rentals'] as const;
export type SectionType = typeof SECTION_TYPES[number];

// Property Status
export const PROPERTY_STATUSES = [
  'Active',
  'In Negotiation',
  'On Hold',
  'Sold',
  'Rented',
  'Expired',
] as const;
export type PropertyStatus = typeof PROPERTY_STATUSES[number];

// Requirement Status
export const REQUIREMENT_STATUSES = [
  'Active',
  'Client Visiting',
  'Negotiating',
  'Closed',
  'Not Interested',
] as const;
export type RequirementStatus = typeof REQUIREMENT_STATUSES[number];

// Lead / Match Status
export const LEAD_STATUSES = [
  'Matched',
  'Pending Confirmation',
  'Confirmed',
  'Rejected',
  'Visit Conducted',
  'Deal Done',
] as const;
export type LeadStatus = typeof LEAD_STATUSES[number];

// Property Types
export const PROPERTY_TYPES = [
  'Flat / Apartment',
  'Independent House',
  'Villa',
  'Plot / Land',
  'Commercial Office',
  'Commercial Shop',
  'Warehouse',
  'PG / Hostel',
] as const;
export type PropertyType = typeof PROPERTY_TYPES[number];

// BHK Options
export const BHK_OPTIONS = ['1 RK', '1 BHK', '2 BHK', '3 BHK', '4 BHK', '4+ BHK'] as const;
export type BHKOption = typeof BHK_OPTIONS[number];

// Furnishing Options
export const FURNISHING_OPTIONS = ['Unfurnished', 'Semi-Furnished', 'Fully Furnished'] as const;
export type FurnishingOption = typeof FURNISHING_OPTIONS[number];

// Budget Ranges (for filters)
export const BUDGET_RANGES = [
  { label: 'Under ₹20L', min: 0, max: 2000000 },
  { label: '₹20L – ₹40L', min: 2000000, max: 4000000 },
  { label: '₹40L – ₹60L', min: 4000000, max: 6000000 },
  { label: '₹60L – ₹1Cr', min: 6000000, max: 10000000 },
  { label: '₹1Cr – ₹2Cr', min: 10000000, max: 20000000 },
  { label: 'Above ₹2Cr', min: 20000000, max: Infinity },
];

export const RENT_RANGES = [
  { label: 'Under ₹5K', min: 0, max: 5000 },
  { label: '₹5K – ₹10K', min: 5000, max: 10000 },
  { label: '₹10K – ₹20K', min: 10000, max: 20000 },
  { label: '₹20K – ₹40K', min: 20000, max: 40000 },
  { label: 'Above ₹40K', min: 40000, max: Infinity },
];

// Credit Pack Options
export const CREDIT_PACKS = [
  {
    id: 'starter',
    credits: 10,
    price: 299,
    pricePerCredit: 29.9,
    features: ['10 confirmations', 'Valid 30 days'],
    popular: false,
  },
  {
    id: 'growth',
    credits: 30,
    price: 699,
    pricePerCredit: 23.3,
    features: ['30 confirmations', 'Valid 60 days', 'Priority support'],
    popular: true,
  },
  {
    id: 'pro',
    credits: 100,
    price: 1999,
    pricePerCredit: 19.9,
    features: ['100 confirmations', 'Valid 90 days', 'Priority support', 'Analytics access'],
    popular: false,
  },
];

// API Base URL — Backend: .NET 9 Web API
// Dev:  Android emulator uses 10.0.2.2 to reach host machine localhost
//       .NET 9 default HTTP port is 5079 (or 7079 for HTTPS)
// Prod: Update to your Azure / AWS / VPS domain
export const API_BASE_URL = __DEV__
  ? 'http://10.0.2.2:5079/api/v1'   // Android emulator → localhost (.NET 9)
  : 'https://api.propseekr.in/v1';  // Production

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN:  'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_PROFILE:  'user_profile',
  SECTION_TYPE:  'section_type',
  FCM_TOKEN:     'fcm_token',
};
