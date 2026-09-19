"use server";
import { guardSubscriptionAction } from "@/features/vayon/billing/services/subscription-write-guard";import{requireEntitlement}from"@/features/vayon/billing/services/require-entitlement";import{revalidatePath}from"next/cache";import{WorkflowAutomationService}from"../services/automation.service";import type{WorkflowDefinition}from"../domain/contracts";const refresh=()=>{revalidatePath("/vayon/workflows");revalidatePath("/vayon/workflows/runtime")};export async function saveWorkflowAction(form:FormData){
await guardSubscriptionAction();
await requireEntitlement("automation");
const value=JSON.parse(String(form.get("definition")??"{}"))as WorkflowDefinition;await new WorkflowAutomationService().save(value);refresh()}export async function publishWorkflowAction(form:FormData){
await guardSubscriptionAction();
await requireEntitlement("automation");
await new WorkflowAutomationService().publish(String(form.get("workflowId")??""),Number(form.get("version")??0));refresh()}export async function installWorkflowTemplateAction(form:FormData){
await guardSubscriptionAction();
await requireEntitlement("automation");
await new WorkflowAutomationService().installTemplate(String(form.get("templateId")??""));refresh()}
