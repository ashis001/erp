"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Tag, Package } from "lucide-react";
import { deleteCategory } from "@/lib/actions";
import { toast } from "@/hooks/use-toast";
import type { Category, Item } from "@/lib/types";
import AddCategoryDialog from "./add-category-dialog";
import EditCategoryDialog from "./edit-category-dialog";

interface CategoryManagementProps {
  categories: Category[];
  items: Item[];
}

export default function CategoryManagement({ categories, items }: CategoryManagementProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

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
        // Auto-refresh the page to show updated categories
        window.location.reload();
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
        {/* Desktop View */}
        <div className="hidden md:block space-y-4">
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
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingCategory(category)}
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
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

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {categories.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Categories Yet</h3>
                <p className="text-muted-foreground">
                  Create your first category to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            categories.map((category) => {
              const itemCount = getCategoryItemCount(category.id);
              return (
                <Card key={category.id} className="border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <Tag className="h-5 w-5 text-orange-500" />
                        <h3 className="font-semibold text-lg">{category.name}</h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4 text-blue-500" />
                        <Badge variant="secondary">{itemCount}</Badge>
                      </div>
                    </div>

                    {category.description && (
                      <p className="text-sm text-muted-foreground mb-4">
                        {category.description}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingCategory(category)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(category.id)}
                        disabled={deletingId === category.id || itemCount > 0}
                        className="flex-1"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {deletingId === category.id ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </CardContent>
      
      {editingCategory && (
        <EditCategoryDialog
          category={editingCategory}
          isOpen={!!editingCategory}
          onClose={() => setEditingCategory(null)}
        />
      )}
    </Card>
  );
}
