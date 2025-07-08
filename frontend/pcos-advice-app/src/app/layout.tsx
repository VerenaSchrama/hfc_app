// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Leaf } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Her <span>Food Code</span>",
  description: "Decode which foods work for you and your cycle",
};

const Header = () => (
  <header className="py-8">
    <div className="max-w-4xl mx-auto px-4 flex flex-col items-center text-center">
      <div className="flex items-center gap-2">
        <Leaf className="h-8 w-8 text-pink-500" />
        <h1 className="text-4xl font-bold text-gray-800">HerFoodCode</h1>
      </div>
      <p className="text-lg text-gray-600 mt-2">
        Decode which foods work for you and your cycle
      </p>
    </div>
  </header>
);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-gray-800`}>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}