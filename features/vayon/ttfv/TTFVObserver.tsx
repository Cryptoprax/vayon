"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { recordTtfvMilestone, type TtfvMilestone } from "./ttfv-events";

const milestones: readonly [RegExp, TtfvMilestone][] = [
  [/^\/vayon\/ai\/employees(?:\/|$)/, "first_ai_employee"],
  [/^\/vayon\/(?:crm\/)?(?:contacts|customers|leads)(?:\/|$)/, "first_crm_contact"],
  [/^\/vayon\/(?:growth|communications\/campaigns|creative-studio\/wizard)(?:\/|$)/, "first_campaign"],
  [/^\/vayon\/deals\/(?:offers|contracts)(?:\/|$)/, "first_proposal"],
  [/^\/vayon\/properties\/new(?:\/|$)/, "first_property"],
  [/^\/vayon\/properties\/projects(?:\/|$)/, "first_project"],
  [/^\/vayon\/calendar\/(?:meetings|site-visits)(?:\/|$)/, "first_appointment"],
  [/^\/vayon\/properties\/inventory(?:\/|$)/, "first_product_import"],
];

export function TTFVObserver({ workspaceReady }: { workspaceReady: boolean }) {
  const path = usePathname();
  const params = useSearchParams();
  useEffect(() => {
    if (workspaceReady) recordTtfvMilestone("workspace_created", path);
    const success = params.get("success");
    if (success) {
      const milestone = milestones.find(([pattern]) => pattern.test(path))?.[1];
      if (milestone) recordTtfvMilestone(milestone, path);
    }
    if (path === "/vayon/settings/subscription" && params.get("checkout") === "success")
      recordTtfvMilestone("first_upgrade", path);
  }, [params, path, workspaceReady]);
  return null;
}
