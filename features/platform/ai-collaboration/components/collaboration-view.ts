import type{AIEmployeeCode}from"@/features/platform/openai/domain/models";
export function employeeName(code:AIEmployeeCode){return ({"sales-ai":"Sarah","crm-ai":"Emma","marketing-ai":"Alex","operations-ai":"David","whatsapp-ai":"Olivia"}as Partial<Record<AIEmployeeCode,string>>)[code]??code.replace("-ai","")}
