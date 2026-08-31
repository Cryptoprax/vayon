import { spawnSync } from "node:child_process";

const gates = [
  ["routes", "scripts/audit-route-integrity.mjs"],
  ["mutations", "scripts/audit-mutation-reliability.mjs"],
  ["interactions", "scripts/audit-interaction-reliability.mjs"],
  ["accessibility", "scripts/audit-ux-simplification.mjs", "accessibility"],
  ["responsive", "scripts/audit-ux-simplification.mjs", "responsive"],
  ["commercial UX", "scripts/audit-commercial-readiness.mjs"],
  ["floating layout", "scripts/audit-floating-layout.mjs"],
  ["production artifacts", "scripts/audit-production-readiness.mjs"],
  ["product source", "scripts/audit-product-certification.mjs"],
];

const failures=[];
for(const [name,...args] of gates){const result=spawnSync(process.execPath,args,{encoding:"utf8"});if(result.status!==0)failures.push({name,detail:result.stderr||result.stdout});else console.log(`PASS ${name}`)}
if(failures.length){for(const failure of failures)console.error(`FAIL ${failure.name}\n${failure.detail}`);process.exitCode=1}else console.log(`Sprint 215 source certification passed: ${gates.length} production-readiness gates verified. Authenticated browser and live database certification remain environment-dependent.`);
