"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { createItem } from "@/lib/actions";
import { toast } from "@/hooks/use-toast";
import type { Category } from "@/lib/types";

interface AddItemDialogProps {
  categories: Category[];
}

export default function AddItemDialog({ categories }: AddItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [itemName, setItemName] = useState<string>("");
  const [autoSku, setAutoSku] = useState<string>("");

  // Generate SKU automatically based on category and item name
  useEffect(() => {
    if (selectedCategory && itemName) {
      const category = categories.find(c => c.id.toString() === selectedCategory);
      if (category) {
        // Create SKU: Category prefix + Item name initials + random number
        const categoryPrefix = category.name.substring(0, 3).toUpperCase();
        const itemInitials = itemName
          .split(' ')
          .map(word => word.charAt(0))
          .join('')
          .toUpperCase()
          .substring(0, 3);
        const randomNum = Math.floor(Math.random() * 999) + 1;
        const generatedSku = `${categoryPrefix}-${itemInitials}-${randomNum.toString().padStart(3, '0')}`;
        setAutoSku(generatedSku);
      }
    } else {
      setAutoSku("");
    }
  }, [selectedCategory, itemName, categories]);

  async function handleSubmit(formData: FormData) {
    if (!selectedCategory) {
      toast({
        title: "Error",
        description: "Please select a category.",
        variant: "destructive",
      });
      return;
    }

    formData.append("categoryId", selectedCategory);
    // Use auto-generated SKU if available
    if (autoSku) {
      formData.set("sku", autoSku);
    }
    setIsSubmitting(true);
    
    try {
      const result = await createItem(formData);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Item created successfully.",
        });
        setOpen(false);
        setSelectedCategory("");
        setItemName("");
        setAutoSku("");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create item.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
          <DialogDescription>
            Create a new product item in your inventory system.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g., Bhagavad Gita As It Is"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sku" className="text-right">
                SKU
              </Label>
              <Input
                id="sku"
                name="sku"
                value={autoSku}
                onChange={(e) => setAutoSku(e.target.value)}
                placeholder="Auto-generated or enter manually"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="defaultSellingPrice" className="text-right">
                Default Price
              </Label>
              <Input
                id="defaultSellingPrice"
                name="defaultSellingPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
