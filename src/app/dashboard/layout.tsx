'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons';
import { LayoutDashboard, Package, BarChart, History, Users, LogOut, FolderOpen, Tag } from 'lucide-react';
import { getUserById } from '@/lib/actions';
import { User } from '@/lib/types';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fetchUser = async () => {
      const userId = localStorage.getItem('currentUser');
      if (userId) {
        const userData = await getUserById(parseInt(userId, 10));
        setUser(userData);
      } else {
        // No user ID in localStorage, redirect to login
        router.push('/login');
      }
    };

    fetchUser();
  }, [router]);

  // Add authentication check on component mount and when returning from other pages
  useEffect(() => {
    const checkAuth = () => {
      const userId = localStorage.getItem('currentUser');
      if (!userId) {
        // Force redirect with history replacement
        window.history.replaceState(null, '', '/login');
        window.location.href = '/login';
      }
    };

    // Check auth when component mounts
    checkAuth();

    // Check auth when user navigates back to this page
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAuth();
      }
    };

    // Check auth when window gains focus (back button, tab switch)
    const handleFocus = () => {
      checkAuth();
    };

    // Check auth on popstate (back/forward button)
    const handlePopState = () => {
      checkAuth();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    // Clear browser history and redirect
    window.history.replaceState(null, '', '/login');
    window.location.href = '/login';
  };

  return (
    <SidebarProvider>
      <div className="relative min-h-svh">
        <Sidebar className="bg-slate-800 border-none">
            <SidebarHeader className="p-4 border-b border-slate-700">
                {user && (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                                {user.name?.charAt(0).toUpperCase() || 'A'}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-white font-medium">{user.name || 'Admin'}</span>
                            <span className="text-green-400 text-xs">● Online</span>
                        </div>
                    </div>
                )}
            </SidebarHeader>
            <SidebarContent className="p-4">
                <div className="mb-4">
                    <h3 className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">GENERAL</h3>
                    <SidebarMenu className="space-y-1">
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild className={`text-white hover:bg-slate-700 rounded-lg ${pathname === '/dashboard' ? 'bg-slate-700' : ''}`}>
                                <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                    Dashboard
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild className={`text-white hover:bg-slate-700 rounded-lg ${pathname === '/dashboard/inventory' ? 'bg-slate-700' : ''}`}>
                                <Link href="/dashboard/inventory" className="flex items-center gap-3 px-3 py-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    Inventory
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild className={`text-white hover:bg-slate-700 rounded-lg ${pathname === '/dashboard/sales' ? 'bg-slate-700' : ''}`}>
                                <Link href="/dashboard/sales" className="flex items-center gap-3 px-3 py-2">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                    Sales
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        {user && user.role === 'superadmin' && (
                            <>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild className={`text-white hover:bg-slate-700 rounded-lg ${pathname === '/dashboard/inventory/categories' ? 'bg-slate-700' : ''}`}>
                                        <Link href="/dashboard/inventory/categories" className="flex items-center gap-3 px-3 py-2">
                                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                            Categories
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild className={`text-white hover:bg-slate-700 rounded-lg ${pathname === '/dashboard/inventory/items' ? 'bg-slate-700' : ''}`}>
                                        <Link href="/dashboard/inventory/items" className="flex items-center gap-3 px-3 py-2">
                                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                            Items
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild className={`text-white hover:bg-slate-700 rounded-lg ${pathname === '/dashboard/users' ? 'bg-slate-700' : ''}`}>
                                        <Link href="/dashboard/users" className="flex items-center gap-3 px-3 py-2">
                                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                            Users
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </>
                        )}
                    </SidebarMenu>
                </div>
            </SidebarContent>
            <SidebarFooter>
                <div className="p-2">
                    <Button 
                        onClick={handleLogout}
                        variant="ghost" 
                        className="w-full justify-start text-white hover:bg-white/10"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </SidebarFooter>
        </Sidebar>
        <SidebarInset>
            {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
