
"use client";
import React, { useState, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addInventory } from '@/lib/actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { Category, Item } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface AddInventoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  items: Item[];
}

const formSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  itemId: z.string().min(1, 'Item is required'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  costPrice: z.coerce.number().min(0, 'Cost price must be non-negative'),
  sellingPrice: z.coerce.number().min(0, 'Selling price must be non-negative'),
});

export default function AddInventoryDialog({ isOpen, onClose, categories, items }: AddInventoryDialogProps) {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryId: '',
      itemId: '',
      quantity: 1,
      costPrice: 0,
      sellingPrice: 0,
    },
  });


  const selectedCategoryId = useWatch({ control: form.control, name: 'categoryId' });
  const selectedItemId = useWatch({ control: form.control, name: 'itemId' });

  const filteredItems = useMemo(() => {
    if (!selectedCategoryId) return [];
    return items.filter(item => item.category_id === parseInt(selectedCategoryId, 10));
  }, [selectedCategoryId, items]);

  // Auto-populate cost price when item is selected
  const selectedItem = useMemo(() => {
    if (!selectedItemId) return null;
    return items.find(item => item.id === parseInt(selectedItemId, 10));
  }, [selectedItemId, items]);

  // Update cost price when item changes
  React.useEffect(() => {
    if (selectedItem && selectedItem.default_selling_price) {
      form.setValue('costPrice', selectedItem.default_selling_price);
    }
  }, [selectedItem, form]);


  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });
    
    const result = await addInventory(formData);

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      });
    } else {
      toast({
        title: "Success",
        description: "Inventory added successfully.",
      });
      form.reset();
      onClose();
      // Auto-refresh the page to show the new inventory
      window.location.reload();
    }
  };
  
  const handleClose = () => {
    form.reset();
    // Force reset the submitting state
    form.clearErrors();
    onClose();
  }


  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] z-50">
        <DialogHeader>
          <DialogTitle>Add Inventory Lot</DialogTitle>
          <DialogDescription>
            Add a new batch of inventory to your global stock.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={(value) => {
                      field.onChange(value);
                      form.resetField('itemId');
                  }} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map(cat => <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="itemId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item</FormLabel>
                   <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCategoryId}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select an item" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredItems.map(item => <SelectItem key={item.id} value={item.id.toString()}>{item.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity Purchased</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="costPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost Price (per unit)</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sellingPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Selling Price (per unit)</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
                <Button type="submit" disabled={form.formState.isSubmitting} className="bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white disabled:opacity-50">
                    {form.formState.isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Adding...
                      </div>
                    ) : (
                      "Add to Inventory"
                    )}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
