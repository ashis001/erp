"use client";
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { updateInventory } from '@/lib/actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

interface UpdateInventoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onSuccess?: () => void;
}

const formSchema = z.object({
  costPrice: z.coerce.number().min(0, 'Cost price must be non-negative'),
  sellingPrice: z.coerce.number().min(0, 'Selling price must be non-negative'),
});

export default function UpdateInventoryDialog({ isOpen, onClose, item, onSuccess }: UpdateInventoryDialogProps) {
  const [error, setError] = React.useState<string>('');
  const [success, setSuccess] = React.useState<string>('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      costPrice: item?.costPrice || 0,
      sellingPrice: item?.sellingPrice || 0,
    },
  });

  React.useEffect(() => {
    if (item) {
      form.reset({
        costPrice: item.costPrice,
        sellingPrice: item.sellingPrice,
      });
    }
  }, [item, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!item) return;
    
    setError('');
    setSuccess('');
    
    const currentUserId = parseInt(localStorage.getItem('currentUser') || '1');
    const formData = new FormData();
    formData.append('itemId', item.itemId.toString());
    formData.append('costPrice', values.costPrice.toString());
    formData.append('sellingPrice', values.sellingPrice.toString());
    formData.append('userId', currentUserId.toString());
    
    const result = await updateInventory(formData);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess('Inventory updated successfully.');
      onSuccess?.(); // Refresh data after successful update
      setTimeout(() => {
        onClose();
        setSuccess('');
        // Force page refresh to show updated data
        window.location.reload();
      }, 1500);
    }
  };
  
  const handleClose = () => {
    form.reset();
    setError('');
    setSuccess('');
    onClose();
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Update Inventory</DialogTitle>
          <DialogDescription>
            Update pricing for {item.itemName} ({item.categoryName})
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Updating..." : "Update Inventory"}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
