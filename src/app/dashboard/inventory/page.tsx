
"use client";
import React, { useState, useEffect } from 'react';
import Header from '@/components/dashboard/header';
import InventoryTable from '@/components/dashboard/superadmin/inventory-table';
import MyStockTable from '@/components/dashboard/admin/my-stock-table';
import type { User, Category, Item, Assignment, Sale } from '@/lib/types';
import { usePathname } from 'next/navigation';
import { getInventoryPageData } from '@/lib/actions';
import { Loader2 } from 'lucide-react';

export default function InventoryPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [data, setData] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  const fetchData = async () => {
    setIsLoading(true);
    const result = await getInventoryPageData();
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

  // Remove auto-refresh loop - will refresh only when operations complete

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
  
  const admins = data.users.filter((u: User) => u.role !== 'superadmin');

  const adminAssignments = data.assignments.filter((a: Assignment) => a.admin_user_id === currentUser.id);
  const adminSales = data.sales.filter((s: Sale) => s.admin_user_id === currentUser.id);

  // Group assignments by item_id to avoid duplicate keys
  const groupedAssignments = adminAssignments.reduce((acc: { [key: number]: Assignment[] }, assignment: Assignment) => {
    if (!acc[assignment.item_id]) {
      acc[assignment.item_id] = [];
    }
    acc[assignment.item_id].push(assignment);
    return acc;
  }, {});

  const stockData = Object.entries(groupedAssignments).map(([itemIdStr, assignments]) => {
    const itemId = parseInt(itemIdStr);
    const item = data.items.find((i: Item) => i.id === itemId);
    const totalAssigned = (assignments as Assignment[]).reduce((sum: number, a: Assignment) => sum + a.qty_assigned, 0);
    const itemSales = adminSales
      .filter((s: Sale) => s.item_id === itemId)
      .reduce((acc: number, s: Sale) => acc + s.qty_sold, 0);
    
    return {
      itemId: itemId,
      itemName: item?.name || 'Unknown Item',
      sku: item?.sku || 'N/A',
      assigned: totalAssigned,
      sold: itemSales,
      available: totalAssigned - itemSales,
      sellingPrice: parseFloat(item?.default_selling_price as any) || 0,
    };
  });

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      <Header currentUser={currentUser} pathname={pathname} />
      <div className="flex-1 p-4 md:p-6 overflow-hidden relative z-10">
        {currentUser.role === 'superadmin' ? (
          <InventoryTable 
            data={data.inventoryData} 
            categories={data.categories}
            items={data.items}
            admins={admins}
          />
        ) : (
          <MyStockTable stockData={stockData} adminId={currentUser.id} />
        )}
      </div>
    </div>
  );
}