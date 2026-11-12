import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import CustomerAuthModal from "@/components/auth/CustomerAuthModal";
import CartDrawer from "@/components/store/CartDrawer";
import WishlistDrawer from "@/components/store/WishlistDrawer";

const sansFont = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const serifFont = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Ceenai | Timeless Elegance & Contemporary Women's Fashion",
  description: "Shop premium Indian wear, western wear, luxury nightwear, innerwear, and designer fashion accessories crafted for the modern woman.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${sansFont.variable} ${serifFont.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-[#FAF7F2] text-[#2B1A13] selection:bg-[#7B1123] selection:text-white"
        suppressHydrationWarning
      >
        <StoreProvider>
          {children}
          <CustomerAuthModal />
          <CartDrawer />
          <WishlistDrawer />
        </StoreProvider>
      </body>
    </html>
  );
}
