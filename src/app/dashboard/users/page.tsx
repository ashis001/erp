
"use client";
import React, { useState, useEffect } from 'react';
import Header from '@/components/dashboard/header';
import type { User } from '@/lib/types';
import { usePathname } from 'next/navigation';
import UserManagementTable from '@/components/dashboard/superadmin/user-management-table';
import { getUsers } from '@/lib/actions';

export default function UsersPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsClient(true);
    getUsers().then(fetchedUsers => {
        if (fetchedUsers.length === 0) return;
        setAllUsers(fetchedUsers);
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

  const handleUserChange = (user: User) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem('currentUser', user.id.toString());
    } else {
      localStorage.removeItem('currentUser');
    }
  };

  if (!isClient || !currentUser || allUsers.length === 0) {
    return null;
  }
  
  const canViewPage = currentUser.role === 'superadmin';

  return (
    <div className="flex h-full flex-col">
      <Header users={allUsers} currentUser={currentUser} onUserChange={handleUserChange} pathname={pathname} />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        {canViewPage ? (
            <UserManagementTable allUsers={allUsers} />
        ) : (
            <div className="flex items-center justify-center h-full">
                <p>You do not have permission to view this page.</p>
            </div>
        )}
      </main>
    </div>
  );
}
