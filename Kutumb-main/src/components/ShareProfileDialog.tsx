
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Copy, Check, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';

interface ShareProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  profileUrl: string;
  profileName: string;
}

export default function ShareProfileDialog({ isOpen, onClose, profileUrl, profileName }: ShareProfileDialogProps) {
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setIsCopied(true);
      toast({ title: 'Link Copied!', description: 'Profile URL has been copied to your clipboard.' });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Copy Failed', description: 'Could not copy the link.' });
    }
  };
  
  // Reset QR code visibility when dialog closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setShowQr(false);
    }
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share {profileName}'s Profile</DialogTitle>
          <DialogDescription>
            Share this profile via link or QR code.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="flex items-center space-x-2">
            <Input value={profileUrl} readOnly />
            <Button type="button" size="icon" onClick={handleCopy}>
              {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span className="sr-only">Copy Link</span>
            </Button>
            <Button variant="outline" size="icon" onClick={() => setShowQr(!showQr)}>
                <QrCode className="h-4 w-4" />
                <span className="sr-only">{showQr ? 'Hide' : 'Show'} QR Code</span>
            </Button>
          </div>

           {showQr && (
            <div className="flex justify-center p-4 bg-muted rounded-lg">
                <QRCodeSVG value={profileUrl} size={160} bgColor={"#ffffff"} fgColor={"#000000"} level={"L"} includeMargin={false} />
            </div>
           )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

