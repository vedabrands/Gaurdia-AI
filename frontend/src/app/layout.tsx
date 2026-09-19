import type { Metadata } from "next";
import { Sidebar } from "@/components/layout/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "GUARDIA AI — Surveillance Operating System",
  description: "AI-Powered Real-Time Neural Surveillance & Multi-Channel Threat Response",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0f0f11] text-[#e8e5e0] min-h-screen flex antialiased">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto">
          {children}
        </div>
      </body>
    </html>
  );
}
