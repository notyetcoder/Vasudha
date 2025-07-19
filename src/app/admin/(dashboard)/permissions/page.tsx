
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AddAdminForm from '@/components/AddAdminForm';
import { useToast } from '@/hooks/use-toast';
import type { AdminUser } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, KeyRound } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAdmin } from '@/context/AdminContext';
import { removeAdmin, getAdmins } from '@/actions/auth';
import AdminLayout from '@/components/AdminLayout';


export default function PermissionsPage() {
  const { adminUser } = useAdmin();
  const { toast } = useToast();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<AdminUser | null>(null);

  const fetchAdmins = useCallback(async () => {
    if (adminUser?.role !== 'super-admin') return;
    try {
        const adminList = await getAdmins();
        setAdmins(adminList);
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Failed to load admins',
            description: 'There was an error fetching the admin data.',
        });
    }
  }, [adminUser, toast]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleAdminAdded = () => {
    fetchAdmins();
    setIsAddDialogOpen(false);
  }

  const openDeleteDialog = (admin: AdminUser) => {
    setAdminToDelete(admin);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteAdmin = async () => {
    if (!adminToDelete || !adminUser) return;

    const result = await removeAdmin(adminToDelete.id, adminUser.id);
    if (result.success) {
      toast({
        title: 'Admin Removed',
        description: result.message,
      });
      fetchAdmins(); // Refresh list
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.message,
      });
    }
    setIsDeleteDialogOpen(false);
    setAdminToDelete(null);
  };


  if (!adminUser) {
    // Should be handled by layout, but as a fallback.
    return null;
  }

  // A non-super-admin should not see this page's content.
  // The link to this page is already hidden in the layout for editors.
  if (adminUser.role !== 'super-admin') {
     return (
        <AdminLayout>
            <div className="flex flex-col items-center justify-center h-full text-center">
                <KeyRound className="h-16 w-16 text-muted-foreground mb-4" />
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground">You do not have permission to manage other administrators.</p>
            </div>
        </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight text-primary mb-2">
            User Permissions
          </h1>
          <p className="text-muted-foreground">
            Manage admin users and their roles.
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Editor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>Add New Editor</DialogTitle>
              <DialogDescription>
                Fill in the details to create a new editor. This will create a user in Firebase Authentication.
              </DialogDescription>
            </DialogHeader>
            <AddAdminForm onAdminAdded={handleAdminAdded} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Users</CardTitle>
          <CardDescription>
            List of users with access to this admin panel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">{admin.name}</TableCell>
                  <TableCell>{admin.username}</TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>
                    <Badge variant={admin.role === 'super-admin' ? 'default' : 'secondary'}>
                      {admin.role.replace('-', ' ')}
                    </Badge>
                  </TableCell>
                   <TableCell className="text-right">
                    {admin.id !== adminUser.id && (
                       <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(admin)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Delete Admin</span>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the admin account for{' '}
              <span className="font-bold">{adminToDelete?.name}</span> from both Firestore and Firebase Authentication.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAdminToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAdmin} className="bg-destructive hover:bg-destructive/90">
              Yes, delete admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
