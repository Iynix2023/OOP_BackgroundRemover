import React, { useEffect, useRef, useState } from 'react';
import { X, Camera as CameraIcon } from 'lucide-react';

interface InlineCameraProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
}

const InlineCamera: React.FC<InlineCameraProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  // Request camera permission and setup video stream
  const setupCamera = async () => {
    try {
      // Always request permissions, don't use stored permissions
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" }, // Use front camera by default
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setCameraError("Camera access denied. Please allow camera access to take photos.");
    }
  };
  
  // Clean up video stream when component unmounts
  useEffect(() => {
    setupCamera();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Add flash effect
        const flashElement = document.createElement('div');
        flashElement.style.position = 'fixed';
        flashElement.style.top = '0';
        flashElement.style.left = '0';
        flashElement.style.right = '0';
        flashElement.style.bottom = '0';
        flashElement.style.backgroundColor = 'white';
        flashElement.style.opacity = '0.8';
        flashElement.style.zIndex = '9999';
        flashElement.style.animation = 'flash 0.5s';
        
        const style = document.createElement('style');
        style.innerHTML = `
          @keyframes flash {
            0% { opacity: 0.8; }
            100% { opacity: 0; }
          }
        `;
        document.head.appendChild(style);
        document.body.appendChild(flashElement);
        
        // Remove flash after animation completes
        setTimeout(() => {
          document.body.removeChild(flashElement);
          document.head.removeChild(style);
        }, 500);
        
        // Convert canvas to image data
        const imageData = canvas.toDataURL('image/jpeg');
        
        // Pass the captured image back to the parent component
        onCapture(imageData);
      }
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
      <div className="relative bg-black rounded-lg overflow-hidden max-w-lg w-full max-h-[80vh]">
        <button 
          className="absolute top-2 right-2 z-10 bg-black bg-opacity-50 rounded-full p-1 text-white"
          onClick={onClose}
        >
          <X size={24} />
        </button>
        
        {/* Hidden canvas for capturing images */}
        <canvas ref={canvasRef} className="hidden"></canvas>
        
        {cameraError ? (
          <div className="p-8 text-center text-white">
            <CameraIcon size={48} className="mx-auto mb-4 text-red-500" />
            <p className="mb-4">{cameraError}</p>
            <button 
              className="px-4 py-2 bg-indigo-600 text-white rounded"
              onClick={onClose}
            >
              Go Back
            </button>
          </div>
        ) : (
          <>
            {/* Camera viewfinder */}
            <div className="aspect-w-4 aspect-h-3 bg-gray-900">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Camera controls */}
            <div className="p-4 bg-black flex justify-center">
              <button 
                className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onClick={takePhoto}
                aria-label="Take Photo"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InlineCamera;