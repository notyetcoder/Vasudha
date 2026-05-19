
'use client';
import type { ControllerRenderProps, FieldValues } from 'react-hook-form';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Link2, X } from 'lucide-react';
import type { User } from '@/lib/types';
import UserAvatar from './UserAvatar';
import { cn } from '@/lib/utils';

interface AutocompleteRelativeInputProps {
  label: string;
  field?: ControllerRenderProps<FieldValues, any>;
  onButtonClick: () => void;
  onClear: () => void;
  selectedPerson?: User | null;
  manualName?: string | null;
  isDisabled?: boolean;
};

export default function AutocompleteRelativeInput({
  label,
  onButtonClick,
  onClear,
  selectedPerson,
  manualName,
  isDisabled = false,
}: AutocompleteRelativeInputProps) {
    
    const inputId = label.toLowerCase().replace(/\s/g, '-');
    const hasSelection = !!selectedPerson;
    const hasManualName = !!manualName && !hasSelection;

    return (
        <div className="grid gap-2">
            <Label htmlFor={inputId}>{label}</Label>
            <div className="flex items-center gap-2">
                <div className="relative w-full">
                     <div 
                        className={cn(
                            "flex h-10 w-full items-center gap-2 rounded-md border border-input bg-muted px-3 py-2 text-sm", 
                            isDisabled && "opacity-50",
                            !hasSelection && "cursor-pointer hover:bg-muted/80"
                        )}
                        onClick={!hasSelection ? onButtonClick : undefined}
                     >
                        {hasSelection ? (
                            <>
                                <UserAvatar name={selectedPerson.name} profilePictureUrl={selectedPerson.profilePictureUrl} size={24} />
                                <span className="font-medium truncate">{selectedPerson.name}</span>
                                <span className="text-muted-foreground truncate">{selectedPerson.surname}</span>
                            </>
                        ) : hasManualName ? (
                            <span className="font-medium">{manualName}</span>
                        ) : (
                            <span className='text-muted-foreground'>Click 'Select' to choose...</span>
                        )}
                    </div>
                </div>
                {hasSelection || hasManualName ? (
                    <div className='flex items-center gap-1'>
                        <Button type="button" variant="outline" size="sm" onClick={onButtonClick} disabled={isDisabled}>
                            Change
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onClear} disabled={isDisabled}>
                            <X className="h-4 w-4" />
                            <span className="sr-only">Clear selection</span>
                        </Button>
                    </div>
                ) : (
                    <Button type="button" variant="outline" onClick={onButtonClick} disabled={isDisabled}>
                        <Link2 className="h-4 w-4 mr-2" />
                        Select
                    </Button>
                )}
            </div>
        </div>
    );
}
