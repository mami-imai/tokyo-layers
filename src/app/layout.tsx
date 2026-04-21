import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "都市の地層 / Tokyo Layers",
  description: "東京の歴史的変遷を地図上の時間レイヤーとして体験する",
};

// スマホ全画面地図用: ピンチズームを無効化し、地図操作と干渉させない
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${geistSans.variable} h-full`}>
      <body className="h-full overflow-hidden font-sans">{children}</body>
    </html>
  );
}
