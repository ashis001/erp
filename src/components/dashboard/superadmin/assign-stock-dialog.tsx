"use client";
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { assignStock } from '@/lib/actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface AssignStockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    itemId: number;
    itemName: string;
    globalAvailable: number;
  };
  admins: User[];
}

export default function AssignStockDialog({ isOpen, onClose, item, admins }: AssignStockDialogProps) {
  const { toast } = useToast();

  const formSchema = z.object({
    adminId: z.string().min(1, 'Admin is required'),
    quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').max(item.globalAvailable, `Cannot assign more than available stock (${item.globalAvailable})`),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      adminId: '',
      quantity: 1,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const formData = new FormData();
    formData.append('itemId', item.itemId.toString());
    formData.append('adminId', values.adminId);
    formData.append('quantity', values.quantity.toString());
    
    const currentUserId = parseInt(localStorage.getItem('currentUser') || '1');
    formData.append('userId', currentUserId.toString());
    
    const result = await assignStock(formData);

    if (result.error) {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    } else {
        toast({ title: 'Success', description: 'Stock assigned successfully.' });
        form.reset();
        onClose();
        // Trigger page refresh to show updated data
        window.location.reload();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign {item.itemName}</DialogTitle>
          <DialogDescription>
            Assign stock to an admin. Global available: {item.globalAvailable}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="adminId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select an admin" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {admins.map(admin => <SelectItem key={admin.id} value={admin.id.toString()}>{admin.name}</SelectItem>)}
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
                  <FormLabel>Quantity to Assign</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Assigning..." : "Assign Stock"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
