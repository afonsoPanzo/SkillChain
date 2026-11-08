import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import "@solana/wallet-adapter/styles.css";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/skillchain/site-header";
import { BottomNav } from "@/components/skillchain/bottom-nav";
import { DemoBanner } from "@/components/skillchain/demo-banner";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

const DESCRIPTION = "Learn Solana by playing. Every level ends with a real transaction on Devnet.";

// Absolute base for Open Graph URLs: explicit setting, else the Vercel deployment, else local.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "SkillChain",
  description: DESCRIPTION,
  icons: { icon: "/icon.svg" },
  openGraph: { title: "SkillChain", description: DESCRIPTION, siteName: "SkillChain", type: "website" },
  twitter: { card: "summary_large_image", title: "SkillChain", description: DESCRIPTION },
};

export const viewport: Viewport = {
  themeColor: "#0E0F14",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${bricolage.variable} ${jetbrains.variable}`}>
      <body suppressHydrationWarning>
        <Providers>
          <div className="flex min-h-screen justify-center bg-ink">
            <div className="flex min-h-screen w-full max-w-[480px] flex-col border-x border-divider">
              <div className="sticky top-0 z-10">
                <DemoBanner />
                <SiteHeader />
              </div>
              <main className="flex flex-1 flex-col gap-5 px-[18px] pt-[22px] pb-8">
                {children}
              </main>
              <BottomNav />
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
