
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

  // Native share (WhatsApp, iMessage, etc.) — available on mobile browsers
  const handleNativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: `${profileName} — Vasudha Connect`,
        text: `View ${profileName}'s profile on Vasudha Connect community family tree.`,
        url: profileUrl,
      });
    } catch (err) {
      // User cancelled share — not an error
    }
  };

  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;
  
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
          {canNativeShare && (
            <Button className="w-full" onClick={handleNativeShare}>
              Share via WhatsApp / Messages
            </Button>
          )}
          <div className="flex items-center space-x-2">
            <Input value={profileUrl} readOnly className="text-xs" />
            <Button type="button" size="icon" onClick={handleCopy} title="Copy link">
              {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span className="sr-only">Copy Link</span>
            </Button>
            <Button variant="outline" size="icon" onClick={() => setShowQr(!showQr)} title="Show QR code">
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

