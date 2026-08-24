import "server-only";

import type { User } from "@supabase/supabase-js";

import { log } from "@/lib/observability/logger";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { founderContext } from "@/features/platform/founder/services/founder-context";

import { founderAllowlist } from "./config";
import { FounderBootstrapRepository } from "./founder-bootstrap.repository";
import type { FounderAccountStatus, FounderRoleChange } from "./types";

interface BootstrapRecord {
  readonly active: boolean;
  readonly previousRole: string | null;
  readonly grantedAt?: string;
  readonly grantedBy?: string;
}

export class FounderBootstrapError extends Error {}

export class FounderBootstrapService {
  private async context() {
    const { user: actor } = await founderContext();
    if (String(actor.app_metadata?.role ?? "") !== "super_admin") {
      throw new FounderBootstrapError("Super Administrator access required.");
    }
    return {
      actor,
      repository: new FounderBootstrapRepository(createSupabaseServiceClient()),
      allowlist: founderAllowlist(),
    };
  }

  async list(): Promise<readonly FounderAccountStatus[]> {
    const { repository, allowlist } = await this.context();
    return (await repository.users())
      .filter((user) => user.email && allowlist.has(normalizeEmail(user.email)))
      .map((user) => status(user, allowlist))
      .sort((left, right) => left.email.localeCompare(right.email));
  }

  async grant(email: string, reason: string): Promise<FounderRoleChange> {
    const normalizedEmail = normalizeAndValidateEmail(email);
    const normalizedReason = validateReason(reason);
    const { actor, repository, allowlist } = await this.context();
    if (!allowlist.has(normalizedEmail)) {
      throw new FounderBootstrapError("Target account is not in the Founder allowlist.");
    }
    const target = await findUser(repository, normalizedEmail);
    const currentRole = role(target);
    if (currentRole === "super_admin") {
      log("founder.bootstrap.grant_skipped", {
        actorId: actor.id,
        targetId: target.id,
        timestamp: new Date().toISOString(),
        reason: normalizedReason,
        outcome: "already_super_admin",
      });
      return { target: status(target, allowlist), changed: false };
    }
    const timestamp = new Date().toISOString();
    const updated = await repository.updateRole(target, {
      ...target.app_metadata,
      role: "super_admin",
      founder_bootstrap: {
        active: true,
        previousRole: currentRole,
        grantedAt: timestamp,
        grantedBy: actor.id,
      },
    });
    log("founder.bootstrap.granted", {
      actorId: actor.id,
      targetId: target.id,
      timestamp,
      reason: normalizedReason,
    });
    return { target: status(updated, allowlist), changed: true };
  }

  async revoke(email: string, reason: string): Promise<FounderRoleChange> {
    const normalizedEmail = normalizeAndValidateEmail(email);
    const normalizedReason = validateReason(reason);
    const { actor, repository, allowlist } = await this.context();
    if (!allowlist.has(normalizedEmail)) {
      throw new FounderBootstrapError("Target account is not in the Founder allowlist.");
    }
    const target = await findUser(repository, normalizedEmail);
    const record = bootstrapRecord(target);
    if (role(target) !== "super_admin" || !record?.active) {
      log("founder.bootstrap.revoke_skipped", {
        actorId: actor.id,
        targetId: target.id,
        timestamp: new Date().toISOString(),
        reason: normalizedReason,
        outcome: "not_bootstrap_managed",
      });
      return { target: status(target, allowlist), changed: false };
    }
    if (target.id === actor.id) {
      throw new FounderBootstrapError("A Super Administrator cannot revoke their own active session.");
    }
    const timestamp = new Date().toISOString();
    const updated = await repository.updateRole(target, {
      ...target.app_metadata,
      role: record.previousRole,
      founder_bootstrap: {
        ...record,
        active: false,
        revokedAt: timestamp,
        revokedBy: actor.id,
        revokeReason: normalizedReason,
      },
    });
    log("founder.bootstrap.revoked", {
      actorId: actor.id,
      targetId: target.id,
      timestamp,
      reason: normalizedReason,
    });
    return { target: status(updated, allowlist), changed: true };
  }
}

async function findUser(repository: FounderBootstrapRepository, email: string): Promise<User> {
  const target = (await repository.users()).find((user) => normalizeEmail(user.email ?? "") === email);
  if (!target) throw new FounderBootstrapError("No authenticated account exists for that email address.");
  return target;
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeAndValidateEmail(value: string): string {
  const email = normalizeEmail(value);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new FounderBootstrapError("Enter a valid email address.");
  }
  return email;
}

function validateReason(value: string): string {
  const reason = value.trim();
  if (reason.length < 8 || reason.length > 500) {
    throw new FounderBootstrapError("Reason must contain between 8 and 500 characters.");
  }
  return reason;
}

function role(user: User): string | null {
  const value = user.app_metadata?.role;
  return typeof value === "string" && value.length ? value : null;
}

function bootstrapRecord(user: User): BootstrapRecord | null {
  const value = user.app_metadata?.founder_bootstrap;
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  return {
    active: record.active === true,
    previousRole: typeof record.previousRole === "string" ? record.previousRole : null,
    grantedAt: typeof record.grantedAt === "string" ? record.grantedAt : undefined,
    grantedBy: typeof record.grantedBy === "string" ? record.grantedBy : undefined,
  };
}

function status(user: User, allowlist: ReadonlySet<string>): FounderAccountStatus {
  const record = bootstrapRecord(user);
  const currentRole = role(user);
  return {
    id: user.id,
    email: normalizeEmail(user.email ?? ""),
    role: currentRole,
    allowlisted: allowlist.has(normalizeEmail(user.email ?? "")),
    founderAccess: currentRole === "super_admin" || currentRole === "founder",
    bootstrapManaged: record?.active === true,
    grantedAt: record?.grantedAt ?? null,
  };
}
