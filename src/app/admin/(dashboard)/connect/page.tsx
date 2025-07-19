
'use client';
import React, { useEffect, useState, useCallback } from 'react';
import ConnectRelationsDashboard from '@/components/ConnectRelationsDashboard';
import type { User } from '@/lib/types';
import { useAdmin } from '@/context/AdminContext';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import AdminLayout from '@/components/AdminLayout';
import { getUsers } from '@/actions/users';

const ConnectPageSkeleton = () => (
    <div className="p-6">
        <div className="flex flex-wrap gap-4 items-center mb-6">
            <Skeleton className="h-10 w-full sm:w-64" />
            <Skeleton className="h-10 w-full sm:w-40" />
            <Skeleton className="h-10 w-full sm:w-40" />
            <Skeleton className="h-5 w-24" />
            <div className="ml-auto flex gap-2">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
            </div>
        </div>
        <div className="border rounded-lg">
            <Skeleton className="h-14 w-full" />
            <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
        </div>
    </div>
);

export default function ConnectPage() {
  const { adminUser } = useAdmin();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
        const users = await getUsers();
        // The connect page needs all non-deleted users for linking
        const relevantUsers = users.filter(user => user.status !== 'deleted');
        setAllUsers(relevantUsers);
    } catch (error) {
       console.error("Failed to fetch users:", error);
        toast({
            variant: 'destructive',
            title: 'Failed to load data',
            description: 'Could not fetch user profiles. Check console for details.',
        });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (adminUser) {
      fetchUsers();
    }
  }, [adminUser, fetchUsers]);


  if (isLoading || !adminUser) {
    return (
      <AdminLayout onDataChange={fetchUsers}>
        <ConnectPageSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout onDataChange={fetchUsers}>
      <ConnectRelationsDashboard allUsers={allUsers} adminUser={adminUser} onDataChange={fetchUsers} />
    </AdminLayout>
  );
}
