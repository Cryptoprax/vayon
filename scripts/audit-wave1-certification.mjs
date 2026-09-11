import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { performance } from 'node:perf_hooks';
import ts from 'typescript';
const require = createRequire(import.meta.url);
function load(file) {
  const filename = resolve(file), mod = { exports: {} };
  const code = ts.transpileModule(readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('require', 'module', 'exports', code)(name => name.startsWith('@/') ? load(name.slice(2) + '.ts') : name.startsWith('.') ? load(resolve(dirname(filename), name + '.ts')) : require(name), mod, mod.exports);
  return mod.exports;
}
const { shellNavigation } = load('features/vayon/product-shell/navigation.ts');
const { filterNavigationForRole } = load('features/platform/permissions/runtime/navigation.ts');
const { evaluateWorkspacePermission } = load('features/platform/permissions/runtime/policy.ts');
const { normalizeVisibilityRole } = load('features/platform/visibility/policy.ts');
const { permissionModules, permissionActions } = load('features/platform/permissions/runtime/types.ts');
const { StaticNavigationSearchProvider } = load('features/vayon/universal-bar/providers/static-navigation.provider.ts');
const { rankUniversalResults } = load('features/vayon/universal-bar/services/universal-search.service.ts');
const { resolveOperatingSystemCommand } = load('features/vayon/cross-module-intelligence/command-router.ts');
const queries = ['Invite Team','Workspace','Members','Roles','Settings','Users','Owner','Admin'];
const allPaths = shellNavigation.flatMap(group => group.items.map(item => item.href));
const roles = ['organization_owner','organization_admin','manager','sales_representative','agent','read_only'];
const roleResults = roles.map(role => {
  const context = {role:normalizeVisibilityRole('',role),founder:false,industry:'REAL_ESTATE'};
  const visible = filterNavigationForRole(shellNavigation,role,context).flatMap(group=>group.items);
  const provider = new StaticNavigationSearchProvider(visible.map(item=>({...item,id:item.href,visible:true})));
  const searches = queries.map(query=>{ const started=performance.now(); const matches=rankUniversalResults(provider.search({query,scopes:provider.scopes}),query); return {query,first:matches[0]?{label:matches[0].label,href:matches[0].href,kind:matches[0].kind}:null,count:matches.length,localDurationMs:Number((performance.now()-started).toFixed(3)),command:resolveOperatingSystemCommand(query).route}; });
  return {role,visiblePages:visible.map(item=>item.href),hiddenPages:allPaths.filter(path=>!visible.some(item=>item.href===path)),grants:permissionModules.map(module=>({module,actions:permissionActions.filter(action=>evaluateWorkspacePermission(role,{module,action}).allowed)})),searches};
});
const read=file=>readFileSync(file,'utf8');
const workspace = {
  status:'Blocked',
  ownershipSource:'supabase/migrations/20260814000000_sprint43_google_identity_workspace.sql',
  creationUsesExistingOnboardingRpc:read('features/onboarding/services/onboarding.service.ts').includes('complete_sprint43_onboarding'),
  selectedWorkspaceReturnedBeforeActiveMembershipCheck:read('features/onboarding/services/workspace.service.ts').includes('if(selected)return'),
  switcherCreateDisabled:read('features/vayon/product-shell/WorkspaceSwitcher.tsx').includes('disabled'),
  acceptanceSelectsNewestPendingByEmail:read('supabase/migrations/20260820000000_sprint51_enterprise_organization.sql').includes("order by created_at desc limit 1 for update"),
  acceptanceActionIgnoresReturnedWorkspace:read('features/platform/organization/actions/organization.actions.ts').includes('await new EnterpriseOrganizationService().acceptInvitation();refresh()'),
};
const report={generatedAt:new Date().toISOString(),status:'Blocked',scope:'Wave 1 Identity, Workspace, Team, RBAC and Recovery source audit; not live lifecycle certification',productionVerified:false,firstTimeCustomerObserved:false,roles:roleResults,workspace,routeFiles:readdirSync('app',{recursive:true}).filter(file=>file.endsWith('page.tsx')).length};
mkdirSync('test-results/wave1-certification',{recursive:true});
writeFileSync('test-results/wave1-certification/source-audit.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({status:report.status,roles:roles.length,searchCases:queries.length*roles.length,workspace:workspace.status,artifact:'test-results/wave1-certification/source-audit.json'},null,2));
