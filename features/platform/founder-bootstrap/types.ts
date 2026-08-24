export interface FounderAccountStatus {
  readonly id: string;
  readonly email: string;
  readonly role: string | null;
  readonly allowlisted: boolean;
  readonly founderAccess: boolean;
  readonly bootstrapManaged: boolean;
  readonly grantedAt: string | null;
}

export interface FounderRoleChange {
  readonly target: FounderAccountStatus;
  readonly changed: boolean;
}
