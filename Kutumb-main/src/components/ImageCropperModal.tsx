
'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RotateCcw, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string | null;
  onCropComplete: (croppedImageUrl: string) => void;
  onError?: (message: string) => void;
}

// This function is simplified to only handle cropping.
// All compression and format conversion is moved to the server.
async function getCroppedImg(
  image: HTMLImageElement,
  crop: Crop,
  canvas: HTMLCanvasElement,
  rotate = 0
): Promise<string> {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('No 2d context');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const pixelCrop = {
        x: crop.x * scaleX,
        y: crop.y * scaleY,
        width: crop.width * scaleX,
        height: crop.height * scaleY,
    };

    const canvasSize = Math.max(pixelCrop.width, pixelCrop.height);
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    // Fill background with white. JPEG does not support transparency,
    // so this prevents a black background on the cropped image.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the rotated and cropped image onto the canvas
    ctx.save();
    try {
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotate * Math.PI) / 180);
        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            -pixelCrop.width / 2,
            -pixelCrop.height / 2,
            pixelCrop.width,
            pixelCrop.height
        );
    } catch (e) {
        throw new Error('Could not draw image on canvas. The source image may be corrupted.');
    } finally {
        ctx.restore();
    }

    // Return as JPEG. This is more universally supported than WebP for canvas.toDataURL
    // Quality is set to 0.8 as a good balance.
    return canvas.toDataURL('image/jpeg', 0.8);
}


export default function ImageCropperModal({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
  onError,
}: ImageCropperModalProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);

  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setRotate(0);
      setCrop(undefined);
      setCompletedCrop(undefined);
    }
  }, [imageSrc, isOpen]);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        1, // aspect ratio 1:1
        width,
        height
      ),
      width,
      height
    );
    setCrop(initialCrop);
    setCompletedCrop(initialCrop);
  }

  const handleSaveCrop = async () => {
    if (completedCrop && previewCanvasRef.current && imgRef.current) {
        try {
            console.log("Starting client-side image crop (to JPEG)...");
            const dataUrl = await getCroppedImg(
                imgRef.current,
                completedCrop,
                previewCanvasRef.current,
                rotate
            );
            console.log("Client-side cropping successful. Passing JPEG data URL to parent.");
            onCropComplete(dataUrl);
            onClose();
        } catch (e) {
            const message = e instanceof Error ? e.message : 'An unknown error occurred during image processing.';
            console.error("Image Cropping Error:", message, e);
            onError?.(message);
        }
    }
  };
  
  if (!imageSrc) return null;

  const changeScale = (delta: number) => setScale(prev => Math.max(0.5, Math.min(prev + delta, 3)));
  const changeRotation = (delta: number) => setRotate(prev => (prev + delta) % 360);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Profile Picture</DialogTitle>
          <DialogDescription>
            Zoom, rotate, and position your photo inside the circle.
          </DialogDescription>
        </DialogHeader>
        <div className="relative w-full aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden my-4">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
              circularCrop
              minWidth={100}
            >
              <img
                ref={imgRef}
                alt="Crop me"
                src={imageSrc}
                style={{ 
                  transform: `scale(${scale}) rotate(${rotate}deg)`,
                  maxHeight: '400px',
                  maxWidth: '400px'
                }}
                onLoad={onImageLoad}
              />
            </ReactCrop>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-2 bg-background/50 backdrop-blur-sm p-1 rounded-md">
                <Button variant="outline" size="icon" onClick={() => changeScale(0.1)}><ZoomIn/></Button>
                <Button variant="outline" size="icon" onClick={() => changeScale(-0.1)}><ZoomOut/></Button>
            </div>
             <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 bg-background/50 backdrop-blur-sm p-1 rounded-md">
                <Button variant="outline" size="icon" onClick={() => changeRotation(-90)}><RotateCcw/></Button>
                <Button variant="outline" size="icon" onClick={() => changeRotation(90)}><RotateCw/></Button>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSaveCrop}>Save Picture</Button>
        </DialogFooter>
        <canvas ref={previewCanvasRef} style={{ display: 'none' }} />
      </DialogContent>
    </Dialog>
  );
}
