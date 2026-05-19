'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User } from '@/lib/types';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (user: User) => void;
  users: User[];
  title: string;
  currentSelected?: User | null;
}

export default function UserSelectionModal({
  open,
  onClose,
  onSelect,
  users,
  title,
  currentSelected,
}: Props) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return users;
    const lower = search.toLowerCase();
    return users.filter(
      u =>
        u.name.toLowerCase().includes(lower) ||
        u.surname.toLowerCase().includes(lower) ||
        (u.family && u.family.toLowerCase().includes(lower)) ||
        (u.description && u.description.toLowerCase().includes(lower))
    );
  }, [search, users]);

  const handleSelect = (user: User) => {
    if (currentSelected?.id !== user.id) {
      onSelect(user);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">{title}</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Found {filtered.length} {filtered.length === 1 ? 'person' : 'people'}
          </p>
        </DialogHeader>

        <div className="px-6 py-4 border-b space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name, surname, or family..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 py-6 text-base"
              autoFocus
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[calc(85vh-200px)]">
          <div className="px-6 py-4 space-y-2">
            {filtered.length > 0 ? (
              filtered.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelect(user)}
                  disabled={currentSelected?.id === user.id}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-purple-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left group"
                >
                  <div className="relative flex-shrink-0">
                    {user.profilePictureUrl && (
                      <img
                        src={user.profilePictureUrl}
                        alt={user.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-300 group-hover:border-purple-400"
                      />
                    )}
                    {currentSelected?.id === user.id && (
                      <div className="absolute inset-0 rounded-full border-2 border-green-500 flex items-center justify-center">
                        <span className="text-green-500 text-lg">✓</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-tight">
                      {user.name} {user.surname}
                    </p>
                    {user.family && (
                      <p className="text-xs text-gray-600">{user.family}</p>
                    )}
                    {user.birthYear && (
                      <p className="text-xs text-gray-500">
                        b. {user.birthYear}
                        {user.isDeceased && ' (Deceased)'}
                      </p>
                    )}
                  </div>

                  {currentSelected?.id === user.id && (
                    <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded">
                      Selected
                    </span>
                  )}
                </button>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="font-medium">No users found</p>
                <p className="text-sm">Try a different search term</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
