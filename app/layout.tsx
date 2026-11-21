import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sahrul - Portfolio",
  description: "Handmade",
  icons: {
  icon: "/brand.svg", // file lives in public/favicon.png
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
      className={geistSans.variable}
      data-loading="true"
    >
      <body data-loading="true">
        {children}
      </body>
    </html>
  );
}