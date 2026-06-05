import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SportVault Coach",
  description: "SportVault valmentajan ohjauspaneeli",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fi" className="dark">
      <body className={`${inter.variable} font-sans min-h-full flex flex-col antialiased`}>
        {children}
      </body>
    </html>
  );
}
