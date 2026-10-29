import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Construct CRM - Construction Operations Platform",
  description: "Enterprise Construction CRM, Estimation, Project Execution and Financial Operations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}

