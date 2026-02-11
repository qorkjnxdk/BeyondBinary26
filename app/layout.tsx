import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Harbour - Women's Anonymous Chat",
  description: "A safe space for women in Singapore to connect anonymously",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

