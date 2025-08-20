"use client";
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { IndianRupee, Calculator, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { recordCreditSale } from '@/lib/actions';

interface StockDataItem {
  itemId: number;
  itemName: string;
  sku: string;
  available: number;
  sellingPrice: number;
}

interface CreditSaleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: StockDataItem | null;
  adminId: number;
}

export default function CreditSaleDialog({ isOpen, onClose, item, adminId }: CreditSaleDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    downPayment: '',
    emiPeriods: '3',
    paymentType: 'emi', // 'emi' or 'pay_later'
    payLaterDate: ''
  });
  const [calculations, setCalculations] = useState({
    totalPrice: 0,
    pendingBalance: 0,
    monthlyEmi: 0
  });

  useEffect(() => {
    if (item && formData.downPayment) {
      const totalPrice = item.sellingPrice;
      const downPayment = parseFloat(formData.downPayment) || 0;
      const pendingBalance = totalPrice - downPayment;
      
      let monthlyEmi = 0;
      if (formData.paymentType === 'emi' && formData.emiPeriods) {
        const emiPeriods = parseInt(formData.emiPeriods) || 1;
        monthlyEmi = pendingBalance / emiPeriods;
      } else if (formData.paymentType === 'pay_later') {
        monthlyEmi = pendingBalance; // Full amount due on pay later date
      }
      
      setCalculations({
        totalPrice,
        pendingBalance,
        monthlyEmi
      });
    }
  }, [item, formData.downPayment, formData.emiPeriods, formData.paymentType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    if (!formData.customerName || !formData.customerEmail || !formData.customerPhone || !formData.downPayment) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    if (formData.paymentType === 'pay_later' && !formData.payLaterDate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a pay later date",
      });
      return;
    }

    const downPayment = parseFloat(formData.downPayment);
    if (downPayment < 0 || downPayment > item.sellingPrice) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Down payment must be between 0 and total price",
      });
      return;
    }

    setLoading(true);

    const creditData = new FormData();
    creditData.append('itemId', item.itemId.toString());
    creditData.append('adminId', adminId.toString());
    creditData.append('customerName', formData.customerName);
    creditData.append('customerEmail', formData.customerEmail);
    creditData.append('customerPhone', formData.customerPhone);
    creditData.append('totalPrice', item.sellingPrice.toString());
    creditData.append('downPayment', formData.downPayment);
    creditData.append('paymentType', formData.paymentType);
    creditData.append('emiPeriods', formData.paymentType === 'emi' ? formData.emiPeriods : '1');
    creditData.append('payLaterDate', formData.payLaterDate || '');
    creditData.append('pendingBalance', calculations.pendingBalance.toString());
    creditData.append('monthlyEmi', calculations.monthlyEmi.toString());

    try {
      const result = await recordCreditSale(creditData);

      if (result.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      } else {
        toast({
          title: "Credit Sale Recorded",
          description: `Credit sale for ${item.itemName} recorded successfully!`,
        });
        onClose();
        window.location.reload();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to record credit sale",
      });
    }

    setLoading(false);
  };

  const handleClose = () => {
    setFormData({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      downPayment: '',
      emiPeriods: '3',
      paymentType: 'emi',
      payLaterDate: ''
    });
    setCalculations({
      totalPrice: 0,
      pendingBalance: 0,
      monthlyEmi: 0
    });
    onClose();
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-orange-500" />
            Credit Sale - {item.itemName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">Customer Name *</Label>
            <Input
              id="customerName"
              type="text"
              placeholder="Enter customer name"
              value={formData.customerName}
              onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email *</Label>
              <Input
                id="customerEmail"
                type="email"
                placeholder="customer@example.com"
                value={formData.customerEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone">Phone *</Label>
              <Input
                id="customerPhone"
                type="tel"
                placeholder="Phone number"
                value={formData.customerPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="downPayment">Down Payment (₹) *</Label>
              <Input
                id="downPayment"
                type="number"
                min="0"
                max={item.sellingPrice}
                step="0.01"
                placeholder="0.00"
                value={formData.downPayment}
                onChange={(e) => setFormData(prev => ({ ...prev, downPayment: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Type *</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={formData.paymentType === 'emi' ? 'default' : 'outline'}
                  onClick={() => setFormData(prev => ({ ...prev, paymentType: 'emi' }))}
                  className="h-10"
                >
                  EMI Plan
                </Button>
                <Button
                  type="button"
                  variant={formData.paymentType === 'pay_later' ? 'default' : 'outline'}
                  onClick={() => setFormData(prev => ({ ...prev, paymentType: 'pay_later' }))}
                  className="h-10"
                >
                  Pay Later
                </Button>
              </div>
            </div>

            {formData.paymentType === 'emi' && (
              <div className="space-y-2">
                <Label htmlFor="emiPeriods">EMI Periods (Months)</Label>
                <Select
                  value={formData.emiPeriods}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, emiPeriods: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Month</SelectItem>
                    <SelectItem value="3">3 Months</SelectItem>
                    <SelectItem value="6">6 Months</SelectItem>
                    <SelectItem value="12">12 Months</SelectItem>
                    <SelectItem value="24">24 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.paymentType === 'pay_later' && (
              <div className="space-y-2">
                <Label htmlFor="payLaterDate">Pay Later Date *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={formData.payLaterDate === 'tomorrow' ? 'default' : 'outline'}
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setFormData(prev => ({ ...prev, payLaterDate: 'tomorrow' }));
                    }}
                    className="h-10 text-xs"
                  >
                    Tomorrow
                  </Button>
                  <Button
                    type="button"
                    variant={formData.payLaterDate === '1_month' ? 'default' : 'outline'}
                    onClick={() => setFormData(prev => ({ ...prev, payLaterDate: '1_month' }))}
                    className="h-10 text-xs"
                  >
                    1 Month
                  </Button>
                </div>
                <Input
                  type="date"
                  value={formData.payLaterDate.startsWith('20') ? formData.payLaterDate : ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, payLaterDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  placeholder="Or select custom date"
                />
              </div>
            )}
          </div>

          {/* Calculation Summary */}
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-orange-700 font-semibold">
                <Calculator className="h-4 w-4" />
                Payment Summary
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Price:</span>
                  <span className="font-semibold">₹{calculations.totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Down Payment:</span>
                  <span className="font-semibold">₹{(parseFloat(formData.downPayment) || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Pending Balance:</span>
                  <span className="font-semibold text-red-600">₹{calculations.pendingBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{formData.paymentType === 'emi' ? 'Monthly EMI:' : 'Amount Due:'}</span>
                  <span className="font-semibold text-blue-600">₹{calculations.monthlyEmi.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formData.paymentType === 'emi' ? 'Duration:' : 'Payment Due:'}
                  </span>
                  <span className="font-semibold">
                    {formData.paymentType === 'emi' 
                      ? `${formData.emiPeriods} months`
                      : formData.payLaterDate === 'tomorrow' 
                        ? 'Tomorrow'
                        : formData.payLaterDate === '1_month'
                        ? '1 Month Later'
                        : formData.payLaterDate || 'Select Date'
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.customerName || !formData.customerEmail || !formData.customerPhone || !formData.downPayment}
              className="flex-1 bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700"
            >
              {loading ? "Recording..." : "Record Credit Sale"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
