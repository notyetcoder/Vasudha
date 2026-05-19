
'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { CalendarIcon, Loader2, Upload, X } from 'lucide-react';
import type { User } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { useEffect, useRef, useState, useMemo } from 'react';
import Image from 'next/image';
import UserAvatar from './UserAvatar';
import ImageCropperModal from './ImageCropperModal';
import { Checkbox } from './ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format, parse } from 'date-fns';
import { findUserById } from '@/lib/user-utils';
import AutocompleteRelativeInput from './AutocompleteRelativeInput';
import RelativeSelectionModal from './RelativeSelectionModal';
import { ScrollArea } from './ui/scroll-area';
import { useToast } from '@/hooks/use-toast';


async function readFileAsDataURL(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = (e) => reject(new Error('FileReader error'));
    r.onload = () => resolve(r.result as string);
    r.readAsDataURL(file);
  });
}

function calcTargetSize(origW: number, origH: number, maxW: number, maxH: number) {
  let width = origW;
  let height = origH;
  if (width > height && width > maxW) {
    height = Math.round(height * (maxW / width));
    width = maxW;
  } else if (height > maxH) {
    width = Math.round(width * (maxH / height));
    height = maxH;
  }
  return { width, height };
}

async function compressImage(file: File, maxWidth = 400, maxHeight = 400, quality = 0.6): Promise<Blob> {
  try {
    // Prefer createImageBitmap (more memory efficient on modern browsers)
    if ('createImageBitmap' in window) {
      const bitmap = await createImageBitmap(file);
      const { width, height } = calcTargetSize(bitmap.width, bitmap.height, maxWidth, maxHeight);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context not available');
      ctx.drawImage(bitmap, 0, 0, width, height);

      // try toBlob, fallback to dataURL->fetch->blob if necessary
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
      if (blob) return blob;

      // fallback
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      return await (await fetch(dataUrl)).blob();
    }

    // Fallback path (older browsers): load Image from dataURL
    const dataUrl = await readFileAsDataURL(file);
    const img = new Image();
    img.src = dataUrl;

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (e) => reject(new Error('Image decode/load failed'));
    });

    const { width, height } = calcTargetSize(img.width, img.height, maxWidth, maxHeight);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (blob) return blob;

    const fallbackDataUrl = canvas.toDataURL('image/jpeg', quality);
    return await (await fetch(fallbackDataUrl)).blob();
  } catch (err: any) {
    // Throw an Error instance so calling code can read .message
    throw new Error(err?.message || String(err));
  }
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, i) => (currentYear - i).toString());
const months = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

const predefinedSurnames = ['CHHANGA', 'MATA', 'VARCHAND'];

const familyOptionsBySurname: Record<string, string[]> = {
  VARCHAND: [
    'DODHIYEVARA', 'KESRANI', 'PATEL', 'VARCHAND',
  ].sort(),
  MATA: [
    'BHANA RAMAIYA', 'DEVANI', 'DHANANI', 'JAGANI', 'KHENGAR', 'LADHANI', 'RUPANI', 'SUJANI', 'TEJA TRIKAM', 'UKERANI', 'VAGHANI', 'VARJANG', 'VIRANI', 'VISAMAN',
  ].sort(),
  CHHANGA: [
    'BHAGVANI', 'BHIMNAI', 'BHOJANI', 'DEHAR MANDA', 'GANGANI', 'NATHANI', 'RATANI', 'SAMRANI', 'SAMTANI',
  ].sort(),
};

const descriptionOptions = [
    'FARMER', 'SERVICE', 'BUSINESS', 'HOUSEWIFE', 'STUDENT', 
    'TEACHER', 'DRIVER', 'SHOPKEEPER', 'TAILOR', 'CARPENTER', 
    'MASON', 'LABORER', 'DOCTOR', 'ENGINEER', 'LAWYER', 
    'PRIEST', 'ARTIST', 'BLACKSMITH', 'POTTER', 'POLICE',
    'RETIRED', 'UNEMPLOYED'
].sort();

const getFinalValue = (selectValue?: string, otherValue?: string) => {
    return selectValue === 'OTHER' ? (otherValue || '').trim().toUpperCase() : selectValue || '';
};

const singleNameValidation = z.string().min(1, 'This field cannot be empty.').regex(/^[A-Z]+$/, 'Only uppercase letters allowed, no spaces.');

const optionalSingleNameValidation = z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    singleNameValidation.optional()
);

