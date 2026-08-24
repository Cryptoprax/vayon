import "server-only";
import {operationsContext} from "@/features/vayon/operations/services/context";
import {FeatureLicensingService} from "@/features/vayon/billing/services/feature-licensing.service";
export type CreativeAccessSource="subscription"|"internal";
export async function creativeStudioAccess(){const c=await operationsContext(),{data:{user}}=await c.client.auth.getUser();if(!user)return null;const role=String(user.app_metadata?.role??"");if(role==="super_admin"||role==="founder"||role==="platform_support")return{...c,user,source:"internal" as const};const{data:membership,error}=await c.client.from("workspace_members").select("id").eq("workspace_id",c.workspaceId).eq("user_id",user.id).eq("status","active").maybeSingle();if(error)throw error;if(!membership)return null;const licensed=await new FeatureLicensingService().licensed("marketing_studio");return licensed?{...c,user,source:"subscription" as const}:null;}
