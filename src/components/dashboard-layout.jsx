'use client';

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Bell, ChevronDown, CircleUserRound } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  // Check if current route is login or signup
  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/otp';

  return (
    <SidebarProvider defaultOpen={true}>
      {!isAuthPage && <AppSidebar />}
      <main className="w-full">
        {!isAuthPage && (
          <div className="flex items-center justify-between p-4 w-full border-b border-slate-200">
            <SidebarTrigger />
            <div className="flex gap-3 items-center mr-[10px] cursor-pointer">
              <Bell size={20} color="#1A1D1F" />
             
            </div>
          </div>
        )}
        <div className="p-[24px]">{children}</div>
      </main>
    </SidebarProvider>
  );
}
