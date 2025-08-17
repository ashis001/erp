"use client";
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { adjustInventoryQuantity } from '@/lib/actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

interface AdjustQuantityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onSuccess?: () => void;
}

const formSchema = z.object({
  adjustmentType: z.enum(['absolute', 'relative']),
  adjustment: z.coerce.number(),
  reason: z.string().min(1, 'Reason is required'),
}).refine((data) => {
  if (data.adjustmentType === 'relative' && data.adjustment === 0) {
    return false;
  }
  if (data.adjustmentType === 'absolute' && data.adjustment < 0) {
    return false;
  }
  return true;
}, {
  message: "Invalid adjustment value",
  path: ["adjustment"]
});

export default function AdjustQuantityDialog({ isOpen, onClose, item, onSuccess }: AdjustQuantityDialogProps) {
  const [error, setError] = React.useState<string>('');
  const [success, setSuccess] = React.useState<string>('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      adjustmentType: 'absolute',
      adjustment: 0,
      reason: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!item) return;
    
    setError('');
    setSuccess('');
    
    const currentUserId = parseInt(localStorage.getItem('currentUser') || '1');
    
    // Calculate the actual adjustment needed
    let actualAdjustment = values.adjustment;
    if (values.adjustmentType === 'absolute') {
      // For absolute, calculate the difference from current quantity
      actualAdjustment = values.adjustment - item.globalAvailable;
    }
    
    const formData = new FormData();
    formData.append('itemId', item.itemId.toString());
    formData.append('adjustment', actualAdjustment.toString());
    formData.append('reason', values.reason);
    formData.append('userId', currentUserId.toString());
    
    const result = await adjustInventoryQuantity(formData);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(result.success || 'Quantity adjusted successfully.');
      onSuccess?.(); // Refresh data after successful adjustment
      form.reset({
        adjustmentType: 'absolute',
        adjustment: 0,
        reason: '',
      });
      // Keep dialog open longer to show success message
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 2500);
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
          <DialogTitle>Adjust Quantity</DialogTitle>
          <DialogDescription>
            Adjust inventory quantity for {item.itemName} ({item.categoryName})
            <br />
            Current available: {item.globalAvailable} units
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
              name="adjustmentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adjustment Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select adjustment type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="absolute">Set Absolute Quantity</SelectItem>
                      <SelectItem value="relative">Add/Remove Quantity</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="adjustment"
              render={({ field }) => {
                const adjustmentType = form.watch('adjustmentType');
                return (
                  <FormItem>
                    <FormLabel>
                      {adjustmentType === 'absolute' ? 'Set Quantity To' : 'Adjust Quantity By'}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder={
                          adjustmentType === 'absolute' 
                            ? "Enter total quantity (e.g., 100)" 
                            : "Enter +/- amount (e.g., +10 or -5)"
                        }
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-muted-foreground">
                      {adjustmentType === 'absolute' 
                        ? `Current: ${item?.globalAvailable || 0} units. Enter the total quantity you want.`
                        : 'Use positive numbers to add stock, negative to remove stock'
                      }
                    </p>
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Adjustment</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="e.g., Stock count correction, Damaged goods, Found additional stock..."
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Adjusting..." : "Adjust Quantity"}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
