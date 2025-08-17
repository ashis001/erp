
"use client";
import React, { useState, useEffect } from 'react';
import Header from '@/components/dashboard/header';
import AuditLogTable from '@/components/dashboard/audit/audit-log-table';
import { getAuditLogs, getUsers } from '@/lib/actions';
import type { User } from '@/lib/types';
import { usePathname } from 'next/navigation';

export default function AuditLogPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const pathname = usePathname();

  useEffect(() => {
    setIsClient(true);
    getUsers().then(fetchedUsers => {
        if (fetchedUsers.length === 0) return;
        setUsers(fetchedUsers);
        const savedUserId = localStorage.getItem('currentUser');
        if (savedUserId) {
            const user = fetchedUsers.find(u => u.id === parseInt(savedUserId));
            if (user) {
                setCurrentUser(user);
            } else if (fetchedUsers.length > 0) {
                setCurrentUser(fetchedUsers[0]);
            }
        } else if (fetchedUsers.length > 0) {
            setCurrentUser(fetchedUsers[0]);
        }
    });
  }, []);

  useEffect(() => {
    if (currentUser?.role === 'superadmin') {
        getAuditLogs().then(setLogs);
    }
  }, [currentUser]);


  const handleUserChange = (user: User) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem('currentUser', user.id.toString());
    } else {
      localStorage.removeItem('currentUser');
    }
  };

  if (!isClient || !currentUser || users.length === 0) {
    return null;
  }
  
  const canViewLogs = currentUser.role === 'superadmin';

  return (
    <div className="flex h-full flex-col">
      <Header users={users} currentUser={currentUser} onUserChange={handleUserChange} pathname={pathname} />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        {canViewLogs ? (
            <AuditLogTable logData={logs} />
        ) : (
            <div className="flex items-center justify-center h-full">
                <p>You do not have permission to view audit logs.</p>
            </div>
        )}
      </main>
    </div>
  );
}
