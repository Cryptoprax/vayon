import { z } from "zod";
import { assignableWorkspaceRoles, type WorkspaceRoleCode } from "../config/workspace-role-catalog";

const assignableRoleCodes = assignableWorkspaceRoles.map((role) => role.code) as [string, ...string[]];
export const roleSchema = z.enum(assignableRoleCodes).transform((role) => role as WorkspaceRoleCode);
const hours = z.object({ open: z.string().regex(/^\d{2}:\d{2}$/), close: z.string().regex(/^\d{2}:\d{2}$/) });
export const profileSchema = z.object({
  name: z.string().trim().min(2).max(160), businessEmail: z.string().trim().email().max(320), phone: z.string().trim().max(40).optional(), website: z.string().trim().url().max(500).optional().or(z.literal("")), timezone: z.string().trim().min(1).max(100), locale: z.string().trim().min(2).max(20), currency: z.string().trim().length(3),
  address: z.object({ line1: z.string().trim().max(200), line2: z.string().trim().max(200), city: z.string().trim().max(100), region: z.string().trim().max(100), postalCode: z.string().trim().max(30), country: z.string().trim().length(2) }),
  branding: z.object({ primary: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().or(z.literal("")), accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().or(z.literal("")) }),
  businessHours: z.record(z.string(), hours), regionalSettings: z.record(z.string(), z.string().max(100)),
});
export const invitationSchema = z.object({ name: z.string().trim().min(2).max(120), email: z.string().trim().email().max(320), role: roleSchema });
export const idSchema = z.string().uuid();
export const transferSchema = z.object({ memberId: idSchema, confirmation: z.literal("TRANSFER") });
export const departmentSchema = z.object({ name: z.string().trim().min(2).max(100), managerMemberId: idSchema.or(z.literal("")), kpis: z.array(z.string().trim().min(1).max(100)).max(25), permissions: z.array(z.string().trim().min(1).max(100)).max(50) });
export const teamSchema = z.object({ name: z.string().trim().min(2).max(100), departmentId: idSchema, managerMemberId: idSchema.or(z.literal("")), capacity: z.coerce.number().int().min(1).max(10000), memberIds: z.array(idSchema).max(1000) });
