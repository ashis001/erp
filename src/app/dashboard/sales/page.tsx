
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Header from '@/components/dashboard/header';
import SalesTable from '@/components/dashboard/sales/sales-table';
import type { User } from '@/lib/types';
import { usePathname } from 'next/navigation';
import StatCard from '@/components/dashboard/stat-card';
import { Wallet, Package, Loader2 } from 'lucide-react';
import SalesCharts from '@/components/dashboard/sales/sales-charts';
import { format, subMonths } from 'date-fns';
import { getSalesPageData, getUsers } from '@/lib/actions';

export default function SalesPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    setIsClient(true);
    getUsers().then(fetchedUsers => {
        if (fetchedUsers.length === 0) {
            setIsLoading(false);
            return;
        };
        setUsers(fetchedUsers);
        const savedUserId = localStorage.getItem('currentUser');
        let user = null;
        if (savedUserId) {
            user = fetchedUsers.find(u => u.id === parseInt(savedUserId)) || null;
        }
        if (!user && fetchedUsers.length > 0) {
            user = fetchedUsers[0];
        }
        setCurrentUser(user);
    });
  }, []);

  useEffect(() => {
    if (currentUser) {
      setIsLoading(true);
      getSalesPageData(currentUser.id).then(result => {
        if (result.data) {
            setSalesData(result.data.salesData);
            if(users.length === 0) setUsers(result.data.users);
        }
      }).finally(() => setIsLoading(false));
    }
  }, [currentUser, users.length]);

  const handleUserChange = (user: User) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem('currentUser', user.id.toString());
    } else {
      localStorage.removeItem('currentUser');
    }
  };
  
  const totalRevenue = useMemo(() => {
    return salesData.reduce((acc, sale) => acc + parseFloat(sale.total_price), 0);
  }, [salesData]);

  const totalItemsSold = useMemo(() => {
      return salesData.reduce((acc, sale) => acc + sale.qty_sold, 0);
  }, [salesData]);

  const salesByCategory = useMemo(() => {
    const categorySales: { [key: string]: { name: string; sales: number } } = {};
    salesData.forEach(sale => {
        if (!categorySales[sale.categoryName]) {
            categorySales[sale.categoryName] = { name: sale.categoryName, sales: 0 };
        }
        categorySales[sale.categoryName].sales += parseFloat(sale.total_price);
    });
    return Object.values(categorySales);
  }, [salesData]);

  const salesByDay = useMemo(() => {
    const daily: { [key: string]: { date: string, revenue: number } } = {};
    salesData.forEach(sale => {
      const day = format(new Date(sale.created_at), 'MMM d');
      if (!daily[day]) {
        daily[day] = { date: day, revenue: 0 };
      }
      daily[day].revenue += parseFloat(sale.total_price);
    });
    return Object.values(daily).slice(-7);
  }, [salesData]);
  
  const salesByMonth = useMemo(() => {
    const monthly: { [key: string]: { month: string, revenue: number } } = {};
    const sixMonthsAgo = subMonths(new Date(), 5);
    
    salesData
        .filter(sale => new Date(sale.created_at) >= sixMonthsAgo)
        .forEach(sale => {
            const month = format(new Date(sale.created_at), 'MMM yyyy');
            if(!monthly[month]) {
                monthly[month] = { month, revenue: 0 };
            }
            monthly[month].revenue += parseFloat(sale.total_price);
    });

    for (let i = 0; i < 6; i++) {
        const monthKey = format(subMonths(new Date(), i), 'MMM yyyy');
        if (!monthly[monthKey]) {
            monthly[monthKey] = { month: monthKey, revenue: 0};
        }
    }
    
    return Object.values(monthly).sort((a,b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }, [salesData]);


  if (!isClient || isLoading || !currentUser || users.length === 0) {
    return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <Header users={users} currentUser={currentUser} onUserChange={handleUserChange} pathname={pathname} />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
            <StatCard 
                title="Total Revenue"
                value={`₹${totalRevenue.toFixed(2)}`}
                icon={<Wallet />}
                description="Total revenue from all sales."
            />
            <StatCard 
                title="Total Items Sold"
                value={totalItemsSold}
                icon={<Package />}
                description="Total number of individual items sold."
            />
        </div>
        
        {currentUser.role === 'superadmin' && salesByCategory.length > 0 && (
            <SalesCharts 
                categoryData={salesByCategory}
                dailyData={salesByDay}
                monthlyData={salesByMonth}
            />
        )}
        
        <SalesTable salesData={salesData} />
      </main>
    </div>
  );
}

    