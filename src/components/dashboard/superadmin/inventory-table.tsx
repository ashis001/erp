
"use client";
import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AddInventoryDialog from './add-inventory-dialog';
import AssignStockDialog from './assign-stock-dialog';
import UpdateInventoryDialog from './update-inventory-dialog';
import AdjustQuantityDialog from './adjust-quantity-dialog';
import { deleteInventoryItem } from '@/lib/actions';
import type { Category, Item, User } from '@/lib/types';

interface InventoryItem {
    itemId: number;
    itemName: string;
    categoryName: string;
    sku: string;
    totalPurchased: number;
    totalAssigned: number;
    globalAvailable: number;
    costPrice: number;
    sellingPrice: number;
}

interface InventoryTableProps {
  data: InventoryItem[];
  categories: Category[];
  items: Item[];
  admins: User[];
  onDataChange?: () => void;
}

export default function InventoryTable({ data, categories, items, admins, onDataChange }: InventoryTableProps) {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isAddInventoryOpen, setAddInventoryOpen] = useState(false);
  const [assigningItem, setAssigningItem] = useState<InventoryItem | null>(null);
  const [updatingItem, setUpdatingItem] = useState<InventoryItem | null>(null);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const filteredData = useMemo(() => {
    if (filterCategory === 'all') return data;
    return data.filter(item => item.categoryName === filterCategory);
  }, [data, filterCategory]);

  const handleDelete = async (item: InventoryItem) => {
    if (!confirm(`Are you sure you want to delete all inventory for "${item.itemName}"?`)) {
      return;
    }

    setError('');
    setSuccess('');
    
    const currentUserId = parseInt(localStorage.getItem('currentUser') || '1');
    const result = await deleteInventoryItem(item.itemId, currentUserId);
    
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess('Inventory deleted successfully.');
      onDataChange?.(); // Refresh data after successful delete
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Global Inventory</CardTitle>
                <CardDescription>Manage your entire stock from one place.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => setAddInventoryOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Inventory
                </Button>
              </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Purchased</TableHead>
                <TableHead className="text-right">Assigned</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="text-right">Cost Price</TableHead>
                <TableHead className="text-right">Selling Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? filteredData.map(item => (
                <TableRow key={item.itemId}>
                  <TableCell className="font-medium">{item.itemName}</TableCell>
                  <TableCell>{item.categoryName}</TableCell>
                  <TableCell>{item.sku}</TableCell>
                  <TableCell className="text-right">{item.totalPurchased}</TableCell>
                  <TableCell className="text-right">{item.totalAssigned}</TableCell>
                  <TableCell className="text-right font-semibold">{item.globalAvailable}</TableCell>
                  <TableCell className="text-right">₹{item.costPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right">₹{item.sellingPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setAssigningItem(item)} disabled={item.globalAvailable <= 0}>
                          Assign to Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setUpdatingItem(item)}>Update Pricing</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setAdjustingItem(item)}>Adjust Quantity</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(item)}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                        No items found for the selected category.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <AddInventoryDialog 
        isOpen={isAddInventoryOpen} 
        onClose={() => setAddInventoryOpen(false)}
        categories={categories}
        items={items}
      />
      {assigningItem && (
        <AssignStockDialog
          isOpen={!!assigningItem}
          onClose={() => setAssigningItem(null)}
          item={assigningItem}
          admins={admins}
        />
      )}
      {updatingItem && (
        <UpdateInventoryDialog
          isOpen={!!updatingItem}
          onClose={() => setUpdatingItem(null)}
          item={updatingItem}
          onSuccess={onDataChange}
        />
      )}
      {adjustingItem && (
        <AdjustQuantityDialog
          isOpen={!!adjustingItem}
          onClose={() => setAdjustingItem(null)}
          item={adjustingItem}
          onSuccess={onDataChange}
        />
      )}
    </>
  );
}
