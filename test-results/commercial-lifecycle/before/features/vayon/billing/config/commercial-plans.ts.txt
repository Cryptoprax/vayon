export const commercialPlanCatalog = Object.freeze([
  {
    code: "starter",
    name: "Starter",
    trialDays: 14,
    seatLimit: 3,
    features: ["inventory", "communications", "reports"],
    limits: {
      ai_requests: 1000,
      image_generations: 25,
      creative_exports: 50,
      storage_gb: 10,
    },
  },
  {
    code: "professional",
    name: "Professional",
    trialDays: 14,
    seatLimit: 15,
    features: [
      "inventory",
      "communications",
      "reports",
      "ai_workforce",
      "property_matching",
    ],
    limits: {
      ai_requests: 10000,
      image_generations: 250,
      creative_exports: 500,
      storage_gb: 100,
    },
  },
  {
    code: "business",
    name: "Business",
    trialDays: 14,
    seatLimit: 50,
    features: [
      "inventory",
      "communications",
      "reports",
      "ai_workforce",
      "property_matching",
      "marketing_studio",
      "growth_studio",
    ],
    limits: {
      ai_requests: 50000,
      image_generations: 1000,
      creative_exports: 2500,
      storage_gb: 500,
    },
  },
  {
    code: "enterprise",
    name: "Enterprise",
    trialDays: 0,
    seatLimit: null,
    features: [
      "inventory",
      "communications",
      "reports",
      "ai_workforce",
      "property_matching",
      "marketing_studio",
      "growth_studio",
    ],
    limits: {
      ai_requests: null,
      image_generations: null,
      creative_exports: null,
      storage_gb: null,
    },
  },
] as const);
export type LicensedFeature =
  (typeof commercialPlanCatalog)[number]["features"][number];
