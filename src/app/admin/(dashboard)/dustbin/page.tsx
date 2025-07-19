
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAdmin } from '@/context/AdminContext';
import type { User } from '@/lib/types';
import AdminLayout from '@/components/AdminLayout';
import { permanentlyDeleteUserAction, recoverUserAction } from '@/actions/users';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Trash2, Undo, AlertTriangle, Loader2 } from 'lucide-react';
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
import { differenceInDays, parseISO } from 'date-fns';
import { getUsers } from '@/actions/users';


const DustbinPageSkeleton = () => (
    <AdminLayout>
        <div className="animate-pulse">
            <div className="h-8 w-48 bg-muted rounded mb-2"></div>
            <div className="h-6 w-64 bg-muted rounded mb-8"></div>
            <div className="border rounded-lg">
                <div className="h-14 bg-muted/50 rounded-t-lg"></div>
                <div className="p-4 space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-12 w-full bg-muted rounded"></div>
                    ))}
                </div>
            </div>
        </div>
    </AdminLayout>
);


export default function DustbinPage() {
    const { adminUser } = useAdmin();
    const { toast } = useToast();
    const [deletedUsers, setDeletedUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [isProcessing, setIsProcessing] = useState(false);

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isRecoverDialogOpen, setIsRecoverDialogOpen] = useState(false);

    const fetchDeletedUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const allUsers = await getUsers();
            setDeletedUsers(allUsers.filter(u => u.status === 'deleted'));
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Failed to load data',
                description: 'Could not fetch deleted users.',
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (adminUser) {
            fetchDeletedUsers();
        }
    }, [fetchDeletedUsers, adminUser]);

    const handleDataChange = () => {
        fetchDeletedUsers();
    };


    const handleSelectAll = (checked: boolean | 'indeterminate') => {
        if (checked === true) {
            setSelectedUserIds(new Set(deletedUsers.map(u => u.id)));
        } else {
            setSelectedUserIds(new Set());
        }
    };

    const handleSelectOne = (userId: string, checked: boolean) => {
        const newSet = new Set(selectedUserIds);
        if (checked) newSet.add(userId);
        else newSet.delete(userId);
        setSelectedUserIds(newSet);
    };

    const handlePermanentDelete = async () => {
        if (adminUser?.role !== 'super-admin' || selectedUserIds.size === 0) return;
        setIsProcessing(true);
        
        const idsToDelete = Array.from(selectedUserIds);
        const promises = idsToDelete.map(id => permanentlyDeleteUserAction(id));
        await Promise.all(promises);

        toast({
            title: "Users Permanently Deleted",
            description: `${idsToDelete.length} user(s) have been removed from the database.`,
        });

        setSelectedUserIds(new Set());
        handleDataChange();
        setIsProcessing(false);
        setIsDeleteDialogOpen(false);
    };

    const handleRecover = async () => {
        if (selectedUserIds.size === 0) return;
        setIsProcessing(true);

        const idsToRecover = Array.from(selectedUserIds);
        const promises = idsToRecover.map(id => recoverUserAction(id));
        await Promise.all(promises);

        toast({
            title: "Users Recovered",
            description: `${idsToRecover.length} user(s) have been restored and set to 'approved'.`,
        });

        setSelectedUserIds(new Set());
        handleDataChange();
        setIsProcessing(false);
        setIsRecoverDialogOpen(false);
    };
    
    const getDaysLeft = (deletedAt?: string) => {
        if (!deletedAt) return 30;
        try {
            const deletionDate = parseISO(deletedAt);
            const daysPassed = differenceInDays(new Date(), deletionDate);
            const daysLeft = 30 - daysPassed;
            return daysLeft < 0 ? 0 : daysLeft;
        } catch {
            return 30;
        }
    };

    if (isLoading) {
        return <DustbinPageSkeleton />;
    }

    return (
        <AdminLayout onDataChange={handleDataChange}>
            <div>
                <h1 className="font-headline text-3xl font-bold tracking-tight text-primary mb-2">Dustbin</h1>
                <p className="text-muted-foreground">
                    Deleted profiles are kept here for 30 days before permanent deletion.
                </p>
            </div>

            <div className="border rounded-lg mt-8">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    onCheckedChange={handleSelectAll}
                                    checked={deletedUsers.length > 0 && selectedUserIds.size === deletedUsers.length ? true : selectedUserIds.size > 0 ? 'indeterminate' : false}
                                />
                            </TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Date Deleted</TableHead>
                            <TableHead>Time Left</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {deletedUsers.length > 0 ? (
                            deletedUsers.map(user => {
                                const daysLeft = getDaysLeft(user.deletedAt);
                                return (
                                    <TableRow key={user.id} data-state={selectedUserIds.has(user.id) ? 'selected' : ''}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedUserIds.has(user.id)}
                                                onCheckedChange={(checked) => handleSelectOne(user.id, !!checked)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-4">
                                                <Image src={user.profilePictureUrl} alt={user.name} width={40} height={40} className="rounded-full" />
                                                <div>
                                                    <p className="font-medium">{user.name} {user.surname}</p>
                                                    <p className="text-sm text-muted-foreground">{user.id}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{user.deletedAt ? new Date(user.deletedAt).toLocaleDateString() : 'N/A'}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {daysLeft <= 7 && <AlertTriangle className="h-4 w-4 text-destructive" />}
                                                <span className={daysLeft <= 7 ? 'text-destructive font-medium' : ''}>
                                                    {daysLeft} days
                                                </span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    The dustbin is empty.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {selectedUserIds.size > 0 && (
                <div className="sticky bottom-0 mt-4 p-4 bg-background/80 backdrop-blur-sm border rounded-lg shadow-lg flex justify-between items-center">
                    <p className="text-sm font-medium">{selectedUserIds.size} user(s) selected</p>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsRecoverDialogOpen(true)} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Undo className="mr-2 h-4 w-4" />}
                            Recover
                        </Button>
                        {adminUser?.role === 'super-admin' && (
                             <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} disabled={isProcessing}>
                                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                Delete Permanently
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Permanent Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete {selectedUserIds.size} user(s). This action is irreversible. All associated data will be removed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handlePermanentDelete} className="bg-destructive hover:bg-destructive/90">
                            Yes, delete permanently
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            {/* Recover Confirmation Dialog */}
            <AlertDialog open={isRecoverDialogOpen} onOpenChange={setIsRecoverDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Recover selected users?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will restore {selectedUserIds.size} user(s) to 'approved' status, making them visible on the site again.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRecover}>Yes, recover</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </AdminLayout>
    );
}
