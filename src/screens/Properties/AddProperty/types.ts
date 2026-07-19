export type TransactionType = 'Rent' | 'Sale' | null;

export type PropertyType = 
  | 'Flat/Apartment'
  | 'Independent House'
  | 'Bungalow/Villa'
  | 'Plot/Land'
  | 'PG/Hostel'
  | 'Office Space'
  | 'Shop/Retail'
  | 'Warehouse'
  | 'Agricultural Land'
  | 'Institution/Specialised'
  | null;

export interface AddPropertyFormState {
  transactionType: TransactionType;
  propertyType: PropertyType;
  
  // Basic Info
  city: string;
  areaLocality: string;
  landmark: string;
  bhk: string;
  carpetArea: string;
  availableFrom: Date | null;
  
  // Pricing
  monthlyRent: string;
  securityDeposit: string;
  maintenanceCharges: string;
  maintenanceIncluded: boolean;
  societyCharges: string;
  societyIncluded: boolean;
  salePrice: string;
  
  // Physical Details (Flats)
  floorNumber: string;
  totalFloors: string;
  facing: string;
  propertyAge: string;
  furnishingStatus: string;
  bathrooms: number;
  balconies: number;
  superBuiltupArea: string;
  
  // Amenities
  amenities: Record<string, boolean | string>;

  // Owner Preferences (Residential)
  tenantPreferences: string[];
  dietaryPreference: string;
  petPolicy: string;
  minLeasePeriod: string;
  maxOccupants: number;
  wfhAllowed: string; // Yes / No / Poochho
  policeVerification: boolean;
  photoPreference: string;
  additionalNotes: string;
  
  // Commercial Preferences
  tenantBusinessType: string[];
  
  // House Specific Fields
  plotArea: string;
  numberOfFloors: string;
  rentalType: string;
  separateEntrance: boolean;
  gardenLawn: boolean;
  gardenArea: string;
  terraceAccess: boolean;
  terraceType: string;
  boreWell: boolean;
  boundaryWall: boolean;
  numberOfBedrooms: number;

  // Plot Specific Fields
  plotAreaUnit: string;
  plotDimensions: string;
  roadWidth: string;
  zoneClassification: string;
  plotNumber: string;
  societyColonyName: string;
  reraRegistered: boolean;
  reraNumber: string;
  clearTitle: string;
  constructionAllowed: boolean;
  negotiable: boolean;

  // PG Specific Fields
  pgForWhom: string;
  roomTypeAvailable: string[];
  rentPerBed: Record<string, string>;
  totalVacancies: string;
  mealsIncluded: string[];
  mealType: string;
  bathroomType: string;
  curfewTiming: Date | null;
  wifiIncluded: boolean;
  laundryFacility: string;
  roWater: boolean;
  wardenCaretaker: boolean;

  // Office Space Fields
  officeType: string;
  leaseLockIn: string;
  rentEscalation: string;
  acType: string;
  receptionLobby: boolean;
  fireNOC: boolean;
  ocCert: boolean;
  cafeteriaNearby: boolean;
  powerBackupKW: string;

  // Shop / Retail Fields
  shopFrontage: string;
  commercialLocationType: string;
  permittedBusiness: string[];
  powerLoadKW: string;
  washroomAvailable: boolean;
  storageAttached: boolean;
  storageArea: string;
  footfallLevel: string;

  // Warehouse / Industrial Fields
  ceilingHeight: string;
  roadAccessWidth: string;
  loadingDock: boolean;
  loadingDockCount: string;
  powerSupplyPhase: string;
  officeSpaceAttached: boolean;
  officeSpaceArea: string;

  // Institution / Specialised Fields
  propertySubtype: string;
  capacityCount: string; // rooms/beds/seats
  currentlyOperational: boolean;
  licensesAvailable: string[];
  parkingCapacity: string;
  heavyPowerSupplyKVA: string;
  
  // AI Context
  aiFilledFields: string[];
}

export const initialFormState: AddPropertyFormState = {
  transactionType: null,
  propertyType: null,
  city: 'Indore',
  areaLocality: '',
  landmark: '',
  bhk: '',
  carpetArea: '',
  availableFrom: new Date(),
  
  monthlyRent: '',
  securityDeposit: '',
  maintenanceCharges: '',
  maintenanceIncluded: false,
  societyCharges: '',
  societyIncluded: false,
  salePrice: '',
  
  floorNumber: '',
  totalFloors: '',
  facing: '',
  propertyAge: '',
  furnishingStatus: '',
  bathrooms: 1,
  balconies: 0,
  superBuiltupArea: '',
  
  amenities: {},
  
  tenantPreferences: [],
  dietaryPreference: '',
  petPolicy: '',
  minLeasePeriod: '',
  maxOccupants: 1,
  wfhAllowed: 'Poochho',
  policeVerification: false,
  photoPreference: 'Share freely',
  additionalNotes: '',

  tenantBusinessType: [],

  // House Defaults
  plotArea: '',
  numberOfFloors: '',
  rentalType: '',
  separateEntrance: false,
  gardenLawn: false,
  gardenArea: '',
  terraceAccess: false,
  terraceType: '',
  boreWell: false,
  boundaryWall: false,
  numberOfBedrooms: 1,

  // Plot Defaults
  plotAreaUnit: 'sqft',
  plotDimensions: '',
  roadWidth: '',
  zoneClassification: '',
  plotNumber: '',
  societyColonyName: '',
  reraRegistered: false,
  reraNumber: '',
  clearTitle: '',
  constructionAllowed: false,
  negotiable: false,

  // PG Defaults
  pgForWhom: '',
  roomTypeAvailable: [],
  rentPerBed: {},
  totalVacancies: '',
  mealsIncluded: [],
  mealType: '',
  bathroomType: '',
  curfewTiming: null,
  wifiIncluded: false,
  laundryFacility: 'None',
  roWater: false,
  wardenCaretaker: false,

  // Office Defaults
  officeType: '',
  leaseLockIn: '',
  rentEscalation: '',
  acType: '',
  receptionLobby: false,
  fireNOC: false,
  ocCert: false,
  cafeteriaNearby: false,
  powerBackupKW: '',

  // Shop Defaults
  shopFrontage: '',
  commercialLocationType: '',
  permittedBusiness: [],
  powerLoadKW: '',
  washroomAvailable: false,
  storageAttached: false,
  storageArea: '',
  footfallLevel: '',

  // Warehouse Defaults
  ceilingHeight: '',
  roadAccessWidth: '',
  loadingDock: false,
  loadingDockCount: '',
  powerSupplyPhase: '',
  officeSpaceAttached: false,
  officeSpaceArea: '',

  // Institution Defaults
  propertySubtype: '',
  capacityCount: '',
  currentlyOperational: false,
  licensesAvailable: [],
  parkingCapacity: '',
  heavyPowerSupplyKVA: '',
  
  aiFilledFields: [],
};
