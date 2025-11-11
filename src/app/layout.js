'use client';

import { Poppins } from "next/font/google";
import "./globals.css";
import { usePathname } from 'next/navigation';
import DashboardLayout from "@/components/dashboard-layout";
import AuthProvider from "@/components/auth-provider";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || 
                    pathname === '/signup' ||
                    pathname === '/otp';
  
  // For auth pages, we don't need the dashboard layout
  if (isAuthPage) {
    return (
      <html lang="en">
        <body className={`${poppins.variable} antialiased min-h-screen bg-gray-50`}>
          {children}
        </body>
      </html>
    );
  }

  // For all other pages, use the dashboard layout with auth protection
  return (
    <html lang="en">
      <body className={`${poppins.variable} antialiased`}>
        <AuthProvider>
          <DashboardLayout>
            {children}
          </DashboardLayout>
        </AuthProvider>
      </body>
    </html>
  );
}