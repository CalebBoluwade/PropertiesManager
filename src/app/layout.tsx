import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { getCurrency, getDateFormat, getExpenseCategories } from "@/lib/data-mode";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Property Management System",
  description: "Property portfolio and rental management system",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [currency, dateFormat, expenseCategories] = await Promise.all([
    getCurrency(),
    getDateFormat(),
    getExpenseCategories(),
  ]);
  return (
    <html
      lang="en"
      className={`${inter.className} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Providers currency={currency} dateFormat={dateFormat} expenseCategories={expenseCategories}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
