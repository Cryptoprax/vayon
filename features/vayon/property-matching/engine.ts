export type MatchConfidence = "High" | "Medium" | "Low" | "Unknown";
export type MatchFactorKey = "budget" | "location" | "property" | "lifestyle" | "timeline" | "amenities";

export interface BuyerMatchEvidence {
  readonly id: string;
  readonly budgetMin?: number;
  readonly budgetMax?: number;
  readonly locations: readonly string[];
  readonly communities: readonly string[];
  readonly propertyTypes: readonly string[];
  readonly bedrooms?: number;
  readonly bathrooms?: number;
  readonly areaMin?: number;
  readonly areaMax?: number;
  readonly parking?: number;
  readonly amenities: readonly string[];
  readonly purpose?: "investment" | "residential";
  readonly listingType?: "sale" | "rental";
  readonly preferredBuilder?: string;
  readonly preferredFloor?: string;
  readonly furnishing?: string;
  readonly timeline?: string;
  readonly mortgageStatus?: string;
  readonly familySize?: number;
  readonly lifestylePreferences: readonly string[];
}

export interface PropertyMatchEvidence {
  readonly id: string;
  readonly price?: number;
  readonly location?: string;
  readonly community?: string;
  readonly propertyType?: string;
  readonly bedrooms?: number;
  readonly bathrooms?: number;
  readonly area?: number;
  readonly parking?: number;
  readonly amenities: readonly string[];
  readonly listingType?: "sale" | "rental";
  readonly builder?: string;
  readonly floor?: string;
  readonly furnishing?: string;
  readonly available?: boolean;
  readonly possessionDate?: string;
  readonly lifestyleTags: readonly string[];
}

export interface MatchFactorProjection {
  readonly key: MatchFactorKey;
  readonly label: string;
  readonly score?: number;
  readonly status: "matched" | "reduced" | "missing";
  readonly explanation: string;
  readonly missingEvidence: readonly string[];
}

export interface AiMatchProjection {
  readonly id: string;
  readonly buyerId: string;
  readonly propertyId: string;
  readonly overallScore?: number;
  readonly confidence: MatchConfidence;
  readonly factors: readonly MatchFactorProjection[];
  readonly reasons: readonly string[];
  readonly confidenceReducers: readonly string[];
  readonly missingInformation: readonly string[];
  readonly recommendedAction: "Call Buyer" | "Schedule Viewing" | "Send WhatsApp" | "Send Brochure" | "Arrange Virtual Tour" | "Negotiate" | "Request Documents";
  readonly recommendationOnly: true;
}

const weights: Record<MatchFactorKey, number> = { budget: 24, location: 22, property: 22, lifestyle: 10, timeline: 10, amenities: 12 };
const cache = new Map<string, AiMatchProjection>();
const normalized = (value?: string) => value?.trim().toLocaleLowerCase();
const overlap = (wanted: readonly string[], actual: readonly string[]) => wanted.filter((item) => actual.map(normalized).includes(normalized(item))).length;
const factor = (key: MatchFactorKey, label: string, score: number | undefined, explanation: string, missingEvidence: readonly string[] = []): MatchFactorProjection => ({ key, label, score, status: score === undefined ? "missing" : score >= 75 ? "matched" : "reduced", explanation, missingEvidence });

export class AiBuyerPropertyMatchingEngine {
  match(buyer: BuyerMatchEvidence, property: PropertyMatchEvidence): AiMatchProjection {
    const cacheKey = JSON.stringify([buyer, property]);
    const cached = cache.get(cacheKey);
    if (cached) return cached;
    const factors = [
      this.budget(buyer, property), this.location(buyer, property), this.property(buyer, property),
      this.lifestyle(buyer, property), this.timeline(buyer, property), this.amenities(buyer, property),
    ];
    const known = factors.filter((item): item is MatchFactorProjection & { score: number } => item.score !== undefined);
    const knownWeight = known.reduce((sum, item) => sum + weights[item.key], 0);
    const coverage = knownWeight / Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    const overallScore = property.available === false || !knownWeight ? undefined : Math.round(known.reduce((sum, item) => sum + item.score * weights[item.key], 0) / knownWeight);
    const confidence: MatchConfidence = property.available === false || coverage < .3 ? "Unknown" : coverage >= .8 ? "High" : coverage >= .55 ? "Medium" : "Low";
    const missingInformation = [...new Set(factors.flatMap((item) => item.missingEvidence))];
    if (property.available === false) missingInformation.unshift("Property unavailable.");
    const result: AiMatchProjection = {
      id: `ai-match-${buyer.id}-${property.id}`, buyerId: buyer.id, propertyId: property.id, overallScore, confidence, factors,
      reasons: factors.filter((item) => item.status === "matched").map((item) => item.explanation),
      confidenceReducers: factors.filter((item) => item.status === "reduced").map((item) => item.explanation),
      missingInformation, recommendedAction: this.action(overallScore, property.available, missingInformation), recommendationOnly: true,
    };
    if (cache.size >= 500) cache.delete(cache.keys().next().value as string);
    cache.set(cacheKey, result);
    return result;
  }

