
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, CheckCircle, Eye, Upload, Download, Code, Users, UserCheck, UserPlus, FileUp, FileDown, Leaf, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import Image from 'next/image';
import type { User, AdminUser } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { useState, useRef, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';
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
import UserFormModal from './UserFormModal';
import { approveUserAction, deleteUserAction, importUsersAction, updateUserAction } from '@/actions/users';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';
import { Input } from './ui/input';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from './ui/tooltip';


function UsersTable({ users: userList, allUsers, isPending, onEdit, onDelete, onApprove, adminUser, onPageChange, currentPage, hasNextPage, hasPrevPage, searchTerm }: { users: User[]; allUsers: User[]; isPending: boolean; onEdit: (user: User) => void; onDelete: (user: User) => void; onApprove: (user: User) => void; adminUser: AdminUser; onPageChange?: (direction: 'next' | 'prev') => void; currentPage?: number; hasNextPage?: boolean; hasPrevPage?: boolean; searchTerm?: string }) {
  
  const canEdit = adminUser.role === 'super-admin' || adminUser.role === 'editor';
  const canDelete = adminUser.role === 'super-admin' || adminUser.role === 'editor'; // Editors can also move to dustbin
  const canApprove = adminUser.role === 'super-admin' || adminUser.role === 'editor';
  
  const { adminUser: loggedInAdmin } = useAdmin();

  const isUserEditable = (user: User) => {
    if (loggedInAdmin?.role === 'super-admin') {
      return true;
    }
    if (loggedInAdmin?.role === 'editor') {
      if (loggedInAdmin.permissions?.access === 'all') {
        return true;
      }
      if (loggedInAdmin.permissions?.access === 'specific') {
        const allowedSurnames = loggedInAdmin.permissions.surnames;
        const allowedFamilies = loggedInAdmin.permissions.families;

        if (allowedSurnames.includes(user.surname) || allowedSurnames.includes(user.maidenName)) {
            const surnameForFamilyCheck = allowedSurnames.includes(user.surname) ? user.surname : user.maidenName;
            const familiesForSurname = allowedFamilies[surnameForFamilyCheck];
            
            if (Array.isArray(familiesForSurname)) {
                return familiesForSurname.includes(user.family);
            }
        }
        return false;
      }
    }
    return false;
  };
  
  const sortedSurnames = useMemo(() => {
    const maidenNames = allUsers.map(u => u.maidenName).filter(Boolean);
    const currentSurnames = allUsers.map(u => u.surname).filter(Boolean);
    return [...new Set([...maidenNames, ...currentSurnames])].sort((a, b) => b.length - a.length);
  }, [allUsers]);

  const parseFirstName = (fullName?: string) => {
      if (!fullName) return '';
      return fullName;
  };
  
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return userList;
    const lowercasedTerm = searchTerm.toLowerCase();
    return userList.filter(user => {
        const searchString = [user.name, user.surname, user.maidenName, user.family].filter(Boolean).join(' ').toLowerCase();
        return searchString.includes(lowercasedTerm);
    });
  }, [userList, searchTerm]);

  return (
    <div className="overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[250px]">User</TableHead>
          <TableHead className="w-[100px]">Birth Date</TableHead>
          <TableHead className="w-[180px]">Parents</TableHead>
          <TableHead className="w-[150px]">Spouse</TableHead>
          <TableHead className="w-[120px]">Status</TableHead>
          <TableHead className="text-right w-[160px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredUsers.map((user) => (
          <TableRow key={user.id} className={!isUserEditable(user) ? 'opacity-50' : ''}>
            <TableCell>
              <div className="flex items-center gap-4">
                <Image
                  src={user.profilePictureUrl}
                  alt={user.name}
                  width={40}
                  height={40}
                  data-ai-hint="user avatar"
                  className={cn("rounded-full", user.isDeceased && 'grayscale')}
                />
                <div>
                  <div className="font-medium truncate flex items-center gap-1.5">
                    {user.isDeceased && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Leaf className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Deceased</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {user.name} {user.surname}
                  </div>
                  <p className="text-sm text-muted-foreground capitalize">
                    {user.gender}
                  </p>
                </div>
              </div>
            </TableCell>
            <TableCell>
              {user.birthMonth && user.birthYear ? (
                  <>
                    <div className="font-medium">{user.birthMonth.substring(0, 3).toUpperCase()}</div>
                    <div className="text-xs text-muted-foreground">{user.birthYear}</div>
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground">N/A</div>
                )
              }
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-muted-foreground">F:</span>
                    <p className="font-medium truncate">{parseFirstName(user.fatherName) || 'N/A'}</p>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-muted-foreground">M:</span>
                    <p className="text-sm text-muted-foreground truncate">{parseFirstName(user.motherName) || 'N/A'}</p>
                </div>
            </TableCell>
            <TableCell>
                <p className="truncate">{parseFirstName(user.spouseName) || 'N/A'}</p>
            </TableCell>
            <TableCell>
              <Badge variant={user.status === 'approved' ? 'default' : 'secondary'} className="capitalize">{user.status}</Badge>
            </TableCell>
            <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                    {isPending && canApprove && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onApprove(user)} disabled={!isUserEditable(user)}>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="sr-only">Approve</span>
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link href={`/profile/${user.id}`} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Link>
                    </Button>
                    {canEdit && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(user)} disabled={!isUserEditable(user)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                      </Button>
                    )}
                    {canDelete && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(user)} disabled={!isUserEditable(user)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Delete</span>
                      </Button>
                    )}
                </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    {onPageChange && filteredUsers.length === userList.length && (
        <div className="flex items-center justify-end space-x-2 py-4 px-4 border-t">
             <span className="text-sm text-muted-foreground">Page {currentPage}</span>
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange('prev')}
                disabled={!hasPrevPage}
            >
                <ChevronLeft className="h-4 w-4" />
                Previous
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange('next')}
                disabled={!hasNextPage}
            >
                Next
                 <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    )}
    </div>
  );
}

