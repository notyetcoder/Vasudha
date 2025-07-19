
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserSearch, Upload, CircleCheck, UserPlus, ShieldAlert, X } from 'lucide-react';
import type { User } from '@/lib/types';
import { useState, useEffect, useRef, useMemo } from 'react';
import RelativeSelectionModal from './RelativeSelectionModal';
import { Button } from './ui/button';
import { createUser, getUsers } from '@/actions/users';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import ImageCropperModal from './ImageCropperModal';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from './ui/scroll-area';
import { Checkbox } from './ui/checkbox';
import Link from 'next/link';
import { validateHumanImage } from '@/ai/flows/validate-human-image';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { cn } from '@/lib/utils';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, i) => (currentYear - i).toString());
const months = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];
const familyOptionsBySurname = {
  VARCHAND: [
    'DODHIYEVARA', 'GOKREVARA', 'KESRANI', 'PATEL', 'VARCHAND',
  ].sort(),
  MATA: [
    'BHANA RAMAIYA', 'DEVANI', 'DHANANI', 'JAGANI', 'KHENGAR', 'LADHANI',
    'RUPANI', 'SUJANI', 'TEJA TRIKAM', 'UKERANI', 'VAGHANI', 'VARJANG',
    'VIRANI', 'VISAMAN',
  ].sort(),
  CHHANGA: [
    'BHAGVANI', 'BHIMNAI', 'BHOJANI', 'DEHAR MANDA', 'GANGANI', 'NATHANI',
    'RATANI', 'SAMRANI', 'SAMTANI',
  ].sort(),
};
const surnameOptions = ['MATA', 'CHHANGA', 'VARCHAND', 'OTHER'];
const descriptionOptions = [
    'ANIMAL HUSBANDRY (PASUPALAN)',
    'ARTISAN / BHARATKAAM',
    'BUSINESS',
    'DAIRY BUSINESS',
    'FARMER',
    'FOOD MANUFACTURING',
    'GOVERNMENT JOB',
    'HOUSE WIFE',
    'LABOURER',
    'OTHER',
    'SERVICE',
    'STUDENT',
    'TEACHER',
    'TRANSPORTATION',
].sort();


const nameValidation = z.string().regex(/^[A-Z]+$/, { message: "Only uppercase letters are allowed, with no spaces." });

const optionalNameValidation = z.preprocess(
    (val) => (val === "" ? undefined : val),
    nameValidation.optional()
);

const createFormSchema = (getIds: () => { fatherId?: string, motherId?: string, spouseId?: string }) => z.object({
  name: nameValidation.min(2, 'Name requires at least 2 characters.'),
  gender: z.enum(['male', 'female'], { required_error: 'Please select a gender.' }),
  maritalStatus: z.enum(['single', 'married'], { required_error: 'Please select a marital status.' }),
  family: z.string().optional(),
  
  maidenSurname: z.string().min(1, 'Please select a surname.'),
  maidenSurnameOther: optionalNameValidation,
  
  currentSurname: z.string().optional(),
  currentSurnameOther: optionalNameValidation,
  
  fatherName: z.string().min(2, "Father's name is required."),
  motherName: z.string().min(2, "Mother's name is required."),
  
  spouseName: optionalNameValidation,
  spouseFamily: z.string().optional(),

  birthMonth: z.string().optional(),
  birthYear: z.string().optional(),
  
  description: z.string().optional(),
  otherDescription: z.string().optional(),
}).superRefine((data, ctx) => {
    // These refinements are for manual text entry only. If an ID is present, we skip the validation.
    const { fatherId, motherId, spouseId } = getIds();
    
    if (!fatherId && !nameValidation.safeParse(data.fatherName).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Only uppercase letters are allowed, with no spaces.",
        path: ['fatherName'],
      });
    }
    if (!motherId && !nameValidation.safeParse(data.motherName).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Only uppercase letters are allowed, with no spaces.",
        path: ['motherName'],
      });
    }
    if (!spouseId && data.maritalStatus === 'married' && data.spouseName && !nameValidation.safeParse(data.spouseName).success) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Only uppercase letters are allowed, with no spaces.",
            path: ['spouseName'],
        });
    }

}).refine(data => {
    if (data.maidenSurname === 'OTHER') {
        return !!data.maidenSurnameOther && data.maidenSurnameOther.length > 0;
    }
    return true;
}, {
    message: "Please specify surname.",
    path: ['maidenSurnameOther'],
}).refine(data => {
    if (data.currentSurname === 'OTHER') {
        return !!data.currentSurnameOther && data.currentSurnameOther.length > 0;
    }
    return true;
}, {
    message: "Please specify surname.",
    path: ['currentSurnameOther'],
}).refine(data => {
    if (data.gender === 'female' && data.maritalStatus === 'married') {
        return !!data.currentSurname;
    }
    return true;
}, {
    message: "Current Surname is required for married women.",
    path: ['currentSurname'],
}).refine(data => {
    if (data.maritalStatus === 'married') {
        return !!data.spouseName && data.spouseName.length >= 2;
    }
    return true;
}, {
    message: "Spouse's name must be at least 2 characters.",
    path: ['spouseName'],
});


