import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  onUpload: (files: File[]) => void;
  multiple?: boolean;
  className?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onUpload, 
  multiple = false,
  className = ''
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onUpload(acceptedFiles);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    multiple
  });

  return (
    <div 
      {...getRootProps()} 
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'}
        ${className}`}
    >
      <input {...getInputProps()} />
      
      <div className="flex flex-col items-center space-y-4">
        {isDragActive ? (
          <>
            <ImageIcon size={48} className="text-indigo-500" />
            <p className="text-indigo-500 font-medium">Drop your images here</p>
          </>
        ) : (
          <>
            <Upload size={48} className="text-gray-400" />
            <div>
              <p className="text-gray-700 font-medium">Drag & drop your {multiple ? 'images' : 'image'} here</p>
              <p className="text-gray-500 text-sm mt-1">or click to browse files</p>
            </div>
            <p className="text-xs text-gray-400 mt-2">Supported formats: JPEG, PNG</p>
          </>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;