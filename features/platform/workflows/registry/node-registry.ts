import type { NodeRegistration, WorkflowNodeKind } from "../domain/contracts";
const nodes: readonly NodeRegistration[] = [
  ["trigger","Trigger","control"],["condition","Condition","control"],["decision","Decision","control"],["delay","Delay / wait","control"],["approval","Approval","control"],["branch","Branch","control"],["loop","Loop","control"],["end","End","control"],
  ["notification","Notification","business"],["email","Email","integration"],["calendar","Calendar","integration"],["task","Task","business"],["communication","Communication","business"],["crm","CRM","business"],["webhook","Webhook","integration"],["document","Document","business"],
  ["variable","Variable","data"],["math","Math","data"],["formatter","Formatter","data"],["ai","AI recommendation","intelligence"],["plugin","Future plugin","extension"],
].map(([kind,label,category])=>Object.freeze({kind:kind as WorkflowNodeKind,label,category:category as NodeRegistration["category"],executable:false as const}));
export const workflowNodeRegistry = Object.freeze(nodes);
export const workflowConnectionRegistry = Object.freeze({allowsSelfConnection:false,allowsDuplicateConnection:false,allowsCycles:false,ports:Object.freeze(["success","failure","true","false","next"]) });
export function getNodeRegistration(kind: WorkflowNodeKind){return workflowNodeRegistry.find(node=>node.kind===kind)}
