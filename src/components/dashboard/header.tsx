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
    return role === 'superadmin' ? "Superadmin Dashboard" : "Admin Dashboard";
}

export default function Header({ currentUser, pathname }: HeaderProps) {
  const { isMobile } = useSidebar();
  return (
    <header className={cn(
        "sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6"
    )}>
      <div className="flex items-center gap-2">
        {isMobile && <SidebarTrigger />}
        <h1 className="text-xl font-semibold text-foreground">
          {getTitle(pathname, currentUser.role)}
        </h1>
      </div>
      <div className="ml-auto">
        <CurrentUser currentUser={currentUser} />
      </div>
    </header>
  );
}
