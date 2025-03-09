import React, { useState } from 'react';
import { Upload, Settings, Play, Download, Trash2, Check, X } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ImageUploader from '../components/ImageUploader';
import BackgroundSelector from '../components/BackgroundSelector';
import ClothesSelector from '../components/ClothesSelector';
import EnhancementControls from '../components/EnhancementControls';
import { BackgroundOptions, ClothesOptions, EnhanceOptions } from '../types';
import imageProcessingService from '../services/imageProcessingService';

interface ProcessedBatchImage {
  original: string;
  processed: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

const BatchPage: React.FC = () => {
  const [uploadedImages, setUploadedImages] = useState<ProcessedBatchImage[]>([]);
  const [background, setBackground] = useState<BackgroundOptions>({ type: 'color', value: '#FFFFFF' });
  const [clothes, setClothes] = useState<ClothesOptions>({ type: 'suit', color: '#0A192F' });
  const [enhanceOptions, setEnhanceOptions] = useState<EnhanceOptions>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    smoothing: 0
  });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processedCount, setProcessedCount] = useState<number>(0);
  const [exportFormat, setExportFormat] = useState<string>('jpeg');
  const [exportSize, setExportSize] = useState<string>('35x45');

  const handleImageUpload = (files: File[]) => {
    const newImages: ProcessedBatchImage[] = [];
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        
        newImages.push({
          original: imageData,
          processed: null,
          status: 'pending'
        });
        
        // Update state after all images are loaded
        if (newImages.length === files.length) {
          setUploadedImages([...uploadedImages, ...newImages]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleBackgroundChange = (options: BackgroundOptions) => {
    setBackground(options);
  };

  const handleClothesChange = (options: ClothesOptions) => {
    setClothes(options);
  };

  const handleEnhanceChange = (options: EnhanceOptions) => {
    setEnhanceOptions(options);
  };

  const removeImage = (index: number) => {
    const newImages = [...uploadedImages];
    newImages.splice(index, 1);
    setUploadedImages(newImages);
  };

// Update the startProcessing function in BatchPage.tsx

const startProcessing = async () => {
  if (uploadedImages.length === 0 || isProcessing) return;
  
  setIsProcessing(true);
  setProcessedCount(0);
  
  try {
    // Convert data URLs to File objects
    const files = await Promise.all(
      uploadedImages.map(async (img, index) => {
        // For data URLs that start with "data:image/jpeg;base64," or similar
        const dataUrlParts = img.original.split(',');
        const mimeMatch = dataUrlParts[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const byteString = atob(dataUrlParts[1]);
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        
        for (let i = 0; i < byteString.length; i++) {
          uint8Array[i] = byteString.charCodeAt(i);
        }
        
        const blob = new Blob([arrayBuffer], { type: mime });
        return new File([blob], `image-${index}.${mime.split('/')[1]}`, { type: mime });
      })
    );
    
    // Start batch processing
    const result = await imageProcessingService.startBatchProcessing(
      files,
      background,
      clothes,
      enhanceOptions,
      exportFormat,
      exportSize
    );
    
    const batchId = result.batchId;
    
    // Set all images to "processing" status
    const processingImages = uploadedImages.map(img => ({
      ...img,
      status: 'processing' as const
    }));
    setUploadedImages(processingImages);
    
    // Poll for status updates
    const pollInterval = setInterval(async () => {
      try {
        const status = await imageProcessingService.getBatchStatus(batchId);
        
        // Update processed count
        setProcessedCount(status.processedCount);
        
        // Update image statuses
        const updatedImages = [...processingImages];
        
        let allCompleted = true;
        for (let i = 0; i < status.images.length; i++) {
          const imgInfo = status.images[i];
          
          if (i < updatedImages.length) {
            updatedImages[i].status = imgInfo.status as any;
            
            if (imgInfo.error) {
              updatedImages[i].error = imgInfo.error;
            }
            
            // If this image is completed but we don't have the processed version yet
            if (imgInfo.status === 'completed' && !updatedImages[i].processed) {
              try {
                const processedImageData = await imageProcessingService.getProcessedImage(batchId, i);
                updatedImages[i].processed = processedImageData;
              } catch (e) {
                console.error(`Error getting processed image ${i}:`, e);
              }
            }
            
            // Check if this image is still in progress
            if (imgInfo.status !== 'completed' && imgInfo.status !== 'failed') {
              allCompleted = false;
            }
          }
        }
        
        setUploadedImages(updatedImages);
        
        // If all images are processed, stop polling
        if (status.completed || allCompleted) {
          clearInterval(pollInterval);
          setIsProcessing(false);
        }
      } catch (error) {
        console.error('Error checking batch status:', error);
        clearInterval(pollInterval);
        setIsProcessing(false);
      }
    }, 2000); // Check every 2 seconds
    
  } catch (error) {
    console.error('Error starting batch processing:', error);
    setIsProcessing(false);
  }
};

const downloadAllImages = () => {
  // Create a zip file with all processed images
  // For simplicity, we'll just download them one by one
  uploadedImages.forEach((image, index) => {
    if (image.processed && image.status === 'completed') {
      const link = document.createElement('a');
      
      // If it's a blob URL
      if (image.processed.startsWith('blob:')) {
        link.href = image.processed;
      } 
      // If it's a data URL
      else {
        link.href = image.processed;
      }
      
      link.download = `processed-image-${index + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  });
};
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">Batch Processing</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Image Upload */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Upload size={20} className="mr-2 text-indigo-600" />
                  Upload Images
                </h2>
                
                <ImageUploader 
                  onUpload={handleImageUpload} 
                  multiple={true}
                  className="mb-6"
                />
                
                {uploadedImages.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-medium">Uploaded Images ({uploadedImages.length})</h3>
                      <button 
                        onClick={() => setUploadedImages([])}
                        className="text-sm text-red-600 hover:text-red-800"
                        disabled={isProcessing}
                      >
                        Clear All
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {uploadedImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-w-3 aspect-h-4 bg-gray-100 rounded-md overflow-hidden">
                            <img 
                              src={image.processed || image.original} 
                              alt={`Upload ${index + 1}`} 
                              className="object-cover w-full h-full"
                            />
                            {image.status === 'processing' && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
                              </div>
                            )}
                            {image.status === 'completed' && (
                              <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                                <Check size={14} />
                              </div>
                            )}
                            {image.status === 'failed' && (
                              <div className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full">
                                <X size={14} />
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            disabled={isProcessing}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {isProcessing && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4">Processing Status</h2>
                  
                  <div className="mb-4">
                    <div className="flex justify-between mb-2">
                      <span>Progress</span>
                      <span>{processedCount} of {uploadedImages.length}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-indigo-600 h-2.5 rounded-full" 
                        style={{ width: `${(processedCount / uploadedImages.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              
              {processedCount > 0 && processedCount === uploadedImages.length && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4">Processing Complete</h2>
                  <button 
                    onClick={downloadAllImages}
                    className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    <Download size={18} className="mr-2" />
                    Download All Processed Images
                  </button>
                </div>
              )}
            </div>
            
            {/* Right Column - Settings */}
            <div>
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Settings size={20} className="mr-2 text-indigo-600" />
                  Processing Settings
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-700 mb-3">Background</h3>
                    <BackgroundSelector 
                      onSelect={handleBackgroundChange}
                      currentBackground={background}
                    />
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-700 mb-3">Clothes</h3>
                    <ClothesSelector 
                      onSelect={handleClothesChange}
                      currentClothes={clothes}
                    />
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-700 mb-3">Enhancement</h3>
                    <EnhancementControls 
                      options={enhanceOptions}
                      onChange={handleEnhanceChange}
                    />
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-700 mb-3">Export Options</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Format</label>
                        <select 
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          value={exportFormat}
                          onChange={(e) => setExportFormat(e.target.value)}
                        >
                          <option value="jpeg">JPEG</option>
                          <option value="png">PNG</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Size</label>
                        <select 
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          value={exportSize}
                          onChange={(e) => setExportSize(e.target.value)}
                        >
                          <option value="35x45">35x45 mm (Standard)</option>
                          <option value="2x2">2x2 inch (US Passport)</option>
                          <option value="custom">Custom Size</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={startProcessing}
                disabled={uploadedImages.length === 0 || isProcessing}
                className={`w-full flex items-center justify-center px-4 py-3 rounded-md text-white font-medium
                  ${uploadedImages.length === 0 || isProcessing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 transition-colors'
                  }`}
              >
                <Play size={18} className="mr-2" />
                {isProcessing ? 'Processing...' : 'Start Batch Processing'}
              </button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default BatchPage;