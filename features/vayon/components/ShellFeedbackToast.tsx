"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { IconButton, Toast } from "@/features/platform/design-system";

export function ShellFeedbackToast({ message, tone }: { readonly message: string; readonly tone: "success" | "danger" }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (tone !== "success") return;
    const timer = window.setTimeout(() => setVisible(false), 5000);
    return () => window.clearTimeout(timer);
  }, [message, tone]);
  if (!visible) return null;
  return <div className="relative"><Toast title={tone === "success" ? "Success" : "Action required"} description={message} tone={tone}/><IconButton type="button" size="sm" aria-label="Dismiss notification" onClick={() => setVisible(false)} className="absolute right-2 top-2"><X className="size-4" aria-hidden="true"/></IconButton></div>;
}
