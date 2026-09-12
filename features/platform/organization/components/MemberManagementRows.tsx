"use client";

import { useId, useRef, type ReactNode } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/features/platform/design-system";
import { memberAction } from "../actions/organization.actions";
import { workspaceRoleByCode } from "../config/workspace-role-catalog";
import type { OrganizationMember } from "../types";
import "./MembersManagement.css";

export function MemberManagementRow({ member, canManage, roleOptions }: {
  member: OrganizationMember;
  canManage: boolean;
  roleOptions: ReactNode;
}) {
  const definition = workspaceRoleByCode.get(member.role);
  const dialog = useRef<HTMLDialogElement>(null);
  const permissionTrigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const protectedOwner = member.role === "organization_owner";
  return <article className="member-management-row" aria-labelledby={`${id}-name`}>
    <div className="member-management-identity">
      <h3 id={`${id}-name`}>{member.name}</h3>
      <p className="member-management-email">{member.email}</p>
      <p className="member-management-role">{definition?.name ?? member.roleName}</p>
      <p className="member-management-muted">{definition?.department ?? "General"} Department</p>
    <div className="member-management-access">
      <p className="member-management-access-name">{definition ? `${definition.department} Access` : "Assigned role access"}</p>
      <Button ref={permissionTrigger} type="button" variant="ghost" aria-label={`View permissions for ${member.name}`} aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>View Permissions</Button>
    </div>
      <p className="member-management-muted member-management-last-seen">{member.lastLoginAt ? `Active ${new Date(member.lastLoginAt).toLocaleString()}` : "Never signed in"}</p>
      {protectedOwner && <p className="member-management-muted member-management-owner-note">Use Transfer ownership below to change the owner.</p>}
    </div>
    <div className="member-management-controls">
      <p className={`member-management-status member-management-status-${member.status}`}><span aria-hidden="true" />{member.status}</p>
      <form action={memberAction} className="member-management-role-form" aria-label={`Change role for ${member.name}`}>
        <input type="hidden" name="memberId" value={member.id} />
        <input type="hidden" name="intent" value="role" />
        <label htmlFor={`${id}-role`}>Role</label>
        <select id={`${id}-role`} name="role" defaultValue={member.role} disabled={!canManage || protectedOwner}>{roleOptions}</select>
        <Button size="sm" variant="secondary" disabled={!canManage || protectedOwner} aria-label={`Change role for ${member.name}`}>Change Role</Button>
      </form>
      <form action={memberAction} className="member-management-actions" aria-label={`Manage ${member.name}`}>
        <input type="hidden" name="memberId" value={member.id} />
        {member.status === "active" ? <Button size="sm" variant="secondary" name="intent" value="suspend" disabled={!canManage || protectedOwner} aria-label={`Suspend ${member.name}`}>Suspend</Button> : <Button size="sm" variant="secondary" name="intent" value="reactivate" disabled={!canManage} aria-label={`Reactivate ${member.name}`}>Reactivate</Button>}
        <Button size="sm" variant="outline" name="intent" value="remove" disabled={!canManage || protectedOwner} aria-label={`Remove ${member.name}`} className="member-management-remove">Remove</Button>
      </form>
    </div>
    <dialog ref={dialog} className="member-permissions-dialog" aria-labelledby={`${id}-permissions-title`} aria-describedby={`${id}-permissions-description`} onClose={() => permissionTrigger.current?.focus()} onKeyDown={event => { if (event.key === "Tab") { event.preventDefault(); dialog.current?.querySelector<HTMLButtonElement>("button")?.focus(); } }}>
      <div className="member-permissions-heading">
        <div><h2 id={`${id}-permissions-title`}>{member.name}&apos;s permissions</h2><p id={`${id}-permissions-description`}>{definition?.name ?? member.roleName}</p></div>
        <Button type="button" variant="ghost" aria-label="Close permissions" onClick={() => dialog.current?.close()}><X aria-hidden="true" /></Button>
      </div>
      {definition ? <>
        <p className="member-management-muted">Access included with this role</p>
        <ul className="member-permissions-list">{definition.permissions.map(permission => <li key={permission}><Check aria-hidden="true" /><span>{permission}</span></li>)}</ul>
        <h3>Access limits</h3>
        <ul className="member-permissions-limits">{definition.restrictions.map(restriction => <li key={restriction}>{restriction}</li>)}</ul>
      </> : <p>Details for this assigned role are not in the current role catalog. Ask your workspace owner to review this member&apos;s access.</p>}
    </dialog>
  </article>;
}
