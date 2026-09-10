import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { VdsThemeProvider } from "@/features/platform/design-system/theme/ThemeProvider";
import { ThemeBootstrap } from "@/features/platform/design-system/theme/ThemeBootstrap";
import { publicSiteUrl } from "@/lib/public-url";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

type LayoutProps = {
  children: ReactNode;
};

export const metadata: Metadata = {
  metadataBase: new URL(publicSiteUrl),
  title: {
    default: "Meet Your AI Team | VAYON",
    template: "%s | VAYON",
  },
  description:
    "Organize properties, clients, viewings, and follow-ups in one real estate workspace. Use contextual assistance and review important actions before they run.",
  alternates: { canonical: "/" },
  applicationName: "Vayon OS",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/assets/brand/favicon.ico", sizes: "256x256" },
      { url: "/assets/brand/favicon.png", type: "image/png", sizes: "256x256" },
    ],
    shortcut: "/assets/brand/favicon.ico",
    apple: "/assets/brand/apple-touch-icon.png",
  },
  openGraph: {
    title: "Meet Your AI Team | VAYON",
    description:
      "Organize properties, clients, viewings, and follow-ups in one real estate workspace. Use contextual assistance and review important actions before they run.",
    url: "/",
    type: "website",
    siteName: "Vayon",
    images: [
      {
        url: "/assets/brand/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "VAYON AI Operating System for Real Estate",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Meet Your AI Team | VAYON",
    description:
      "Organize properties, clients, viewings, and follow-ups in one real estate workspace. Use contextual assistance and review important actions before they run.",
    images: ["/assets/brand/twitter-image.png"],
  },
};

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <ThemeBootstrap />
      </head>
      <body className="min-h-full flex flex-col">
        <VdsThemeProvider>{children}</VdsThemeProvider>
      </body>
    </html>
  );
}
