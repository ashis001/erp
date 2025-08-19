
"use client";
import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Package, IndianRupee, ShoppingCart, Users, Tag } from 'lucide-react';
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
      // Auto-refresh the page to show updated inventory
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col h-full relative z-0">
      <div className="pb-4 sticky top-0 bg-white z-10 border-b">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Global Inventory</h1>
              <p className="text-muted-foreground">Manage your entire stock from one place.</p>
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
              <Button 
                onClick={() => setAddInventoryOpen(true)}
                className="bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Inventory
              </Button>
            </div>
        </div>
      </div>
      <div className="flex flex-col flex-1 min-h-0">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-orange-100 border border-orange-400 text-orange-700 rounded">
              {success}
            </div>
          )}
          {/* Desktop Table View */}
          <div className="hidden lg:block flex-1 border rounded-md min-h-0 overflow-hidden relative">
            <div style={{ position: 'sticky', top: 0, zIndex: 1000, backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div className="grid grid-cols-9 gap-4 px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                <div className="text-left">Item</div>
                <div className="text-left">Category</div>
                <div className="text-left">SKU</div>
                <div className="text-right">Purchased</div>
                <div className="text-right">Assigned</div>
                <div className="text-right">Available</div>
                <div className="text-right">Cost Price</div>
                <div className="text-right">Selling Price</div>
                <div className="text-right">Actions</div>
              </div>
            </div>
            <div className="overflow-y-auto bg-white" style={{ height: 'calc(100vh - 250px)' }}>
            <div className="divide-y divide-gray-200">
                {filteredData.length > 0 ? filteredData.map(item => (
                  <div key={item.itemId} className="grid grid-cols-9 gap-4 px-4 py-3 text-sm hover:bg-gray-50 bg-white">
                    <div className="font-medium text-black">{item.itemName}</div>
                    <div className="text-black">{item.categoryName}</div>
                    <div className="text-black">{item.sku}</div>
                    <div className="text-right text-black">{item.totalPurchased}</div>
                    <div className="text-right text-black">{item.totalAssigned}</div>
                    <div className="text-right font-semibold text-black">{item.globalAvailable}</div>
                    <div className="text-right text-black">₹{item.costPrice.toFixed(2)}</div>
                    <div className="text-right text-black">₹{item.sellingPrice.toFixed(2)}</div>
                    <div className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-orange-100 hover:text-orange-600">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => setAssigningItem(item)} 
                            disabled={item.globalAvailable <= 0}
                            className="hover:bg-orange-500 hover:text-black focus:bg-orange-500 focus:text-black"
                          >
                            Assign to Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setUpdatingItem(item)}
                            className="hover:bg-orange-500 hover:text-black focus:bg-orange-500 focus:text-black"
                          >
                            Update Pricing
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setAdjustingItem(item)}
                            className="hover:bg-orange-500 hover:text-black focus:bg-orange-500 focus:text-black"
                          >
                            Adjust Quantity
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive hover:bg-red-100 hover:text-red-600 focus:bg-red-100 focus:text-red-600" 
                            onClick={() => handleDelete(item)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )) : (
                  <div className="px-4 py-24 text-center text-black bg-white">
                    No items found for the selected category.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4 overflow-y-auto" style={{ height: 'calc(100vh - 200px)' }}>
            {filteredData.length > 0 ? filteredData.map(item => (
              <Card key={item.itemId} className="border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-orange-500" />
                      <h3 className="font-semibold text-lg">{item.itemName}</h3>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-orange-100 hover:text-orange-600">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => setAssigningItem(item)} 
                          disabled={item.globalAvailable <= 0}
                          className="hover:bg-orange-500 hover:text-black focus:bg-orange-500 focus:text-black"
                        >
                          Assign to Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setUpdatingItem(item)}
                          className="hover:bg-orange-500 hover:text-black focus:bg-orange-500 focus:text-black"
                        >
                          Update Pricing
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setAdjustingItem(item)}
                          className="hover:bg-orange-500 hover:text-black focus:bg-orange-500 focus:text-black"
                        >
                          Adjust Quantity
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive hover:bg-red-100 hover:text-red-600 focus:bg-red-100 focus:text-red-600" 
                          onClick={() => handleDelete(item)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-muted-foreground">Category:</span>
                      <Badge variant="outline">{item.categoryName}</Badge>
                      <span className="text-sm text-muted-foreground ml-auto">SKU: {item.sku}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                          <ShoppingCart className="h-4 w-4" />
                        </div>
                        <div className="text-sm text-muted-foreground">Purchased</div>
                        <div className="font-semibold">{item.totalPurchased}</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                          <Users className="h-4 w-4" />
                        </div>
                        <div className="text-sm text-muted-foreground">Assigned</div>
                        <div className="font-semibold">{item.totalAssigned}</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                          <Package className="h-4 w-4" />
                        </div>
                        <div className="text-sm text-muted-foreground">Available</div>
                        <div className="font-bold text-lg text-green-600">{item.globalAvailable}</div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Cost Price</div>
                        <div className="flex items-center gap-1 font-semibold text-red-600">
                          <IndianRupee className="h-4 w-4" />
                          {item.costPrice.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Selling Price</div>
                        <div className="flex items-center gap-1 font-bold text-green-600 text-lg">
                          <IndianRupee className="h-4 w-4" />
                          {item.sellingPrice.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Items Found</h3>
                  <p className="text-muted-foreground">
                    No items found for the selected category.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
      </div>
      
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
    </div>
  );
}
