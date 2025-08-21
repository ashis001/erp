"use client";
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Search, UserPlus, Edit, Trash2, Phone, Mail, MapPin, Calendar as CalendarIcon2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { updateLead, deleteLead } from '@/lib/actions';
import { cn } from '@/lib/utils';
import LeadCaptureDialog from '../admin/lead-capture-dialog';
import type { Lead, User, Item } from '@/lib/types';

interface LeadsTableProps {
  leads: Lead[];
  users: User[];
  items: Item[];
  currentUser: User;
  onRefresh: () => void;
}

export default function LeadsTable({ leads, users, items, currentUser, onRefresh }: LeadsTableProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [followUpDate, setFollowUpDate] = useState<Date>();
  
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    customer_address: '',
    interested_item_id: 'none',
    notes: '',
    status: 'new',
    priority: 'medium'
  });

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = 
        lead.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.customer_phone.includes(searchTerm) ||
        (lead.customer_email && lead.customer_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.item_name && lead.item_name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || lead.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [leads, searchTerm, statusFilter, priorityFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="default" className="bg-blue-500">New</Badge>;
      case 'contacted':
        return <Badge variant="default" className="bg-yellow-500">Contacted</Badge>;
      case 'interested':
        return <Badge variant="default" className="bg-orange-500">Interested</Badge>;
      case 'converted':
        return <Badge variant="default" className="bg-green-500">Converted</Badge>;
      case 'lost':
        return <Badge variant="secondary">Lost</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="default" className="bg-orange-500">Medium</Badge>;
      case 'low':
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      customer_name: lead.customer_name,
      customer_phone: lead.customer_phone,
      customer_email: lead.customer_email || '',
      customer_address: lead.customer_address || '',
      interested_item_id: lead.interested_item_id?.toString() || 'none',
      notes: lead.notes || '',
      status: lead.status,
      priority: lead.priority
    });
    if (lead.follow_up_date) {
      setFollowUpDate(new Date(lead.follow_up_date));
    } else {
      setFollowUpDate(undefined);
    }
    setEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;
    
    setLoading(true);
    const form = new FormData();
    form.append('id', editingLead.id.toString());
    form.append('customer_name', formData.customer_name);
    form.append('customer_phone', formData.customer_phone);
    form.append('customer_email', formData.customer_email);
    form.append('customer_address', formData.customer_address);
    if (formData.interested_item_id !== 'none') {
      form.append('interested_item_id', formData.interested_item_id);
    }
    form.append('notes', formData.notes);
    form.append('status', formData.status);
    form.append('priority', formData.priority);
    if (followUpDate) {
      form.append('follow_up_date', format(followUpDate, 'yyyy-MM-dd'));
    }

    const result = await updateLead(form);
    
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      });
    } else {
      toast({
        title: "Lead Updated!",
        description: "Lead has been successfully updated.",
      });
      setEditDialogOpen(false);
      setEditingLead(null);
      onRefresh();
    }
    setLoading(false);
  };

  const handleDelete = async (leadId: number) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    
    const result = await deleteLead(leadId);
    
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      });
    } else {
      toast({
        title: "Lead Deleted",
        description: "Lead has been successfully deleted.",
      });
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header without orange background */}
      <div>
        <h1 className="text-2xl font-bold">Leads Management</h1>
        <p className="text-muted-foreground">Track and manage your sales leads</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="interested">Interested</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground flex items-center">
              Total: {filteredLeads.length} leads
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add New Lead Button */}
      <div className="flex justify-end">
        <LeadCaptureDialog 
          adminId={currentUser.id} 
          items={items.map(item => ({ id: item.id, name: item.name, sku: item.sku }))}
          trigger={
            <Button className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
              <UserPlus className="h-4 w-4 mr-2" />
              Add New Lead
            </Button>
          }
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full hidden sm:table">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Customer</th>
                  <th className="text-left p-4 font-medium">Contact</th>
                  <th className="text-left p-4 font-medium">Item Interest</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Priority</th>
                  <th className="text-left p-4 font-medium">Follow-up</th>
                  {currentUser.role === 'superadmin' && (
                    <th className="text-left p-4 font-medium">Admin</th>
                  )}
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={currentUser.role === 'superadmin' ? 8 : 7} className="text-center p-8 text-muted-foreground">
                      No leads found
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr key={lead.id} className="border-b hover:bg-muted/25">
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{lead.customer_name}</div>
                          {lead.customer_address && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {lead.customer_address}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {lead.customer_phone}
                          </div>
                          {lead.customer_email && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {lead.customer_email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {lead.item_name ? (
                          <span className="text-sm font-medium">{lead.item_name}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">No specific item</span>
                        )}
                      </td>
                      <td className="p-4">{getStatusBadge(lead.status)}</td>
                      <td className="p-4">{getPriorityBadge(lead.priority)}</td>
                      <td className="p-4">
                        {lead.follow_up_date ? (
                          <div className="flex items-center gap-1 text-sm">
                            <CalendarIcon2 className="h-3 w-3" />
                            {format(new Date(lead.follow_up_date), 'MMM dd, yyyy')}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">No follow-up</span>
                        )}
                      </td>
                      {currentUser.role === 'superadmin' && (
                        <td className="p-4">
                          <span className="text-sm">{lead.admin_name}</span>
                        </td>
                      )}
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(lead)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(lead.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Mobile card list */}
            <div className="sm:hidden">
              {filteredLeads.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">No leads found</div>
              ) : (
                <div className="space-y-3 p-3">
                  {filteredLeads.map((lead) => (
                    <div key={lead.id} className="rounded-lg border p-4 bg-background">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-medium">{lead.customer_name}</div>
                          <div className="mt-1 space-y-1 text-sm">
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {lead.customer_phone}
                            </div>
                            {lead.customer_email && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Mail className="h-3 w-3" /> {lead.customer_email}
                              </div>
                            )}
                            {lead.customer_address && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <MapPin className="h-3 w-3" /> {lead.customer_address}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {getStatusBadge(lead.status)}
                          {getPriorityBadge(lead.priority)}
                        </div>
                      </div>

                      <div className="mt-3 text-sm">
                        <div>
                          <span className="font-medium">Item: </span>
                          {lead.item_name ? lead.item_name : <span className="text-muted-foreground">No specific item</span>}
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                          <CalendarIcon2 className="h-3 w-3" />
                          {lead.follow_up_date ? format(new Date(lead.follow_up_date), 'MMM dd, yyyy') : 'No follow-up'}
                        </div>
                        {currentUser.role === 'superadmin' && (
                          <div className="mt-1"><span className="font-medium">Admin: </span>{lead.admin_name}</div>
                        )}
                      </div>

                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEdit(lead)}>
                          <Edit className="h-3 w-3 mr-1" /> Edit
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 text-red-600 hover:text-red-700" onClick={() => handleDelete(lead.id)}>
                          <Trash2 className="h-3 w-3 mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Lead Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-orange-500" />
              Edit Lead
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_customer_name">Customer Name *</Label>
                <Input
                  id="edit_customer_name"
                  value={formData.customer_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_customer_phone">Phone Number *</Label>
                <Input
                  id="edit_customer_phone"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_customer_email">Email</Label>
              <Input
                id="edit_customer_email"
                type="email"
                value={formData.customer_email}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_customer_address">Address</Label>
              <Input
                id="edit_customer_address"
                value={formData.customer_address}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_address: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_interested_item">Interested Item</Label>
                <Select value={formData.interested_item_id} onValueChange={(value) => setFormData(prev => ({ ...prev, interested_item_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select item" />
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
                <Label htmlFor="edit_status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="interested">Interested</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
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
              <Label>Follow-up Date</Label>
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
              <Label htmlFor="edit_notes">Notes</Label>
              <Textarea
                id="edit_notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              >
                {loading ? "Updating..." : "Update Lead"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
