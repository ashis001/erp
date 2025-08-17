
import React from 'react';
import type { User, Item, Assignment, Sale, Category } from '@/lib/types';
import StatCard from '../stat-card';
import { Package, CheckCircle, TrendingUp } from 'lucide-react';
import MyStockTable from './my-stock-table';

interface AdminDashboardProps {
  user: User;
  items: Item[];
  assignments: Assignment[];
  sales: Sale[];
  categories: Category[];
}

const getCategoryForRole = (role: User['role']): string | null => {
    if (role === 'book_admin') return 'Books';
    if (role === 'japa_admin') return 'Japa Mala';
    if (role === 'counter_admin') return 'Counter';
    return null;
}

export default function AdminDashboard({ user, items, assignments, sales, categories }: AdminDashboardProps) {
  const userCategoryName = getCategoryForRole(user.role);
  const userCategory = categories.find(c => c.name === userCategoryName);

  const adminAssignments = assignments.filter(a => {
    if (a.admin_user_id !== user.id) return false;
    const item = items.find(i => i.id === a.item_id);
    return item?.category_id === userCategory?.id;
  });

  const adminSales = sales.filter(s => {
    if (s.admin_user_id !== user.id) return false;
    const item = items.find(i => i.id === s.item_id);
    return item?.category_id === userCategory?.id;
  });

  const totalAssigned = adminAssignments.reduce((acc, a) => acc + a.qty_assigned, 0);
  const totalSold = adminSales.reduce((acc, s) => acc + s.qty_sold, 0);
  const availableStock = totalAssigned - totalSold;

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
    const item = items.find(i => i.id === itemId);
    const totalAssigned = (assignments as Assignment[]).reduce((sum: number, a: Assignment) => sum + a.qty_assigned, 0);
    const itemSales = adminSales
      .filter(s => s.item_id === itemId)
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
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="My Assigned Stock" value={totalAssigned} icon={<Package />} description={`Total ${userCategoryName} items assigned`} />
        <StatCard title="My Available Stock" value={availableStock} icon={<CheckCircle />} description="Items available to be sold" />
        <StatCard title="My Total Sold" value={totalSold} icon={<TrendingUp />} description={`Total ${userCategoryName} items you have sold`} />
      </div>
      <div>
        <MyStockTable stockData={stockData} adminId={user.id} />
      </div>
    </div>
  );
}
