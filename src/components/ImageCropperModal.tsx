
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
}

const MAX_FILE_SIZE_KB = 50;
const MAX_DIMENSION = 400; // Max width/height for the output image

async function getCroppedImg(
  image: HTMLImageElement,
  crop: Crop,
  canvas: HTMLCanvasElement,
  scale = 1,
  rotate = 0
): Promise<string> {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No 2d context');
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  
  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;
  const cropWidth = crop.width * scaleX;
  const cropHeight = crop.height * scaleY;

  // Let's start with a reasonable output dimension
  let outputWidth = Math.min(cropWidth, MAX_DIMENSION);
  let outputHeight = Math.min(cropHeight, MAX_DIMENSION);

  // Maintain aspect ratio
  if (cropWidth > cropHeight) {
      outputHeight = outputWidth * (cropHeight / cropWidth);
  } else {
      outputWidth = outputHeight * (cropWidth / cropHeight);
  }
  
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  ctx.save();
  // We draw the cropped section of the original image onto the canvas
  const rotateRads = (rotate * Math.PI) / 180;
  ctx.translate(outputWidth / 2, outputHeight / 2);
  ctx.rotate(rotateRads);
  ctx.scale(scale, scale);
  ctx.translate(-outputWidth / 2, -outputHeight / 2);

  ctx.drawImage(
    image,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    outputWidth,
    outputHeight
  );
  ctx.restore();

  // Iteratively reduce quality and size until the file is small enough
  let quality = 0.9;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);

  while (dataUrl.length > MAX_FILE_SIZE_KB * 1024 * 1.37 && quality > 0.1) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }

  // If still too large, reduce dimensions
  while (dataUrl.length > MAX_FILE_SIZE_KB * 1024 * 1.37 && canvas.width > 50) {
      canvas.width /= 1.25;
      canvas.height /= 1.25;
      ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
      dataUrl = canvas.toDataURL('image/jpeg', 0.7); // use a reasonable quality
  }
  
  return dataUrl;
}

export default function ImageCropperModal({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
}: ImageCropperModalProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);

  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Reset state when a new image is loaded
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
            const dataUrl = await getCroppedImg(
                imgRef.current,
                completedCrop,
                previewCanvasRef.current,
                1, // Scale is handled by the drawing now, not transform
                rotate
            );
            onCropComplete(dataUrl);
            onClose();
        } catch (e) {
            console.error(e);
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
