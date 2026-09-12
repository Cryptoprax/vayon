import{MicrosoftIdentityDashboard}from"@/features/platform/integrations/microsoft/MicrosoftIdentityDashboard";
import{MicrosoftOAuthService}from"@/features/platform/integrations/microsoft/services/microsoft-oauth.service";
import{operationsContext}from"@/features/vayon/operations/services/context";
import{EnvironmentFeatureFlagProvider}from"@/lib/infrastructure/feature-flags";
export default async function Page({searchParams}:{searchParams:Promise<{error?:string;success?:string}>}){const ctx=await operationsContext(),[credential,flag,query]=await Promise.all([new MicrosoftOAuthService().credential(),new EnvironmentFeatureFlagProvider().evaluate(ctx.workspaceId,"microsoft_identity"),searchParams]);return <>{query.error&&<p role="alert" className="mt-6 text-vds-danger">{query.error}</p>}{query.success&&<p role="status" className="mt-6 text-vds-success">{query.success}</p>}<MicrosoftIdentityDashboard credential={credential} featureEnabled={flag.enabled}/></>}
