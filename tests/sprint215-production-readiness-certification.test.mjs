import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const read=(path)=>readFile(path,"utf8");

test("Sprint 215 certification combines route mutation interaction accessibility responsive and production gates",()=>{const result=spawnSync(process.execPath,["scripts/audit-sprint215-certification.mjs"],{encoding:"utf8"});assert.equal(result.status,0,result.stderr||result.stdout);assert.match(result.stdout,/Sprint 215 source certification passed/)});

test("VDS buttons submit forms by intent and neutralize explicit dead controls",async()=>{const source=await read("features/platform/design-system/components/core/Actions.tsx");assert.match(source,/type\?\?\(onClick\?"button":"submit"\)/);assert.match(source,/unavailable=type==="button"&&!hasInteraction/);assert.match(source,/disabled=\{disabled\|\|unavailable\}/)});

test("task create has persistence verification feedback revalidation and redirect safety",async()=>{const[actions,repository,form]=await Promise.all([read("features/vayon/operations/actions/operations.actions.ts"),read("features/vayon/operations/repositories/task.repository.ts"),read("features/vayon/operations/components/OperationForms.tsx")]);assert.match(repository,/if\(!data\)throw/);assert.match(actions,/Task created successfully/);assert.match(actions,/revalidatePath\("\/vayon\/tasks"\)/);assert.match(form,/role="status"/);assert.match(form,/role="alert"/)});

test("unimplemented interactions are visibly unavailable instead of dead",async()=>{const files=await Promise.all([read("features/vayon/brand-studio/BrandStudio.tsx"),read("features/vayon/image-studio/ImageStudio.tsx"),read("features/platform/core/themes/components/ThemeCard.tsx"),read("features/vayon/workspace-engine/components/WorkspaceEngine.tsx")]);for(const source of files)assert.match(source,/disabled/);assert.match(files.join("\n"),/not available|not connected|unavailable/i)});
