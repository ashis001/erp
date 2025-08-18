
"use client";
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { recordSale } from '@/lib/actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface RecordSaleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    itemId: number;
    itemName: string;
    available: number;
    sellingPrice: number;
  };
  adminId: number;
}

export default function RecordSaleDialog({ isOpen, onClose, item, adminId }: RecordSaleDialogProps) {
  const { toast } = useToast();
  
  const formSchema = z.object({
    quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').max(item.available, `Cannot sell more than available stock (${item.available})`),
    customerName: z.string().min(1, 'Customer name is required'),
    customerAddress: z.string().optional(),
    customerPhone: z.string().refine((val) => /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(val) || val === '', { message: "Invalid phone number format."}).optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: 1,
      customerName: '',
      customerAddress: '',
      customerPhone: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const formData = new FormData();
    formData.append('itemId', item.itemId.toString());
    formData.append('adminId', adminId.toString());
    formData.append('quantity', values.quantity.toString());
    formData.append('unitPrice', item.sellingPrice.toString());
    formData.append('customerName', values.customerName);
    formData.append('customerAddress', values.customerAddress || '');
    formData.append('customerPhone', values.customerPhone || '');
    
    const result = await recordSale(formData);

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      });
    } else {
      toast({
        title: "Success",
        description: "Sale recorded successfully.",
      });
      form.reset();
      onClose();
      // Refresh the page to show updated data
      window.location.reload();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Sale for {item.itemName}</DialogTitle>
          <DialogDescription>
            Enter the details of the sale. Available stock: {item.available}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity Sold</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="customerAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Address (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="customerPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Phone (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Recording..." : "Record Sale"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