type FormData = z.infer<ReturnType<typeof createFormSchema>>;
type SelectionType = 'father' | 'mother' | 'spouse';

const defaultFormValues: Partial<FormData> = {
    maidenSurname: undefined,
    maidenSurnameOther: '',
    currentSurname: undefined,
    currentSurnameOther: '',
    name: '',
    gender: undefined,
    maritalStatus: undefined,
    family: undefined,
    fatherName: '',
    motherName: '',
    spouseName: '',
    spouseFamily: undefined,
    birthMonth: undefined,
    birthYear: undefined,
    description: undefined,
    otherDescription: '',
};

const SelectedUserPill = ({ user, onClear }: { user: User, onClear: () => void }) => (
    <div className="flex items-center justify-between gap-2 p-2 bg-muted rounded-md text-sm">
        <div className="flex items-center gap-2 truncate">
            <Image src={user.profilePictureUrl} alt={user.name} width={24} height={24} className="rounded-full" data-ai-hint="profile avatar" />
            <span className="font-medium truncate">{user.name} {user.fatherName ? `${user.fatherName.split(' ')[0]} ` : ''}{user.surname}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClear}>
            <X className="h-4 w-4" />
        </Button>
    </div>
);

export default function RegistrationForm() {
    const { toast } = useToast();
    
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectionType, setSelectionType] = useState<SelectionType | null>(null);
    const [surnameFilter, setSurnameFilter] = useState<string | null>(null);

    const [fatherId, setFatherId] = useState<string | undefined>();
    const [motherId, setMotherId] = useState<string | undefined>();
    const [spouseId, setSpouseId] = useState<string | undefined>();
    
    const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
    const [isCropperOpen, setIsCropperOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [pendingData, setPendingData] = useState<FormData | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [hasAgreed, setHasAgreed] = useState(false);
    
    const [submissionResult, setSubmissionResult] = useState<{
        success: boolean;
        message: string;
        userId?: string;
    } | null>(null);

    const [imageValidationError, setImageValidationError] = useState<string | null>(null);
    const [isImageValidating, setIsImageValidating] = useState(false);

    const getSelectedIds = () => ({ fatherId, motherId, spouseId });

    const formSchema = createFormSchema(getSelectedIds);

    const { handleSubmit, watch, reset, formState: { errors }, setValue, control, trigger, getValues } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: defaultFormValues
    });

    const maidenSurnameSelection = watch('maidenSurname');
    const currentSurnameSelection = watch('currentSurname');
    const gender = watch('gender');
    const maritalStatus = watch('maritalStatus');
    const description = watch('description');

    const isMarriedFemale = gender === 'female' && maritalStatus === 'married';
    const isMarriedMale = gender === 'male' && maritalStatus === 'married';
    
    const father = allUsers.find(u => u.id === fatherId);
    const mother = allUsers.find(u => u.id === motherId);
    const spouse = allUsers.find(u => u.id === spouseId);

    useEffect(() => {
      getUsers().then(users => setAllUsers(users));
    }, []);

    useEffect(() => {
        // When maiden surname changes, reset the family selection.
        setValue('family', undefined);
    }, [maidenSurnameSelection, setValue]);

    useEffect(() => {
        // When spouse is selected for a married female, auto-set and lock her family.
        if (isMarriedFemale && spouseId && spouse?.family) {
            setValue('family', spouse.family, { shouldValidate: true });
        } else if (isMarriedFemale && !spouseId) {
            // If spouse is cleared, unlock family selection
            setValue('family', undefined);
        }
    }, [isMarriedFemale, spouseId, spouse, setValue]);

    useEffect(() => {
        if (errors.fatherName || errors.motherName || errors.spouseName) {
            trigger(['fatherName', 'motherName', 'spouseName']);
        }
    }, [fatherId, motherId, spouseId, errors.fatherName, errors.motherName, errors.spouseName, trigger]);


    const allSurnamesInDb = useMemo(() => {
        const maidenNames = allUsers.map(u => u.maidenName).filter(Boolean);
        const currentSurnames = allUsers.map(u => u.surname).filter(Boolean);
        return [...new Set([...maidenNames, ...currentSurnames])].sort((a,b) => b.length - a.length);
    }, [allUsers]);

    const parseFirstName = (fullName?: string) => {
        if (!fullName) return '';
        let potentialFirstName = fullName;
        for (const surname of allSurnamesInDb) {
            if (potentialFirstName.endsWith(surname)) {
                return potentialFirstName.substring(0, potentialFirstName.length - surname.length).trim();
            }
        }
        return potentialFirstName;
    };

    const getFinalValue = (selectValue?: string, otherValue?: string) => {
        return selectValue === 'OTHER' ? (otherValue || '') : (selectValue || '');
    };

    const confirmationDisplayName = useMemo(() => {
        if (!pendingData) return '';
        const finalMaidenName = getFinalValue(pendingData.maidenSurname, pendingData.maidenSurnameOther);
        if (pendingData.gender === 'female' && pendingData.maritalStatus === 'married') {
            const spouseFirstName = parseFirstName(pendingData.spouseName);
            const finalCurrentSurname = getFinalValue(pendingData.currentSurname, pendingData.currentSurnameOther);
            return `${pendingData.name} ${spouseFirstName} ${finalCurrentSurname}`;
        } else {
            const fatherFirstName = parseFirstName(pendingData.fatherName);
            return `${pendingData.name} ${fatherFirstName} ${finalMaidenName}`;
        }
    }, [pendingData, allSurnamesInDb]);

    const formatNameInput = (value: string) => {
        if (!value) return '';
        return value.toUpperCase().replace(/[^A-Z]/g, '');
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImageToCrop(reader.result as string);
                setIsCropperOpen(true);
            });
            reader.readAsDataURL(file);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };
    
    const onCropComplete = async (url: string) => {
        setImageValidationError(null);
        setIsImageValidating(true);
        setCroppedImageUrl(url); 
        try {
            const validation = await validateHumanImage({ photoDataUri: url });
            if (!validation.isHumanFace) {
                setImageValidationError(validation.reason);
                setCroppedImageUrl(null);
            }
        } catch (error) {
            console.error("AI image validation failed, but allowing submission.", error);
            setImageValidationError(null);
        } finally {
            setIsImageValidating(false);
        }
    };

    const handleFormSubmit = (data: FormData) => {
        if (imageValidationError) {
            toast({
                variant: 'destructive',
                title: "Invalid Profile Picture",
                description: "Please upload a valid photo of a person.",
            });
            return;
        }
        setPendingData(data);
        setIsConfirmOpen(true);
        setHasAgreed(false);
    };
    
    const processSubmission = async () => {
        if (!pendingData) return;
        
        setIsProcessing(true);

        const finalMaidenName = getFinalValue(pendingData.maidenSurname, pendingData.maidenSurnameOther);
        let finalCurrentSurname = finalMaidenName;
        if (pendingData.gender === 'female' && pendingData.maritalStatus === 'married') {
            finalCurrentSurname = getFinalValue(pendingData.currentSurname, pendingData.currentSurnameOther) || finalMaidenName;
        }
        
        const finalDescription = pendingData.description === 'OTHER' ? pendingData.otherDescription : pendingData.description;

        const payload = {
            maidenName: finalMaidenName,
            surname: finalCurrentSurname,
            name: pendingData.name,
            gender: pendingData.gender,
            maritalStatus: pendingData.maritalStatus,
            fatherName: pendingData.fatherName,
            motherName: pendingData.motherName,
            family: pendingData.family,
            spouseName: pendingData.spouseName,
            birthMonth: pendingData.birthMonth,
            birthYear: pendingData.birthYear,
            description: finalDescription,
            fatherId,
            motherId,
            spouseId,
            profilePictureUrl: croppedImageUrl || undefined,
        };

        const result = await createUser(payload);
        
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
        setPendingData(null);
    };

    const openSelectionModal = (type: SelectionType) => {
        let surnameToFilterForParents: string | null = null;
        if (type === 'father' || type === 'mother') {
            const birthSurname = getFinalValue(getValues('maidenSurname'), getValues('maidenSurnameOther'));
            if (!birthSurname) {
                toast({ variant: 'destructive', title: 'Surname Required', description: "Please select the person's birth surname before selecting a parent." });
                return;
            }
            surnameToFilterForParents = birthSurname;
        }
        setSurnameFilter(surnameToFilterForParents);
        setSelectionType(type);
        setIsModalOpen(true);
    };
    
    const clearSelection = (type: SelectionType) => {
        const fieldName = `${type}Name` as 'fatherName' | 'motherName' | 'spouseName';
        setValue(fieldName, '', { shouldValidate: true });
        if (type === 'father') setFatherId(undefined);
        if (type === 'mother') setMotherId(undefined);
        if (type === 'spouse') setSpouseId(undefined);
    };

    const handleSelectRelative = (relative: User) => {
        if (!selectionType) return;
    
        const updates: Partial<Record<'fatherId' | 'motherId' | 'spouseId', string>> = {};
        const formUpdates: Partial<FormData> = {};
    
        const mainFieldName = `${selectionType}Name` as 'fatherName' | 'motherName' | 'spouseName';
        formUpdates[mainFieldName] = `${relative.name} ${relative.surname}`;
        updates[`${selectionType}Id`] = relative.id;
    
        if (selectionType === 'spouse' && isMarriedFemale && relative.family) {
            formUpdates.family = relative.family;
        }
    
        if ((selectionType === 'father' || selectionType === 'mother') && relative.spouseId) {
            const spouseOfRelative = allUsers.find(u => u.id === relative.spouseId);
            if (spouseOfRelative) {
                const spouseFieldName = selectionType === 'father' ? 'motherName' : 'fatherName';
                const spouseIdField = selectionType === 'father' ? 'motherId' : 'fatherId';
                formUpdates[spouseFieldName] = `${spouseOfRelative.name} ${spouseOfRelative.surname}`;
                updates[spouseIdField] = spouseOfRelative.id;
            }
        }
    
        // Batch state and form updates
        setFatherId(prev => updates.fatherId ?? prev);
        setMotherId(prev => updates.motherId ?? prev);
        setSpouseId(prev => updates.spouseId ?? prev);
    
        Object.entries(formUpdates).forEach(([key, value]) => {
            setValue(key as keyof FormData, value, { shouldValidate: true, shouldDirty: true });
        });
    
        setIsModalOpen(false);
        setSelectionType(null);
    };
    
    const handleManualSaveRelative = (name: string) => {
        if (selectionType) {
            clearSelection(selectionType);
            const fieldName = `${selectionType}Name` as 'fatherName' | 'motherName' | 'spouseName';
            setValue(fieldName, name, { shouldValidate: true });
            setIsModalOpen(false);
            setSelectionType(null);
        }
    };

    const getFilteredUsers = () => {
        if (!selectionType) return [];
        let sourceUsers = allUsers.filter(u => u.status === 'approved');

        if (surnameFilter) {
            sourceUsers = sourceUsers.filter(u => u.surname === surnameFilter || u.maidenName === surnameFilter);
        }

        switch (selectionType) {
            case 'father': return sourceUsers.filter(u => u.gender === 'male');
            case 'mother': return sourceUsers.filter(u => u.gender === 'female');
            case 'spouse':
                let potentialSpouses = sourceUsers.filter(u => !u.spouseId);
                if (gender === 'male') return potentialSpouses.filter(u => u.gender === 'female');
                if (gender === 'female') return potentialSpouses.filter(u => u.gender === 'male');
                return potentialSpouses;
            default: return [];
        }
    }
    
    const activeSurnameForFamily = isMarriedFemale ? currentSurnameSelection : maidenSurnameSelection;
    const currentFamilyOptions = familyOptionsBySurname[activeSurnameForFamily as keyof typeof familyOptionsBySurname] || [];

    const RelativeInput = ({ type }: { type: SelectionType }) => {
        const id = type === 'father' ? fatherId : type === 'mother' ? motherId : spouseId;
        const selectedUser = allUsers.find(u => u.id === id);
        const fieldName = `${type}Name` as 'fatherName' | 'motherName' | 'spouseName';

        return (
            <div className="grid gap-2">
                <Label htmlFor={fieldName} className="capitalize">{type}'s Name</Label>
                {selectedUser ? (
                    <SelectedUserPill user={selectedUser} onClear={() => clearSelection(type)} />
                ) : null}
                 <div className="flex gap-2">
                    <Controller
                        name={fieldName}
                        control={control}
                        render={({ field }) => (
                            <Input 
                                {...field}
                                placeholder={`E.G. ${type === 'mother' ? 'ANITA' : 'SURESH'}`}
                                onChange={(e) => field.onChange(formatNameInput(e.target.value))}
                                disabled={!!selectedUser}
                                className={cn(!!selectedUser && "bg-muted/50")}
                            />
                        )} 
                    />
                    <Button type="button" variant="outline" size="icon" onClick={() => openSelectionModal(type)} disabled={type === 'spouse' && !gender}>
                        <UserSearch />
                    </Button>
                </div>
                {type === 'spouse' && !gender && <p className="text-blue-600 text-sm">Please select a gender to select a spouse.</p>}
                {errors[fieldName] && <p className="text-red-500 text-sm">{errors[fieldName]?.message}</p>}
            </div>
        );
    };

    if (submissionResult?.success) {
      return (
        <div className="text-center py-8">
          <CircleCheck className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="mt-4 text-2xl font-bold">Registration Successful!</h2>
          <p className="mt-2 text-muted-foreground">Your profile is now pending approval.</p>
          <div className="mt-6 bg-muted p-4 rounded-md">
            <p className="text-sm">Your Unique ID is:</p>
            <p className="text-2xl font-mono font-bold tracking-wider">{submissionResult.userId}</p>
            <p className="text-xs text-muted-foreground mt-1">Please save this ID for future reference.</p>
          </div>
          <div className="mt-8 flex justify-center gap-4">
            <Button onClick={() => {
              reset(defaultFormValues);
              setSubmissionResult(null);
              setCroppedImageUrl(null);
              setFatherId(undefined);
              setMotherId(undefined);
              setSpouseId(undefined);
            }}>
              <UserPlus className="mr-2 h-4 w-4" />
              Register Another Person
            </Button>
            <Button variant="outline" asChild>
              <Link href="/explore">Explore Community</Link>
            </Button>
          </div>
        </div>
      );
    }

    return (
        <>
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8 pt-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="grid gap-2">
                        <Label>Gender</Label>
                        <Controller
                            control={control}
                            name="gender"
                            render={({ field }) => (
                                <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4 pt-2">
                                    <Label className="flex items-center gap-2 font-normal cursor-pointer"><RadioGroupItem value="male" /> Male</Label>
                                    <Label className="flex items-center gap-2 font-normal cursor-pointer"><RadioGroupItem value="female" /> Female</Label>
                                </RadioGroup>
                            )}
                        />
                        {errors.gender && <p className="text-red-500 text-sm">{errors.gender.message}</p>}
                    </div>
                     <div className="grid gap-2">
                        <Label>Marital Status</Label>
                        <Controller
                            control={control}
                            name="maritalStatus"
                            render={({ field }) => (
                                <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4 pt-2">
                                   <Label className="flex items-center gap-2 font-normal cursor-pointer"><RadioGroupItem value="single" /> Single</Label>
                                   <Label className="flex items-center gap-2 font-normal cursor-pointer"><RadioGroupItem value="married" /> Married</Label>
                                </RadioGroup>
                            )}
                        />
                        {errors.maritalStatus && <p className="text-red-500 text-sm">{errors.maritalStatus.message}</p>}
                    </div>
                </div>

                {isMarriedFemale ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="maidenSurname">Surname (at birth)</Label>
                             <Controller name="maidenSurname" control={control} render={({ field }) => ( <Select onValueChange={field.onChange} value={field.value}> <SelectTrigger><SelectValue placeholder="SELECT SURNAME" /></SelectTrigger> <SelectContent> {surnameOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)} </SelectContent> </Select> )} />
                            {errors.maidenSurname && <p className="text-red-500 text-sm">{errors.maidenSurname.message}</p>}
                            {maidenSurnameSelection === 'OTHER' && (
                                <div className="mt-2">
                                    <Controller name="maidenSurnameOther" control={control} render={({ field }) => <Input {...field} placeholder="TYPE SURNAME" onChange={(e) => field.onChange(formatNameInput(e.target.value))}/>} />
                                    {errors.maidenSurnameOther && <p className="text-red-500 text-sm mt-1">{errors.maidenSurnameOther.message}</p>}
                                </div>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="currentSurname">Current Surname (after marriage)</Label>
                             <Controller name="currentSurname" control={control} render={({ field }) => ( <Select onValueChange={field.onChange} value={field.value}> <SelectTrigger><SelectValue placeholder="SELECT SURNAME" /></SelectTrigger> <SelectContent> {surnameOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)} </SelectContent> </Select> )} />
                            {errors.currentSurname && <p className="text-red-500 text-sm">{errors.currentSurname.message}</p>}
                            {currentSurnameSelection === 'OTHER' && (
                                <div className="mt-2">
                                    <Controller name="currentSurnameOther" control={control} render={({ field }) => <Input {...field} placeholder="TYPE SURNAME" onChange={(e) => field.onChange(formatNameInput(e.target.value))}/>} />
                                    {errors.currentSurnameOther && <p className="text-red-500 text-sm mt-1">{errors.currentSurnameOther.message}</p>}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                     <div className="grid gap-2">
                        <Label htmlFor="maidenSurname">Surname</Label>
                        <Controller name="maidenSurname" control={control} render={({ field }) => ( <Select onValueChange={field.onChange} value={field.value}> <SelectTrigger><SelectValue placeholder="SELECT SURNAME" /></SelectTrigger> <SelectContent> {surnameOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)} </SelectContent> </Select> )} />
                         {errors.maidenSurname && <p className="text-red-500 text-sm">{errors.maidenSurname.message}</p>}
                         {maidenSurnameSelection === 'OTHER' && (
                            <div className="mt-2">
                                <Controller name="maidenSurnameOther" control={control} render={({ field }) => <Input {...field} placeholder="TYPE SURNAME" onChange={(e) => field.onChange(formatNameInput(e.target.value))}/>} />
                                {errors.maidenSurnameOther && <p className="text-red-500 text-sm mt-1">{errors.maidenSurnameOther.message}</p>}
                            </div>
                         )}
                    </div>
                )}
                
                <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Controller name="name" control={control} render={({ field }) => <Input {...field} placeholder="E.G. RAMESH" onChange={(e) => field.onChange(formatNameInput(e.target.value))}/>} />
                    {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                </div>


                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <RelativeInput type="father" />
                    <RelativeInput type="mother" />
                </div>
                
                {maritalStatus === 'married' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <RelativeInput type="spouse" />
                        {isMarriedMale && (
                            <div className="grid gap-2">
                                <Label htmlFor="spouseFamily">Spouse's Maiden Family</Label>
                                    <Controller
                                    name="spouseFamily"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger id="spouseFamily">
                                                <SelectValue placeholder="SELECT FAMILY" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.keys(familyOptionsBySurname).map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                        )}
                    </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div className="grid grid-cols-2 gap-2">
                         <div className="grid gap-2">
                            <Label htmlFor="birthMonth">Birth Month (Optional)</Label>
                            <Controller
                                control={control}
                                name="birthMonth"
                                render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger id="birthMonth"><SelectValue placeholder="MONTH" /></SelectTrigger>
                                    <SelectContent>
                                        {months.map(month => <SelectItem key={month} value={month}>{month}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                )}
                            />
                            {errors.birthMonth && <p className="text-red-500 text-sm">{errors.birthMonth.message}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="birthYear">Birth Year (Optional)</Label>
                             <Controller
                                control={control}
                                name="birthYear"
                                render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger id="birthYear"><SelectValue placeholder="YEAR" /></SelectTrigger>
                                    <SelectContent>
                                        {years.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                )}
                            />
                            {errors.birthYear && <p className="text-red-500 text-sm">{errors.birthYear.message}</p>}
                        </div>
                    </div>
                     <div className="grid gap-2">
                        <Label>Profession (Optional)</Label>
                        <Controller
                            name="description"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger id="description">
                                        <SelectValue placeholder="SELECT A PROFESSION" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {descriptionOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                         {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
                         {description === 'OTHER' && (
                            <div className="mt-2">
                                <Controller
                                    name="otherDescription"
                                    control={control}
                                    render={({ field }) => <Input {...field} placeholder="Please specify your profession" />}
                                />
                                {errors.otherDescription && <p className="text-red-500 text-sm mt-1">{errors.otherDescription.message}</p>}
                            </div>
                         )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div className="space-y-2">
                        <Label>Profile Picture (Optional)</Label>
                        <div className="flex items-center gap-4 p-4 border rounded-lg h-32">
                            <div className="relative w-24 h-24">
                                {croppedImageUrl ? (
                                    <Image src={croppedImageUrl} alt="Profile preview" layout="fill" objectFit="cover" data-ai-hint="profile avatar" className="rounded-full" />
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                        <UserSearch className="w-10 h-10" />
                                    </div>
                                )}
                                {isImageValidating && (
                                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-full">
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 space-y-2">
                                <p className="text-sm text-muted-foreground">Must be a real photo of a person.</p>
                                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isImageValidating}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload Picture
                                </Button>
                                <input id="profilePicture" type="file" ref={fileInputRef} onChange={onFileChange} accept="image/*" className="hidden" />
                            </div>
                        </div>
                        {imageValidationError && (
                            <Alert variant="destructive" className="mt-2">
                                <ShieldAlert className="h-4 w-4" />
                                <AlertTitle>Invalid Image</AlertTitle>
                                <AlertDescription>{imageValidationError}</AlertDescription>
                            </Alert>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label>Family (Optional)</Label>
                        <Controller
                            name="family"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    disabled={
                                        !activeSurnameForFamily || 
                                        activeSurnameForFamily === 'OTHER' || 
                                        (isMarriedFemale && !!spouseId)
                                    }
                                >
                                    <SelectTrigger id="family">
                                        <SelectValue placeholder="SELECT FAMILY" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {currentFamilyOptions.length > 0 ? (
                                            currentFamilyOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)
                                        ) : (
                                            <SelectItem value="disabled" disabled>First, select a valid surname</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.family && <p className="text-red-500 text-sm">{errors.family.message}</p>}
                    </div>
                </div>

                
                <div className="text-right">
                    <Button type="submit" disabled={isProcessing || isImageValidating} size="lg">
                        {isProcessing || isImageValidating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Profile'}
                    </Button>
                </div>
            </form>

            <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirm Profile Submission</DialogTitle>
                         <DialogDescription>
                            Please review your details and agree to the policy before submitting.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex flex-col items-center space-y-2">
                             <Image 
                                src={croppedImageUrl || 'https://placehold.co/150x150.png'} 
                                alt="Profile Preview" 
                                width={100} 
                                height={100} 
                                className="rounded-full border-2"
                                data-ai-hint="profile avatar"
                            />
                             <p className="text-lg font-bold">{confirmationDisplayName}</p>
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Privacy and Policy</Label>
                            <ScrollArea className="h-32 w-full rounded-md border p-3 text-sm">
                                <p className="font-semibold mb-2">1. Data Accuracy and Approval:</p>
                                <p className="mb-2">You confirm that the information provided is accurate to the best of your knowledge. All profiles are subject to review and approval by an administrator. False or misleading entries may be rejected or removed without notice.</p>
                                
                                <p className="font-semibold mb-2">2. Public Visibility:</p>
                                <p className="mb-2">Once approved, your profile information, including your name, family connections, and profile picture, will be visible to other members of the community on this website. Do not submit information you wish to keep private.</p>

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
                        <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
                        <Button onClick={processSubmission} disabled={isProcessing || !hasAgreed}>
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Agree & Submit'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


             {isCropperOpen && (
                <ImageCropperModal
                    isOpen={isCropperOpen}
                    onClose={() => setIsCropperOpen(false)}
                    imageSrc={imageToCrop}
                    onCropComplete={onCropComplete}
                />
            )}
            {selectionType && (
                <RelativeSelectionModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    users={getFilteredUsers()}
                    allUsers={allUsers}
                    onSelect={handleSelectRelative}
                    onManualSave={handleManualSaveRelative}
                    title={`Select ${selectionType.charAt(0).toUpperCase() + selectionType.slice(1)}`}
                    selectionType={selectionType}
                    surnameToFilter={surnameFilter}
                />
            )}
        </>
    );
}
