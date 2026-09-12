import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AppShell } from '@/features/vayon/product-shell/AppShell';
import { WorkspacePageLayout, WorkspaceHeader, WorkspaceContent, WorkspaceEmptyState, WorkspaceAssistantDock, WorkspacePagination } from '@/features/platform/design-system/layout/WorkspaceLayouts';
import { WorkspaceTable } from '@/features/platform/design-system/layout/WorkspaceTable';
import { Button, ButtonLink } from '@/features/platform/design-system/components/core/Actions';
import { PropertyTable } from '@/features/vayon/property/components/PropertyTable';
import { PropertyTable as BeforePropertyTable } from '@/features/vayon/property/components/PropertyTable?before';
import { DataTable } from '@/features/platform/design-system/components/data/Data';
import { PropertyToolbar } from '@/features/vayon/property/components/PropertyToolbar';
import { LeadTable } from '@/features/vayon/lead/components/LeadList';
import { LeadToolbar } from '@/features/vayon/lead/components/LeadToolbar';
import { CompanyDirectory } from '@/features/vayon/crm-engine/components/CrmDirectory';
import { ContactDirectory } from '@/features/vayon/crm-company/ContactDirectory';
import { GrowthOverview } from '@/features/vayon/growth-intelligence/GrowthOverview';

// Explicit presentation data. No services, authentication, queries or real mutations.
const mode = new URLSearchParams(location.search).get('workspace') || 'properties';
const names = { properties:'Properties',leads:'Leads',clients:'Clients',companies:'Companies',growth:'Marketing Performance',table:'Operational records',empty:'Clients',form:'Workspace Settings',pipeline:'Deals',data:'Data table',before:'Before: Properties table' };
const property = {id:'qa-property',title:'QA Property With A Long Descriptive Name',reference:'QA-001',status:'available',propertyType:'apartment',salePrice:{amount:250000,currency:'USD'},address:{city:'Bengaluru'},assignedAgentName:'QA Agent',updatedAt:'2026-09-01'};
const lead = {id:'qa-lead',name:'Alexandria Montgomery',phone:'+1 555 0100',email:'alexandria.montgomery.with.a.long.address@example.test',status:'new',priority:'urgent',score:80,budgetAmount:{amount:300000,currency:'USD'},interestedPropertyNames:['QA Property'],assignedAgentName:'QA Agent',source:'website',lastActivityAt:'2026-09-01'};
const company = {id:'qa-company',name:'QA Real Estate Company',industry:'Real estate',address:'A long address that must wrap without clipping',ownerName:'QA Agent'};
const contact = {id:'qa-contact',name:'Alexandria Montgomery',position:'Buyer',relationship:'Buyer',companyName:'QA Company',ownerName:'QA Agent',email:lead.email};
const breadcrumb=<nav aria-label="Breadcrumb"><a href="?workspace=properties">Workspace</a><span aria-hidden="true"> / </span><span aria-current="page">{names[mode]}</span></nav>;
function Fixture(){
 const [rows,setRows]=useState(3);
 const table=<WorkspaceTable aria-label="QA operational records"><thead><tr>{['Record','Status','Email','Role','Department','Updated','Actions'].map(x=><th scope="col" key={x}>{x}</th>)}</tr></thead><tbody>{Array.from({length:rows},(_,i)=><tr key={i}><th scope="row">QA Record {i+1}</th><td>Active</td><td>{lead.email}</td><td>Manager</td><td>Sales</td><td>2026-09-12</td><td><form onSubmit={event=>{event.preventDefault();window.saved=Object.fromEntries(new FormData(event.currentTarget));}}><input type="hidden" name="recordId" value={i}/><Button type="submit">Update record {i+1}</Button></form></td></tr>)}</tbody></WorkspaceTable>;
 let content;
 if(mode==='properties')content=<><PropertyToolbar query={{}}/><PropertyTable items={[property,{...property,id:'qa-property-2'}]}/></>;
 else if(mode==='before')content=<BeforePropertyTable items={[property,{...property,id:'qa-property-2'}]}/>;
 else if(mode==='data')content=<DataTable caption="QA configurable table" rowKey={row=>row.id} rows={[lead,{...lead,id:'qa-lead-2'}]} columns={['name','email','phone','status','priority','source'].map(id=>({id,header:id,cell:row=>row[id]}))}/>;
 else if(mode==='leads')content=<><LeadToolbar query={{}}/><LeadTable items={[lead,{...lead,id:'qa-lead-2'}]}/></>;
 else if(mode==='clients')content=<ContactDirectory items={[contact]} />;
 else if(mode==='companies')content=<CompanyDirectory items={[company]} />;
 else if(mode==='growth')content=<GrowthOverview userName="QA broker" marketingAvailable/>;
 else if(mode==='empty')content=<WorkspaceEmptyState title="No clients yet" description="No client relationships have been recorded." nextStep="Create your first lead to record a relationship." action={{href:'/vayon/leads/new',label:'Create Lead'}}/>;
 else if(mode==='form')content=<form onSubmit={event=>event.preventDefault()} className="grid gap-6"><label>Workspace name<input className="block w-full rounded-xl border border-vds-border bg-vds-input p-3" defaultValue="QA Workspace"/></label><label>Description<textarea className="block w-full rounded-xl border border-vds-border bg-vds-input p-3" defaultValue="QA presentation fixture"/></label><Button>Save changes</Button></form>;
 else if(mode==='pipeline')content=<div className="vds-workspace-pipeline">{['New','Viewing','Offer','Closing'].map(stage=><section key={stage} className="rounded-2xl border border-vds-border p-5"><h2>{stage}</h2><article className="mt-4 rounded-2xl border border-vds-border"><h3>QA Deal</h3><p>Plan the next conversation with this buyer.</p><Button variant="secondary">Open deal</Button></article></section>)}</div>;
 else content=<><Button onClick={()=>setRows(value=>value+1)} variant="secondary">Add QA row</Button>{table}</>;
 const header=<header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center border-b border-vds-border bg-vds-background px-4 text-sm">VAYON · Local presentation fixture</header>;
 const sidebar=<aside className="fixed bottom-0 left-0 top-16 hidden w-64 border-r border-vds-border bg-vds-background p-5 lg:block"><nav aria-label="Fixture navigation">{Object.entries(names).map(([key,title])=><a className="mb-3 block" key={key} href={`?workspace=${key}`}>{title}</a>)}</nav></aside>;
 return <div className="vayon-product"><AppShell sidebarCollapsed={false} header={header} sidebar={sidebar}><main id="main-content"><WorkspacePageLayout breadcrumbs={breadcrumb} assistant={<WorkspaceAssistantDock><label>Ask assistant<textarea aria-label="Ask assistant" className="block w-full rounded-xl border border-vds-border bg-vds-input p-3"/></label></WorkspaceAssistantDock>}><WorkspaceContent>{mode!=='growth'&&<WorkspaceHeader title={names[mode]} description="Choose a record and continue your next task." actions={mode==='empty'||mode==='form'?undefined:<ButtonLink href="#workspace-records">Open records</ButtonLink>}/>}<div id="workspace-records">{content}</div><WorkspacePagination page={1} pageCount={2} nextHref="?page=2" total={20}/></WorkspaceContent></WorkspacePageLayout></main></AppShell></div>;
}
createRoot(document.getElementById('root')).render(<Fixture/>);
