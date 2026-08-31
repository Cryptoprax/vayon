import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const surfaces = read("features/vayon/enterprise-collaboration/CollaborationSurfaces.tsx");

test("enterprise inbox reuses the existing notification center", () => {
  const inbox = read("app/vayon/notifications/page.tsx");
  assert.match(inbox, /Enterprise Inbox/);
  assert.match(inbox, /<NotificationCenter/);
  assert.doesNotMatch(inbox, /new Messaging|duplicate inbox/i);
});

test("collaboration exposes comments mentions assignments and governed history", () => {
  for (const capability of ["Comments", "@mentions", "attachments", "approval notes", "AI summaries", "threaded replies", "Assign work", "Approval history remains immutable"]) assert.ok(surfaces.includes(capability));
});

test("daily briefing and meeting intelligence use existing workflows", () => {
  for (const route of ["/vayon/calendar", "/vayon/leads", "/vayon/tasks", "/vayon/timeline", "/vayon/meetings"]) assert.ok(surfaces.includes(route));
  for (const item of ["AI summary", "Action items", "Decisions", "Risks", "Follow-ups", "Assignments", "Approval suggestions"]) assert.ok(surfaces.includes(item));
});

test("collaboration does not introduce polling or external execution", () => {
  assert.doesNotMatch(surfaces, /setInterval|setTimeout|fetch\(|axios|supabase/);
});
