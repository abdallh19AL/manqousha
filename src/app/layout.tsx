import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import PWARegister from "@/components/PWARegister";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#E8622A",
};

export const metadata: Metadata = {
  title: "منقوشة و نار | أصيل وطازج",
  description: "مناقيش وفطائر طازجة كل يوم — محضّرة بحب وعلى أصولها",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "منقوشة و نار",
  },
  icons: {
    apple: "/icons/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.variable} font-cairo antialiased`}>

        {/* Content */}
        <AuthProvider>{children}</AuthProvider>
        <PWARegister />

      </body>
    </html>
  );
}
