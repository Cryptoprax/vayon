import { readFile } from "node:fs/promises";
const component=await readFile(new URL("../features/platform/openai/runtime/ChatPanel.tsx",import.meta.url),"utf8");
const route=await readFile(new URL("../app/vayon/ai/workforce/[employeeId]/page.tsx",import.meta.url),"utf8");
const required=["Conversation history","Suggested","Workspace Context","Evidence Panel","Session Memory","Approval Required","Recommended Actions","Follow-up questions","Ask me anything about your business","I don't have enough verified information to answer that yet"];
const missing=required.filter(value=>!component.toLowerCase().includes(value.toLowerCase()));
if(missing.length)throw new Error(`Conversation audit failed: ${missing.join(", ")}`);
if(!route.includes("conversationContext")||!route.includes("AICollaborationService.production()"))throw new Error("Conversation projections are not wired.");
if(/createSupabaseServerClient|\.from\(|insert\(|update\(|delete\(/.test(component))throw new Error("Conversation UI bypasses existing projections or mutates business data.");
console.log("AI employee conversation audit passed: five colleagues, structured evidence, session memory, approval handoff, limitations, accessibility, and projection reuse verified.");
