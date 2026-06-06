import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import CallListener from "@/components/CallListener";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chatboat",
  description: "Chatboat — a great friend to chat with you",
};

export const viewport: Viewport = {
  themeColor: "#1fb8c0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-dvh flex-col bg-white text-ink">
        {children}
        <CallListener />
      </body>
    </html>
  );
}
