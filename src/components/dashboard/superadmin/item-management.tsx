"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Package, Tag, IndianRupee, Barcode } from "lucide-react";
import { deleteItem } from "@/lib/actions";
import { toast } from "@/hooks/use-toast";
import type { Category, Item, InventoryLot } from "@/lib/types";
import AddItemDialog from "./add-item-dialog";
import EditItemDialog from "./edit-item-dialog";

interface ItemManagementProps {
  categories: Category[];
  items: Item[];
  inventoryLots: InventoryLot[];
}

export default function ItemManagement({ categories, items, inventoryLots }: ItemManagementProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

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
        // Auto-refresh the page to show updated items
        window.location.reload();
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
        {/* Desktop View */}
        <div className="hidden md:block space-y-4">
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
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingItem(item)}
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
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

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {items.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Items Yet</h3>
                <p className="text-muted-foreground">
                  Create your first item to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            items.map((item) => {
              const inventoryCount = getItemInventoryCount(item.id);
              const hasInventory = inventoryCount > 0;
              
              return (
                <Card key={item.id} className="border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Package className="h-5 w-5 text-orange-500 flex-shrink-0" />
                        <h3 className="font-semibold text-lg truncate">{item.name}</h3>
                      </div>
                      <Badge variant={hasInventory ? "default" : "secondary"} className="ml-2 flex-shrink-0">
                        {inventoryCount} stock
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Barcode className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-muted-foreground">SKU:</span>
                        <Badge variant="outline">{item.sku}</Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-purple-500" />
                        <span className="text-sm text-muted-foreground">Category:</span>
                        <span className="text-sm font-medium">{getCategoryName(item.category_id)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <IndianRupee className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-muted-foreground">Price:</span>
                        <span className="text-lg font-bold text-green-600">
                          ₹{parseFloat(item.default_selling_price as any).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingItem(item)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id || hasInventory}
                        className="flex-1"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {deletingId === item.id ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </CardContent>
      
      {editingItem && (
        <EditItemDialog
          item={editingItem}
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
        />
      )}
    </Card>
  );
}
