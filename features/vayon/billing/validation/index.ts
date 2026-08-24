import { z } from "zod";
import { planCodes } from "../config/entitlements";
export const changePlanSchema=z.object({planCode:z.enum(planCodes),expectedVersion:z.coerce.number().int().positive(),seatQuantity:z.coerce.number().int().min(1).max(10000)});
export const cancelSchema=z.object({expectedVersion:z.coerce.number().int().positive()});
export const billingContactSchema=z.object({companyName:z.string().trim().min(2).max(160),billingEmail:z.string().trim().email().max(320),taxId:z.string().trim().max(80).optional()});
