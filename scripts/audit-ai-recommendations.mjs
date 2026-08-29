import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read=path=>readFileSync(path,"utf8"),ui=read("features/vayon/founder-command-center/ExecutiveAIInbox.tsx"),home=read("features/vayon/founder-command-center/FounderCommandCenter.tsx"),repository=read("features/platform/ai-collaboration/repositories/supabase-collaboration.repository.ts");
for(const value of["Executive AI Inbox","Today’s AI Briefing","Pending Review","Approved Today","Rejected Today","Completed Today","Critical Items","Approve","Modify","Reject","Explain","View Evidence","View Related Record","Recommendation only · no autonomous execution","Human approval required","Business Impact","Confidence","Recommendation History","Sarah","Emma","Alex","David","Olivia"])assert.match(ui+home,new RegExp(value));
assert.match(home,/Today’s Executive Summary[\s\S]+ExecutiveAIInbox/);
assert.match(repository,/organization_id[\s\S]+workspace_id/);
assert.doesNotMatch(ui,/fetch\(|createSupabaseServerClient|\.from\(|provider token|SQL/i);
console.log("AI Recommendation audit passed: evidence-backed queue projection, human approval handoff, employee coverage, and non-execution governance are present.");
