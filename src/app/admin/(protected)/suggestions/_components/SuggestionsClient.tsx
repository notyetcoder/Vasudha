
'use client';
import React, { useState, useCallback } from 'react';
import type { Suggestion } from '@/actions/suggestions';
import { deleteSuggestion, getSuggestions } from '@/actions/suggestions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, ExternalLink, RefreshCw, MessageSquareQuote } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';

interface SuggestionsClientProps {
    initialSuggestions: Suggestion[];
}

export default function SuggestionsClient({ initialSuggestions }: SuggestionsClientProps) {
    const [suggestions, setSuggestions] = useState(initialSuggestions);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [suggestionToDelete, setSuggestionToDelete] = useState<Suggestion | null>(null);
    const { toast } = useToast();

    const fetchSuggestions = useCallback(async () => {
        setIsLoading(true);
        try {
            const freshSuggestions = await getSuggestions();
            setSuggestions(freshSuggestions);
            toast({ title: 'Suggestions Refreshed' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch suggestions.' });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    const handleDelete = async () => {
        if (!suggestionToDelete) return;
        
        setIsDeleting(suggestionToDelete.id);
        const result = await deleteSuggestion(suggestionToDelete.id);
        if (result.success) {
            setSuggestions(prev => prev.filter(s => s.id !== suggestionToDelete.id));
            toast({ title: 'Suggestion Deleted' });
        } else {
            toast({ variant: 'destructive', title: 'Deletion Failed', description: result.message });
        }
        setIsDeleting(null);
        setSuggestionToDelete(null);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2"><MessageSquareQuote /> Suggestions Log Book</CardTitle>
                        <CardDescription>Review and manage edit requests submitted by users.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchSuggestions} disabled={isLoading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Submitted</TableHead>
                                    <TableHead>Regarding</TableHead>
                                    <TableHead>Message</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {suggestions.length > 0 ? (
                                    suggestions.map(suggestion => (
                                        <TableRow key={suggestion.id}>
                                            <TableCell className="w-[150px] align-top">
                                                <Badge variant="outline">
                                                    {formatDistanceToNow(new Date(suggestion.created_at), { addSuffix: true })}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="w-[250px] align-top">
                                                <div className="font-medium">{suggestion.profile_name}</div>
                                                <div className="text-xs text-muted-foreground font-mono">{suggestion.profile_id}</div>
                                            </TableCell>
                                            <TableCell className="align-top">
                                                <p className="whitespace-pre-wrap">{suggestion.message}</p>
                                            </TableCell>
                                            <TableCell className="text-right w-[150px] align-top">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button asChild variant="outline" size="sm">
                                                        <Link href={`/admin/connect?search=${suggestion.profile_id}`} target="_blank">
                                                            <ExternalLink className="mr-2 h-3 w-3" /> View Profile
                                                        </Link>
                                                    </Button>
                                                    <Button 
                                                        variant="destructive" 
                                                        size="icon" 
                                                        onClick={() => setSuggestionToDelete(suggestion)}
                                                        disabled={!!isDeleting}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                            No suggestions yet. The log book is clear!
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={!!suggestionToDelete} onOpenChange={(isOpen) => !isOpen && setSuggestionToDelete(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the suggestion for <span className="font-bold">{suggestionToDelete?.profile_name}</span>. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                    Yes, delete it
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
        </div>
    );
}
