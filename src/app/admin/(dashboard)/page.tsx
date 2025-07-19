
'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AdminDashboard from '@/components/AdminDashboard';
import { useAdmin } from '@/context/AdminContext';
import type { User } from '@/lib/types';
import AdminLayout from '@/components/AdminLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getUsers } from '@/actions/users';

export default function AdminDashboardPage() {
  const { adminUser } = useAdmin();
  const { toast } = useToast();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  const fetchUsers = useCallback(async () => {
    setIsDataLoading(true);
    try {
      const users = await getUsers();
      const nonDeletedUsers = users.filter(user => user.status !== 'deleted');
      setAllUsers(nonDeletedUsers);
    } catch (error) {
       console.error("Failed to fetch users:", error);
        toast({
            variant: 'destructive',
            title: 'Failed to load data',
            description: 'Could not fetch user profiles. Check console for details.',
        });
    } finally {
        setIsDataLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    if (adminUser) {
      fetchUsers();
    }
  }, [adminUser, fetchUsers]);

  const visibleUsers = useMemo(() => {
    if (!adminUser) return [];
    if (adminUser.role === 'super-admin' || adminUser.permissions?.access === 'all') {
      return allUsers;
    }
    if (adminUser.permissions?.access === 'specific') {
      const { surnames, families } = adminUser.permissions;
      return allUsers.filter(user => {
        const userSurnames = [user.maidenName, user.surname].filter(Boolean);
        const hasSurnameAccess = userSurnames.some(s => surnames.includes(s));
        if (!hasSurnameAccess) return false;

        const surnameForFamilyCheck = surnames.includes(user.surname) ? user.surname : user.maidenName;
        const allowedFamilies = families[surnameForFamilyCheck];
        if (!allowedFamilies || !user.family) return false;

        return allowedFamilies.includes(user.family);
      });
    }
    return [];
  }, [allUsers, adminUser]);
  
  const handleDataChange = () => {
    fetchUsers();
  }

  const pendingUsers = visibleUsers.filter((user) => user.status === 'pending');
  const approvedUsers = visibleUsers.filter((user) => user.status === 'approved');
  
  if (isDataLoading || !adminUser) {
      return (
           <AdminLayout onDataChange={handleDataChange}>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
                  <Skeleton className="h-28" />
                  <Skeleton className="h-28" />
                  <Skeleton className="h-28" />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-96 w-full" />
              </div>
           </AdminLayout>
      )
  }
  
  return (
    <AdminLayout onDataChange={handleDataChange}>
      <AdminDashboard
        allUsers={visibleUsers}
        totalUsers={visibleUsers.length}
        pendingUsers={pendingUsers}
        approvedUsers={approvedUsers}
        adminUser={adminUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onDataChange={handleDataChange}
      />
    </AdminLayout>
  );
}
