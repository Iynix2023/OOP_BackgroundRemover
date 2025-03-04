import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { CropArea } from '../types';

interface ImageCropperProps {
  imageUrl: string;
  onCropComplete: (croppedArea: CropArea) => void;
  aspectRatio?: number;
}

const ImageCropper: React.FC<ImageCropperProps> = ({ 
  imageUrl, 
  onCropComplete,
  aspectRatio = 35/45 // Default ID photo aspect ratio
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const handleCropComplete = useCallback(
    (_: any, croppedAreaPixels: CropArea) => {
      onCropComplete(croppedAreaPixels);
    },
    [onCropComplete]
  );

  return (
    <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden">
      <Cropper
        image={imageUrl}
        crop={crop}
        zoom={zoom}
        aspect={aspectRatio}
        onCropChange={setCrop}
        onCropComplete={handleCropComplete}
        onZoomChange={setZoom}
        cropShape="rect"
        showGrid={true}
      />
      
      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
        <div className="bg-white px-4 py-2 rounded-full shadow-md">
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-48"
          />
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;