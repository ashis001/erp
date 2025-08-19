"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Home, Package, TrendingUp, LogOut, Users, FileText } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@/lib/types';

interface MobileMenuProps {
  currentUser: User;
}

export default function MobileMenu({ currentUser }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = (path: string) => {
    router.push(path);
    setOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    router.push('/login');
  };

  const menuItems = [
    {
      icon: Home,
      label: 'Dashboard',
      path: '/dashboard',
      show: currentUser.role === 'superadmin'
    },
    {
      icon: Package,
      label: 'Inventory',
      path: '/dashboard/inventory',
      show: true
    },
    {
      icon: TrendingUp,
      label: 'Sales',
      path: '/dashboard/sales',
      show: true
    },
    {
      icon: Users,
      label: 'Users',
      path: '/dashboard/users',
      show: currentUser.role === 'superadmin'
    },
    {
      icon: FileText,
      label: 'Audit Logs',
      path: '/dashboard/audit-logs',
      show: currentUser.role === 'superadmin'
    }
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 bg-slate-800 text-white p-0">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">GM</span>
              </div>
              <div>
                <h2 className="font-semibold text-white">Govinda Mart</h2>
                <p className="text-xs text-slate-300">{currentUser.name}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="flex-1 py-4">
            <nav className="space-y-1 px-3">
              {menuItems.filter(item => item.show).map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                      isActive 
                        ? 'bg-orange-500 text-white' 
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Logout */}
          <div className="p-4 border-t border-slate-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-slate-300 hover:bg-red-600 hover:text-white transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
