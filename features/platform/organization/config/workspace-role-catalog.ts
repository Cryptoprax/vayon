export const workspaceRoleDepartments = [
  "Executive", "Sales", "Marketing", "Operations", "Customer Success",
  "Supported Services", "Finance", "Human Resources", "Knowledge", "Product", "AI", "General",
] as const;

export type WorkspaceRoleDepartment = typeof workspaceRoleDepartments[number];

export const workspaceRoleCodes = [
  "organization_owner", "organization_admin", "operations_manager", "sales_manager",
  "sales_representative", "marketing_manager", "marketing_specialist",
  "customer_success_manager", "support_agent", "finance_manager", "hr_manager",
  "knowledge_manager", "product_manager", "ai_manager", "analyst", "standard_member",
  "viewer", "guest", "manager", "sales", "marketing", "operations", "finance", "support", "read_only",
] as const;

export type WorkspaceRoleCode = typeof workspaceRoleCodes[number];

export interface WorkspaceRoleDefinition {
  readonly code: WorkspaceRoleCode;
  readonly name: string;
  readonly department: WorkspaceRoleDepartment;
  readonly description: string;
  readonly permissions: readonly string[];
  readonly restrictions: readonly string[];
  readonly typicalUsers: string;
  readonly icon: "crown" | "shield" | "sales" | "megaphone" | "operations" | "success" | "support" | "finance" | "people" | "knowledge" | "product" | "ai" | "analytics" | "member" | "viewer" | "guest";
  readonly color: string;
  readonly assignable: boolean;
  readonly legacy?: boolean;
}

const role = (definition: WorkspaceRoleDefinition) => definition;

