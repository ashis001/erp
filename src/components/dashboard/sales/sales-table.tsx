
"use client";
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Calendar, User, Package, IndianRupee } from 'lucide-react';

interface SaleDataItem {
    id: number;
    itemName: string;
    adminName: string;
    qty_sold: number;
    total_price: number;
    customer_name: string;
    created_at: string;
}

interface SalesTableProps {
  salesData: SaleDataItem[];
}

export default function SalesTable({ salesData }: SalesTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales History</CardTitle>
        <CardDescription>A record of all sales made.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Total Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesData.length > 0 ? salesData.map(sale => (
                <TableRow key={sale.id}>
                  <TableCell>{format(new Date(sale.created_at), 'PPP')}</TableCell>
                  <TableCell className="font-medium">{sale.itemName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{sale.adminName}</Badge>
                  </TableCell>
                  <TableCell>{sale.customer_name}</TableCell>
                  <TableCell className="text-right">{sale.qty_sold}</TableCell>
                  <TableCell className="text-right font-semibold">₹{parseFloat(sale.total_price as any).toFixed(2)}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">No sales recorded yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {salesData.length > 0 ? salesData.map(sale => (
            <Card key={sale.id} className="border-l-4 border-l-orange-500">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">
                      {format(new Date(sale.created_at), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-lg font-bold text-green-600">
                      <IndianRupee className="h-4 w-4" />
                      {parseFloat(sale.total_price as any).toFixed(2)}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">{sale.itemName}</span>
                    <Badge variant="secondary" className="ml-auto">
                      Qty: {sale.qty_sold}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-purple-500" />
                    <span className="text-sm text-muted-foreground">Admin:</span>
                    <Badge variant="outline">{sale.adminName}</Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">Customer:</span>
                    <span className="text-sm">{sale.customer_name}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Sales Yet</h3>
                <p className="text-muted-foreground">
                  Sales will appear here once you start recording them.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
