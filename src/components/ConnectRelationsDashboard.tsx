
'use client';
import React, { useState, useMemo, useEffect } from 'react';
import type { User, AdminUser } from '@/lib/types';
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
import Image from 'next/image';
import Link from 'next/link';
import {
  Search,
  UserPlus,
  Download,
  AlertTriangle,
  Eye,
  ChevronDown,
  ChevronUp,
  Link2,
  Link2Off,
  Sparkles,
  Trash2,
  CheckCircle,
  XCircle,
  Leaf,
  Loader2,
} from 'lucide-react';
import RelativeSelectionModal from './RelativeSelectionModal';
import UserFormModal from './UserFormModal';
import { useToast } from '@/hooks/use-toast';
import { adminCreateUser, approveUserAction, deleteUserAction, unapproveUserAction, updateDeceasedStatusAction, updateUserAction } from '@/actions/users';
import * as XLSX from 'xlsx';
import FamilyConnectionDetails from './FamilyConnectionDetails';
import { Label } from './ui/label';
import { suggestFamilyConnections, type SuggestFamilyConnectionsOutput } from '@/ai/flows/suggest-family-connections';
import AISuggestionModal from './AISuggestionModal';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useAdmin } from '@/context/AdminContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

type RelationType = 'fatherId' | 'motherId' | 'spouseId';

