
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import UserAvatar from './UserAvatar';
import type { User } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Input } from './ui/input';
import { findUserById } from '@/lib/user-utils';
import { Search } from 'lucide-react';

type RelativeSelectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  allUsers: User[];
  onSelect: (user: User) => void;
  onManualSave: (name: string) => void;
  title: string;
  selectionType: 'father' | 'mother' | 'spouse' | null;
  surnameToFilter?: string;
};

export default function RelativeSelectionModal({
  isOpen,
  onClose,
  users,
  onSelect,
  onManualSave,
  title,
}: RelativeSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const sortedUsers = useMemo(() => {
    // Sort by newest first (descending ID)
    return [...users].sort((a,b) => b.id.localeCompare(a.id));
  }, [users]);
  
  const filteredUsers = useMemo(() => {
    if (!searchTerm) {
      return sortedUsers;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return sortedUsers.filter(user => {
        const userFullName = `${user.name} ${user.surname}`.toLowerCase();
        return userFullName.includes(lowercasedTerm);
    });
  }, [sortedUsers, searchTerm]);

  const handleManualSaveClick = () => {
    const formattedName = searchTerm.trim().toUpperCase().split(' ')[0];
    if (formattedName) {
      onManualSave(formattedName);
    }
  };
  
  const handleSelectUser = (user: User) => {
    onSelect(user);
    onClose();
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSearchTerm('');
      onClose();
    }
  };

  const isManualSaveDisabled = () => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return true; // Disabled if empty
    return false;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Search for an existing person. If not found, type their first name and click "Save Name".
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4">
            <div className="relative flex items-center gap-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search or type new name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
                <Button onClick={handleManualSaveClick} disabled={isManualSaveDisabled()} variant="link" size="sm" className="whitespace-nowrap pr-1">Save Name</Button>
            </div>

            <ScrollArea className="h-72 w-full rounded-md border">
                <div className="p-2">
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map(user => (
                            <div
                                key={user.id}
                                onClick={() => handleSelectUser(user)}
                                className="flex items-center justify-between w-full text-left p-2 rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground"
                            >
                                <div className="flex items-center gap-3">
                                    <UserAvatar
                                        name={user.name}
                                        profilePictureUrl={user.profilePictureUrl}
                                        size={40}
                                        isDeceased={user.isDeceased}
                                    />
                                    <div>
                                        <p className="text-sm font-medium">{user.name} {user.surname}</p>
                                        {user.fatherName && (
                                        <p className="text-xs text-muted-foreground">
                                            s/o {user.fatherName}
                                        </p>
                                        )}
                                    </div>
                                </div>
                                <Button variant="secondary" size="sm" className="ml-2" onClick={(e) => { e.stopPropagation(); handleSelectUser(user); }}>
                                    Select
                                </Button>
                            </div>
                        ))
                    ) : (
                         <div className="py-6 text-center text-sm">
                            <p>No person found with that name.</p>
                            <p className="text-muted-foreground">You can save the name you typed above.</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