const formSchema = z.object({
  maidenName: z.string().min(1, 'Maiden surname is required.'),
  maidenNameOther: z.string().optional(),
  surname: z.string().min(1, 'Current surname is required.'),
  surnameOther: z.string().optional(),
  name: singleNameValidation.min(2, 'Name must be at least 2 characters.'),
  gender: z.enum(['male', 'female'], { required_error: 'Please select a gender.' }),
  maritalStatus: z.enum(['single', 'married'], { required_error: 'Please select a marital status.' }),
  fatherName: optionalSingleNameValidation,
  motherName: optionalSingleNameValidation,
  spouseName: optionalSingleNameValidation,
  birthMonth: z.string().optional(),
  birthYear: z.string().optional(),
  family: z.string().optional(),
  familyOther: z.string().optional(),
  description: z.string().optional(),
  descriptionOther: z.string().optional(),
  isDeceased: z.boolean().optional(),
  deathDate: z.string().optional(),
}).refine(data => {
    if (data.maritalStatus === 'married' && data.gender === 'female' && !data.spouseId) {
        return !!data.spouseName && data.spouseName.length >= 2;
    }
    return true;
}, {
    message: "Spouse's name is required for married women.",
    path: ['spouseName'],
}).refine(data => {
    if (data.surname === 'OTHER') return !!data.surnameOther && data.surnameOther.length > 0;
    return true;
}, {
    message: 'Please specify the surname.',
    path: ['surnameOther'],
}).refine(data => {
    if (data.maidenName === 'OTHER') return !!data.maidenNameOther && data.maidenNameOther.length > 0;
    return true;
}, {
    message: 'Please specify the maiden surname.',
    path: ['maidenNameOther'],
}).refine(data => {
    if (data.family === 'OTHER') return !!data.familyOther && data.familyOther.length > 0;
    return true;
}, {
    message: 'Please specify the family.',
    path: ['familyOther'],
}).refine(data => {
    if (data.description === 'OTHER') return !!data.descriptionOther && data.descriptionOther.length > 0;
    return true;
}, {
    message: 'Please specify the profession.',
    path: ['descriptionOther'],
});


type FormData = z.infer<typeof formSchema>;

type UserFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  allUsers: User[];
  onSave: (data: any) => Promise<void> | void;
  mode: 'create' | 'edit';
};

const emptyFormValues: Partial<FormData> = {
    surname: '',
    maidenName: '',
    name: '',
    gender: undefined,
    maritalStatus: undefined,
    fatherName: '',
    motherName: '',
    spouseName: '',
    birthMonth: '',
    birthYear: '',
    family: '',
    description: '',
    isDeceased: false,
    deathDate: '',
};

type SelectionType = 'father' | 'mother' | 'spouse';

export default function UserFormModal({ isOpen, onClose, user, allUsers, onSave, mode }: UserFormModalProps) {
    const { control, handleSubmit, watch, formState: { errors, isSubmitting }, reset, setValue, trigger } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: emptyFormValues
    });
    const { toast } = useToast();

    const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
    const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
    const [isCropperOpen, setIsCropperOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [fatherId, setFatherId] = useState<string | undefined | null>();
    const [motherId, setMotherId] = useState<string | undefined | null>();
    const [spouseId, setSpouseId] = useState<string | undefined | null>();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRelation, setEditingRelation] = useState<SelectionType | null>(null);
    
    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && user) {
                let formattedDeathDate = '';
                if (user.deathDate) {
                    try {
                        const parsedDate = new Date(user.deathDate);
                        if (!isNaN(parsedDate.getTime())) {
                            formattedDeathDate = format(parsedDate, 'dd/MM/yyyy');
                        }
                    } catch (e) { /* ignore invalid date */ }
                }

                const defaultValues = { ...emptyFormValues, ...user, deathDate: formattedDeathDate };
                reset(defaultValues);
                setCurrentImageUrl(user.profilePictureUrl);
                setFatherId(user.fatherId);
                setMotherId(user.motherId);
                setSpouseId(user.spouseId);

            } else {
                 reset(emptyFormValues);
                setCurrentImageUrl(null);
                setFatherId(null);
                setMotherId(null);
                setSpouseId(null);
            }
            setCroppedImageUrl(null);
        }
    }, [isOpen, mode, user, reset]);

    const maritalStatus = watch('maritalStatus');
    const gender = watch('gender');
    const watchSurname = watch('surname');
    const watchMaidenName = watch('maidenName');
    const watchDescription = watch('description');
    const watchFamily = watch('family');
    const isDeceased = watch('isDeceased');
    
    const isMarriedFemale = gender === 'female' && maritalStatus === 'married';
    const surnameForFamilyOptions = isMarriedFemale ? watchSurname : watchMaidenName;

    const dynamicFamilyOptions = useMemo(() => {
        const finalSurname = getFinalValue(surnameForFamilyOptions, watch('surnameOther') || watch('maidenNameOther'));
        if (!finalSurname) return [];
        return familyOptionsBySurname[finalSurname as keyof typeof familyOptionsBySurname] || [];
    }, [surnameForFamilyOptions, watch]);

    const spouse = useMemo(() => findUserById(spouseId, allUsers), [allUsers, spouseId]);
    
    useEffect(() => {
        if (isMarriedFemale && spouse) {
            setValue('family', spouse.family || '', { shouldValidate: true });
            setValue('surname', spouse.surname, { shouldValidate: true });
        }
    }, [isMarriedFemale, spouse, setValue]);

    