type AdminDashboardProps = {
  allUsers: User[];
  totalUsers: number;
  pendingUsers: User[];
  approvedUsers: User[];
  adminUser: AdminUser;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onDataChange: () => void;
};

const USERS_PER_PAGE = 50;

export default function AdminDashboard({ allUsers, totalUsers, pendingUsers, approvedUsers, adminUser, activeTab, setActiveTab, onDataChange }: AdminDashboardProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [allUsersPage, setAllUsersPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    const paginatedAllUsers = useMemo(() => {
        const start = (allUsersPage - 1) * USERS_PER_PAGE;
        const end = start + USERS_PER_PAGE;
        return allUsers.slice(start, end);
    }, [allUsers, allUsersPage]);

    const handleAllUsersPageChange = (direction: 'next' | 'prev') => {
        if (direction === 'next') {
            if (allUsersPage * USERS_PER_PAGE < allUsers.length) {
                setAllUsersPage(prev => prev + 1);
            }
        } else {
            if (allUsersPage > 1) {
                setAllUsersPage(prev => prev - 1);
            }
        }
    };


    const handleExport = () => {
        const usersToExport = [...pendingUsers, ...approvedUsers];
        const fields = [
            "name", "maidenName", "surname", "family", "gender", 
            "maritalStatus", "fatherName", "motherName", "spouseName", 
            "birthMonth", "birthYear", "description", "isDeceased", "deathDate"
        ];
        // We are explicitly omitting profilePictureUrl here as it can cause errors if it's a long data URI
        const dataForCsv = usersToExport.map(user => {
            const { profilePictureUrl, ...rest } = user;
            return rest;
        })

        const csvData = Papa.unparse({ fields, data: dataForCsv });
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `vasudha_users_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadTemplate = () => {
      const headers = ["name", "maidenName", "surname", "family", "gender", "maritalStatus", "fatherName", "motherName", "spouseName", "birthMonth", "birthYear", "description", "profilePictureUrl", "isDeceased", "deathDate"];
      const csv = Papa.unparse([headers]);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "vasudha_import_template.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                if (!text) throw new Error("File is not readable");

                let importedData;
                if (file.type === 'text/csv') {
                    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
                    if(parsed.errors.length > 0){
                       throw new Error(`CSV Parsing Error: ${parsed.errors[0].message}`);
                    }
                    importedData = parsed.data;
                } else { // Assume JSON
                    importedData = JSON.parse(text);
                }
                
                if (!Array.isArray(importedData) || (importedData.length > 0 && !importedData.every(item => 'name' in item && 'surname' in item))) {
                    throw new Error("Invalid file format. Expected an array of user objects.");
                }

                const result = await importUsersAction(importedData as User[]);
                if (result.success) {
                    toast({ title: "Success", description: result.message });
                    onDataChange();
                } else {
                    toast({ variant: "destructive", title: "Import Failed", description: result.message });
                }

            } catch (error) {
                const message = error instanceof Error ? error.message : "An unknown error occurred.";
                toast({ variant: "destructive", title: "Import Failed", description: message });
            } finally {
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };
        reader.readAsText(file);
    };

    const handleEditUser = (user: User) => {
      setEditingUser(user);
    }

    const handleSaveUser = async (updatedUser: User) => {
      const result = await updateUserAction(updatedUser);
      if (result.success) {
        toast({ title: "Success", description: "User data updated successfully." });
        setEditingUser(null);
        onDataChange();
      } else {
        toast({ variant: "destructive", title: "Update Failed", description: "Could not update user." });
      }
    }
    
    const handleApproveUser = async (user: User) => {
        const result = await approveUserAction(user.id);
        if (result.success) {
            toast({ title: "Profile Approved", description: `${user.name} is now visible.` });
            onDataChange();
        } else {
            toast({ variant: "destructive", title: "Approval Failed" });
        }
    }

    const handleInitiateDelete = (user: User) => {
        setUserToDelete(user);
    };

    const handleConfirmDelete = async () => {
        if (!userToDelete) return;
        const result = await deleteUserAction(userToDelete.id);
        if (result.success) {
            toast({ title: "User Moved to Dustbin", description: `The profile for ${userToDelete.name} ${userToDelete.surname} can be recovered from the Dustbin.`});
            onDataChange();
        } else {
            toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete user."});
        }
        setUserToDelete(null);
    };
    
    const StatCard = ({ title, value, icon, onClick, isActive }: { title: string, value: number, icon: React.ReactNode, onClick: () => void, isActive: boolean }) => (
        <button onClick={onClick} className={cn("w-full text-left", !isActive && "opacity-70 hover:opacity-100 transition-opacity")}>
            <Card className={cn(isActive && "ring-2 ring-primary")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    {icon}
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{value}</div>
                </CardContent>
            </Card>
        </button>
    );
    
    return (
        <TooltipProvider>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
                <StatCard
                    title="Pending Approval"
                    value={pendingUsers.length}
                    icon={<UserPlus className="h-4 w-4 text-muted-foreground" />}
                    onClick={() => setActiveTab('pending')}
                    isActive={activeTab === 'pending'}
                />
                <StatCard
                    title="Approved Profiles"
                    value={approvedUsers.length}
                    icon={<UserCheck className="h-4 w-4 text-muted-foreground" />}
                    onClick={() => setActiveTab('approved')}
                    isActive={activeTab === 'approved'}
                />
                <StatCard
                    title="Total Profiles"
                    value={totalUsers}
                    icon={<Users className="h-4 w-4 text-muted-foreground" />}
                    onClick={() => setActiveTab('all')}
                    isActive={activeTab === 'all'}
                />
            </div>
            
             <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="relative w-full md:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by name, surname, family..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className='flex gap-2 flex-wrap'>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv,.json" />
                    <Button variant="outline" onClick={handleUploadClick}><FileUp className="mr-2 h-4 w-4" /> Import</Button>
                    <Button variant="outline" onClick={handleExport}><FileDown className="mr-2 h-4 w-4" /> Export All</Button>
                    <Button variant="outline" onClick={handleDownloadTemplate}><Download className="mr-2 h-4 w-4" /> Get Template</Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList>
                    <TabsTrigger value="pending">Pending ({pendingUsers.length})</TabsTrigger>
                    <TabsTrigger value="approved">Approved ({approvedUsers.length})</TabsTrigger>
                    <TabsTrigger value="all">All ({allUsers.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="pending">
                     <Card><CardContent className="p-0"><UsersTable users={pendingUsers} allUsers={allUsers} isPending={true} adminUser={adminUser} onEdit={handleEditUser} onDelete={handleInitiateDelete} onApprove={handleApproveUser} searchTerm={searchTerm} /></CardContent></Card>
                </TabsContent>
                <TabsContent value="approved">
                     <Card><CardContent className="p-0"><UsersTable users={approvedUsers} allUsers={allUsers} isPending={false} adminUser={adminUser} onEdit={handleEditUser} onDelete={handleInitiateDelete} onApprove={handleApproveUser} searchTerm={searchTerm} /></CardContent></Card>
                </TabsContent>
                 <TabsContent value="all">
                    <Card>
                        <CardContent className="p-0">
                            <UsersTable 
                                users={paginatedAllUsers} 
                                allUsers={allUsers} 
                                isPending={false} 
                                adminUser={adminUser} 
                                onEdit={handleEditUser} 
                                onDelete={handleInitiateDelete} 
                                onApprove={handleApproveUser}
                                onPageChange={handleAllUsersPageChange}
                                currentPage={allUsersPage}
                                hasPrevPage={allUsersPage > 1}
                                hasNextPage={allUsersPage * USERS_PER_PAGE < allUsers.length}
                                searchTerm={searchTerm}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <UserFormModal mode="edit" isOpen={!!editingUser} onClose={() => setEditingUser(null)} user={editingUser!} onSave={handleSaveUser} />

            <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will move the profile for <span className="font-bold">{userToDelete?.name} {userToDelete?.surname}</span> to the Dustbin. You can recover it for 30 days.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">Yes, move to Dustbin</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </TooltipProvider>
    );
}
