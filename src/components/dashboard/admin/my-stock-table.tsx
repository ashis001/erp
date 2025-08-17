"use client";
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import RecordSaleDialog from './record-sale-dialog';

interface StockDataItem {
  itemId: number;
  itemName: string;
  sku: string;
  assigned: number;
  sold: number;
  available: number;
  sellingPrice: number;
}

interface MyStockTableProps {
  stockData: StockDataItem[];
  adminId: number;
}

export default function MyStockTable({ stockData, adminId }: MyStockTableProps) {
  const [selectedItem, setSelectedItem] = useState<StockDataItem | null>(null);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>My Inventory</CardTitle>
          <CardDescription>Items assigned to you for selling.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Assigned</TableHead>
                <TableHead className="text-right">Sold</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="text-right">Selling Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockData.length > 0 ? stockData.map(item => (
                <TableRow key={item.itemId}>
                  <TableCell className="font-medium">{item.itemName}</TableCell>
                  <TableCell>{item.sku}</TableCell>
                  <TableCell className="text-right">{item.assigned}</TableCell>
                  <TableCell className="text-right">{item.sold}</TableCell>
                  <TableCell className="text-right font-semibold">{item.available}</TableCell>
                  <TableCell className="text-right">₹{item.sellingPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedItem(item)}
                      disabled={item.available <= 0}
                    >
                      Record Sale
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">No stock assigned to you yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {selectedItem && (
        <RecordSaleDialog
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          item={selectedItem}
          adminId={adminId}
        />
      )}
    </>
  );
}
