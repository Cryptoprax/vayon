export interface FoundingMemberAvailability {
  eligible: boolean;
  status: "available" | "reserved" | "confirmed" | "expired" | "not_eligible" | "transition_pending" | "transitioned" | "ended";
  remaining: number;
  ownsAllocation: boolean;
  applicable: boolean;
  successfulPeriods: number;
  promotionalEnd: string | null;
}

export const unavailableFoundingOffer: FoundingMemberAvailability = {
  eligible: false, status: "not_eligible", remaining: 0, ownsAllocation: false,
  applicable: false, successfulPeriods: 0, promotionalEnd: null,
};
