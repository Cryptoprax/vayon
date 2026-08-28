"use client";
import { Button } from "@/features/platform/design-system";
import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { ThemeToggle } from "@/features/platform/design-system/theme/ThemeToggle";
import { vayonNavigation } from "@/features/platform/builder/config/vayon-navigation";
import { UniversalBar } from "@/features/vayon/universal-bar/components/UniversalBar";
import { HelpMenu, NotificationsMenu, ProfileMenu } from "./ShellMenus";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import type { ShellIdentity } from "./types";
import { BrandIcon, BrandLogo } from "@/components/brand";

function Brand({iconOnly=false}:{readonly iconOnly?:boolean}){return <Link href="/vayon/home" aria-label="VAYON home" className={`focus-ring flex min-w-0 shrink-0 items-center whitespace-nowrap rounded-xl ${iconOnly?"justify-center":"w-full"}`}>{iconOnly?<BrandIcon size="md" priority/>:<BrandLogo size="md" className="max-w-[9.5rem]" priority/>}</Link>}

export function ShellHeader({identity,collapsed,onMenu}:{readonly identity:ShellIdentity;readonly collapsed:boolean;readonly onMenu:()=>void}){const[profileOpen,setProfileOpen]=useState(false);return <header className={`fixed inset-x-0 top-0 h-16 border-b border-vds-border bg-vds-surface/90 shadow-sm shadow-vds-shadow backdrop-blur-xl ${profileOpen?"z-[80]":"z-[60]"}`}><div className="flex h-full min-w-0 items-center"><div className={`hidden h-full shrink-0 items-center border-r border-vds-border transition-[width,padding] duration-200 lg:flex ${collapsed?"w-20 justify-center px-3":"w-64 px-6"}`}><Brand iconOnly={collapsed}/></div><div className="flex shrink-0 items-center gap-2 px-3 lg:hidden"><Button variant="control" type="button" onClick={onMenu} aria-label="Open navigation" aria-controls="vayon-sidebar" className="grid size-10 place-items-center rounded-xl text-vds-muted hover:bg-vds-hover hover:text-vds-foreground"><Menu className="size-[18px]"/></Button><Brand iconOnly/></div><div className="flex min-w-0 flex-1 items-center gap-2 px-3 sm:gap-4 sm:px-5 lg:px-6"><div className="hidden shrink-0 sm:block"><WorkspaceSwitcher name={identity.workspaceName} logo={identity.workspaceLogo} description={identity.organizationDescription}/></div><div className="mx-auto min-w-0 max-w-2xl flex-1"><UniversalBar navigation={vayonNavigation} includeAuroraCrm={identity.demoWorkspace==="aurora"}/></div><HelpMenu/><NotificationsMenu/><ThemeToggle compact/><ProfileMenu name={identity.userName} onOpenChange={setProfileOpen}/></div></div></header>}
