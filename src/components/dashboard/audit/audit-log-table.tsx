
"use client";
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface LogDataItem {
  id: number;
  userName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ASSIGN' | 'SELL';
  entity_type: string;
  entity_id: number;
  timestamp: string;
}

interface AuditLogTableProps {
  logData: LogDataItem[];
}

const actionColors: Record<LogDataItem['action'], 'default' | 'secondary' | 'destructive'> = {
    CREATE: 'default',
    UPDATE: 'secondary',
    DELETE: 'destructive',
    ASSIGN: 'default',
    SELL: 'secondary'
}

const getActionVariant = (action: LogDataItem['action']): "default" | "secondary" | "destructive" | "outline" => {
    switch(action) {
        case 'CREATE': return 'default';
        case 'UPDATE': return 'secondary';
        case 'ASSIGN': return 'default';
        case 'SELL': return 'secondary';
        case 'DELETE': return 'destructive';
        default: return 'outline';
    }
}


export default function AuditLogTable({ logData }: AuditLogTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Logs</CardTitle>
        <CardDescription>A record of all actions taken in the system.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logData.length > 0 ? logData.map(log => (
              <TableRow key={log.id}>
                <TableCell>{format(new Date(log.timestamp), 'Pp')}</TableCell>
                <TableCell>{log.userName}</TableCell>
                <TableCell>
                    <Badge variant={getActionVariant(log.action)}>{log.action}</Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">{log.entity_type} #{log.entity_id}</TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24">No audit logs found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