  private budget(b: BuyerMatchEvidence, p: PropertyMatchEvidence) { if (b.budgetMax === undefined || p.price === undefined) return factor("budget", "Budget Match", undefined, "Budget comparison unavailable.", [b.budgetMax === undefined ? "Buyer budget missing." : "Property price missing."]); const fits = p.price <= b.budgetMax && (b.budgetMin === undefined || p.price >= b.budgetMin); return factor("budget", "Budget Match", fits ? 100 : 30, fits ? "Property price is within the recorded buyer budget." : "Property price is outside the recorded buyer budget."); }
  private location(b: BuyerMatchEvidence, p: PropertyMatchEvidence) { const wanted = [...b.locations, ...b.communities]; if (!wanted.length || (!p.location && !p.community)) return factor("location", "Location Match", undefined, "Location comparison unavailable.", [!wanted.length ? "Preferred location missing." : "Property location missing."]); const matches = [p.location, p.community].filter((x): x is string => Boolean(x)).some((x) => wanted.map(normalized).includes(normalized(x))); return factor("location", "Location Match", matches ? 100 : 25, matches ? "Property matches a recorded preferred location or community." : "Property is outside the recorded preferred locations."); }
  private property(b: BuyerMatchEvidence, p: PropertyMatchEvidence) { const missing = [p.area === undefined ? "Property area missing." : "", b.propertyTypes.length === 0 ? "Preferred property type missing." : ""].filter(Boolean); const checks = [!b.propertyTypes.length || (p.propertyType ? b.propertyTypes.map(normalized).includes(normalized(p.propertyType)) : false), b.bedrooms === undefined || p.bedrooms === b.bedrooms, b.bathrooms === undefined || (p.bathrooms !== undefined && p.bathrooms >= b.bathrooms), b.areaMin === undefined || (p.area !== undefined && p.area >= b.areaMin), b.areaMax === undefined || (p.area !== undefined && p.area <= b.areaMax), b.parking === undefined || (p.parking !== undefined && p.parking >= b.parking), !b.listingType || p.listingType === b.listingType]; const evidenced = checks.filter(Boolean).length; return missing.length === 2 ? factor("property", "Property Match", undefined, "Property requirements cannot be compared.", missing) : factor("property", "Property Match", Math.round(evidenced / checks.length * 100), `${evidenced} of ${checks.length} recorded property requirements align.`, missing); }
  private lifestyle(b: BuyerMatchEvidence, p: PropertyMatchEvidence) { if (!b.lifestylePreferences.length || !p.lifestyleTags.length) return factor("lifestyle", "Lifestyle Match", undefined, "Lifestyle comparison unavailable.", [!b.lifestylePreferences.length ? "Lifestyle preferences missing." : "Property lifestyle evidence missing."]); const count = overlap(b.lifestylePreferences, p.lifestyleTags); return factor("lifestyle", "Lifestyle Match", Math.round(count / b.lifestylePreferences.length * 100), `${count} of ${b.lifestylePreferences.length} lifestyle preferences align.`); }
  private timeline(b: BuyerMatchEvidence, p: PropertyMatchEvidence) { if (!b.timeline || !p.possessionDate) return factor("timeline", "Timeline Match", undefined, "Timeline comparison unavailable.", [!b.timeline ? "Buyer timeline missing." : "Property possession timeline missing."]); const fits = p.possessionDate <= b.timeline; return factor("timeline", "Timeline Match", fits ? 100 : 35, fits ? "Possession timing fits the recorded buyer timeline." : "Possession timing is later than the buyer timeline."); }
  private amenities(b: BuyerMatchEvidence, p: PropertyMatchEvidence) { if (!b.amenities.length || !p.amenities.length) return factor("amenities", "Amenities Match", undefined, "Amenities comparison unavailable.", [!b.amenities.length ? "Buyer amenity preferences missing." : "Property amenities missing."]); const count = overlap(b.amenities, p.amenities); return factor("amenities", "Amenities Match", Math.round(count / b.amenities.length * 100), `${count} of ${b.amenities.length} requested amenities are recorded for the property.`); }
  private action(score?: number, available?: boolean, missing: readonly string[] = []): AiMatchProjection["recommendedAction"] { if (available === false) return "Request Documents"; if (missing.length >= 3) return "Request Documents"; if (score !== undefined && score >= 85) return "Schedule Viewing"; if (score !== undefined && score >= 70) return "Send Brochure"; return "Call Buyer"; }
}
