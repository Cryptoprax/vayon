// Browser fixtures capture form payloads only. No invitation, membership, or database mutation occurs.
const capture = action => async form => { window.memberSubmissions.push({ action, values: Object.fromEntries(form.entries()) }); };
export const memberAction = capture("member");
export const invitationAction = capture("invitation");
export const inviteMemberAction = capture("invite");
export const transferOwnershipAction = capture("transfer");
