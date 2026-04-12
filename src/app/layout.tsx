import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SmartStock AI | Restaurant Inventory",
  description: "AI-Powered Restaurant Inventory System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 h-screen flex overflow-hidden`}>
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 h-screen">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
