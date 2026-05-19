
'use client';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { User } from '@/lib/types';
import type { ConnectPageSearchParams } from '../page';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Checkbox } from '@/components/ui/checkbox';
import UserAvatar from '@/components/UserAvatar';
import {
  Search,
  Download,
  ChevronDown,
  ChevronUp,
  Link2,
  Link2Off,
  Trash2,
  Leaf,
  Edit,
  RefreshCw,
  Users,
  ChevronLeft,
  ChevronRight,
  UserX,
} from 'lucide-react';
import RelativeSelectionModal from '@/components/RelativeSelectionModal';
import UserFormModal from '@/components/UserFormModal';
import { useToast } from '@/hooks/use-toast';
import { 
    deleteUserAction, 
    updateDeceasedStatusAction, 
    updateUserAction, 
    linkSpousesAction, 
    bulkDeleteUsersAction, 
    unlinkSpousesAction, 
    getAllUsersForAdmin, 
    getAllUsersForPublic,
    clearRelationAction,
    findChildrenAction,
    findSiblingsAction,
} from '@/actions/users';
import { exportUsersToExcel } from '@/actions/export';
import FamilyConnectionDetails from '@/components/FamilyConnectionDetails';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import ConnectPageSkeleton from './ConnectPageSkeleton';
import { Separator } from '@/components/ui/separator';

type RelationType = 'fatherId' | 'motherId' | 'spouseId';

type ExpandedRowData = {
    userId: string;
    siblings: User[];
    children: User[];
} | null;

interface ConnectPageClientProps {
    initialUsers: User[];
    initialTotal: number;
    pageSize: number;
    searchParams: ConnectPageSearchParams;
}

