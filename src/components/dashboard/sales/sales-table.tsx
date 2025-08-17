
"use client";
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

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
      </CardContent>
    </Card>
  );
}
