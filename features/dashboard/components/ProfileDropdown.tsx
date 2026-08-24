"use client";
import { Button } from "@/features/platform/design-system";
import { logoutAction } from "@/features/authentication/actions/auth.actions";

import {
  CircleHelp,
  LogOut,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react";

export interface ProfileDropdownProps {
  onClose: () => void;
}

const menuItems = [
  { label: "Profile", icon: UserRound },
  { label: "Account settings", icon: Settings },
  { label: "Security", icon: ShieldCheck },
  { label: "Help & shortcuts", icon: CircleHelp },
];

export function ProfileDropdown({ onClose }: ProfileDropdownProps) {
  return (
    <div
      className="absolute right-0 top-[calc(100%+0.6rem)] z-50 w-64 overflow-hidden rounded-2xl border border-vds-border bg-[var(--vds-color-surface)]/95 shadow-2xl shadow-vds-shadow backdrop-blur-2xl"
      role="menu"
      aria-label="User menu"
    >
      <div className="border-b border-vds-border/[0.07] p-4">
        <p className="text-sm font-semibold text-vds-foreground">Platform Operator</p>
        <p className="mt-0.5 text-xs text-vds-muted">operator@atlasos.com</p>
      </div>
      <div className="p-1.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button variant="control"
              key={item.label}
              type="button"
              onClick={onClose}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-vds-secondary transition hover:bg-vds-surface/[0.06] hover:text-vds-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vds-focus"
              role="menuitem"
            >
              <Icon className="size-4 text-vds-muted" aria-hidden="true" />
              {item.label}
            </Button>
          );
        })}
      </div>
      <div className="border-t border-vds-border/[0.07] p-1.5">
        <form action={logoutAction}>
          <Button variant="control"
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-vds-muted transition hover:bg-vds-danger-soft hover:text-vds-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vds-danger"
            role="menuitem"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}
