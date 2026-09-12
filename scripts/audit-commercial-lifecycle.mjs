import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
const output=resolve('test-results/commercial-lifecycle');
async function walk(path){const entries=await readdir(path,{withFileTypes:true});return(await Promise.all(entries.map(entry=>entry.isDirectory()?walk(resolve(path,entry.name)):[resolve(path,entry.name)]))).flat();}
const before=resolve(output,'before');
const paths=(await walk(before)).map(path=>relative(before,path).replaceAll('\\','/').replace(/\.txt$/,''));
const added=[
 'features/vayon/billing/config/trial.ts',
 'features/vayon/billing/components/SubscriptionCenter.tsx',
 'features/vayon/billing/components/SubscriptionManagement.tsx',
 'features/vayon/billing/components/WorkspaceTrialBanner.tsx',
 'features/vayon/billing/components/checkout-overlay.ts',
 'features/vayon/billing/components/dialog-keyboard.ts',
 'features/vayon/billing/services/workspace-trial.ts',
 'features/vayon/billing/actions/subscription-center.actions.ts',
 'supabase/migrations/20261030000000_sprint233_workspace_trial.sql',
 'tests/sprint233-commercial-lifecycle.test.mjs',
 'tests/fixtures/commercial-lifecycle/actions.mjs',
 'tests/fixtures/commercial-lifecycle/navigation.mjs',
 'tests/fixtures/commercial-lifecycle/entry.jsx',
 'scripts/certify-commercial-lifecycle.mjs',
 'scripts/audit-commercial-lifecycle.mjs',
 'COMMERCIAL_LIFECYCLE_CERTIFICATION.md',
];
const files=[...new Set([...paths,...added])].sort();
const environment=await readFile('.env.local','utf8').catch(()=> '');
const names=['PADDLE_ENVIRONMENT','PADDLE_API_KEY','PADDLE_WEBHOOK_SECRET','PADDLE_CLIENT_TOKEN','PADDLE_PRICE_STARTER_MONTHLY','PADDLE_PRICE_STARTER_ANNUAL','PADDLE_PRICE_PROFESSIONAL_MONTHLY','PADDLE_PRICE_PROFESSIONAL_ANNUAL'];
const configPresence=Object.fromEntries(names.map(name=>{const match=environment.match(new RegExp(`^${name}=(.*)$`,'m'));return[name,Boolean(match?.[1]?.trim().replace(/^["']|["']$/g,''))];}));
const evidence={files,configPresence,configurationNote:'Presence only in .env.local; values are not recorded and provider validity was not checked.',trialProvisioning:'Migration prepared, not applied.',trialEnforcement:'Blocked pending scope clarification: no new CRM, AI, marketing or membership write guards have been added.',runtime:'Component fixtures only; no authenticated production session supplied.'};
await writeFile(resolve(output,'source-evidence.json'),JSON.stringify(evidence,null,2));
console.log(JSON.stringify({files:files.length,configPresence,trialEnforcement:evidence.trialEnforcement},null,2));
