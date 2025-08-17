"use client";

import React from 'react';
import type { User } from '@/lib/types';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { cn } from '@/lib/utils';

interface CurrentUserProps {
  currentUser: User;
  className?: string;
}

const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
}

export default function CurrentUser({ currentUser, className }: CurrentUserProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
        <Avatar className="h-8 w-8">
            <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
        </Avatar>
        <div className="text-left hidden md:block">
            <div className="font-medium text-sm text-foreground">{currentUser.name}</div>
            <div className="text-xs text-muted-foreground capitalize">{currentUser.role.replace('_', ' ')}</div>
        </div>
    </div>
  );
}
