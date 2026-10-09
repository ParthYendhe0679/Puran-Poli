import type { Metadata, Viewport } from "next";
import { Poppins, Unbounded } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";

const unbounded = Unbounded({ subsets: ["latin"], weight: ["500", "600", "700", "800"], display: "swap", variable: "--font-unbounded" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap", variable: "--font-poppins" });

export const metadata: Metadata = {
  title: { default: "Group Event Planner — plans that actually happen", template: "%s · Group Event Planner" },
  description: "Propose, vote, pay in advance and confirm group plans without endless group-chat back-and-forth. Frontend prototype — all payments are simulated.",
};

export const viewport: Viewport = {
  themeColor: "#f5f1e8",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${unbounded.variable} ${poppins.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
