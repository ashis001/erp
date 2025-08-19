
"use client";
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Key, Trash2, UserCheck, UserX, User as UserIcon, Mail, Shield } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
// Note: Using console.log for now, can be replaced with proper toast notifications later
import type { User } from '@/lib/types';
import { deleteUser, toggleUserStatus } from '@/lib/actions';
import AddAdminDialog from './add-admin-dialog';
import ResetPasswordDialog from './reset-password-dialog';

interface UserManagementTableProps {
  allUsers: User[];
}

export default function UserManagementTable({ allUsers }: UserManagementTableProps) {
    const [isAddAdminOpen, setAddAdminOpen] = useState(false);
    const [isResetPasswordOpen, setResetPasswordOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const handleToggleStatus = async (user: User) => {
        try {
            const result = await toggleUserStatus(user.id);
            if (result.error) {
                console.error('Error toggling user status:', result.error);
                alert(result.error);
            } else {
                console.log('Success:', result.success);
                window.location.reload(); // Refresh to show updated data
            }
        } catch (error) {
            console.error('Error toggling user status:', error);
            alert('Failed to update user status');
        }
    };

    const handleDeleteUser = async (user: User) => {
        try {
            const result = await deleteUser(user.id);
            if (result.error) {
                console.error('Error deleting user:', result.error);
                alert(result.error);
            } else {
                console.log('Success:', result.success);
                window.location.reload(); // Refresh to show updated data
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Failed to delete user');
        }
    };

    const handleResetPassword = (user: User) => {
        setSelectedUser(user);
        setResetPasswordOpen(true);
    };

  return (
    <>
      <Card>
        <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Create and manage admin accounts.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => setAddAdminOpen(true)} className="bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add New Admin
                    </Button>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allUsers.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {user.role.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? 'default' : 'secondary'}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0" disabled={user.role === 'superadmin'}>
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                            {user.is_active ? (
                              <>
                                <UserX className="mr-2 h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                            <Key className="mr-2 h-4 w-4" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the user account for {user.name}.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteUser(user)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {allUsers.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <UserIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Users Yet</h3>
                  <p className="text-muted-foreground">
                    Add your first admin to get started.
                  </p>
                </CardContent>
              </Card>
            ) : (
              allUsers.map(user => (
                <Card key={user.id} className="border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <div className="flex items-center mb-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <UserIcon className="h-5 w-5 text-orange-500 flex-shrink-0" />
                        <h3 className="font-semibold text-lg truncate">{user.name}</h3>
                      </div>
                      <div className="flex items-center gap-2 ml-auto">
                        <Badge variant={user.is_active ? 'default' : 'secondary'} className="whitespace-nowrap">
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {user.role !== 'superadmin' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-orange-100 hover:text-orange-600 flex-shrink-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                                {user.is_active ? (
                                  <>
                                    <UserX className="mr-2 h-4 w-4" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                                <Key className="mr-2 h-4 w-4" />
                                Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the user account for {user.name}.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteUser(user)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-muted-foreground">Email:</span>
                        <span className="text-sm font-medium truncate">{user.email}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-purple-500" />
                        <span className="text-sm text-muted-foreground">Role:</span>
                        <Badge variant="outline" className="capitalize">
                          {user.role.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      
      <AddAdminDialog 
        isOpen={isAddAdminOpen} 
        onClose={() => setAddAdminOpen(false)}
      />
      
      <ResetPasswordDialog 
        isOpen={isResetPasswordOpen} 
        onClose={() => setResetPasswordOpen(false)}
        user={selectedUser}
      />
    </>
  );
}
