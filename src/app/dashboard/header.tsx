"use client";
import React from 'react';
import type { User } from '@/lib/types';
import { cn } from '@/lib/utils';

interface HeaderProps {
  users: User[];
  currentUser: User;
  onUserChange: (user: User) => void;
  pathname: string;
}

const getTitle = (pathname: string, role: string) => {
    if (pathname.endsWith('/inventory')) return 'Inventory';
    if (pathname.endsWith('/sales')) return 'Sales';
    if (pathname.endsWith('/audit-logs')) return 'Audit Logs';
    if (pathname.endsWith('/users')) return 'User Management';
    return role === 'superadmin' ? "Superadmin Dashboard" : "Admin Dashboard";
}

export default function Header({ users, currentUser, onUserChange, pathname }: HeaderProps) {
  return (
    <header className={cn(
        "sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-gradient-to-r from-orange-500 to-orange-600 px-4 md:px-6"
    )}>
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold text-white">
          {getTitle(pathname, currentUser.role)}
        </h1>
      </div>
    </header>
  );
}
