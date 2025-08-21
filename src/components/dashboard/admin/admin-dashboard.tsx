import React, { useState, useMemo } from 'react';
import type { User, Item, Assignment, Sale, Category, CreditSale } from '@/lib/types';
import StatCard from '../stat-card';
import { Package, CheckCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';

interface AdminDashboardProps {
  user: User;
  items: Item[];
  assignments: Assignment[];
  sales: Sale[];
  categories: Category[];
  creditSales: CreditSale[];
}

const getCategoryForRole = (role: User['role']): string | null => {
    if (role === 'book_admin') return 'Books';
    if (role === 'japa_admin') return 'Japa Mala';
    if (role === 'counter_admin') return 'Counter';
    return null;
}

export default function AdminDashboard({ user, items, assignments, sales, categories, creditSales }: AdminDashboardProps) {
  const [salesPeriod, setSalesPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const userCategoryName = getCategoryForRole(user.role);
  const userCategory = categories.find(c => c.name === userCategoryName);

  const adminAssignments = assignments.filter(a => a.admin_user_id === user.id);
  const adminSales = sales.filter(s => s.admin_user_id === user.id);
  const adminCreditSales = creditSales.filter(cs => cs.admin_id === user.id);

  const totalAssigned = adminAssignments.reduce((acc, a) => acc + a.qty_assigned, 0);
  const totalSold = adminSales.reduce((acc, s) => acc + s.qty_sold, 0);
  const availableStock = totalAssigned - totalSold;

  // Revenue breakdown for this admin
  const totalSalesValue = adminSales.reduce((sum, sale) => sum + parseFloat(sale.total_price as any), 0);
  const pendingCredit = adminCreditSales
    .filter(cs => cs.status === 'active')
    .reduce((sum, cs) => sum + Number(cs.pending_balance || 0), 0);
  // Cash = total sales value minus active pending balances
  const cashRevenue = totalSalesValue - pendingCredit;

  // Sales data aggregation by time periods
  const salesAnalytics = useMemo(() => {
    const now = new Date();
    const salesData = adminSales.map(sale => ({
      ...sale,
      date: new Date(sale.created_at)
    }));

    // Weekly data (last 12 weeks)
    const weeklyData = [];
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const weekSales = salesData.filter(sale => 
        sale.date >= weekStart && sale.date <= weekEnd
      );

      const totalQuantity = weekSales.reduce((sum, sale) => sum + sale.qty_sold, 0);
      const totalRevenue = weekSales.reduce((sum, sale) => sum + sale.total_price, 0);

      weeklyData.push({
        period: `Week ${i === 0 ? 'Current' : i + 1}`,
        quantity: totalQuantity,
        revenue: totalRevenue,
        date: weekStart.toISOString().split('T')[0]
      });
    }

    // Monthly data (last 12 months)
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);

      const monthSales = salesData.filter(sale => 
        sale.date >= monthStart && sale.date <= monthEnd
      );

      const totalQuantity = monthSales.reduce((sum, sale) => sum + sale.qty_sold, 0);
      const totalRevenue = monthSales.reduce((sum, sale) => sum + sale.total_price, 0);

      monthlyData.push({
        period: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        quantity: totalQuantity,
        revenue: totalRevenue,
        date: monthStart.toISOString().split('T')[0]
      });
    }

    // Yearly data (last 5 years)
    const yearlyData = [];
    for (let i = 4; i >= 0; i--) {
      const year = now.getFullYear() - i;
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

      const yearSales = salesData.filter(sale => 
        sale.date >= yearStart && sale.date <= yearEnd
      );

      const totalQuantity = yearSales.reduce((sum, sale) => sum + sale.qty_sold, 0);
      const totalRevenue = yearSales.reduce((sum, sale) => sum + sale.total_price, 0);

      yearlyData.push({
        period: year.toString(),
        quantity: totalQuantity,
        revenue: totalRevenue,
        date: yearStart.toISOString().split('T')[0]
      });
    }

    return { weeklyData, monthlyData, yearlyData };
  }, [adminSales]);

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

  // Prepare data for pie charts
  const stockStatusData = [
    { name: 'Available', value: availableStock, color: '#22c55e' },
    { name: 'Sold', value: totalSold, color: '#ef4444' }
  ];

  const itemDistributionData = stockData.map((item, index) => ({
    name: item.itemName,
    value: item.available,
    color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`
  })).filter(item => item.value > 0);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="My Assigned Stock" value={totalAssigned} icon={<Package />} description={`Total ${userCategoryName} items assigned`} />
        <StatCard title="My Available Stock" value={availableStock} icon={<CheckCircle />} description="Items available to be sold" />
        <StatCard title="My Total Sold" value={totalSold} icon={<TrendingUp />} description={`Total ${userCategoryName} items you have sold`} />
        <StatCard title="My Cash Revenue" value={`₹${cashRevenue.toFixed(2)}`} icon={<TrendingUp />} description="Cash received (cash sales - active pending credits)" />
        <StatCard title="My Pending Credit" value={`₹${pendingCredit.toFixed(2)}`} icon={<Package />} description="Outstanding balances on your credits" />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Stock Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Status Overview</CardTitle>
            <CardDescription>Distribution of available vs sold stock</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stockStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Item Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Available Items Distribution</CardTitle>
            <CardDescription>Breakdown of available stock by item</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {itemDistributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={itemDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {itemDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No available stock to display
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Analytics Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sales Analytics</CardTitle>
              <CardDescription>Track your sales performance over time</CardDescription>
            </div>
            <Select value={salesPeriod} onValueChange={(value: 'weekly' | 'monthly' | 'yearly') => setSalesPeriod(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="quantity" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="quantity">Quantity Sold</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
            </TabsList>
            
            <TabsContent value="quantity" className="space-y-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesAnalytics[`${salesPeriod}Data`]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} items`, 'Quantity Sold']} />
                    <Bar dataKey="quantity" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="revenue" className="space-y-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesAnalytics[`${salesPeriod}Data`]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₹${Number(value).toFixed(2)}`, 'Revenue']} />
                    <Line type="monotone" dataKey="revenue" stroke="#82ca9d" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
