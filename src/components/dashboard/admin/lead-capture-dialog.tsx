"use client";
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, UserPlus, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { createLead } from '@/lib/actions';
import { cn } from '@/lib/utils';

interface LeadCaptureDialogProps {
  adminId: number;
  items: Array<{ id: number; name: string; sku: string }>;
  trigger?: React.ReactNode;
}

export default function LeadCaptureDialog({ adminId, items, trigger }: LeadCaptureDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [followUpDate, setFollowUpDate] = useState<Date>();
  
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    customer_address: '',
    interested_item_id: 'none',
    notes: '',
    priority: 'medium'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const form = new FormData();
    form.append('admin_user_id', adminId.toString());
    form.append('customer_name', formData.customer_name);
    form.append('customer_phone', formData.customer_phone);
    form.append('customer_email', formData.customer_email);
    form.append('customer_address', formData.customer_address);
    if (formData.interested_item_id !== 'none') {
      form.append('interested_item_id', formData.interested_item_id);
    }
    form.append('notes', formData.notes);
    form.append('priority', formData.priority);
    if (followUpDate) {
      form.append('follow_up_date', format(followUpDate, 'yyyy-MM-dd'));
    }

    const result = await createLead(form);

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      });
    } else {
      toast({
        title: "Lead Captured!",
        description: "Lead has been successfully added to your pipeline.",
      });
      setOpen(false);
      setFormData({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        customer_address: '',
        interested_item_id: 'none',
        notes: '',
        priority: 'medium'
      });
      setFollowUpDate(undefined);
    }
    setLoading(false);
  };

  const defaultTrigger = (
    <Button 
      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse"
      size="sm"
    >
      <Sparkles className="h-4 w-4 mr-2" />
      Capture Lead
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-purple-500" />
            Capture New Lead
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer_name">Customer Name *</Label>
              <Input
                id="customer_name"
                value={formData.customer_name}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                placeholder="Enter customer name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customer_phone">Phone Number *</Label>
              <Input
                id="customer_phone"
                value={formData.customer_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                placeholder="Enter phone number"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer_email">Email (Optional)</Label>
            <Input
              id="customer_email"
              type="email"
              value={formData.customer_email}
              onChange={(e) => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
              placeholder="Enter email address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer_address">Address (Optional)</Label>
            <Input
              id="customer_address"
              value={formData.customer_address}
              onChange={(e) => setFormData(prev => ({ ...prev, customer_address: e.target.value }))}
              placeholder="Enter customer address"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interested_item">Interested Item (Optional)</Label>
              <Select value={formData.interested_item_id} onValueChange={(value) => setFormData(prev => ({ ...prev, interested_item_id: value }))}>
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="Select an item" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific item</SelectItem>
                  {items.map(item => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {item.name} ({item.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Follow-up Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !followUpDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {followUpDate ? format(followUpDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={followUpDate}
                  onSelect={setFollowUpDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any additional notes about this lead..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
            >
              {loading ? "Capturing..." : "Capture Lead"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
