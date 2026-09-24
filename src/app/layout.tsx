import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { CustomerHeader } from "@/components/layout/CustomerHeader";
import { CustomerFooter } from "@/components/layout/CustomerFooter";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
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
      className={`${plusJakartaSans.variable} font-sans h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        <CartProvider>
          <WishlistProvider>
            <CustomerHeader />
            <main className="flex-1 flex flex-col">{children}</main>
            <CustomerFooter />
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
