"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { deleteItem } from "@/lib/actions";
import { toast } from "@/hooks/use-toast";
import type { Category, Item, InventoryLot } from "@/lib/types";
import AddItemDialog from "./add-item-dialog";

interface ItemManagementProps {
  categories: Category[];
  items: Item[];
  inventoryLots: InventoryLot[];
}

export default function ItemManagement({ categories, items, inventoryLots }: ItemManagementProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleDelete(itemId: number) {
    setDeletingId(itemId);
    try {
      const result = await deleteItem(itemId);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Item deleted successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete item.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  }

  const getCategoryName = (categoryId: number) => {
    return categories.find(cat => cat.id === categoryId)?.name || "Unknown";
  };

  const getItemInventoryCount = (itemId: number) => {
    return inventoryLots
      .filter(lot => lot.item_id === itemId)
      .reduce((sum, lot) => sum + lot.qty_purchased, 0);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Item Management</CardTitle>
            <CardDescription>
              Manage product items in your inventory system
            </CardDescription>
          </div>
          <AddItemDialog categories={categories} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No items found. Create your first item to get started.
            </p>
          ) : (
            items.map((item) => {
              const inventoryCount = getItemInventoryCount(item.id);
              const hasInventory = inventoryCount > 0;
              
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{item.name}</h3>
                      <Badge variant="outline">{item.sku}</Badge>
                      <Badge variant={hasInventory ? "default" : "secondary"}>
                        {inventoryCount} in stock
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Category: {getCategoryName(item.category_id)}</span>
                      <span>Price: ₹{parseFloat(item.default_selling_price as any).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id || hasInventory}
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingId === item.id ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
