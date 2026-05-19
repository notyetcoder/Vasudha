
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MainHeader from '@/components/MainHeader';
import Footer from '@/components/Footer';
import RegistrationForm from '@/components/RegistrationForm';
import { getAllUsersForPublic, createUser } from "@/actions/users";
import { useState, useEffect, useCallback } from 'react';
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { UserPlus, CircleCheck, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import UserAvatar from '@/components/UserAvatar';
import { findUserById } from '@/lib/user-utils';

export default function RegisterPage() {
  const [allUsers, setAllUsers] = useState<User[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [pendingData, setPendingData] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{ success: boolean; message: string; userId?: string; } | null>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch all users for relation selection
      const { users } = await getAllUsersForPublic(1, 10000); 
      setAllUsers(users);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load necessary data. Please try refreshing.'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  const handleFormSave = async (data: any) => {
    setCroppedImageUrl(data.profilePictureUrl);
    setPendingData(data);
    setIsConfirmOpen(true);
  };
  
  const getConstructedFullName = () => {
    if (!pendingData || !allUsers) return '';
    const { name, fatherName, spouseName, surname, gender, maritalStatus, fatherId, spouseId } = pendingData;
    
    const father = fatherId ? findUserById(fatherId, allUsers) : null;
    const spouse = spouseId ? findUserById(spouseId, allUsers) : null;
    
    const finalFatherName = father ? father.name : fatherName;
    const finalSpouseName = spouse ? spouse.name : spouseName;

    const isMarriedFemale = gender === 'female' && maritalStatus === 'married';
    const middleName = isMarriedFemale ? finalSpouseName : finalFatherName;
    
    return `${name} ${middleName || ''} ${surname}`.replace(/\s+/g, ' ').trim();
  };

  const processFinalSubmission = async () => {
        if (!pendingData) return;
        setIsProcessing(true);
        const result = await createUser(pendingData);
        
        if (result.success) {
            setSubmissionResult(result);
        } else {
            toast({
                variant: 'destructive',
                title: "Submission Failed",
                description: result.message,
            });
        }
        setIsProcessing(false);
        setIsConfirmOpen(false);
  };

  const startNewRegistration = () => {
    setSubmissionResult(null);
    setPendingData(null);
    setCroppedImageUrl(null);
    setHasAgreed(false);
    router.refresh();
    fetchUsers();
  };

  const renderSuccessMessage = () => (
     <div className="text-center py-8">
        <CircleCheck className="mx-auto h-16 w-16 text-green-500" />
        <h2 className="mt-4 text-2xl font-bold">Registration Submitted!</h2>
        <p className="mt-2 text-muted-foreground">Your profile will be reviewed and added to the community tree.</p>
        <div className="mt-6 bg-muted p-4 rounded-md">
            <p className="text-sm">Your Unique ID is:</p>
            <p className="text-2xl font-mono font-bold tracking-wider">{submissionResult?.userId}</p>
            <p className="text-xs text-muted-foreground mt-1">Please save this ID for future reference.</p>
        </div>
        <div className="mt-8 flex justify-center gap-4">
            <Button onClick={startNewRegistration}>
                <UserPlus className="mr-2 h-4 w-4" />
                Register Another Person
            </Button>
            <Button variant="outline" asChild>
                <Link href="/explore">Explore Community</Link>
            </Button>
        </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
       <div className="absolute inset-0 -z-10 h-full w-full bg-background">
          <div aria-hidden="true" className="aurora-background absolute--full-bleed pointer-events-none" />
      </div>
      <MainHeader />
      <main className="flex-1 container mx-auto pt-24 pb-12 px-4">
        <div className="w-full max-w-3xl mx-auto">
          <Card className="bg-card/30 backdrop-blur-lg border-white/10 shadow-lg">
            <CardHeader className="text-center">
                <h1 className="font-headline text-4xl sm:text-5xl text-primary">वसुधैव कुटुम्बकम्</h1>
                <CardTitle className="text-2xl font-semibold tracking-tight pt-2">Register Your Profile</CardTitle>
                <CardDescription>Fill out the form below to add a new profile to our community network.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}
              
              {!isLoading && allUsers && !submissionResult && (
                 <RegistrationForm 
                    onSave={handleFormSave} 
                    allUsers={allUsers}
                    mode="create"
                 />
              )}
              
              {!isLoading && submissionResult && renderSuccessMessage()}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
      
       <Dialog open={isConfirmOpen} onOpenChange={(isOpen) => !isProcessing && setIsConfirmOpen(isOpen)}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Confirm Profile Submission</DialogTitle>
                     <DialogDescription>
                        Please review the details and agree to the policy before submitting.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                     <div className="flex flex-col items-center space-y-4 p-4 rounded-lg bg-muted/50">
                         <UserAvatar
                            name={pendingData?.name || 'U'}
                            profilePictureUrl={croppedImageUrl || null}
                            size={100}
                        />
                        <div className="w-full text-center">
                            <p className="font-bold text-lg">{getConstructedFullName()}</p>
                        </div>
                     </div>
                    <div className="space-y-2">
                        <Label>Privacy and Policy</Label>
                        <ScrollArea className="h-32 w-full rounded-md border p-3 text-sm">
                            <p className="font-semibold mb-2">1. Data Accuracy and Approval:</p>
                            <p className="mb-2">You confirm that the information provided is accurate to the best of your knowledge. All profiles are subject to review and edit/refine by an administrator. False or misleading entries may be rejected or removed without notice.</p>
                            
                            <p className="font-semibold mb-2">2. Public Visibility:</p>
                            <p className="mb-2">Your profile information, including your name, family connections, and profile picture, will be visible to other members of the community on this website. Do not submit information you wish to keep private.</p>

                            <p className="font-semibold mb-2">3. Data Usage:</p>
                            <p>The data collected is solely for the purpose of building and displaying the family tree for the Vasudha community. It will not be sold or shared with third parties for marketing purposes.</p>
                        </ScrollArea>
                    </div>
                    
                     <div className="flex items-center space-x-2">
                        <Checkbox id="terms" checked={hasAgreed} onCheckedChange={(checked) => setHasAgreed(!!checked)} />
                        <label
                            htmlFor="terms"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            I have read and agree to the terms and policy.
                        </label>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsConfirmOpen(false)} disabled={isProcessing}>Cancel</Button>
                    <Button onClick={processFinalSubmission} disabled={isProcessing || !hasAgreed}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Agree & Submit
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

    </div>
  );
}
