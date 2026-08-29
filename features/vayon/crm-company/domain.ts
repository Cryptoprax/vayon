export interface CompanyInput { name:string; logoPath?:string; industry?:string; website?:string; email?:string; phone?:string; employees?:number; revenue?:number; currency:string; address?:string; country?:string; ownerId?:string; notes?:string }
export interface CompanyRecord extends CompanyInput { id:string; ownerName:string; createdAt:string; updatedAt:string; version:number }
export interface CompanyPage { items:readonly CompanyRecord[]; count:number; page:number; pageSize:number }
export interface CompanyRelatedItem { id:string; title:string; status:string; meta?:string }
export interface CompanyProfile { company:CompanyRecord; contacts:readonly CompanyRelatedItem[]; leads:readonly CompanyRelatedItem[]; properties:readonly CompanyRelatedItem[]; deals:readonly CompanyRelatedItem[]; activities:readonly CompanyRelatedItem[]; revenue:number;metrics:{totalLeads:number;activeDeals:number;wonDeals:number;lostDeals:number;propertiesSold:number;averageDealSize:number;salesVelocityDays:number;conversion:number;assignedAgents:number} }
export interface SalespersonOption { id:string; name:string; email:string; role:string; team:string }
export interface ContactRecord { id:string;leadId?:string;name:string;email?:string;phone?:string;companyName:string;position?:string;department?:string;relationship:string;ownerName:string;updatedAt:string }
