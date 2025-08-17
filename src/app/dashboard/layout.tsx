'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
        <Sidebar>
            <SidebarHeader>
                <div className="flex items-center gap-2">
                    <Logo className="h-8 w-8 text-sidebar-primary" />
                    <span className="text-lg font-semibold">Govinda Mart</span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <Link href="/dashboard">
                                <LayoutDashboard />
                                Dashboard
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                         <SidebarMenuButton asChild>
                            <Link href="/dashboard/inventory">
                                <Package />
                                Inventory
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    {user && user.role === 'superadmin' && (
                      <>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <Link href="/dashboard/inventory/categories">
                                    <FolderOpen />
                                    Categories
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <Link href="/dashboard/inventory/items">
                                    <Tag />
                                    Items
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                      </>
                    )}
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <Link href="/dashboard/sales">
                                <BarChart />
                                Sales
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    {user && user.role === 'superadmin' && (
                      <>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <Link href="/dashboard/users">
                                    <Users />
                                    Users
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                      </>
                    )}
                </SidebarMenu>
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
