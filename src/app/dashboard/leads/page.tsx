"use client";
import React, { useState, useEffect } from 'react';
import Header from '@/components/dashboard/header';
import LeadsTable from '@/components/dashboard/leads/leads-table';
import type { User, Lead } from '@/lib/types';
import { usePathname } from 'next/navigation';
import { getLeadsPageData } from '@/lib/actions';
import { Loader2 } from 'lucide-react';

export default function LeadsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [data, setData] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  const fetchData = async () => {
    setIsLoading(true);
    const result = await getLeadsPageData();
    if (result.data) {
      setData(result.data);
      if (result.data.users.length === 0) return;
      const savedUserId = localStorage.getItem('currentUser');
      if (savedUserId) {
        const user = result.data.users.find((u: User) => u.id === parseInt(savedUserId));
        if (user) {
          setCurrentUser(user);
        }
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    setIsClient(true);
    fetchData();
  }, []);

  const handleUserChange = (user: User | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem('currentUser', user.id.toString());
    } else {
      localStorage.removeItem('currentUser');
    }
  };

  if (!isClient || isLoading || !data || data.users.length === 0 || !currentUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Filter leads based on user role
  const filteredLeads = currentUser.role === 'superadmin' 
    ? data.leads 
    : data.leads.filter((lead: Lead) => lead.admin_user_id === currentUser.id);

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      <Header currentUser={currentUser} pathname={pathname} />
      <div className="flex-1 p-4 md:p-6 overflow-hidden relative z-10">
        <LeadsTable 
          leads={filteredLeads}
          users={data.users}
          items={data.items}
          currentUser={currentUser}
          onRefresh={fetchData}
        />
      </div>
    </div>
  );
}
