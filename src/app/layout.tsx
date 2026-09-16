import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { CustomerHeader } from "@/components/layout/CustomerHeader";
import { CustomerFooter } from "@/components/layout/CustomerFooter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tổ Sách — Nhà Sách Trực Tuyến Tinh Hoa (B2C)",
  description: "Hệ thống thương mại điện tử chuyên cung cấp sách mới 100% chính hãng, có bản quyền từ các nhà xuất bản uy tín.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        <CartProvider>
          <CustomerHeader />
          <main className="flex-1 flex flex-col">{children}</main>
          <CustomerFooter />
        </CartProvider>
      </body>
    </html>
  );
}