const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files.length > 0) {
    const file = e.target.files[0];
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please upload a valid image file (jpg, png, webp).' });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'File Too Large', description: 'File size must be less than 20MB.' });
      return;
    }

    try {
      console.log('[upload] compressing file', file.type, file.size, file.name);
      const compressedBlob = await compressImage(file, 800, 800, 0.8);
      console.log('[upload] compressed blob size', compressedBlob.size);
      const compressedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' });

      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageToCrop(reader.result as string);
        setIsCropperOpen(true);
      });
      reader.addEventListener('error', (err) => {
        console.error('File read error after compression', err);
        toast({ variant: 'destructive', title: 'File Read Error', description: 'Could not read the compressed file. Please try again.' });
      });
      reader.readAsDataURL(compressedFile);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      console.error('Compression error', err);
      toast({
        variant: 'destructive',
        title: 'Compression Failed',
        description: err?.message || 'Could not compress the image. Please try again.',
      });
    }
  }
};
    
    const handleCropError = (message: string) => {
        toast({
            variant: 'destructive',
            title: 'Image Crop Failed',
            description: message,
        });
        setIsCropperOpen(false);
    };

    const onCropComplete = (url: string) => setCroppedImageUrl(url);


    const handleRemovePicture = () => { setCurrentImageUrl(null); setCroppedImageUrl(null); };
    const formatSingleNameInput = (value: string) => value ? value.toUpperCase().replace(/[^A-Z]/g, '') : '';
    
    const processSubmission = async (values: FormData) => {
        const finalProfilePictureUrl = croppedImageUrl || currentImageUrl || 'https://placehold.co/150x150.png';

        if (finalProfilePictureUrl.startsWith('data:image')) {
            const match = finalProfilePictureUrl.match(/^data:image\/(png|jpeg);base64,(.*)$/);
            if (!match) {
                toast({ variant: 'destructive', title: 'Image Error', description: 'Invalid image format after cropping. Please try uploading again.' });
                return;
            }
        }

        let isoDeathDate: string | undefined;
        if (values.isDeceased && values.deathDate) {
            try {
                isoDeathDate = parse(values.deathDate, 'dd/MM/yyyy', new Date()).toISOString();
            } catch (e) { /* Ignore */ }
        }
        
        const finalMaidenName = getFinalValue(values.maidenName, values.maidenNameOther);
        const finalSurname = getFinalValue(values.surname, values.surnameOther);
        const finalDescription = getFinalValue(values.description, values.descriptionOther);
        const finalFamily = getFinalValue(values.family, values.familyOther);

        const dataToSave = { 
            ...values,
            maidenName: finalMaidenName,
            surname: finalSurname || finalMaidenName,
            description: finalDescription,
            family: finalFamily,
            deathDate: isoDeathDate,
            profilePictureUrl: finalProfilePictureUrl,
            fatherId, motherId, spouseId,
        };
        
        await onSave(dataToSave);
    };

    const openRelationModal = (type: SelectionType) => {
        setEditingRelation(type);
        setIsModalOpen(true);
    };

    const handleSelectRelative = async (relative: User) => {
        if (!editingRelation) return;
        
        const relationNameKey = `${editingRelation}Name` as const;
        const relationIdKey = `${editingRelation}Id` as const;
        
        setValue(relationNameKey, relative.name, { shouldValidate: true });

        if (relationIdKey === 'fatherId') setFatherId(relative.id);
        if (relationIdKey === 'motherId') setMotherId(relative.id);
        if (relationIdKey === 'spouseId') {
            setSpouseId(relative.id);
            setValue('spouseName', relative.name);
        }

        if (editingRelation === 'father') {
            const mother = findUserById(relative.spouseId, allUsers);
            if (mother) {
                setMotherId(mother.id);
                setValue('motherName', mother.name, { shouldValidate: true });
            }
        }
        
        setIsModalOpen(false);
        await trigger(relationNameKey);
    };

    const handleManualRelativeSave = async (name: string) => {
        if (!editingRelation) return;
        const relationNameKey = `${editingRelation}Name` as const;
        const relationIdKey = `${editingRelation}Id` as const;
        
        setValue(relationNameKey, name, { shouldValidate: true });
        
        if (relationIdKey === 'fatherId') setFatherId(null);
        if (relationIdKey === 'motherId') setMotherId(null);
        if (relationIdKey === 'spouseId') setSpouseId(null);
        
        setIsModalOpen(false);
        await trigger(relationNameKey);
    };
    
    const handleClearRelative = (type: SelectionType) => {
        const relationNameKey = `${type}Name` as const;
        const relationIdKey = `${type}Id` as const;
        
        setValue(relationNameKey, undefined, { shouldValidate: true });

        if (relationIdKey === 'fatherId') {
            setFatherId(null);
            setMotherId(null);
            setValue('motherName', undefined, { shouldValidate: true });
        } else if (relationIdKey === 'motherId') {
            setMotherId(null);
        } else if (relationIdKey === 'spouseId') {
            setSpouseId(null);
        }
    };

    const getModalUsers = () => {
        if (!editingRelation) return [];
        let potentialRelatives = allUsers.filter(u => u.id !== user?.id);
        switch (editingRelation) {
            case 'father': return potentialRelatives.filter(u => u.gender === 'male');
            case 'mother': return potentialRelatives.filter(u => u.gender === 'female');
            case 'spouse': {
                 let potentialSpouses = potentialRelatives.filter(u => !u.spouseId || u.spouseId === user?.id);
                 if (gender === 'male') return potentialSpouses.filter(u => u.gender === 'female');
                 if (gender === 'female') return potentialSpouses.filter(u => u.gender === 'male');
                 return potentialSpouses;
            }
            default: return [];
        }
    };

    const getModalTitle = () => {
        if (!editingRelation) return "Select Relative";
        const relationName = editingRelation.charAt(0).toUpperCase() + editingRelation.slice(1);
        return `Select ${relationName} for ${watch('name')} ${watch('surname')}`;
    };
    
    const father = findUserById(fatherId, allUsers);
    const mother = findUserById(motherId, allUsers);
    const pictureToDisplay = croppedImageUrl || currentImageUrl;
    const getSpouseLabel = () => gender === 'male' ? "Spouse - Wife" : gender === 'female' ? "Spouse - Husband" : "Spouse's Name";

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl flex flex-col h-[90vh]">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle>{mode === 'edit' ? `Edit User: ${user?.name} ${user?.surname}` : 'Create New Person'}</DialogTitle>
                    <DialogDescription>
                        {mode === 'edit' ? "Make changes to the user's profile information. Click save when you're done." : "Fill in the details for the new person."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(processSubmission)} className="flex-grow flex flex-col overflow-hidden">
                    <ScrollArea className="flex-grow pr-6 -mr-6">
                      <div className='space-y-4'>
                        {mode === 'edit' && user && (
                            <div className="grid gap-2">
                                <Label htmlFor="uniqueId">Unique ID</Label>
                                <Input id="uniqueId" value={user.id} readOnly disabled />
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-center">
                            <div className="grid gap-2">
                                <Label>Gender</Label>
                                <Controller control={control} name="gender" render={({ field }) => (
                                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4 pt-2">
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="male" id="male-modal" /><Label htmlFor="male-modal">Male</Label></div>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="female" id="female-modal" /><Label htmlFor="female-modal">Female</Label></div>
                                    </RadioGroup>
                                )} />
                                {errors.gender && <p className="text-red-500 text-sm">{errors.gender.message}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label>Marital Status</Label>
                                <Controller control={control} name="maritalStatus" render={({ field }) => (
                                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4 pt-2">
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="single" id="single-modal" /><Label htmlFor="single-modal">Single</Label></div>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="married" id="married-modal" /><Label htmlFor="married-modal">Married</Label></div>
                                    </RadioGroup>
                                )} />
                                {errors.maritalStatus && <p className="text-red-500 text-sm">{errors.maritalStatus.message}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="maidenName">Surname {isMarriedFemale && '(at birth)'}</Label>
                                <Controller name="maidenName" control={control} render={({ field }) => ( <Select onValueChange={field.onChange} value={field.value ?? ''}> <SelectTrigger><SelectValue placeholder="Select Surname" /></SelectTrigger> <SelectContent> {predefinedSurnames.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)} <SelectItem value="OTHER">OTHER</SelectItem> </SelectContent> </Select> )} />
                                {watchMaidenName === 'OTHER' && (
                                    <Controller name="maidenNameOther" control={control} render={({ field }) => <Input {...field} placeholder="Please specify surname" className="mt-2" onChange={(e) => field.onChange(formatSingleNameInput(e.target.value))} />} />
                                )}
                                {errors.maidenName && <p className="text-red-500 text-sm">{errors.maidenName.message}</p>}
                                {errors.maidenNameOther && <p className="text-red-500 text-sm">{errors.maidenNameOther.message}</p>}
                            </div>
                            <div className="grid gap-2">
                                    <Label htmlFor="surname">Current Surname</Label>
                                    <Controller name="surname" control={control} render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={isMarriedFemale && !!spouseId}>
                                            <SelectTrigger><SelectValue placeholder="Select Surname" /></SelectTrigger>
                                            <SelectContent>{predefinedSurnames.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}  <SelectItem value="OTHER">OTHER</SelectItem></SelectContent>
                                        </Select>
                                    )} />
                                    {watch('surname') === 'OTHER' && (
                                        <Controller name="surnameOther" control={control} render={({ field }) => <Input {...field} placeholder="Please specify surname" className="mt-2" onChange={(e) => field.onChange(formatSingleNameInput(e.target.value))} />} />
                                    )}
                                    {errors.surname && <p className="text-red-500 text-sm">{errors.surname.message}</p>}
                                    {errors.surnameOther && <p className="text-red-500 text-sm">{errors.surnameOther.message}</p>}
                                </div>
                        </div>
                        
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Controller name="name" control={control} render={({ field }) => <Input {...field} placeholder="E.G. SURESH" onChange={(e) => field.onChange(formatSingleNameInput(e.target.value))} />} />
                            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Controller
                                name="fatherName"
                                control={control}
                                render={({ field }) => (
                                    <AutocompleteRelativeInput
                                        label="Father's Name"
                                        onButtonClick={() => openRelationModal('father')}
                                        onClear={() => handleClearRelative('father')}
                                        selectedPerson={father}
                                        manualName={field.value}
                                    />
                                )}
                            />
                            <Controller
                                name="motherName"
                                control={control}
                                render={({ field }) => (
                                    <AutocompleteRelativeInput
                                        label="Mother's Name"
                                        onButtonClick={() => openRelationModal('mother')}
                                        onClear={() => handleClearRelative('mother')}
                                        selectedPerson={mother}
                                        manualName={field.value}
                                    />
                                )}
                            />
                        </div>
                         {errors.fatherName && <p className="text-red-500 text-sm -mt-4">{errors.fatherName.message}</p>}
                         {errors.motherName && <p className="text-red-500 text-sm -mt-4">{errors.motherName.message}</p>}

                        {maritalStatus === 'married' && (
                            <div className="grid gap-2">
                                <Controller
                                    name="spouseName"
                                    control={control}
                                    render={({ field }) => (
                                        <AutocompleteRelativeInput
                                            label={getSpouseLabel()}
                                            onButtonClick={() => openRelationModal('spouse')}
                                            onClear={() => handleClearRelative('spouse')}
                                            selectedPerson={spouse}
                                            manualName={field.value}
                                        />
                                    )}
                                />
                                {errors.spouseName && <p className="text-red-500 text-sm">{errors.spouseName.message}</p>}
                            </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label>Birth Month (Optional)</Label>
                                <Controller name="birthMonth" control={control} render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value ?? ''}><SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                                        <SelectContent>{months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                                    </Select>
                                )} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Birth Year (Optional)</Label>
                                <Controller name="birthYear" control={control} render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value ?? ''}><SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                                        <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                                    </Select>
                                )} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="description">Profession (Optional)</Label>
                                <Controller name="description" control={control} render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={isDeceased}>
                                    <SelectTrigger><SelectValue placeholder="Select Profession" /></SelectTrigger>
                                    <SelectContent>
                                        <ScrollArea className="h-72">
                                            {descriptionOptions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                            <SelectItem value="OTHER">OTHER</SelectItem>
                                        </ScrollArea>
                                    </SelectContent>
                                </Select>
                                )} />
                                {watchDescription === 'OTHER' && (
                                    <Controller name="descriptionOther" control={control} render={({ field }) => <Input {...field} placeholder="Please specify profession" className="mt-2" />} />
                                )}
                                {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
                                {errors.descriptionOther && <p className="text-red-500 text-sm">{errors.descriptionOther.message}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="family">Family (Optional)</Label>
                                <Controller name="family" control={control} render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={!surnameForFamilyOptions || dynamicFamilyOptions.length === 0 || (isMarriedFemale && !!spouseId)}>
                                    <SelectTrigger><SelectValue placeholder="Select Family" /></SelectTrigger>
                                    <SelectContent>
                                        {dynamicFamilyOptions.length > 0 ? (
                                            <>
                                                {dynamicFamilyOptions.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                                                <SelectItem value="OTHER">OTHER</SelectItem>
                                            </>
                                        ) : (
                                            <SelectItem value="disabled" disabled>First, select surname</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                                )} />
                                {watchFamily === 'OTHER' && (
                                    <Controller name="familyOther" control={control} render={({ field }) => <Input {...field} placeholder="Please specify family" className="mt-2" onChange={(e) => field.onChange(formatSingleNameInput(e.target.value))}/>} />
                                )}
                                {errors.family && <p className="text-red-500 text-sm">{errors.family.message}</p>}
                                {errors.familyOther && <p className="text-red-500 text-sm">{errors.familyOther.message}</p>}
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label>Profile Picture</Label>
                            <div className="flex items-center gap-4 p-4 border rounded-lg min-h-[120px]">
                                {pictureToDisplay ? (
                                    <>
                                        <UserAvatar name={watch('name') || 'U'} profilePictureUrl={pictureToDisplay} size={80} />
                                        <div className="space-y-2">
                                            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                                <Upload className="mr-2 h-4 w-4" /> Change Picture
                                            </Button>
                                            <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={handleRemovePicture}>
                                                <X className="mr-2 h-4 w-4" /> Remove Picture
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                        <Upload className="mr-2 h-4 w-4" /> Upload Picture
                                    </Button>
                                )}
                                <input
                                    id="profilePicture"
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={onFileChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-4 rounded-lg border p-4">
                            <Controller
                                control={control}
                                name="isDeceased"
                                render={({ field }) => (
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="isDeceased-modal"
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                        <Label htmlFor="isDeceased-modal">स्वर्गस्थ</Label>
                                    </div>
                                )}
                            />
                            {isDeceased && (
                                <div className="grid gap-2">
                                    <Label>Date of Passing (Optional)</Label>
                                    <Controller
                                        control={control}
                                        name="deathDate"
                                        render={({ field }) => (
                                            <div className="flex items-center gap-2">
                                                <Input 
                                                    placeholder="DD/MM/YYYY" 
                                                    value={field.value || ''} 
                                                    onChange={field.onChange}
                                                />
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button type="button" variant={"outline"} size="icon" className="w-10">
                                                            <CalendarIcon className="h-4 w-4" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value ? parse(field.value, 'dd/MM/yyyy', new Date()) : undefined}
                                                            onSelect={(date) => {
                                                                if (date) {
                                                                    field.onChange(format(date, 'dd/MM/yyyy'));
                                                                }
                                                            }}
                                                            disabled={(date) =>
                                                                date > new Date() || date < new Date("1900-01-01")
                                                            }
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        )}
                                    />
                                </div>
                            )}
                        </div>
                      </div>
                    </ScrollArea>

                    <DialogFooter className="flex-shrink-0 mt-4 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {mode === 'edit' ? 'Save Changes' : 'Create Profile'}
                        </Button>
                    </DialogFooter>
                </form>

                 {isModalOpen && (
                    <RelativeSelectionModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        users={getModalUsers()}
                        allUsers={allUsers}
                        onSelect={handleSelectRelative}
                        onManualSave={handleManualRelativeSave}
                        title={getModalTitle()}
                        selectionType={editingRelation}
                    />
                )}

                {isCropperOpen && (
                    <ImageCropperModal
                        isOpen={isCropperOpen}
                        onClose={() => setIsCropperOpen(false)}
                        imageSrc={imageToCrop}
                        onCropComplete={onCropComplete}
                        onError={handleCropError}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}

    
