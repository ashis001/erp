"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/dashboard/header';
import CategoryManagement from '@/components/dashboard/superadmin/category-management';
import type { User } from '@/lib/types';
import { usePathname } from 'next/navigation';
import { getDashboardPageData } from '@/lib/actions';
import { Loader2 } from 'lucide-react';

export default function CategoriesPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [data, setData] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  const fetchData = async () => {
    setIsLoading(true);
    const result = await getDashboardPageData();
    if (result.data) {
        setData(result.data);
        if (result.data.users.length === 0) return;
        const savedUserId = localStorage.getItem('currentUser');
        if (savedUserId) {
            const user = result.data.users.find((u: User) => u.id === parseInt(savedUserId));
            if (user) {
                setCurrentUser(user);
            } else if (result.data.users.length > 0) {
                setCurrentUser(result.data.users[0]);
            }
        } else if (result.data.users.length > 0) {
            setCurrentUser(result.data.users[0]);
        }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    setIsClient(true);
    fetchData();
  }, []);

  const handleUserChange = (user: User) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem('currentUser', user.id.toString());
    } else {
      localStorage.removeItem('currentUser');
    }
  };

  if (!isClient || isLoading || !data || data.users.length === 0 || !currentUser) {
    return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    );
  }

  // Only allow superadmin to access this page
  if (currentUser.role !== 'superadmin') {
    return (
      <div className="flex h-full flex-col">
        <Header currentUser={currentUser} pathname={pathname} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Access denied. Only superadmins can manage categories.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <Header currentUser={currentUser} pathname={pathname} />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Category Management</h1>
            <p className="text-muted-foreground">
              Manage product categories for your inventory system
            </p>
          </div>
          <CategoryManagement categories={data.categories} items={data.items} />
        </div>
      </main>
    </div>
  );
}
