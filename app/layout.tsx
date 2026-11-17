import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { AuthProvider } from "@/components/providers/session-provider";

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Invoice Generator - Invoice Modern untuk UMKM",
  description: "Tingkatkan produktivitas UMKM dengan InvoicePWA. Buat, kelola, dan pantau tagihan klien dengan mudah. Dilengkapi akses offline yang aman.",
  keywords: [
    "SaaS Invoice",
    "Aplikasi Tagihan UMKM",
    "Buat Invoice Online",
    "Invoice Offline",
    "Manajemen Klien",
    "Generator Invoice",
    "Padi Invoice"
  ],
  other: {
    "geo.region": "ID-JI",
    "geo.placename": "Surabaya",
    "geo.position": "-7.250445;112.768845",
    "ICBM": "-7.250445, 112.768845"
  },
  icons: {
    icon: "/logo.jpg",
    shortcut: "/logo.jpg",
    apple: "/logo.jpg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "InvoicePWA",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={plusJakartaSans.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <InstallPrompt />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
