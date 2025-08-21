"use client";
import React from 'react';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import CurrentUser from './current-user';
import type { User } from '@/lib/types';
import { cn } from '@/lib/utils';

interface HeaderProps {
  currentUser: User;
  pathname: string;
}

const getTitle = (pathname: string, role: string) => {
    if (pathname.endsWith('/inventory')) return 'Inventory';
    if (pathname.endsWith('/categories')) return 'Category Management';
    if (pathname.endsWith('/items')) return 'Item Management';
    if (pathname.endsWith('/sales')) return 'Sales';
    if (pathname.endsWith('/audit-logs')) return 'Audit Logs';
    if (pathname.endsWith('/credit')) return 'Credit Sales Management';
    if (pathname.endsWith('/users')) return 'User Management';
    if (pathname.endsWith('/leads')) return 'Leads Management';
    return role === 'superadmin' ? "Superadmin Dashboard" : "Admin Dashboard";
}

export default function Header({ currentUser, pathname }: HeaderProps) {
  const { isMobile } = useSidebar();
  return (
    <header className={cn(
        "sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-gradient-to-r from-orange-500 to-orange-600 px-4 md:px-6"
    )}>
      <div className="flex items-center gap-2">
        {isMobile && <SidebarTrigger className="text-white hover:bg-white/20" />}
        <h1 className="text-xl font-semibold text-white">
          {getTitle(pathname, currentUser.role)}
        </h1>
      </div>
    </header>
  );
}
