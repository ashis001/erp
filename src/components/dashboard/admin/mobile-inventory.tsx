"use client";
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Package, IndianRupee, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { recordSale } from '@/lib/actions';
import CreditSaleDialog from './credit-sale-dialog';

interface StockDataItem {
  itemId: number;
  itemName: string;
  sku: string;
  assigned: number;
  sold: number;
  available: number;
  sellingPrice: number;
}

interface MobileInventoryProps {
  stockData: StockDataItem[];
  adminId: number;
}

export default function MobileInventory({ stockData, adminId }: MobileInventoryProps) {
  const { toast } = useToast();
  const [loadingItems, setLoadingItems] = useState<Set<number>>(new Set());
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockDataItem | null>(null);

  const handleQuickSale = async (item: StockDataItem) => {
    if (item.available <= 0) return;
    
    setLoadingItems(prev => new Set(prev).add(item.itemId));
    
    const formData = new FormData();
    formData.append('itemId', item.itemId.toString());
    formData.append('adminId', adminId.toString());
    formData.append('quantity', '1');
    formData.append('unitPrice', item.sellingPrice.toString());
    formData.append('customerName', 'Walk-in Customer');
    formData.append('customerAddress', '');
    formData.append('customerPhone', '');
    
    const result = await recordSale(formData);

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      });
    } else {
      toast({
        title: "Sale Recorded",
        description: `1 ${item.itemName} sold successfully!`,
      });
      // Refresh the page to show updated data
      window.location.reload();
    }
    
    setLoadingItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(item.itemId);
      return newSet;
    });
  };

  return (
    <div className="space-y-4 p-4">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Quick Sale</h1>
        <p className="text-muted-foreground">Tap to record sale</p>
      </div>
      
      {stockData.length > 0 ? (
        <div className="grid gap-4">
          {stockData.map(item => (
            <Card key={item.itemId} className="relative">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{item.itemName}</h3>
                    <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                  </div>
                  <Badge variant={item.available > 0 ? "default" : "secondary"}>
                    {item.available} left
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <Package className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                    <p className="text-xs text-muted-foreground">Assigned</p>
                    <p className="font-semibold">{item.assigned}</p>
                  </div>
                  <div className="text-center">
                    <ShoppingCart className="h-5 w-5 mx-auto mb-1 text-green-500" />
                    <p className="text-xs text-muted-foreground">Sold</p>
                    <p className="font-semibold">{item.sold}</p>
                  </div>
                  <div className="text-center">
                    <IndianRupee className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="font-semibold">₹{item.sellingPrice}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={() => handleQuickSale(item)}
                    disabled={item.available <= 0 || loadingItems.has(item.itemId)}
                    className="bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white"
                    size="lg"
                  >
                    {loadingItems.has(item.itemId) ? (
                      "Recording..."
                    ) : item.available <= 0 ? (
                      "Out of Stock"
                    ) : (
                      <>Record Sale</>
                    )}
                  </Button>
                  
                  <button
                    onClick={() => {
                      setSelectedItem(item);
                      setCreditDialogOpen(true);
                    }}
                    disabled={item.available <= 0}
                    className="inline-flex items-center justify-center gap-2 h-11 px-8 rounded-md border border-orange-500 text-orange-600 bg-transparent hover:bg-transparent hover:text-orange-600 hover:border-orange-500 focus:bg-transparent focus:text-orange-600 focus:border-orange-500 active:bg-transparent active:text-orange-600 active:border-orange-500 hover:opacity-100 focus:opacity-100 active:opacity-100 disabled:opacity-100 disabled:text-orange-400 disabled:border-orange-300 disabled:cursor-not-allowed focus:outline-none focus:ring-0 transition-none"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Credit
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Stock Assigned</h3>
            <p className="text-muted-foreground">
              You don't have any items assigned to you yet.
            </p>
          </CardContent>
        </Card>
      )}
      
      <CreditSaleDialog 
        isOpen={creditDialogOpen}
        onClose={() => {
          setCreditDialogOpen(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        adminId={adminId}
      />
    </div>
  );
}