export default function ConnectRelationsDashboard({ allUsers, adminUser, onDataChange }: { allUsers: User[], adminUser: AdminUser, onDataChange: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [unlinkedOnly, setUnlinkedOnly] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingRelation, setEditingRelation] = useState<RelationType | null>(null);
  const [userToPrefill, setUserToPrefill] = useState<Partial<User> | undefined>(undefined);

  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const [suggestionUser, setSuggestionUser] = useState<User | null>(null);
  const [isSuggestionLoading, setIsSuggestionLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<SuggestFamilyConnectionsOutput['suggestions']>([]);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { adminUser: loggedInAdmin } = useAdmin();
  
  const { toast } = useToast();

  const allSurnamesInDb = useMemo(() => {
    const maidenNames = allUsers.map(u => u.maidenName).filter(Boolean);
    const currentSurnames = allUsers.map(u => u.surname).filter(Boolean);
    return [...new Set([...maidenNames, ...currentSurnames])].sort((a,b) => b.length - a.length);
  }, [allUsers]);

  const getNameParts = (fullNameWithSurname?: string, userSurname?: string): { firstName: string, surname: string } => {
    if (!fullNameWithSurname) return { firstName: '', surname: '' };
    
    // If a definitive surname is provided, use it.
    if (userSurname) {
        return { firstName: fullNameWithSurname, surname: userSurname };
    }

    // Otherwise, try to parse it
    for (const surname of allSurnamesInDb) {
        if (fullNameWithSurname.endsWith(surname)) {
            const firstName = fullNameWithSurname.substring(0, fullNameWithSurname.length - surname.length).trim();
            return { firstName: firstName || 'N/A', surname };
        }
    }
    return { firstName: fullNameWithSurname, surname: '' };
  };

  const isUserVisible = (user: User) => {
    if (loggedInAdmin?.role === 'super-admin' || loggedInAdmin?.permissions?.access === 'all') {
      return true;
    }
    if (loggedInAdmin?.permissions?.access === 'specific') {
      const { surnames, families } = loggedInAdmin.permissions;
      const userSurnames = [user.maidenName, user.surname].filter(Boolean);
      const hasSurnameAccess = userSurnames.some(s => surnames.includes(s));

      if (!hasSurnameAccess) return false;

      const surnameForFamilyCheck = surnames.includes(user.surname) ? user.surname : user.maidenName;
      const allowedFamilies = families[surnameForFamilyCheck];
      if (!allowedFamilies || !user.family) return false;

      return allowedFamilies.includes(user.family);
    }
    return false;
  };
  
  const visibleUsers = useMemo(() => {
    return allUsers.filter(isUserVisible);
  }, [allUsers, loggedInAdmin]);

  const filteredUsers = useMemo(() => {
    return visibleUsers.filter(user => {
      const searchMatch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.family && user.family.toLowerCase().includes(searchTerm.toLowerCase()));
      const statusMatch = statusFilter === 'all' || user.status === statusFilter;
      const genderMatch = genderFilter === 'all' || user.gender === genderFilter;
      
      const isMissingParents = !user.fatherId || !user.motherId;
      const isMarriedAndMissingSpouse = user.maritalStatus === 'married' && !user.spouseId;
      const unlinkedMatch = !unlinkedOnly || isMissingParents || isMarriedAndMissingSpouse;

      return searchMatch && statusMatch && genderMatch && unlinkedMatch;
    });
  }, [visibleUsers, searchTerm, statusFilter, genderFilter, unlinkedOnly]);

  useEffect(() => {
    setSelectedUserIds(new Set());
  }, [searchTerm, statusFilter, genderFilter, unlinkedOnly]);

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedUserIds(new Set(filteredUsers.map(u => u.id)));
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
  
  const handleBulkApprove = async () => {
    const usersToProcess = Array.from(selectedUserIds)
      .map(id => allUsers.find(u => u.id === id))
      .filter((u): u is User => !!u && u.status === 'pending');
      
    if (usersToProcess.length === 0) {
      toast({ title: "No action taken", description: "No pending users were selected." });
      return;
    }
    const promises = usersToProcess.map(u => approveUserAction(u!.id));
    await Promise.all(promises);
    toast({ title: "Bulk Action Complete", description: `${usersToProcess.length} users have been approved.` });
    setSelectedUserIds(new Set());
    onDataChange();
  };

  const handleBulkUnapprove = async () => {
    const usersToProcess = Array.from(selectedUserIds)
      .map(id => allUsers.find(u => u.id === id))
      .filter((u): u is User => !!u && u.status === 'approved');

    if (usersToProcess.length === 0) {
      toast({ title: "No action taken", description: "No approved users were selected." });
      return;
    }
    const promises = usersToProcess.map(u => unapproveUserAction(u!.id));
    await Promise.all(promises);
    toast({ title: "Bulk Action Complete", description: `${usersToProcess.length} users have been unapproved.` });
    setSelectedUserIds(new Set());
    onDataChange();
  }

  const handleBulkDelete = async () => {
    if (selectedUserIds.size === 0) return;
    setIsDeleteDialogOpen(true);
  }

  const confirmBulkDelete = async () => {
    const idsToDelete = Array.from(selectedUserIds);
    const promises = idsToDelete.map(id => deleteUserAction(id));
    await Promise.all(promises);
    toast({ title: "Bulk Delete Complete", description: `${idsToDelete.length} users have been moved to the Dustbin.` });
    setSelectedUserIds(new Set());
    onDataChange();
    setIsDeleteDialogOpen(false);
  }
  
  const handleBulkDeceasedUpdate = async (isDeceased: boolean) => {
    const idsToUpdate = Array.from(selectedUserIds);
    if (idsToUpdate.length === 0) {
      toast({ title: "No action taken", description: "No users were selected." });
      return;
    }
    const result = await updateDeceasedStatusAction(idsToUpdate, isDeceased);
    if (result.success) {
      toast({ title: "Update Successful", description: `${idsToUpdate.length} users have been marked as ${isDeceased ? 'deceased' : 'living'}.`});
      setSelectedUserIds(new Set());
      onDataChange();
    } else {
      toast({ variant: 'destructive', title: 'Update Failed' });
    }
  }


  const openRelationModal = (user: User, relation: RelationType) => {
    setEditingUser(user);
    setEditingRelation(relation);
    setIsModalOpen(true);
  };
  
  const handleClearRelation = async (user: User, relation: RelationType) => {
     const updatedUser: User = { ...user, [relation]: undefined };
     if (relation === 'fatherId') updatedUser.fatherName = '';
     if (relation === 'motherId') updatedUser.motherName = '';
     if (relation === 'spouseId') updatedUser.spouseName = '';
     
     const result = await updateUserAction(updatedUser);
     if (result.success) {
        toast({ title: 'Relation Cleared', description: `${relation.replace('Id', '')} for ${user.name} has been unlinked.` });
        onDataChange();
     } else {
        toast({ variant: 'destructive', title: 'Update Failed' });
     }
  };

  const handleSelectRelative = async (relative: User) => {
    if (editingUser && editingRelation) {
      const updatedUser: User = { 
        ...editingUser, 
        [editingRelation]: relative.id
      };
      
      const relationName = `${relative.name}${relative.surname}`;
      if (editingRelation === 'fatherId') updatedUser.fatherName = relationName;
      if (editingRelation === 'motherId') updatedUser.motherName = relationName;
      if (editingRelation === 'spouseId') updatedUser.spouseName = relationName;

      const result = await updateUserAction(updatedUser);
      if (result.success) {
        toast({ title: 'Relation Updated', description: `${editingRelation.replace('Id', '')} for ${editingUser.name} has been set.` });
        onDataChange();
      } else {
        toast({ variant: 'destructive', title: 'Update Failed' });
      }
    }
    setIsModalOpen(false);
    setEditingUser(null);
    setEditingRelation(null);
  };

  const handleManualSave = async (name: string) => {
    if (editingUser && editingRelation) {
      const relationNameKey = editingRelation.replace('Id', 'Name') as 'fatherName' | 'motherName' | 'spouseName';
      const updatedUser: User = { 
          ...editingUser, 
          [editingRelation]: undefined, // Clear ID
          [relationNameKey]: name // Set name
      };

      const result = await updateUserAction(updatedUser);
      if (result.success) {
        toast({ title: 'Relation Updated', description: `${relationNameKey.replace('Name', '')} for ${editingUser.name} has been set.` });
        onDataChange();
      } else {
        toast({ variant: 'destructive', title: 'Update Failed' });
      }
    }
    setIsModalOpen(false);
    setEditingUser(null);
    setEditingRelation(null);
  };

  const getModalUsers = () => {
    if (!editingRelation || !editingUser) return [];
    let potentialRelatives = allUsers.filter(u => u.id !== editingUser.id && u.status === 'approved');
    switch (editingRelation) {
        case 'fatherId': return potentialRelatives.filter(u => u.gender === 'male');
        case 'motherId': return potentialRelatives.filter(u => u.gender === 'female');
        case 'spouseId':
             // Filter out anyone who is already married
             let potentialSpouses = potentialRelatives.filter(u => !u.spouseId);
             if (editingUser.gender === 'male') return potentialSpouses.filter(u => u.gender === 'female');
             if (editingUser.gender === 'female') return potentialSpouses.filter(u => u.gender === 'male');
             return potentialSpouses;
        default: return [];
    }
  };

  const getModalTitle = () => {
    if (!editingRelation || !editingUser) return "Select Relative";
    const relationName = editingRelation.replace('Id', '');
    return `Select ${relationName} for ${editingUser.name} ${editingUser.surname}`;
  }

  const handleAiSuggest = async (userToSuggestFor: User) => {
    setAiSuggestions([]);
    setSuggestionUser(userToSuggestFor);
    setIsSuggestionLoading(true);

    try {
        const communityProfiles = allUsers
            .filter(u => u.status === 'approved' && u.id !== userToSuggestFor.id)
            .map(p => ({
                id: p.id,
                name: `${p.name} ${p.surname}`,
                surname: p.surname,
                gender: p.gender,
                birthYear: p.birthYear || '',
                spouseId: p.spouseId,
            }));

        const userProfile = {
            id: userToSuggestFor.id,
            name: `${userToSuggestFor.name} ${userToSuggestFor.surname}`,
            surname: userToSuggestFor.surname,
            gender: userToSuggestFor.gender,
            maritalStatus: userToSuggestFor.maritalStatus,
            fatherName: userToSuggestFor.fatherName,
            motherName: userToSuggestFor.motherName,
            spouseName: userToSuggestFor.spouseName,
        };
        const result = await suggestFamilyConnections({ userProfile, communityProfiles });
        setAiSuggestions(result.suggestions);
    } catch (error) {
        console.error("AI suggestion failed", error);
        toast({ variant: 'destructive', title: 'AI Suggestion Failed', description: 'Could not get suggestions from the AI.' });
        setSuggestionUser(null); // Close modal on error
    } finally {
        setIsSuggestionLoading(false);
    }
  };

  const handleAcceptSuggestion = async (targetUser: User, suggestedRelative: SuggestFamilyConnectionsOutput['suggestions'][0], relationship: 'father' | 'mother' | 'spouse') => {
      const relationIdField = `${relationship}Id` as 'fatherId' | 'motherId' | 'spouseId';
      const relationNameField = `${relationship}Name` as 'fatherName' | 'motherName' | 'spouseName';

      const updatedUser: User = {
          ...targetUser,
          [relationIdField]: suggestedRelative.userId,
          [relationNameField]: suggestedRelative.name,
      };
      
      const result = await updateUserAction(updatedUser);
      if (result.success) {
          toast({ title: 'Connection Linked!', description: `${suggestedRelative.name} has been linked as ${targetUser.name}'s ${relationship}.` });
          setSuggestionUser(null); // Close modal
          onDataChange();
      } else {
          toast({ variant: 'destructive', title: 'Update Failed' });
      }
  };

  const renderRelationCell = (user: User, relation: RelationType) => {
      const relationId = user[relation];
      const relationTypeCapitalized = relation.charAt(0).toUpperCase() + relation.slice(1).replace('Id', '');
      const relationNameKey = relation.replace('Id', 'Name') as 'fatherName' | 'motherName' | 'spouseName';
      const relationName = user[relationNameKey];
      const relatedUser = allUsers.find(u => u.id === relationId);

      if (relatedUser) {
          const { firstName, surname } = getNameParts(relatedUser.name, relatedUser.surname);
          return (
              <div className="flex items-center gap-2 group w-full justify-between">
                <div className="flex items-center gap-2 truncate">
                    <Link2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{firstName || relatedUser.name}</p>
                      <p className="text-xs text-muted-foreground">{surname || relatedUser.surname}</p>
                    </div>
                </div>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0" onClick={(e) => { e.stopPropagation(); handleClearRelation(user, relation)}}>
                            <Link2Off className="h-4 w-4 text-red-500" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Clear {relation.replace('Id','')}</p>
                    </TooltipContent>
                </Tooltip>
              </div>
          )
      }
      
      if (relationName) {
        const { firstName, surname } = getNameParts(relationName);
        return (
            <div className="flex items-center justify-between gap-2 w-full group">
                <Button variant="link" size="sm" className="p-0 h-auto text-sm font-normal italic text-muted-foreground text-left" onClick={(e) => { e.stopPropagation(); openRelationModal(user, relation); }}>
                    <div>
                      <p>{firstName}</p>
                      <p className="text-xs">{surname}</p>
                    </div>
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0" onClick={(e) => { e.stopPropagation(); handleAiSuggest(user); }}>
                        <Sparkles className="h-4 w-4 text-purple-500" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>AI Suggest Connection</p>
                  </TooltipContent>
                </Tooltip>
            </div>
        )
      }
      
      return (
          <Button variant="link" size="sm" className="p-0 h-auto text-sm font-normal flex items-center gap-2 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); openRelationModal(user, relation); }}>
            <Link2 className="h-4 w-4" /> Link {relationTypeCapitalized}
          </Button>
      )
  };

  const handleCreateNewUser = (prefillData?: Partial<User>) => {
    setUserToPrefill(prefillData);
    setIsCreateModalOpen(true);
  };

  const handleSaveNewUser = async (formData: any) => {
    const result = await adminCreateUser(formData);
    if (result.success) {
        toast({ title: "Success", description: "New user created and is now approved." });
        setIsCreateModalOpen(false);
        setUserToPrefill(undefined);
        onDataChange();
    } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
    }
  };
  
  const handleExport = () => {
    if (filteredUsers.length === 0) {
        toast({ variant: "destructive", title: "No Data to Export", description: "There are no users matching the current filters." });
        return;
    }

    const dataToExport = filteredUsers.map(user => ({
      ID: user.id,
      Name: user.name,
      'Maiden Surname': user.maidenName,
      'Current Surname': user.surname,
      Family: user.family,
      Gender: user.gender,
      'Marital Status': user.maritalStatus,
      'Birth Month': user.birthMonth,
      'Birth Year': user.birthYear,
      'Father Name': user.fatherName,
      'Mother Name': user.motherName,
      'Spouse Name': user.spouseName,
      'Father ID': user.fatherId,
      'Mother ID': user.motherId,
      'Spouse ID': user.spouseId,
      Status: user.status,
      Description: user.description,
      'Is Deceased': user.isDeceased,
      'Death Date': user.deathDate,
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
    
    XLSX.writeFile(workbook, `vasudha_connect_export_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const toggleRowExpansion = (userId: string) => {
    setExpandedUserId(currentId => currentId === userId ? null : userId);
  };

  const handleApprove = async (user: User) => {
    if (user.status !== 'approved') {
        const result = await approveUserAction(user.id);
        if (result.success) {
            toast({ title: 'Profile Approved', description: `${user.name} ${user.surname} is now visible.` });
            onDataChange();
        } else {
            toast({ variant: 'destructive', title: 'Approval Failed' });
        }
    }
  }

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col">
          <Card>
              <CardHeader>
                  <CardTitle>Connect Family Relations</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col md:flex-row items-center gap-4">
                  <div className="relative min-w-[250px] flex-grow">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input placeholder="Search name, surname, family, or ID" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                  </div>
                  <div className='flex flex-wrap items-center gap-4 w-full md:w-auto'>
                      <Select value={genderFilter} onValueChange={setGenderFilter}>
                          <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="All Genders" /></SelectTrigger>
                          <SelectContent><SelectItem value="all">All Genders</SelectItem><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent>
                      </Select>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                          <SelectContent><SelectItem value="all">All Statuses</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="approved">Approved</SelectItem></SelectContent>
                      </Select>
                      <div className="flex items-center space-x-2">
                          <Checkbox id="unlinked-only" checked={unlinkedOnly} onCheckedChange={(checked) => setUnlinkedOnly(!!checked)} />
                          <Label htmlFor="unlinked-only" className="text-sm font-medium whitespace-nowrap text-gray-700">Unlinked Only</Label>
                      </div>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                  <Button onClick={() => handleCreateNewUser()}><UserPlus className="mr-2 h-4 w-4" />Create</Button>
                  <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>
                  </div>
              </CardContent>
          </Card>
          
          <div className="flex-1 mt-6 overflow-auto">
            <div className="border rounded-lg bg-background shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px] px-4"><Checkbox onCheckedChange={handleSelectAll} checked={ filteredUsers.length > 0 && selectedUserIds.size === filteredUsers.length ? true : selectedUserIds.size > 0 ? 'indeterminate' : false } /></TableHead>
                    <TableHead className="w-[120px]">ID</TableHead>
                    <TableHead className="min-w-[200px]">Profile</TableHead>
                    <TableHead className="min-w-[180px]">Father</TableHead>
                    <TableHead className="min-w-[180px]">Mother</TableHead>
                    <TableHead className="min-w-[180px]">Spouse</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="text-right w-[120px]">Actions</TableHead>
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
                              <Image src={user.profilePictureUrl} alt={user.name} width={36} height={36} className={cn("rounded-full", user.isDeceased && "grayscale")} data-ai-hint="profile avatar" />
                              <div>
                                  <div className="flex items-center gap-1.5">
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
                                    <p className="font-medium">{user.name}</p>
                                  </div>
                                  <div className="text-sm text-muted-foreground">{user.surname}</div>
                                  <div className="text-xs text-muted-foreground capitalize">{user.gender}</div>
                              </div>
                           </div>
                        </TableCell>
                        <TableCell>{renderRelationCell(user, 'fatherId')}</TableCell>
                        <TableCell>{renderRelationCell(user, 'motherId')}</TableCell>
                        <TableCell>{user.maritalStatus === 'married' ? renderRelationCell(user, 'spouseId') : <span className='text-sm text-muted-foreground'>Single</span>}</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <Checkbox id={`approve-${user.id}`} checked={user.status === 'approved'} onCheckedChange={(checked) => { if (checked) { handleApprove(user) }}} disabled={user.status === 'approved'} />
                            <Label htmlFor={`approve-${user.id}`} className={`text-xs font-medium capitalize ${user.status === 'approved' ? 'text-green-600' : 'text-amber-600'}`}>{user.status}</Label>
                          </div>
                        </TableCell>
                         <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                                {isSuggestionLoading && suggestionUser?.id === user.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleAiSuggest(user); }}>
                                          <Sparkles className="h-4 w-4 text-purple-500" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>AI Suggest Connections</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); toggleRowExpansion(user.id); }}>
                                      {expandedUserId === user.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{expandedUserId === user.id ? 'Collapse' : 'Expand'}</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                                      <Link href={`/profile/${user.id}`} target="_blank">
                                          <Eye className="h-4 w-4" />
                                          <span className="sr-only">View Profile</span>
                                      </Link>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>View Profile</p>
                                  </TooltipContent>
                                </Tooltip>
                                {user.maritalStatus === 'married' && !user.spouseId && !user.spouseName && (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Inconsistency: Married but no spouse linked.</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                            </div>
                         </TableCell>
                      </TableRow>
                      {expandedUserId === user.id && (
                         <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableCell colSpan={8} className="p-4">
                               <FamilyConnectionDetails selectedUser={user} allUsers={allUsers} onAddNewRelative={handleCreateNewUser} />
                            </TableCell>
                         </TableRow>
                      )}
                    </React.Fragment>
                  )) : (<TableRow><TableCell colSpan={8} className="text-center h-24 text-muted-foreground">No users match the current filters.</TableCell></TableRow>)}
                </TableBody>
              </Table>
            </div>
          </div>
        
          {isModalOpen && editingUser && <RelativeSelectionModal 
              isOpen={isModalOpen} 
              onClose={() => setIsModalOpen(false)} 
              users={getModalUsers()} 
              allUsers={allUsers} 
              onSelect={handleSelectRelative} 
              onManualSave={handleManualSave} 
              title={getModalTitle()} 
              selectionType={editingRelation ? editingRelation.replace('Id', '') as 'father' | 'mother' | 'spouse' : null}
              surnameToFilter={editingUser.surname}
          />}
          
          <UserFormModal mode="create" isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); setUserToPrefill(undefined); }} onSave={handleSaveNewUser} prefillData={userToPrefill} />
  
          {suggestionUser && (
              <AISuggestionModal
                  isOpen={!!suggestionUser}
                  onClose={() => setSuggestionUser(null)}
                  targetUser={suggestionUser}
                  suggestions={aiSuggestions}
                  isLoading={isSuggestionLoading}
                  onAcceptSuggestion={handleAcceptSuggestion}
              />
          )}
        
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will move {selectedUserIds.size} user(s) to the Dustbin. They can be recovered for 30 days.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmBulkDelete} className="bg-destructive hover:bg-destructive/90">
                    Yes, move to Dustbin
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
  
          {selectedUserIds.size > 0 && (
              <footer className="sticky bottom-0 z-10 p-3 bg-background/80 backdrop-blur-sm border-t shadow-lg">
                  <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
                    <p className="text-sm font-medium"><span className="font-bold">{selectedUserIds.size}</span> selected</p>
                    <div className="flex gap-2 flex-wrap">
                      <Button variant="outline" size="sm" onClick={() => setSelectedUserIds(new Set())}>Deselect All</Button>
                      <Button onClick={handleBulkApprove} size="sm"><CheckCircle className="mr-2 h-4 w-4" />Approve</Button>
                      <Button variant="secondary" onClick={handleBulkUnapprove} size="sm"><XCircle className="mr-2 h-4 w-4" />Unapprove</Button>
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="secondary" size="sm"><Leaf className="mr-2 h-4 w-4" />Deceased Status</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleBulkDeceasedUpdate(true)}>Mark as Deceased</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleBulkDeceasedUpdate(false)}>Mark as Living</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button variant="destructive" onClick={handleBulkDelete} size="sm"><Trash2 className="mr-2 h-4 w-4" />To Dustbin</Button>
                    </div>
                  </div>
              </footer>
          )}
      </div>
    </TooltipProvider>
  );
}
