
'use client';

import MainHeader from "@/components/MainHeader";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Edit, ExternalLink, Heart, Send, MessageSquareQuote, Loader2, CircleCheck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from 'next/navigation';
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { createSuggestion } from "@/actions/suggestions";
import { useState } from "react";
import Image from "next/image";

const suggestionSchema = z.object({
  message: z.string().min(10, { message: "Suggestion must be at least 10 characters long." }),
  profileId: z.string(),
  profileName: z.string(),
});

type SuggestionFormData = z.infer<typeof suggestionSchema>;

const SuggestionForm = ({ profileId, profileName }: { profileId: string; profileName: string }) => {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { control, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<SuggestionFormData>({
    resolver: zodResolver(suggestionSchema),
    defaultValues: {
      message: '',
      profileId: profileId,
      profileName: profileName
    }
  });

  const onSubmit = async (data: SuggestionFormData) => {
    const result = await createSuggestion({
      profile_id: data.profileId,
      profile_name: data.profileName,
      message: data.message
    });
    
    if (result.success) {
      toast({
        title: "Suggestion Sent!",
        description: "Thank you for your feedback. An admin will review it shortly.",
      });
      setIsSubmitted(true);
      reset();
    } else {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: result.message || "An unknown error occurred.",
      });
    }
  };

  if (isSubmitted) {
    return (
        <div className="text-center p-8 border-2 border-dashed border-green-500 rounded-lg bg-green-500/10">
            <CircleCheck className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold">Thank You!</h3>
            <p className="text-muted-foreground">Your suggestion has been submitted successfully.</p>
        </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="profileName">Regarding Profile</Label>
        <Input id="profileName" value={profileName} readOnly disabled />
      </div>
       <div className="grid gap-2">
        <Label htmlFor="message">Your Correction or Suggestion</Label>
        <Controller
          name="message"
          control={control}
          render={({ field }) => (
            <Textarea
              {...field}
              placeholder={`e.g., "The birth year is incorrect, it should be 1975." or "This person is the child of..."`}
              rows={4}
            />
          )}
        />
        {errors.message && <p className="text-sm text-destructive">{errors.message.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
        Submit Suggestion
      </Button>
    </form>
  )
}

export default function ContactPage() {
  const searchParams = useSearchParams();
  const profileId = searchParams.get('profileId');
  const profileName = searchParams.get('profileName');

  const qrCodeUrl = 'https://vxgjrfiruftdvdsfjcwr.supabase.co/storage/v1/object/public/assets/Capture1.JPG'; 
  const supportLink = 'upi://pay?pa=nandl90337668@barodampay&pn=Nandl&am=100&cu=INR';

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background">
          <div aria-hidden="true" className="aurora-background absolute--full-bleed pointer-events-none" />
      </div>
      <MainHeader />
      <main className="flex-1 container mx-auto pt-28 pb-12 px-4 md:px-6">
        <div className="text-center mb-12">
          <h1 className="font-headline text-4xl sm:text-5xl font-bold tracking-tight text-primary mb-2">
            Contact & Support
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            We value your feedback. Use the options below to get in touch or contribute to the community.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          
          <Card className="bg-card/30 backdrop-blur-lg border-white/10 shadow-lg md:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquareQuote className="h-5 w-5" />
                  Request an Edit or Correction
                </CardTitle>
                <CardDescription>
                    {profileId && profileName 
                      ? "You are requesting an edit for the profile selected. Please provide the details below."
                      : "To request an edit, first find the person's profile on the Explore page, then click the 'Request Edit' button on their page."
                    }
                </CardDescription>
            </CardHeader>
            <CardContent>
                {profileId && profileName ? (
                    <SuggestionForm profileId={profileId} profileName={profileName} />
                ) : (
                    <div className="text-center p-4 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">Please navigate to a profile first to submit a correction.</p>
                        <Button asChild variant="link">
                            <Link href="/explore">Go to Explore Page</Link>
                        </Button>
                    </div>
                )}
            </CardContent>
          </Card>

          <Card className="bg-card/30 backdrop-blur-lg border-white/10 shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  General Contact Email
                </CardTitle>
                <CardDescription>
                    For general inquiries not related to a specific profile, please contact us via email.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <a href="mailto:notyetcoder@gmail.com" className="font-semibold text-primary hover:underline">
                  notyetcoder@gmail.com
                </a>
            </CardContent>
          </Card>

           <Card className="bg-card/30 backdrop-blur-lg border-white/10 shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Other Suggestions or Notes
                </CardTitle>
                <CardDescription>
                    Have a general idea for the website? Please let us know!
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild>
                  <Link href="https://docs.google.com/forms/d/e/1FAIpQLSfWHA4bXHONChLPndwZpmdTYmX3ILdTCHu5boJ4hY1G09nplw/viewform?usp=sharing&ouid=112813512106264672173" target="_blank" rel="noopener noreferrer">
                    Open Suggestion Form
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
            </CardContent>
          </Card>
          
           <Card className="bg-card/30 backdrop-blur-lg border-white/10 shadow-lg md:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Support Our Community
                </CardTitle>
                <CardDescription>
                    This platform is for all of our village and will always be free. To keep it running smoothly on the web, we need your support.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-48 h-48 bg-white p-2 rounded-lg flex items-center justify-center flex-shrink-0 shadow-inner">
                    <Image 
                        src={qrCodeUrl}
                        alt="QR Code for community support"
                        width={180}
                        height={180}
                        data-ai-hint="QR code"
                        className="object-contain"
                    />
                </div>
                <div className="space-y-4 text-center sm:text-left">
                    <p className="text-lg font-medium">Scan the QR code with your payment app or use the button below.</p>
                    <p className="text-sm text-muted-foreground">Your contribution helps cover server costs and ensures this platform remains a valuable resource for our community's heritage.</p>
                     <Button asChild variant="secondary">
                        <Link href={supportLink} target="_blank" rel="noopener noreferrer">
                          Provide Support via Link
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </CardContent>
          </Card>
        </div>
        
      </main>
      <Footer />
    </div>
  );
}
