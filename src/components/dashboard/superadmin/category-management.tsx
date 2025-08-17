"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit } from "lucide-react";
import { deleteCategory } from "@/lib/actions";
import { toast } from "@/hooks/use-toast";
import type { Category, Item } from "@/lib/types";
import AddCategoryDialog from "./add-category-dialog";

interface CategoryManagementProps {
  categories: Category[];
  items: Item[];
}

export default function CategoryManagement({ categories, items }: CategoryManagementProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleDelete(categoryId: number) {
    setDeletingId(categoryId);
    try {
      const result = await deleteCategory(categoryId);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Category deleted successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete category.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  }

  const getCategoryItemCount = (categoryId: number) => {
    return items.filter(item => item.category_id === categoryId).length;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Category Management</CardTitle>
            <CardDescription>
              Manage product categories for your inventory system
            </CardDescription>
          </div>
          <AddCategoryDialog />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {categories.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No categories found. Create your first category to get started.
            </p>
          ) : (
            categories.map((category) => {
              const itemCount = getCategoryItemCount(category.id);
              return (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{category.name}</h3>
                      <Badge variant="secondary">{itemCount} items</Badge>
                    </div>
                    {category.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {category.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(category.id)}
                      disabled={deletingId === category.id || itemCount > 0}
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingId === category.id ? "Deleting..." : "Delete"}
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
