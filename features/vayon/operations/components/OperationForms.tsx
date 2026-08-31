import { Button } from "@/features/platform/design-system";
import { createTaskAction, scheduleMeetingAction, scheduleVisitAction } from "../actions/operations.actions";

const input = "rounded-xl border border-vds-border bg-vds-input px-4 py-3 text-sm outline-none focus:border-vds-primary";
const advanced = "md:col-span-2 rounded-2xl border border-vds-border p-4";

export function TaskForm({success,error}:{success?:string;error?:string}) {
  return <form action={createTaskAction} className="mt-6 grid gap-3 rounded-3xl border border-vds-border bg-vds-surface/[.03] p-5 md:grid-cols-2">
    {success&&<p role="status" className="rounded-xl bg-vds-success-soft p-3 text-sm text-vds-success md:col-span-2">{success}</p>}
    {error&&<p role="alert" className="rounded-xl bg-vds-danger-soft p-3 text-sm text-vds-danger md:col-span-2">{error}</p>}
    <input className={input} name="title" placeholder="What needs to be done?" aria-label="Task title" required />
    <input className={input} name="dueAt" type="datetime-local" aria-label="Due date and time" required />
    <details className={advanced}><summary className="cursor-pointer font-medium">Advanced options</summary><div className="mt-4 grid gap-3 md:grid-cols-2"><label className="grid gap-2 text-sm">Priority<select className={input} name="priority" defaultValue="medium"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label><label className="grid gap-2 text-sm">Status<select className={input} name="status" defaultValue="pending"><option value="pending">Pending</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label><textarea className={`${input} md:col-span-2`} name="description" placeholder="Add details (optional)" aria-label="Task details" /></div></details>
    <Button type="submit" variant="primary" className="md:justify-self-start">Create task</Button>
  </form>;
}

export function MeetingForm() {
  return <form action={scheduleMeetingAction} className="mt-6 grid gap-3 rounded-3xl border border-vds-border bg-vds-surface/[.03] p-5 md:grid-cols-2">
    <input className={input} name="title" placeholder="Meeting title" required />
    <select className={input} name="meetingType" aria-label="Meeting type"><option value="customer">Customer meeting</option><option value="internal">Internal meeting</option><option value="builder">Builder meeting</option><option value="broker">Broker meeting</option><option value="follow_up">Follow-up meeting</option></select>
    <input className={input} name="startsAt" type="datetime-local" aria-label="Meeting start" required />
    <input className={input} name="endsAt" type="datetime-local" aria-label="Meeting end" required />
    <Button variant="primary" className="md:justify-self-start">Schedule meeting</Button>
  </form>;
}

export function VisitForm() {
  return <form action={scheduleVisitAction} className="mt-6 grid gap-3 rounded-3xl border border-vds-border bg-vds-surface/[.03] p-5 md:grid-cols-2">
    <input className={input} name="propertyId" placeholder="Choose a property" aria-label="Property" required />
    <input className={input} name="startsAt" type="datetime-local" aria-label="Visit date and time" required />
    <details className={advanced}><summary className="cursor-pointer font-medium">Advanced options</summary><div className="mt-4 grid gap-3 md:grid-cols-2"><input className={input} name="leadId" placeholder="Lead (optional)" aria-label="Lead" /><input className={input} name="assignedAgentId" placeholder="Agent (optional)" aria-label="Assigned agent" /><select className={input} name="status" aria-label="Visit status"><option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="no_show">No show</option></select><textarea className={input} name="notes" placeholder="Notes (optional)" aria-label="Visit notes" /></div></details>
    <Button variant="primary" className="md:justify-self-start">Schedule visit</Button>
  </form>;
}
