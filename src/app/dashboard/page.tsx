"use client";
import React, { useState, useEffect } from 'react';
import Header from '@/components/dashboard/header';
import SuperadminDashboard from '@/components/dashboard/superadmin/superadmin-dashboard';
import AdminDashboard from '@/components/dashboard/admin/admin-dashboard';
import type { User } from '@/lib/types';
import { usePathname } from 'next/navigation';
import { getDashboardPageData, getUserById } from '@/lib/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  const { setOpen } = useSidebar();

  useEffect(() => {
    setIsClient(true);
    const initializeApp = async () => {
      try {
        const result = await getDashboardPageData();
        if (result.error) {
          setError(result.error);
        } else if (result.data) {
          setData(result.data);
          const currentUserId = localStorage.getItem('currentUser');
          if (currentUserId) {
            const user = result.data.users.find(u => u.id.toString() === currentUserId);
            setCurrentUser(user || (result.data.users.length > 0 ? result.data.users[0] : null));
          } else if (result.data.users.length > 0) {
            setCurrentUser(result.data.users[0]);
            localStorage.setItem('currentUser', result.data.users[0].id.toString());
          }
        }
      } catch (e: any) {
        setError(e.message);
      }
      setIsLoading(false);
    };

    initializeApp();
  }, []);

  useEffect(() => {
      if (data?.users?.length > 0) {
        const timer = setTimeout(() => setOpen(true), 500);
        return () => clearTimeout(timer);
      }
  }, [setOpen, data?.users]);

  if (!isClient || isLoading) {
    return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    );
  }

  if (error) {
    return (
        <div className="flex items-center justify-center h-screen">
            <Card className="w-full max-w-lg mx-4 bg-destructive text-destructive-foreground">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle /> Application Error
                    </CardTitle>
                    <CardDescription className="text-destructive-foreground/80">There was a problem loading the dashboard.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>The following error was encountered:</p>
                    <div className="bg-background/20 p-4 rounded-md font-mono text-sm overflow-x-auto mt-2">
                        <code>{error}</code>
                    </div>
                     <p className="mt-4">Please check the server logs for more details and ensure the database is running and accessible.</p>
                </CardContent>
            </Card>
        </div>
    )
  }

  if (!data || data.users.length === 0) {
    return (
        <div className="flex items-center justify-center h-screen">
            <Card className="w-full max-w-lg mx-4">
                <CardHeader>
                    <CardTitle>Welcome to RoleStock!</CardTitle>
                    <CardDescription>Your database is set up, but there are no users yet.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p>To get started, you need to add a superadmin user to your database. Run the following SQL command in your database management tool (like phpMyAdmin):</p>
                    <div className="bg-muted p-4 rounded-md font-mono text-sm overflow-x-auto">
                        <code className="text-muted-foreground">
                        INSERT INTO users (name, email, role, is_active) VALUES ('Super Admin', 'superadmin@example.com', 'superadmin', 1);
                        </code>
                    </div>
                    <p>After running the command, please refresh this page.</p>
                </CardContent>
            </Card>
        </div>
    )
  }

  if (!currentUser) {
    // This state should ideally not be reached if there are users, but as a fallback:
     return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-2">Selecting user...</p>
        </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
        <Header currentUser={currentUser} pathname={pathname}/>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">

            {currentUser.role === 'superadmin' ? (
                <SuperadminDashboard
                    users={data.users}
                    categories={data.categories}
                    items={data.items}
                    inventoryLots={data.inventoryLots}
                    assignments={data.assignments}
                    sales={data.sales}
                />
            ) : (
                <AdminDashboard
                    user={currentUser}
                    categories={data.categories}
                    items={data.items}
                    assignments={data.assignments}
                    sales={data.sales}
                />
            )}
        </main>
    </div>
  );
}
