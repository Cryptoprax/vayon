import type { HTMLAttributes, ReactNode } from "react";
type SurfaceProps = HTMLAttributes<HTMLElement> & { readonly children: ReactNode };
export function Card({ className = "", children, ...props }: SurfaceProps) { return <article className={`vds-surface vds-card-motion flex min-w-0 flex-col rounded-2xl p-5 sm:p-6 ${className}`} {...props}>{children}</article> }
export function Panel({ className = "", children, ...props }: SurfaceProps) { return <aside className={`vds-surface vds-raised rounded-3xl p-5 sm:p-6 ${className}`} {...props}>{children}</aside> }
export function Section({ className = "", children, ...props }: SurfaceProps) { return <section className={`space-y-5 ${className}`} {...props}>{children}</section> }
export function Divider({ className = "", ...props }: HTMLAttributes<HTMLHRElement>) { return <hr className={`border-0 border-t border-[var(--vds-color-border)] ${className}`} {...props}/> }
