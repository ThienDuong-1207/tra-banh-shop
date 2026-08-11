import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartProvider } from "@/contexts/CartContext";
import "../globals.css";

// Font tiếng Việt theo mục 3 của brief thiết kế — hỗ trợ đầy đủ dấu thanh
// điệu, dải weight rộng, dáng bo tròn hợp phong cách F&B.
const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Trà & Bánh — Nguyên liệu pha chế",
  description: "Nguyên liệu trà, bánh, pha chế — Trà & Bánh",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${beVietnamPro.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <CartProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
