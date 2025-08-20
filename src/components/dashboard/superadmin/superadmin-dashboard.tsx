import React from 'react';
import StatCard from '../stat-card';
import { Package, Send, Wallet, Users, TrendingUp, ShoppingCart } from 'lucide-react';
import type { User, Category, Item, InventoryLot, Assignment, Sale, CreditSale } from '@/lib/types';
import SalesCharts from '../sales/sales-charts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Pie, PieChart, Cell, Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts";

const CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

interface SuperadminDashboardProps {
  users: User[];
  categories: Category[];
  items: Item[];
  inventoryLots: InventoryLot[];
  assignments: Assignment[];
  sales: Sale[];
  creditSales: CreditSale[];
}

export default function SuperadminDashboard({ users, categories, items, inventoryLots, assignments, sales, creditSales }: SuperadminDashboardProps) {
  // Calculate totals consistently
  const totalStock = inventoryLots.reduce((sum, lot) => sum + lot.qty_purchased, 0);
  const totalAssigned = assignments.reduce((sum, assignment) => sum + assignment.qty_assigned, 0);
  const totalSold = sales.reduce((sum, sale) => sum + sale.qty_sold, 0);
  const totalSalesValue = sales.reduce((sum, sale) => sum + parseFloat(sale.total_price as any), 0);

  // Revenue breakdown
  const pendingCredit = creditSales
    .filter(cs => cs.status === 'active')
    .reduce((sum, cs) => sum + Number(cs.pending_balance || 0), 0);
  // Cash = total sales value minus active pending balances
  const cashRevenue = totalSalesValue - pendingCredit;

  // Calculate available stock (ensure it's not negative)
  const globalAvailable = Math.max(0, totalAssigned - totalSold);
  const unassignedStock = Math.max(0, totalStock - totalAssigned);
  
  // Calculate oversold items (if sales exceed assignments)
  const oversoldItems = totalSold > totalAssigned ? totalSold - totalAssigned : 0;

  // Prepare analytics data
  const categoryData = categories.map(category => {
    const categoryItems = items.filter(item => item.category_id === category.id);
    const categorySales = sales.filter(sale => {
      const item = items.find(i => i.id === sale.item_id);
      return item?.category_id === category.id;
    });
    const categoryRevenue = categorySales.reduce((sum, sale) => sum + parseFloat(sale.total_price as any), 0);
    
    return {
      name: category.name,
      sales: categoryRevenue
    };
  }).filter(cat => cat.sales > 0);

  // Daily sales data (last 7 days)
  const dailyData = React.useMemo(() => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayRevenue = sales
        .filter(sale => {
          if (!sale.created_at) return false;
          const saleDate = new Date(sale.created_at).toISOString().split('T')[0];
          return saleDate === dateStr;
        })
        .reduce((sum, sale) => sum + parseFloat(sale.total_price as any), 0);
      
      last7Days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: dayRevenue
      });
    }
    return last7Days;
  }, [sales]);

  // Monthly data (last 6 months)
  const monthlyData = React.useMemo(() => {
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toISOString().substring(0, 7);
      
      const monthRevenue = sales
        .filter(sale => {
          if (!sale.created_at) return false;
          const saleMonth = new Date(sale.created_at).toISOString().substring(0, 7);
          return saleMonth === monthStr;
        })
        .reduce((sum, sale) => sum + parseFloat(sale.total_price as any), 0);
      
      last6Months.push({
        month: date.toLocaleDateString('en-US', { month: 'long' }),
        revenue: monthRevenue
      });
    }
    return last6Months;
  }, [sales]);

  const inventoryData = items.map(item => {
    const category = categories.find(c => c.id === item.category_id);
    const lots = inventoryLots.filter(lot => lot.item_id === item.id);
    const itemAssignments = assignments.filter(a => a.item_id === item.id);
    
    const totalPurchased = lots.reduce((sum, lot) => sum + lot.qty_purchased, 0);
    const totalAssignedForItem = itemAssignments.reduce((sum, a) => sum + a.qty_assigned, 0);
    
    return {
      itemId: item.id,
      itemName: item.name,
      categoryName: category?.name || 'Uncategorized',
      sku: item.sku,
      totalPurchased: totalPurchased,
      totalAssigned: totalAssignedForItem,
      globalAvailable: totalPurchased - totalAssignedForItem,
      costPrice: parseFloat(lots[0]?.cost_price as any) || 0,
      sellingPrice: parseFloat(item.default_selling_price as any),
    };
  });
  
  const admins = users.filter(u => u.role !== 'superadmin');

  // User role distribution data
  const userRoleData = React.useMemo(() => {
    const roleCounts = admins.reduce((acc: { [key: string]: number }, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(roleCounts).map(([role, count]) => ({
      role: role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count
    }));
  }, [admins]);

  // Category stock distribution data
  const categoryStockData = React.useMemo(() => {
    return categories.map(category => {
      const categoryItems = items.filter(item => item.category_id === category.id);
      const categoryLots = inventoryLots.filter(lot => 
        categoryItems.some(item => item.id === lot.item_id)
      );
      const categoryAssignments = assignments.filter(assignment => 
        categoryItems.some(item => item.id === assignment.item_id)
      );
      
      const totalPurchased = categoryLots.reduce((sum, lot) => sum + lot.qty_purchased, 0);
      const totalAssigned = categoryAssignments.reduce((sum, assignment) => sum + assignment.qty_assigned, 0);
      
      return {
        category: category.name,
        available: totalPurchased - totalAssigned
      };
    });
  }, [categories, items, inventoryLots, assignments]);

  // Assignment vs Sales comparison data
  const assignmentSalesData = React.useMemo(() => {
    return categories.map(category => {
      const categoryItems = items.filter(item => item.category_id === category.id);
      const categoryAssignments = assignments.filter(assignment => 
        categoryItems.some(item => item.id === assignment.item_id)
      );
      const categorySales = sales.filter(sale => 
        categoryItems.some(item => item.id === sale.item_id)
      );
      
      const totalAssigned = categoryAssignments.reduce((sum, assignment) => sum + assignment.qty_assigned, 0);
      const totalSold = categorySales.reduce((sum, sale) => sum + sale.qty_sold, 0);
      
      return {
        category: category.name,
        assigned: totalAssigned,
        sold: totalSold
      };
    });
  }, [categories, items, assignments, sales]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      {/* Enhanced Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Stock Purchased" value={totalStock} icon={<Package />} description="Total inventory purchased" />
        <StatCard title="Stock Assigned to Admins" value={totalAssigned} icon={<Send />} description="Stock distributed to admins" />
        <StatCard title="Available with Admins" value={globalAvailable} icon={<Package />} description={oversoldItems > 0 ? `${oversoldItems} oversold items detected` : "Assigned but not yet sold"} />
        <StatCard title="Items Sold" value={totalSold} icon={<ShoppingCart />} description="Total units sold" />
        <StatCard title="Cash Revenue" value={`₹${cashRevenue.toFixed(2)}`} icon={<Wallet />} description="Cash received (cash sales - active pending credits)" />
        <StatCard title="Pending Credit" value={`₹${pendingCredit.toFixed(2)}`} icon={<TrendingUp />} description="Outstanding balances on active credits" />
        <StatCard title="Unassigned Stock" value={unassignedStock} icon={<TrendingUp />} description="Stock in global inventory" />
      </div>

      {/* Sales Analytics Charts */}
      {categoryData.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Sales Analytics</h2>
            <p className="text-muted-foreground">Real-time business insights</p>
          </div>
          <SalesCharts 
            categoryData={categoryData}
            dailyData={dailyData}
            monthlyData={monthlyData}
          />
        </div>
      )}


      {/* User Analytics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">User & Inventory Analytics</h2>
          <p className="text-muted-foreground">Insights into users and inventory distribution</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {/* Category Stock Distribution */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Stock by Category</CardTitle>
              <CardDescription>Available stock across categories</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
              <ChartContainer
                config={{
                  stock: { label: "Stock", color: "hsl(var(--chart-1))" },
                }}
                className="h-full w-full"
              >
                <BarChart accessibilityLayer data={categoryStockData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="category" tickLine={false} tickMargin={10} axisLine={false} />
                  <YAxis tickFormatter={(value) => `${value}`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="available" fill="var(--color-stock)" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Assignment vs Sales Comparison */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Assignment vs Sales</CardTitle>
              <CardDescription>Assigned stock vs actual sales</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
              <ChartContainer
                config={{
                  assigned: { label: "Assigned", color: "hsl(var(--chart-1))" },
                  sold: { label: "Sold", color: "hsl(var(--chart-2))" },
                }}
                className="h-full w-full"
              >
                <BarChart accessibilityLayer data={assignmentSalesData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="category" tickLine={false} tickMargin={10} axisLine={false} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="assigned" fill="var(--color-assigned)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="sold" fill="var(--color-sold)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
