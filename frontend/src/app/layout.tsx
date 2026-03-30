import type { Metadata } from "next";
import { IBM_Plex_Mono, Libre_Baskerville } from "next/font/google";
import "./globals.css";

const libreBaskerville = Libre_Baskerville({
  variable: "--font-libre-baskerville",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Process Audit Ledger",
  description: "Immutable workflow and compliance logging on Stacks.",
  other: {
    "talentapp:project_verification":
      "f512cfc20c2dd63e613938d09a5b25f590f2a555cda3de64696c34272bb9113a81db0eee7fd1a2de0528605dc8c255bdf93676bd3cac4ccce1912bf56b485886",
  },
  openGraph: {
    title: "Process Audit Ledger",
    description: "Immutable workflow and compliance logging on Stacks.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Process Audit Ledger",
    description: "Immutable workflow and compliance logging on Stacks.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${libreBaskerville.variable} ${ibmPlexMono.variable}`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