export const workspaceRoleCatalog = Object.freeze([
  role({code:"organization_owner",name:"Organization Owner",department:"Executive",description:"Full organization authority across commercial, operational, and administrative capabilities.",permissions:["Organization management","Billing","Users","Integrations","AI","Reports","CRM","Marketing","Sales","Customer Success","Operations"],restrictions:["Founder Platform is never available","Assignment requires confirmed ownership transfer"],typicalUsers:"Legal owner or accountable organization executive",icon:"crown",color:"amber",assignable:false}),
  role({code:"organization_admin",name:"Organization Admin",department:"Executive",description:"Administers people, workspaces, integrations, and the organization operating environment.",permissions:["User management","Workspace settings","Integrations","CRM","Marketing","Sales","Customer Success","Knowledge","AI Employees"],restrictions:["Founder Platform is never available","Cannot transfer ownership without confirmation"],typicalUsers:"COO, chief of staff, or trusted system administrator",icon:"shield",color:"violet",assignable:true}),
  role({code:"sales_manager",name:"Sales Manager",department:"Sales",description:"Leads pipeline execution, forecasting, and sales-team performance.",permissions:["CRM","Deals","Leads","Contacts","Companies","Sales AI","Reports"],restrictions:["No organization administration or billing"],typicalUsers:"Head of Sales, regional manager, or team lead",icon:"sales",color:"blue",assignable:true}),
  role({code:"sales_representative",name:"Sales Representative",department:"Sales",description:"Works assigned leads and deals through meetings, inbox, and Sales AI.",permissions:["Own Leads","Own Deals","Contacts","Meetings","Inbox","Sales AI"],restrictions:["Access is limited to owned sales records where enforced"],typicalUsers:"Account executives and sales representatives",icon:"sales",color:"blue",assignable:true}),
  role({code:"marketing_manager",name:"Marketing Manager",department:"Marketing",description:"Owns campaign strategy, creative operations, growth programs, and reporting.",permissions:["Campaigns","Growth Studio","Creative Studio","Marketing AI","Reports"],restrictions:["Publishing remains approval governed"],typicalUsers:"Head of Marketing or campaign lead",icon:"megaphone",color:"pink",assignable:true}),
  role({code:"marketing_specialist",name:"Marketing Specialist",department:"Marketing",description:"Executes campaigns and develops governed creative assets with Marketing AI.",permissions:["Campaign execution","Creative assets","Marketing AI"],restrictions:["No organization administration or unrestricted publishing"],typicalUsers:"Campaign specialists, content creators, and designers",icon:"megaphone",color:"pink",assignable:true}),
  role({code:"operations_manager",name:"Operations Manager",department:"Operations",description:"Coordinates operational work, schedules, tasks, workflows, and Operations AI.",permissions:["Operations","Calendar","Tasks","Workflow Automation","AI Operations"],restrictions:["No billing or ownership management"],typicalUsers:"Operations heads and delivery managers",icon:"operations",color:"cyan",assignable:true}),
  role({code:"customer_success_manager",name:"Customer Success Manager",department:"Customer Success",description:"Manages account health, retention, renewals, and evidence-backed success guidance.",permissions:["Customer Health","Renewals","Success AI","Timeline","Reports"],restrictions:["No billing configuration or autonomous customer communication"],typicalUsers:"Customer success managers and account managers",icon:"success",color:"emerald",assignable:true}),
  role({code:"support_agent",name:"Support Agent",department:"Supported Services",description:"Resolves customer requests using the shared inbox, tickets, timeline, and knowledge.",permissions:["Inbox","Tickets","Customer Timeline","Knowledge"],restrictions:["No organization administration"],typicalUsers:"Customer support and service desk agents",icon:"support",color:"sky",assignable:true}),
  role({code:"finance_manager",name:"Finance Manager",department:"Finance",description:"Oversees invoices, payments, billing operations, and revenue reporting.",permissions:["Billing","Invoices","Payments","Revenue Reports"],restrictions:["No ownership or Founder Platform access"],typicalUsers:"Finance controllers and billing managers",icon:"finance",color:"green",assignable:true}),
  role({code:"hr_manager",name:"HR Manager",department:"Human Resources",description:"Administers team invitations and the employee directory.",permissions:["Team","Invitations","Employee directory"],restrictions:["No billing, CRM, or platform administration"],typicalUsers:"People operations and HR managers",icon:"people",color:"orange",assignable:true}),
  role({code:"knowledge_manager",name:"Knowledge Manager",department:"Knowledge",description:"Maintains trusted organizational knowledge and governed AI memory resources.",permissions:["Knowledge Base","Documentation","AI Memory"],restrictions:["No cross-tenant knowledge or autonomous document changes"],typicalUsers:"Knowledge owners, enablement leads, and documentation managers",icon:"knowledge",color:"indigo",assignable:true}),
  role({code:"product_manager",name:"Product Manager",department:"Product",description:"Reviews product intelligence, feedback, roadmaps, and AI product insights.",permissions:["Product Intelligence","Feedback","Roadmaps","AI Product insights"],restrictions:["Recommendations cannot modify the product automatically"],typicalUsers:"Product managers and product operations leads",icon:"product",color:"purple",assignable:true}),
  role({code:"ai_manager",name:"AI Manager",department:"AI",description:"Configures governed AI employees, workflows, settings, and prompt resources.",permissions:["AI Employees","AI Workflows","AI Settings","Prompt Library"],restrictions:["Approval and recommendation-only boundaries remain enforced"],typicalUsers:"AI operations and automation administrators",icon:"ai",color:"fuchsia",assignable:true}),
  role({code:"analyst",name:"Analyst",department:"General",description:"Read-only access to business intelligence and performance reporting.",permissions:["Dashboards (read)","Reports (read)","Analytics (read)"],restrictions:["No write, approval, or administrative operations"],typicalUsers:"Business analysts and reporting stakeholders",icon:"analytics",color:"slate",assignable:true}),
  role({code:"standard_member",name:"Standard Member",department:"General",description:"Standard employee access to everyday workspace capabilities.",permissions:["Workspace home","Assigned work","Collaboration","Knowledge"],restrictions:["No administrative, billing, or ownership capabilities"],typicalUsers:"General organization employees",icon:"member",color:"slate",assignable:true}),
  role({code:"viewer",name:"Viewer",department:"General",description:"Read-only access to workspace information made available to the member.",permissions:["Workspace read","Shared reports","Shared records"],restrictions:["No create, update, delete, export, or approval operations"],typicalUsers:"Executives, auditors, and external observers",icon:"viewer",color:"slate",assignable:true}),
  role({code:"guest",name:"Guest",department:"General",description:"Limited access to resources explicitly shared with the invited guest.",permissions:["Explicitly shared resources"],restrictions:["No workspace-wide discovery or administrative access"],typicalUsers:"Partners, vendors, and external collaborators",icon:"guest",color:"slate",assignable:true}),
  role({code:"manager",name:"Manager (Legacy)",department:"General",description:"Existing broad workspace manager role retained for backward compatibility.",permissions:["Legacy manager permissions"],restrictions:["Not offered for new invitations"],typicalUsers:"Existing members assigned before the enterprise catalog",icon:"member",color:"slate",assignable:false,legacy:true}),
  role({code:"sales",name:"Sales (Legacy)",department:"Sales",description:"Existing sales role retained for backward compatibility.",permissions:["Legacy sales permissions"],restrictions:["Not offered for new invitations"],typicalUsers:"Existing sales members",icon:"sales",color:"blue",assignable:false,legacy:true}),
  role({code:"marketing",name:"Marketing (Legacy)",department:"Marketing",description:"Existing marketing role retained for backward compatibility.",permissions:["Legacy marketing permissions"],restrictions:["Not offered for new invitations"],typicalUsers:"Existing marketing members",icon:"megaphone",color:"pink",assignable:false,legacy:true}),
  role({code:"operations",name:"Operations (Legacy)",department:"Operations",description:"Existing operations role retained for backward compatibility.",permissions:["Legacy operations permissions"],restrictions:["Not offered for new invitations"],typicalUsers:"Existing operations members",icon:"operations",color:"cyan",assignable:false,legacy:true}),
  role({code:"finance",name:"Finance (Legacy)",department:"Finance",description:"Existing finance role retained for backward compatibility.",permissions:["Legacy finance permissions"],restrictions:["Not offered for new invitations"],typicalUsers:"Existing finance members",icon:"finance",color:"green",assignable:false,legacy:true}),
  role({code:"support",name:"Support (Legacy)",department:"Supported Services",description:"Existing support role retained for backward compatibility.",permissions:["Legacy support permissions"],restrictions:["Not offered for new invitations"],typicalUsers:"Existing support members",icon:"support",color:"sky",assignable:false,legacy:true}),
  role({code:"read_only",name:"Read-only (Legacy)",department:"General",description:"Existing read-only role retained for backward compatibility.",permissions:["Legacy read-only permissions"],restrictions:["Not offered for new invitations"],typicalUsers:"Existing read-only members",icon:"viewer",color:"slate",assignable:false,legacy:true}),
] satisfies readonly WorkspaceRoleDefinition[]);

export const assignableWorkspaceRoles = workspaceRoleCatalog.filter((item) => item.assignable);
export const workspaceRoleByCode = new Map(workspaceRoleCatalog.map((item) => [item.code, item]));

export function summarizePermissions(roleCode: WorkspaceRoleCode, limit = 3): string {
  const permissions = workspaceRoleByCode.get(roleCode)?.permissions ?? [];
  const visible = permissions.slice(0, limit).join(", ");
  return permissions.length > limit ? `${visible} +${permissions.length - limit}` : visible;
}
