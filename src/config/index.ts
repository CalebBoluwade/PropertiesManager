// Single source of truth for what a "class" of property is and which
// extra fields it asks for. To add a new class (e.g. "Farmland" or
// "Warehouse"), add an entry here — nothing else in the app needs to
// change. Type-specific answers are stored as JSON on Property.details,
// keyed by each field's `key`.

export type FieldType = "text" | "number" | "select";

export interface PropertyTypeField {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  suffix?: string;
  placeholder?: string;
}

export interface PropertyTypeConfig {
  value: string;
  label: string;
  description: string;
  /** Whether this class of property is normally divided into rentable
   *  units with tenants (a house or apartment block) vs. usually held
   *  without a tenant (raw land) — used to decide default UI, not to
   *  hard-block anything, since land can still be leased. */
  usesUnitsByDefault: boolean;
  fields: PropertyTypeField[];
}

export const PROPERTY_TYPES: PropertyTypeConfig[] = [
  {
    value: "LAND",
    label: "Land",
    description: "Vacant, agricultural, or undeveloped plots",
    usesUnitsByDefault: false,
    fields: [
      { key: "landSize", label: "Land size", type: "number", suffix: "sqm" },
      {
        key: "titleDocument",
        label: "Title document",
        type: "select",
        options: [
          "Certificate of Occupancy (C of O)",
          "Deed of Assignment",
          "Governor's Consent",
          "Excision",
          "Survey plan only",
          "Other",
        ],
      },
      {
        key: "landUse",
        label: "Land use",
        type: "select",
        options: ["Residential", "Commercial", "Agricultural", "Mixed use", "Industrial"],
      },
      { key: "surveyPlanNumber", label: "Survey plan number", type: "text" },
    ],
  },
  {
    value: "HOUSE",
    label: "House",
    description: "Detached, semi-detached, terraced, or duplex homes",
    usesUnitsByDefault: true,
    fields: [
      { key: "bedrooms", label: "Bedrooms", type: "number" },
      { key: "bathrooms", label: "Bathrooms", type: "number" },
      { key: "parkingSpaces", label: "Parking spaces", type: "number" },
      {
        key: "furnishing",
        label: "Furnishing",
        type: "select",
        options: ["Unfurnished", "Semi-furnished", "Furnished"],
      },
      { key: "yearBuilt", label: "Year built", type: "number" },
    ],
  },
  {
    value: "APARTMENT_BUILDING",
    label: "Apartment building",
    description: "Multi-unit residential block, flats, or duplex-in-blocks",
    usesUnitsByDefault: true,
    fields: [
      { key: "totalFloors", label: "Total floors", type: "number" },
      {
        key: "amenities",
        label: "Amenities",
        type: "text",
        placeholder: "e.g. borehole, generator, gated, CCTV",
      },
      { key: "yearBuilt", label: "Year built", type: "number" },
    ],
  },
  {
    value: "COMMERCIAL",
    label: "Commercial",
    description: "Office, retail, or warehouse space",
    usesUnitsByDefault: true,
    fields: [
      { key: "floorArea", label: "Floor area", type: "number", suffix: "sqm" },
      {
        key: "commercialUse",
        label: "Commercial use",
        type: "select",
        options: ["Office", "Retail", "Warehouse", "Mixed use"],
      },
      { key: "parkingSpaces", label: "Parking spaces", type: "number" },
    ],
  },
  {
    value: "OTHER",
    label: "Other",
    description: "Anything that doesn't fit the categories above",
    usesUnitsByDefault: true,
    fields: [],
  },
];

export function getPropertyTypeConfig(value: string): PropertyTypeConfig {
  return PROPERTY_TYPES.find((t) => t.value === value) ?? PROPERTY_TYPES[PROPERTY_TYPES.length - 1];
}

export function parseDetails(details: string | null | undefined): Record<string, string> {
  if (!details) return {};
  try {
    return JSON.parse(details);
  } catch {
    return {};
  }
}