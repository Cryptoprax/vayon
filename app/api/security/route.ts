import { z } from "zod";
import { EnterpriseSecurityService } from "@/features/platform/enterprise-security";
import { requireEntitlement, FeatureNotEntitledError } from "@/features/vayon/billing/services/require-entitlement";
const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("enroll-mfa"),
    name: z.string().min(1).max(100).default("VAYON Authenticator"),
  }),
  z.object({
    action: z.literal("verify-mfa"),
    factorId: z.string().min(1),
    code: z.string().regex(/^\d{6}$/),
  }),
  z.object({ action: z.literal("disable-mfa"), factorId: z.string().min(1) }),
  z.object({
    action: z.literal("change-password"),
    password: z.string().min(12).max(128),
  }),
  z.object({ action: z.literal("change-email"), email: z.string().email() }),
  z.object({ action: z.literal("revoke-sessions") }),
  z.object({
    action: z.literal("trust-device"),
    fingerprint: z.string().min(16).max(500),
    name: z.string().min(1).max(100),
  }),
  z.object({ action: z.literal("remove-device"), id: z.string().uuid() }),
  z.object({
    action: z.literal("create-token"),
    name: z.string().min(1).max(100),
    scopes: z
      .array(z.string().regex(/^[a-z][a-z0-9_.:-]{1,63}$/))
      .min(1)
      .max(20),
    expiresAt: z.string().datetime().optional(),
  }),
  z.object({ action: z.literal("revoke-token"), id: z.string().uuid() }),
  z.object({
    action: z.literal("switch-organization"),
    organizationId: z.string().uuid(),
    workspaceId: z.string().uuid(),
  }),
]);
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return Response.json(
      { error: "Invalid security request." },
      { status: 400 },
    );
  try {
    const service = await EnterpriseSecurityService.production(),
      input = parsed.data;
    switch (input.action) {
      case "enroll-mfa":
        return Response.json(await service.enrollMfa(input.name), {
          headers: { "Cache-Control": "no-store" },
        });
      case "verify-mfa":
        return Response.json(
          {
            recoveryCodes: await service.verifyMfa(input.factorId, input.code),
          },
          { headers: { "Cache-Control": "no-store" } },
        );
      case "disable-mfa":
        await service.disableMfa(input.factorId);
        break;
      case "change-password":
        await service.changePassword(input.password);
        break;
      case "change-email":
        await service.changeEmail(input.email, new URL(request.url).origin);
        break;
      case "revoke-sessions":
        await service.revokeOtherSessions();
        break;
      case "trust-device":
        await service.trustDevice(input.fingerprint, input.name);
        break;
      case "remove-device":
        await service.removeDevice(input.id);
        break;
      case "create-token": {
        try {
          await requireEntitlement("api");
        } catch (error) {
          if (error instanceof FeatureNotEntitledError)
            return Response.json(
              { error: "Programmatic API access (personal access tokens) is available on the Business plan.", code: "API_NOT_ENTITLED" },
              { status: 403, headers: { "Cache-Control": "no-store" } },
            );
          throw error;
        }
        return Response.json(
          await service.createToken(input.name, input.scopes, input.expiresAt),
          { headers: { "Cache-Control": "no-store" } },
        );
      }
      case "revoke-token": {
        try {
          await requireEntitlement("api");
        } catch (error) {
          if (error instanceof FeatureNotEntitledError)
            return Response.json(
              { error: "Programmatic API access (personal access tokens) is available on the Business plan.", code: "API_NOT_ENTITLED" },
              { status: 403, headers: { "Cache-Control": "no-store" } },
            );
          throw error;
        }
        await service.revokeToken(input.id);
        break;
      }
      case "switch-organization":
        await service.switchOrganization(
          input.organizationId,
          input.workspaceId,
        );
        break;
    }
    return Response.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "The governed security operation could not be completed." },
      { status: 400 },
    );
  }
}
