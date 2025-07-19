
'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { createAdmin } from '@/actions/auth';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';

const surnameOptions = ['MATA', 'CHHANGA', 'VARCHAND'];
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

const formSchema = z.object({
    name: z.string().min(2, "Name is required."),
    username: z.string().min(4, "Username must be at least 4 characters."),
    email: z.string().email("Please enter a valid email."),
    password: z.string().min(6, "Password must be at least 6 characters."),
    permissions: z.object({
        access: z.enum(['all', 'specific']),
        surnames: z.array(z.string()),
        families: z.record(z.array(z.string())),
    }),
}).refine(data => {
    if (data.permissions.access === 'specific') {
        return data.permissions.surnames.length > 0;
    }
    return true;
}, {
    message: "Please select at least one surname for specific access.",
    path: ['permissions.surnames'],
});

type FormData = z.infer<typeof formSchema>;

export default function AddAdminForm({ onAdminAdded }: { onAdminAdded: () => void }) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, formState: { errors }, control, watch } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            permissions: {
                access: 'all',
                surnames: [],
                families: {},
            }
        }
    });

    const permissions = watch('permissions');

    const permissionSummary = useMemo(() => {
        if (permissions.access === 'all') {
            return "Full Access: Can view and edit all profiles in the community.";
        }
        if (permissions.surnames.length === 0) {
            return "No access rights selected. Please choose specific surnames and families.";
        }
        return permissions.surnames.map(surname => {
            const families = permissions.families[surname] || [];
            if (families.length === 0 || families.length === familyOptionsBySurname[surname as keyof typeof familyOptionsBySurname]?.length) {
                return `${surname} (All Families)`;
            }
            return `${surname} (${families.join(', ')})`;
        }).join('\n');
    }, [permissions]);

    const onSubmit = async (values: FormData) => {
        setIsSubmitting(true);
        try {
            const result = await createAdmin({ ...values, role: 'editor' });
            if (result.success) {
                toast({
                    title: "Admin Added",
                    description: result.message,
                });
                onAdminAdded();
            } else {
                 toast({ variant: "destructive", title: "Failed to Add Admin", description: result.message });
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ variant: "destructive", title: "Failed to Add Admin", description: message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full overflow-hidden">
            <div className="flex-grow overflow-y-auto pr-6 -mr-6 space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column for User Details */}
                  <div className="space-y-4">
                      <div className="grid gap-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input id="name" {...register('name')} placeholder="Enter full name" />
                          {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                      </div>
                      <div className="grid gap-2">
                          <Label htmlFor="username">Username</Label>
                          <Input id="username" {...register('username')} placeholder="Enter username" />
                          {errors.username && <p className="text-red-500 text-sm">{errors.username.message}</p>}
                      </div>
                      <div className="grid gap-2">
                          <Label htmlFor="email">Email (for login)</Label>
                          <Input id="email" type="email" {...register('email')} placeholder="editor@example.com" />
                          {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                      </div>
                      <div className="grid gap-2">
                          <Label htmlFor="password">Password</Label>
                          <Input id="password" type="password" {...register('password')} placeholder="Min. 6 characters" />
                          {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
                      </div>
                  </div>

                  {/* Right Column for Permissions */}
                  <div className="space-y-4 rounded-lg border p-4">
                      <h3 className="text-lg font-semibold">Permissions</h3>
                      <Controller
                          name="permissions.access"
                          control={control}
                          render={({ field }) => (
                              <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                                  <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="all" id="all-access" />
                                      <Label htmlFor="all-access" className="font-normal">Full Access</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="specific" id="specific-access" />
                                      <Label htmlFor="specific-access" className="font-normal">Specific Access</Label>
                                  </div>
                              </RadioGroup>
                          )}
                      />
                      
                      {permissions.access === 'specific' && (
                          <div className="space-y-4 pl-2 border-l-2 ml-2 pt-2">
                              <div>
                                  <Label className="font-medium">Allowed Surnames</Label>
                                  {surnameOptions.map(surname => (
                                      <Controller
                                          key={surname}
                                          name="permissions.surnames"
                                          control={control}
                                          render={({ field }) => (
                                              <div className="flex items-center space-x-2 mt-2">
                                                  <Checkbox
                                                      id={`surname-${surname}`}
                                                      checked={field.value?.includes(surname)}
                                                      onCheckedChange={(checked) => {
                                                          const newSurnames = checked
                                                              ? [...(field.value || []), surname]
                                                              : (field.value || []).filter(s => s !== surname);
                                                          field.onChange(newSurnames);
                                                      }}
                                                  />
                                                  <Label htmlFor={`surname-${surname}`} className="font-normal">{surname}</Label>
                                              </div>
                                          )}
                                      />
                                  ))}
                                  {errors.permissions?.surnames && <p className="text-red-500 text-sm mt-1">{errors.permissions.surnames.message}</p>}
                              </div>

                              {permissions.surnames.map(surname => (
                                  <div key={surname} className="p-3 mt-2 rounded-md border bg-muted/50">
                                      <Label className="font-medium">Families for {surname}</Label>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-2">
                                          {(familyOptionsBySurname[surname as keyof typeof familyOptionsBySurname] || []).map(family => (
                                              <Controller
                                                  key={family}
                                                  name={`permissions.families.${surname}`}
                                                  control={control}
                                                  render={({ field }) => (
                                                      <div className="flex items-center space-x-2">
                                                          <Checkbox
                                                              id={`family-${surname}-${family}`}
                                                              checked={field.value?.includes(family)}
                                                              onCheckedChange={(checked) => {
                                                                  const currentFamilies = field.value || [];
                                                                  const newFamilies = checked
                                                                      ? [...currentFamilies, family]
                                                                      : currentFamilies.filter(f => f !== family);
                                                                  field.onChange(newFamilies);
                                                              }}
                                                          />
                                                          <Label htmlFor={`family-${surname}-${family}`} className="font-normal text-sm">{family}</Label>
                                                      </div>
                                                  )}
                                              />
                                          ))}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
            </div>
            
            <div className="flex-shrink-0 pt-4 space-y-4">
              <Separator />
              <div className="space-y-2">
                  <Label className="font-medium">Permission Summary</Label>
                  <Textarea readOnly value={permissionSummary} className="text-xs text-muted-foreground bg-muted/50" rows={2}/>
              </div>
              
              <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Editor
                  </Button>
              </div>
            </div>
        </form>
    );
}
