import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CMP.SHP — Build Your Dream PC",
    template: "%s | CMP.SHP",
  },
  description:
    "Shop the best PC components — CPUs, GPUs, RAM, Motherboards, and more. Use our compatibility-checked PC Builder to assemble your perfect rig.",
  keywords: ["PC components", "computer parts", "CPU", "GPU", "RAM", "PC builder", "custom PC"],
  openGraph: {
    type: "website",
    title: "CMP.SHP — Build Your Dream PC",
    description:
      "Shop top PC components and use our compatibility-checked PC Builder to craft your perfect build.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0f172a] text-white">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
