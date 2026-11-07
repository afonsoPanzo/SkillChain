import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import "@solana/wallet-adapter/styles.css";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/skillchain/site-header";
import { BottomNav } from "@/components/skillchain/bottom-nav";

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

export const metadata: Metadata = {
  title: "SkillChain",
  description:
    "Aprende Solana a jogar. Cada nível termina com uma transacção real na Devnet.",
  icons: { icon: "/icon.svg" },
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
    <html lang="pt-PT" className={`${bricolage.variable} ${jetbrains.variable}`}>
      <body suppressHydrationWarning>
        <Providers>
          <div className="flex min-h-screen justify-center bg-ink">
            <div className="flex min-h-screen w-full max-w-[480px] flex-col border-x border-divider">
              <SiteHeader />
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
