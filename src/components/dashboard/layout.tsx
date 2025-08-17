'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Logo } from '@/components/icons';
import { LayoutDashboard, Package, BarChart, History, Users } from 'lucide-react';
import { getUserById } from '@/lib/actions';
import { User } from '@/lib/types';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const userId = localStorage.getItem('currentUser');
      if (userId) {
        const userData = await getUserById(parseInt(userId, 10));
        setUser(userData);
      }
    };

    fetchUser();
  }, []);
  return (
    <SidebarProvider>
      <div className="relative min-h-svh">
        <Sidebar>
            <SidebarHeader>
                <div className="flex items-center gap-2">
                    <Logo className="h-8 w-8 text-sidebar-primary" />
                    <span className="text-lg font-semibold">RoleStock</span>
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
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <Link href="/dashboard/audit-logs">
                                    <History />
                                    Audit Logs
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                      </>
                    )}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                {/* UserSwitcher will be placed in the header, so this is empty or for other items */}
            </SidebarFooter>
        </Sidebar>
        <SidebarInset>
            {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