export default function ConnectPageClient({ initialUsers, initialTotal, pageSize, searchParams }: ConnectPageClientProps) {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  
  const [allUsers, setAllUsers] = useState<User[]>(initialUsers);
  const [totalUsers, setTotalUsers] = useState(initialTotal);
  const [currentPage, setCurrentPage] = useState(Number(searchParams.page) || 1);
  const [isLoading, setIsLoading] = useState(false);

  // Full dataset for the modal — fetched once in background so admins can
  // search ALL community members when linking relatives, not just the current page.
  const [allUsersForModal, setAllUsersForModal] = useState<User[]>(initialUsers);
  const [modalDataLoaded, setModalDataLoaded] = useState(false);

  useEffect(() => {
    getAllUsersForPublic(1, 10000)
      .then(({ users }) => {
        setAllUsersForModal(users);
        setModalDataLoaded(true);
      })
      .catch(err => console.error('Background full-user fetch failed:', err));
  }, []);

  const [searchTerm, setSearchTerm] = useState(searchParams.search || '');
  const [maritalStatusFilter, setMaritalStatusFilter] = useState(searchParams.marital || 'all');
  const [deceasedFilter, setDeceasedFilter] = useState(searchParams.deceased || 'all');
  const [unlinkedOnly, setUnlinkedOnly] = useState(searchParams.unlinked === 'true');
  const [familyFilter, setFamilyFilter] = useState(searchParams.family || 'all');

  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingRelation, setEditingRelation] = useState<RelationType | null>(null);
  
  const [expandedRowData, setExpandedRowData] = useState<ExpandedRowData>(null);
  const [isRowLoading, setIsRowLoading] = useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  
  const onDataChange = useCallback(async (showToast = false, page = 1) => {
    setIsLoading(true);
    try {
        const { users: freshUsers, total } = await getAllUsersForAdmin(page, pageSize);
        setAllUsers(freshUsers);
        setTotalUsers(total);
        setCurrentPage(page);
        if (showToast) {
            toast({ title: 'Data Refreshed', description: 'The latest user data has been loaded.' });
        }
    } catch (error) {
       console.error("Failed to fetch users:", error);
        toast({
            variant: 'destructive',
            title: 'Failed to load data',
            description: error instanceof Error ? error.message : 'Could not fetch user profiles.',
        });
    } finally {
        setIsLoading(false);
    }
  }, [toast, pageSize]);
  
  // This effect syncs the component's state with the URL search params.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCurrentPage(Number(params.get('page')) || 1);
    setSearchTerm(params.get('search') || '');
    setMaritalStatusFilter(params.get('marital') || 'all');
    setDeceasedFilter(params.get('deceased') || 'all');
    setUnlinkedOnly(params.get('unlinked') === 'true');
    setFamilyFilter(params.get('family') || 'all');
  }, [searchParams]);
  
  const updateUrlParams = useCallback(() => {
      const params = new URLSearchParams();
      if (currentPage > 1) params.set('page', String(currentPage));
      if (searchTerm) params.set('search', searchTerm);
      if (maritalStatusFilter !== 'all') params.set('marital', maritalStatusFilter);
      if (deceasedFilter !== 'all') params.set('deceased', deceasedFilter);
      if (unlinkedOnly) params.set('unlinked', 'true');
      if (familyFilter !== 'all') params.set('family', familyFilter);
      
      const queryString = params.toString();
      router.push(`${pathname}?${queryString}`, { scroll: false });
  }, [router, pathname, currentPage, searchTerm, maritalStatusFilter, deceasedFilter, unlinkedOnly, familyFilter]);

  // Update URL whenever a filter changes
  useEffect(() => {
    updateUrlParams();
  }, [updateUrlParams]);

  const filteredUsers = useMemo(() => {
    // With server-side pagination, the filtering logic will eventually move to the server.
    // For now, this filters the locally held page of users.
    return allUsers
      .filter(user => {
        const searchMatch =
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.family && user.family.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const maritalMatch = maritalStatusFilter === 'all' || user.maritalStatus === maritalStatusFilter;
        const familyMatch = familyFilter === 'all' || user.family === familyFilter;
        
        let deceasedMatch = true;
        if (deceasedFilter === 'deceased') deceasedMatch = !!user.isDeceased;
        if (deceasedFilter === 'living') deceasedMatch = !user.isDeceased;

        const isMissingSpouse = user.maritalStatus === 'married' && !user.spouseId;
        const unlinkedMatch = !unlinkedOnly || isMissingSpouse;

        return searchMatch && maritalMatch && unlinkedMatch && deceasedMatch && familyMatch;
      });
  }, [allUsers, searchTerm, maritalStatusFilter, unlinkedOnly, deceasedFilter, familyFilter]);

  const totalPages = Math.ceil(totalUsers / pageSize);

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    const newSelectedIds = new Set<string>();
    if (checked === true) {
      filteredUsers.forEach(u => newSelectedIds.add(u.id));
    }
    setSelectedUserIds(newSelectedIds);
  };

  const handleSelectOne = (userId: string, checked: boolean) => {
    const newSet = new Set(selectedUserIds);
    if (checked) newSet.add(userId);
    else newSet.delete(userId);
    setSelectedUserIds(newSet);
  };
  
  const handleBulkDeceasedUpdate = async (isDeceased: boolean) => {
    const idsToUpdate = Array.from(selectedUserIds);
    if (idsToUpdate.length === 0) {
      toast({ title: "No action taken", description: "No users were selected." });
      return;
    }

    try {
        const result = await updateDeceasedStatusAction(idsToUpdate, isDeceased);
        if (result.success) {
          toast({ title: "Update Successful", description: `${idsToUpdate.length} users have been marked as ${isDeceased ? 'स्वर्गस्थ' : 'living'}.`});
          setSelectedUserIds(new Set());
          await onDataChange(false, currentPage);
        } else {
          toast({ variant: 'destructive', title: 'Update Failed', description: result.message });
        }
    } catch(err) {
        toast({ variant: 'destructive', title: 'Error', description: err instanceof Error ? err.message : 'An unexpected error occurred.' });
    }
  }

  const openRelationModal = (user: User, relation: RelationType) => {
    setEditingUser(user);
    setEditingRelation(relation);
    setIsModalOpen(true);
  };
  
  const handleClearRelation = async (user: User, relation: RelationType) => {
    try {
        let result;
        if (relation === 'spouseId') {
            result = await unlinkSpousesAction(user.id);
            if (result.success) toast({ title: 'Spouse Unlinked' });
        } else {
            result = await clearRelationAction(user.id, relation.replace('Id', '') as 'father' | 'mother');
            if (result.success) toast({ title: 'Relation Cleared' });
        }
        
        if (result && !result.success) {
            toast({ variant: 'destructive', title: 'Update Failed', description: result.message });
        }
        
        await onDataChange(false, currentPage);
    } catch(err) {
        toast({ variant: 'destructive', title: 'Error', description: err instanceof Error ? err.message : 'An unexpected error occurred.' });
    }
  };


  const handleSelectRelative = async (relative: User) => {
    if (!editingUser || !editingRelation) return;

    try {
        let result;
        if (editingRelation === 'spouseId') {
            result = await linkSpousesAction(editingUser.id, relative.id);
            if (result.success) {
                toast({ title: 'Spouses Linked', description: `${editingUser.name} and ${relative.name} are now linked.` });
            }
        } else {
            const updatedUser: User = {
                ...editingUser,
                [editingRelation]: relative.id,
                [editingRelation.replace('Id', 'Name') as 'fatherName' | 'motherName']: relative.name,
            };

            result = await updateUserAction(updatedUser);
            if (result.success) {
                toast({ title: 'Relation Updated', description: `${editingRelation.replace('Id', '')} for ${editingUser.name} has been set.` });
            }
        }
        
        if (result && !result.success) {
            toast({ variant: 'destructive', title: 'Update Failed', description: result.message });
        }

        await onDataChange(false, currentPage);
    } catch(err) {
        toast({ variant: 'destructive', title: 'Error', description: err instanceof Error ? err.message : 'An unexpected error occurred.' });
    } finally {
        setIsModalOpen(false);
        setEditingUser(null);
        setEditingRelation(null);
    }
};

  const handleManualSave = async (name: string) => {
    if (editingUser && editingRelation) {
      try {
          const relationNameKey = editingRelation.replace('Id', 'Name') as 'fatherName' | 'motherName' | 'spouseName';
          const updatedUser: User = { 
              ...editingUser, 
              [editingRelation]: null, 
              [relationNameKey]: name 
          };

          const result = await updateUserAction(updatedUser);
          if (result.success) {
            toast({ title: 'Relation Updated', description: `${relationNameKey.replace('Name', '')} for ${editingUser.name} has been set.` });
            await onDataChange(false, currentPage);
          } else {
            toast({ variant: 'destructive', title: 'Update Failed', description: result.message });
          }
      } catch(err) {
          toast({ variant: 'destructive', title: 'Error', description: err instanceof Error ? err.message : 'An unexpected error occurred.' });
      }
    }
    setIsModalOpen(false);
    setEditingUser(null);
    setEditingRelation(null);
  };

  const getModalUsers = () => {
    if (!editingRelation || !editingUser) return [];
    // Uses allUsersForModal (full dataset, background-fetched) so admins can
    // search ALL community members — not just the current paginated page.
    let potentialRelatives = allUsersForModal.filter(u => u.id !== editingUser.id);
    switch (editingRelation) {
        case 'fatherId': return potentialRelatives.filter(u => u.gender === 'male');
        case 'motherId': return potentialRelatives.filter(u => u.gender === 'female');
        case 'spouseId': {
             const unlinkedUsers = potentialRelatives.filter(u => !u.spouseId || u.spouseId === editingUser.id);
             if (editingUser.gender === 'male') return unlinkedUsers.filter(u => u.gender === 'female');
             if (editingUser.gender === 'female') return unlinkedUsers.filter(u => u.gender === 'male');
             return unlinkedUsers;
        }
        default: return [];
    }
  };

  const getModalTitle = () => {
    if (!editingRelation || !editingUser) return "Select Relative";
    const relationName = editingRelation.replace('Id', '');
    return `Select ${relationName} for ${editingUser.name} ${editingUser.surname}`;
  }

  const renderRelationCell = (user: User, relation: RelationType) => {
      const relationId = user[relation];
      const relationTypeCapitalized = relation.charAt(0).toUpperCase() + relation.slice(1).replace('Id', '');
      const relationNameKey = relation.replace('Id', 'Name') as 'fatherName' | 'motherName' | 'spouseName';
      let relationName = user[relationNameKey];
      const relatedUser = allUsers.find(u => u.id === relationId);

      const unlinkButton = (
         <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0" onClick={(e) => { e.stopPropagation(); handleClearRelation(user, relation)}}>
                    <Link2Off className="h-4 w-4 text-red-500" />
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>Unlink {relation.replace('Id','')}</p>
            </TooltipContent>
        </Tooltip>
      );

      if (relatedUser) {
          return (
              <div className="flex items-center gap-2 group w-full justify-between">
                <div className="flex items-center gap-2 truncate">
                    <Link2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{relatedUser.name}</p>
                      <p className="text-xs text-muted-foreground">{relatedUser.surname}</p>
                    </div>
                </div>
                {unlinkButton}
              </div>
          )
      }
      
      const linkButtonContent = (
          <>
            <Link2 className="h-4 w-4" /> Link {relationTypeCapitalized}
          </>
      );

      const linkButton = (
        <Button variant="link" size="sm" className="p-0 h-auto text-sm font-normal flex items-center gap-2 text-muted-foreground hover:text-foreground w-full justify-start" onClick={(e) => { e.stopPropagation(); openRelationModal(user, relation); }}>
           {linkButtonContent}
        </Button>
      );
      
      if (relationName) {
        return (
            <div className="flex items-center justify-between gap-2 w-full group">
                <Button variant="link" size="sm" className="p-0 h-auto text-sm font-normal italic text-muted-foreground text-left" onClick={(e) => { e.stopPropagation(); openRelationModal(user, relation); }}>
                    {relationName}
                </Button>
            </div>
        )
      }
      
      return linkButton;
  };

  const handleOpenFormModal = (user: User | null) => {
    setEditingUser(user);
    setIsFormModalOpen(true);
  };
  
  const handleSaveForm = async (data: any) => {
    try {
        const payload = { ...editingUser!, ...data };
        const result = await updateUserAction(payload);
        
        if (result.success) {
            toast({ title: "Success", description: `User updated.` });
            setIsFormModalOpen(false);
            await onDataChange(false, currentPage);
        } else {
            toast({ 
                variant: "destructive", 
                title: "Error", 
                description: result.message || `Could not update user.` 
            });
        }
    } catch (error) {
        console.error("An unexpected error occurred during save:", error);
        toast({
            variant: "destructive",
            title: "Unexpected Error",
            description: error instanceof Error ? error.message : "An unknown error occurred. Please try again."
        });
    }
  };


  const handleInitiateDelete = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
        const result = await deleteUserAction(userToDelete.id);
        if (result.success) {
          toast({ title: "User Deleted", description: `The profile for ${userToDelete.name} ${userToDelete.surname} has been permanently deleted.` });
          await onDataChange(false, currentPage);
        } else {
          toast({ variant: "destructive", title: "Deletion Failed", description: result.message });
        }
    } catch (err) {
         toast({ variant: 'destructive', title: 'Deletion Failed', description: err instanceof Error ? err.message : String(err) });
    } finally {
        setUserToDelete(null);
        setIsDeleteDialogOpen(false);
    }
  };
  
  const handleConfirmBulkDelete = async () => {
    const idsToDelete = Array.from(selectedUserIds);
    if (idsToDelete.length === 0) return;
    
    try {
        const result = await bulkDeleteUsersAction(idsToDelete);
        if (result.success) {
          toast({ title: "Bulk Delete Successful", description: `${idsToDelete.length} users have been permanently deleted.` });
          setSelectedUserIds(new Set());
          await onDataChange(false, currentPage);
        } else {
          toast({ variant: "destructive", title: "Bulk Deletion Failed", description: result.message });
        }
    } catch (err) {
        toast({ variant: 'destructive', title: 'Bulk Deletion Failed', description: err instanceof Error ? err.message : String(err) });
    } finally {
        setIsBulkDeleteDialogOpen(false);
    }
  };

  const handleExport = async () => {
    if (filteredUsers.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Data to Export',
        description: 'There are no users on the current page to export.',
      });
      return;
    }
    setIsExporting(true);
    try {
      const { fileContents, fileName } = await exportUsersToExcel(filteredUsers);
      const blob = new Blob([new Uint8Array(atob(fileContents).split('').map(char => char.charCodeAt(0)))], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Export Failed', description: error instanceof Error ? error.message : String(error) });
    } finally {
      setIsExporting(false);
    }
  };

  const toggleRowExpansion = async (user: User) => {
    if (expandedRowData?.userId === user.id) {
        setExpandedRowData(null);
        return;
    }

    setIsRowLoading(true);
    try {
        const [siblings, children] = await Promise.all([
            findSiblingsAction(user),
            findChildrenAction(user.id),
        ]);
        setExpandedRowData({ userId: user.id, siblings, children });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load family details.' });
        setExpandedRowData(null);
    } finally {
        setIsRowLoading(false);
    }
  };

  if (isLoading && allUsers.length === 0) {
    return <ConnectPageSkeleton />;
  }
  
  return (
    <TooltipProvider>
      <div className="h-full flex flex-col gap-4">
          <Card>
            <CardHeader className='pb-4 flex flex-row items-center justify-between'>
                <div>
                    <CardTitle>User & Connection Management</CardTitle>
                    <CardDescription>Search, filter, and manage all user profiles and their relationships.</CardDescription>
                </div>
                 <Button variant="outline" size="sm" onClick={() => onDataChange(true, currentPage)} disabled={isLoading}>
                    {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Refresh Data
                </Button>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-center gap-4">
                  <div className="relative min-w-[250px] flex-grow">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input placeholder="Search name, surname, family, or ID" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                  </div>
                  <div className='flex flex-wrap items-center gap-4 w-full md:w-auto'>
                      <Select value={maritalStatusFilter} onValueChange={setMaritalStatusFilter}>
                          <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="all">All Marital Statuses</SelectItem>
                              <SelectItem value="single">Single</SelectItem>
                              <SelectItem value="married">Married</SelectItem>
                          </SelectContent>
                      </Select>
                      <Select value={deceasedFilter} onValueChange={setDeceasedFilter}>
                          <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="All" /></SelectTrigger>
                          <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="living">Living</SelectItem><SelectItem value="deceased">स्वर्गस्थ</SelectItem></SelectContent>
                      </Select>
                      <div className="flex items-center space-x-2">
                          <Checkbox id="unlinked-only" checked={unlinkedOnly} onCheckedChange={(checked) => setUnlinkedOnly(!!checked)} />
                          <Label htmlFor="unlinked-only" className="text-sm font-medium whitespace-nowrap">Unlinked Spouses</Label>
                      </div>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <Button variant="outline" onClick={handleExport} disabled={isExporting}>
                      {isExporting ? <span className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mr-2"></span> : <Download className="mr-2 h-4 w-4" />}
                      Export Page
                    </Button>
                  </div>
              </CardContent>
          </Card>
          
          <div className="flex-1 border rounded-lg bg-background shadow-sm overflow-hidden flex flex-col">
            <div className="flex-grow overflow-auto">
              <Table>
                  <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
                    <TableRow>
                      <TableHead className="w-[50px] px-4"><Checkbox onCheckedChange={handleSelectAll} checked={ filteredUsers.length > 0 && selectedUserIds.size === filteredUsers.length ? true : selectedUserIds.size > 0 ? 'indeterminate' : false } /></TableHead>
                      <TableHead className="w-[120px]">ID</TableHead>
                      <TableHead className="min-w-[200px]">Profile</TableHead>
                      <TableHead className="min-w-[180px]">Father</TableHead>
                      <TableHead className="min-w-[180px]">Mother</TableHead>
                      <TableHead className="min-w-[180px]">Spouse</TableHead>
                      <TableHead className="text-right w-[160px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length > 0 ? filteredUsers.map(user => (
                      <React.Fragment key={user.id}>
                        <TableRow data-state={selectedUserIds.has(user.id) ? 'selected' : ''} className="group">
                          <TableCell className="px-4" onClick={(e) => e.stopPropagation()}><Checkbox checked={selectedUserIds.has(user.id)} onCheckedChange={(checked) => handleSelectOne(user.id, !!checked)} /></TableCell>
                          <TableCell>
                              <div className="text-xs text-muted-foreground">{user.id}</div>
                          </TableCell>
                          <TableCell>
                             <div className="flex items-center gap-3">
                                <UserAvatar name={user.name} profilePictureUrl={user.profilePictureUrl} size={36} isDeceased={user.isDeceased} />
                                <div>
                                    <div className="flex items-center gap-1.5">
                                      {user.isDeceased && (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Leaf className="h-3 w-3 text-muted-foreground" />
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>स्वर्गस्थ</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      )}
                                      <p className="font-medium">{user.name}</p>
                                    </div>
                                    <div className="text-sm text-muted-foreground">{user.surname}</div>
                                    <div className="text-xs text-muted-foreground capitalize">{user.gender}</div>
                                </div>
                             </div>
                          </TableCell>
                          <TableCell>{renderRelationCell(user, 'fatherId')}</TableCell>
                          <TableCell>{renderRelationCell(user, 'motherId')}</TableCell>
                          <TableCell>{user.maritalStatus === 'married' ? renderRelationCell(user, 'spouseId') : <span className='text-sm text-muted-foreground capitalize'>{user.maritalStatus}</span>}</TableCell>
                           <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleOpenFormModal(user); }}>
                                          <Edit className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Edit User</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleInitiateDelete(user); }}>
                                          <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Delete Permanently</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); toggleRowExpansion(user); }}>
                                        {expandedRowData?.userId === user.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{expandedRowData?.userId === user.id ? 'Collapse' : 'Expand'}</p>
                                    </TooltipContent>
                                  </Tooltip>
                              </div>
                           </TableCell>
                        </TableRow>
                        {expandedRowData?.userId === user.id && (
                           <TableRow className="bg-muted/50 hover:bg-muted/50">
                              <TableCell colSpan={7} className="p-4">
                                 <FamilyConnectionDetails 
                                   siblings={expandedRowData.siblings} 
                                   children={expandedRowData.children}
                                   isLoading={isRowLoading} 
                                 />
                              </TableCell>
                           </TableRow>
                        )}
                      </React.Fragment>
                    )) : (<TableRow><TableCell colSpan={7} className="text-center h-24 text-muted-foreground">No users match the current filters.</TableCell></TableRow>)}
                  </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between p-2 border-t flex-shrink-0">
                 <div className="text-sm text-muted-foreground">
                    {selectedUserIds.size} of {totalUsers} row(s) selected.
                 </div>
                 <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDataChange(false, currentPage - 1)}
                        disabled={currentPage <= 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDataChange(false, currentPage + 1)}
                        disabled={currentPage >= totalPages}
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
          </div>
        
          {selectedUserIds.size > 0 && (
              <div className="sticky bottom-0 z-10 p-3 bg-background/95 backdrop-blur-sm border-t shadow-lg rounded-t-lg mt-auto -mx-4 -mb-4 lg:-mx-6 lg:-mb-6">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <p className="text-sm font-medium"><span className="font-bold">{selectedUserIds.size}</span> selected</p>
                    <div className="flex gap-2 flex-wrap">
                       <Button variant="outline" size="sm" onClick={() => handleBulkDeceasedUpdate(true)}><Leaf className="mr-2 h-4 w-4" />Mark as स्वर्गस्थ</Button>
                       <Button variant="outline" size="sm" onClick={() => handleBulkDeceasedUpdate(false)}><UserX className="mr-2 h-4 w-4" />Mark as Living</Button>
                       <Button variant="destructive" size="sm" onClick={() => setIsBulkDeleteDialogOpen(true)}><Trash2 className="mr-2 h-4 w-4" />Delete Selected</Button>
                       <Button variant="secondary" size="sm" onClick={() => setSelectedUserIds(new Set())}>Deselect All</Button>
                    </div>
                  </div>
              </div>
          )}
        
          {isModalOpen && editingUser && <RelativeSelectionModal 
              isOpen={isModalOpen} 
              onClose={() => setIsModalOpen(false)} 
              users={getModalUsers()} 
              allUsers={allUsersForModal} 
              onSelect={handleSelectRelative} 
              onManualSave={handleManualSave} 
              title={modalDataLoaded ? getModalTitle() : `Loading all profiles… — ${getModalTitle()}`}
              selectionType={editingRelation ? editingRelation.replace('Id', '') as 'father' | 'mother' | 'spouse' : null}
              surnameToFilter={editingUser.surname}
          />}
          
          {isFormModalOpen && <UserFormModal 
            mode="edit"
            allUsers={allUsersForModal} 
            isOpen={isFormModalOpen} 
            onClose={() => { setIsFormModalOpen(false); setEditingUser(null); }} 
            user={editingUser} 
            onSave={handleSaveForm}
          />}
  
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action is permanent and cannot be undone. This will permanently delete the profile for {userToDelete?.name} {userToDelete?.surname} and all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
                    Yes, delete permanently
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
          
          <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Bulk Deletion</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete {selectedUserIds.size} user(s). This action cannot be undone. Are you sure you want to continue?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmBulkDelete} className="bg-destructive hover:bg-destructive/90">
                    Yes, delete {selectedUserIds.size} user(s)
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
