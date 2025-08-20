'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { getCreditSales, markCreditSaleCompleted, getUsers, getUserById } from '@/lib/actions';
import { Search, Calendar, IndianRupee, User, Phone, Mail, CheckCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { User as AppUser } from '@/lib/types';

interface CreditSale {
  id: number;
  item_name: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_price: number;
  down_payment: number;
  pending_balance: number;
  payment_type: 'emi' | 'pay_later';
  emi_periods: number;
  monthly_emi: number;
  pay_later_date: string | null;
  status: 'active' | 'completed' | 'defaulted';
  created_at: string;
  admin_name: string;
  admin_id: number;
}

export default function CreditPage() {
  const [creditSales, setCreditSales] = useState<CreditSale[]>([]);
  const [filteredSales, setFilteredSales] = useState<CreditSale[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<CreditSale | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  useEffect(() => {
    fetchCreditSales();
    // Fetch users for admin filter
    getUsers().then(setUsers).catch(console.error);
    // Fetch current user from localStorage
    const userId = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null;
    if (userId) {
      getUserById(parseInt(userId, 10))
        .then((u) => setCurrentUser(u))
        .finally(() => setIsUserLoading(false));
    } else {
      setIsUserLoading(false);
    }
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const isSuperadmin = currentUser?.role === 'superadmin';
    const filtered = creditSales.filter(sale => {
      const matchesSearch =
        sale.customer_name.toLowerCase().includes(term) ||
        sale.customer_email.toLowerCase().includes(term) ||
        sale.item_name.toLowerCase().includes(term) ||
        sale.admin_name.toLowerCase().includes(term);

      const adminUser = users.find(u => u.id === sale.admin_id);
      const matchesRole = isSuperadmin
        ? (selectedRole === 'all' || (adminUser && adminUser.role === selectedRole))
        : true;

      const matchesAdmin = isSuperadmin
        ? (selectedAdmin === 'all' || sale.admin_id === Number(selectedAdmin))
        : (currentUser ? sale.admin_id === currentUser.id : false);

      return matchesSearch && matchesRole && matchesAdmin;
    });
    setFilteredSales(filtered);
  }, [searchTerm, creditSales, selectedAdmin, selectedRole, users, currentUser]);

  const fetchCreditSales = async () => {
    try {
      setIsLoading(true);
      const sales = await getCreditSales();
      setCreditSales(sales);
      setFilteredSales(sales);
    } catch (error) {
      console.error('Error fetching credit sales:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkCompleted = async (saleId: number) => {
    try {
      await markCreditSaleCompleted(saleId);
      await fetchCreditSales(); // Refresh the list
      setSelectedSale(null);
    } catch (error) {
      console.error('Error marking sale as completed:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-blue-500">Active</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'defaulted':
        return <Badge variant="destructive">Defaulted</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentTypeBadge = (type: string) => {
    return type === 'emi' ? 
      <Badge variant="outline" className="text-purple-600">EMI</Badge> : 
      <Badge variant="outline" className="text-orange-600">Pay Later</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  // Calculate summary statistics (based on what is visible after filters)
  const activeSales = filteredSales.filter(sale => sale.status === 'active');
  const totalPendingAmount = activeSales.reduce((sum, sale) => sum + Number(sale.pending_balance ?? 0), 0);
  const totalDownPayments = filteredSales.reduce((sum, sale) => sum + Number(sale.down_payment ?? 0), 0);
  const completedSales = filteredSales.filter(sale => sale.status === 'completed');

  if (isLoading || isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading credit sales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Credit Sales Management</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Credits</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSales.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(totalPendingAmount)} pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Down Payments</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDownPayments)}</div>
            <p className="text-xs text-muted-foreground">
              Received so far
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedSales.length}</div>
            <p className="text-xs text-muted-foreground">
              Fully paid credits
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{creditSales.length}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Credit Sales</CardTitle>
          <CardDescription>
            Manage and track all credit sales and payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground hidden md:block" />
              <Input
                placeholder="Search by customer name, email, or item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:max-w-sm"
              />
            </div>
            <div className="md:ml-auto flex items-center gap-2 flex-wrap">
            </div>
            {/* Only superadmin can see Role/Admin filters */}
            {currentUser?.role === 'superadmin' && (
              <div className="md:ml-auto flex items-center gap-2 flex-wrap">
                <Label className="text-sm">Role</Label>
                <Select value={selectedRole} onValueChange={(val) => { setSelectedRole(val); setSelectedAdmin('all'); }}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    <SelectItem value="book_admin">Book Admin</SelectItem>
                    <SelectItem value="counter_admin">Counter Admin</SelectItem>
                    <SelectItem value="japa_admin">Japa Admin</SelectItem>
                  </SelectContent>
                </Select>

                <Label className="text-sm">Admin</Label>
                <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
                  <SelectTrigger className="w-full md:w-[220px]">
                    <SelectValue placeholder="All admins" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All admins</SelectItem>
                    {users
                      .filter(u => u.role !== 'superadmin')
                      .filter(u => selectedRole === 'all' || u.role === selectedRole)
                      .map(u => (
                        <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Mobile list view */}
          <div className="md:hidden space-y-3">
            {filteredSales.map((sale) => (
              <Card key={sale.id} className="border">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-medium">{sale.customer_name}</div>
                      <div className="text-sm text-muted-foreground">{sale.customer_email}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">{formatDate(sale.created_at)}</div>
                  </div>
                  <div className="text-sm">Item: <span className="font-medium">{sale.item_name}</span></div>
                  <div className="text-sm">Admin: <span className="font-medium">{sale.admin_name}</span></div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="text-muted-foreground">Total</div>
                      <div>{formatCurrency(sale.total_price)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Down</div>
                      <div>{formatCurrency(sale.down_payment)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Pending</div>
                      <div className="font-semibold text-orange-600">{formatCurrency(sale.pending_balance)}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getPaymentTypeBadge(sale.payment_type)}
                      {getStatusBadge(sale.status)}
                    </div>
                    <Dialog onOpenChange={(open) => {
                      if (open) setSelectedSale(sale); else setSelectedSale(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">View</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Credit Sale Details</DialogTitle>
                          <DialogDescription>Manage this credit sale</DialogDescription>
                        </DialogHeader>
                        {selectedSale && (
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium">Customer</Label>
                                <p className="text-sm">{selectedSale.customer_name}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Item</Label>
                                <p className="text-sm">{selectedSale.item_name}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium">Total Price</Label>
                                <p className="text-sm">{formatCurrency(selectedSale.total_price)}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Down Payment</Label>
                                <p className="text-sm">{formatCurrency(selectedSale.down_payment)}</p>
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Admin</Label>
                              <p className="text-sm">{selectedSale.admin_name}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium">Pending Balance</Label>
                                <p className="text-sm font-bold text-orange-600">
                                  {formatCurrency(selectedSale.pending_balance)}
                                </p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Status</Label>
                                <div className="mt-1">{getStatusBadge(selectedSale.status)}</div>
                              </div>
                            </div>
                            {selectedSale.payment_type === 'emi' && (
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">EMI Periods</Label>
                                  <p className="text-sm">{selectedSale.emi_periods} months</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Monthly EMI</Label>
                                  <p className="text-sm">{formatCurrency(selectedSale.monthly_emi)}</p>
                                </div>
                              </div>
                            )}
                            {selectedSale.payment_type === 'pay_later' && selectedSale.pay_later_date && (
                              <div>
                                <Label className="text-sm font-medium">Pay Later Date</Label>
                                <p className="text-sm">{formatDate(selectedSale.pay_later_date)}</p>
                              </div>
                            )}
                            <div>
                              <Label className="text-sm font-medium">Contact</Label>
                              <p className="text-sm">{selectedSale.customer_phone}</p>
                              <p className="text-sm text-muted-foreground">{selectedSale.customer_email}</p>
                            </div>
                          </div>
                        )}
                        <DialogFooter>
                          {selectedSale && selectedSale.status === 'active' && (
                            <Button onClick={() => handleMarkCompleted(selectedSale.id)} className="bg-green-600 hover:bg-green-700">Mark as Paid</Button>
                          )}
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop table view */}
          <div className="hidden md:block rounded-md border overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Total Price</TableHead>
                  <TableHead>Down Payment</TableHead>
                  <TableHead>Pending</TableHead>
                  <TableHead>Payment Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{sale.customer_name}</div>
                        <div className="text-sm text-muted-foreground">{sale.customer_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{sale.item_name}</TableCell>
                    <TableCell>{sale.admin_name}</TableCell>
                    <TableCell>{formatCurrency(sale.total_price)}</TableCell>
                    <TableCell>{formatCurrency(sale.down_payment)}</TableCell>
                    <TableCell className="font-medium text-orange-600">
                      {formatCurrency(sale.pending_balance)}
                    </TableCell>
                    <TableCell>{getPaymentTypeBadge(sale.payment_type)}</TableCell>
                    <TableCell>{getStatusBadge(sale.status)}</TableCell>
                    <TableCell>{formatDate(sale.created_at)}</TableCell>
                    <TableCell>
                      <Dialog onOpenChange={(open) => {
                        if (open) setSelectedSale(sale); else setSelectedSale(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                          >
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Credit Sale Details</DialogTitle>
                            <DialogDescription>
                              Manage this credit sale
                            </DialogDescription>
                          </DialogHeader>
                          {selectedSale && (
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">Customer</Label>
                                  <p className="text-sm">{selectedSale.customer_name}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Item</Label>
                                  <p className="text-sm">{selectedSale.item_name}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">Total Price</Label>
                                  <p className="text-sm">{formatCurrency(selectedSale.total_price)}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Down Payment</Label>
                                  <p className="text-sm">{formatCurrency(selectedSale.down_payment)}</p>
                                </div>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Admin</Label>
                                <p className="text-sm">{selectedSale.admin_name}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">Pending Balance</Label>
                                  <p className="text-sm font-bold text-orange-600">
                                    {formatCurrency(selectedSale.pending_balance)}
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Status</Label>
                                  <div className="mt-1">{getStatusBadge(selectedSale.status)}</div>
                                </div>
                              </div>
                              {selectedSale.payment_type === 'emi' && (
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium">EMI Periods</Label>
                                    <p className="text-sm">{selectedSale.emi_periods} months</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Monthly EMI</Label>
                                    <p className="text-sm">{formatCurrency(selectedSale.monthly_emi)}</p>
                                  </div>
                                </div>
                              )}
                              {selectedSale.payment_type === 'pay_later' && selectedSale.pay_later_date && (
                                <div>
                                  <Label className="text-sm font-medium">Pay Later Date</Label>
                                  <p className="text-sm">{formatDate(selectedSale.pay_later_date)}</p>
                                </div>
                              )}
                              <div>
                                <Label className="text-sm font-medium">Contact</Label>
                                <p className="text-sm">{selectedSale.customer_phone}</p>
                                <p className="text-sm text-muted-foreground">{selectedSale.customer_email}</p>
                              </div>
                            </div>
                          )}
                          <DialogFooter>
                            {selectedSale && selectedSale.status === 'active' && (
                              <Button
                                onClick={() => handleMarkCompleted(selectedSale.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Mark as Paid
                              </Button>
                            )}
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
