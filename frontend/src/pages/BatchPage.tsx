import React, { useState, useEffect, useRef } from 'react';
import { Upload, Settings, Play, Download, Trash2, Check, X, Camera as CameraIcon, RefreshCw } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ImageUploader from '../components/ImageUploader';
import BackgroundSelector from '../components/BackgroundSelector';
import InlineCamera from '../components/InlineCamera';
import { BackgroundOptions, EnhanceOptions, ExportSize } from '../types';
import imageProcessingService from '../services/imageProcessingService';
import EnhancementControls from '../components/EnhancementControls';
import { useNavigate } from 'react-router-dom';

interface ProcessedBatchImage {
  original: string;
  processed: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

const BatchPage: React.FC = () => {
  const [uploadedImages, setUploadedImages] = useState<ProcessedBatchImage[]>([]);
  const [background, setBackground] = useState<BackgroundOptions>({ type: 'color', value: '#FFFFFF' });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processedCount, setProcessedCount] = useState<number>(0);
  const [exportFormat, setExportFormat] = useState<string>('jpeg');
  const [exportSize, setExportSize] = useState<string>(ExportSize.STANDARD_35x45);
  const [exportLayout, setExportLayout] = useState<string>('single');
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const [enhanceOptions, setEnhanceOptions] = useState<EnhanceOptions>({ brightness: 0, contrast: 0, saturation: 0 });
  const [customDimensions, setCustomDimensions] = useState({ width: 160, height: 120 });
  const navigate = useNavigate();
  
  // Use a ref to store the interval ID so it can be accessed from anywhere in the component
  const pollTimerRef = useRef<number | null>(null);

  const clearAllImages = () => {
    // Refresh the page (this will reset everything)
    navigate(0);
  };
  
  // Only keep one useEffect hook for polling
  useEffect(() => {
    // Clear any existing timer first
    if (pollTimerRef.current !== null) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    // Set up a new timer if processing
    if (isProcessing && currentBatchId) {
      pollTimerRef.current = window.setInterval(async () => {
        await checkBatchStatus(currentBatchId);
      }, 2000);
    }

    // Clean up on unmount or when dependencies change
    return () => {
      if (pollTimerRef.current !== null) {
        window.clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [isProcessing, currentBatchId]);

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

  const handleCameraCapture = (imageData: string) => {
    setUploadedImages([...uploadedImages, {
      original: imageData,
      processed: null,
      status: 'pending'
    }]);
    setShowCamera(false);
  };

  const handleBackgroundChange = (options: BackgroundOptions) => {
    setBackground(options);
  };

  const handleEnhanceChange = (options: EnhanceOptions) => {
    setEnhanceOptions(options);
  };

  const removeImage = (index: number) => {
    const newImages = [...uploadedImages];
    newImages.splice(index, 1);
    setUploadedImages(newImages);
  };

  // Define cancelProcessing function
  const cancelProcessing = () => {
    // Clear any polling interval
    if (pollTimerRef.current !== null) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    
    // Reset processing state
    setIsProcessing(false);
    setCurrentBatchId(null);
    setProcessedCount(0);
  };

  // Reset and start processing function
  const resetAndStartProcessing = () => {
    // Cancel any existing processing
    if (pollTimerRef.current !== null) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    
    // Reset to initial state
    setIsProcessing(false);
    setCurrentBatchId(null);
    setProcessedCount(0);
    
    // Reset image statuses to pending
    setUploadedImages(prevImages => 
      prevImages.map(img => ({
        ...img,
        status: 'pending',
        processed: null,
        error: undefined
      }))
    );
    
    // Start processing from scratch
    setTimeout(() => {
      startProcessing();
    }, 100);
  };

  const startProcessing = async () => {
    if (uploadedImages.length === 0) return;
    
    // If already processing, cancel it completely first
    if (isProcessing && currentBatchId) {
      // First stop polling
      if (pollTimerRef.current !== null) {
        window.clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      
      // Reset processing states
      setIsProcessing(false);
      setCurrentBatchId(null);
      setProcessedCount(0);
      
      // Clear any existing processed images from state to ensure UI updates
      // This is critical - we need to force the UI to show the new processed images
      const resetImages = uploadedImages.map(img => ({
        ...img,
        status: 'pending' as const,
        processed: null, // Clear processed image URLs
        error: undefined
      }));
      
      setUploadedImages(resetImages);
      
      // Give React a moment to update the state before starting new processing
      setTimeout(() => {
        // Start processing again with new settings (call the function again)
        startProcessing();
      }, 100);
      
      // Exit this invocation of the function
      return;
    }
    
    // Start new processing with current settings
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

      // Prepare the form data with CURRENT settings
      const formData = new FormData();
      
      // Add files to FormData
      files.forEach(file => {
        formData.append('files', file);
      });
      
      // Add background options
      formData.append('backgroundType', background.type);
      formData.append('backgroundValue', background.value);
      
      // Add enhancement options
      formData.append('brightness', enhanceOptions.brightness.toString());
      formData.append('contrast', enhanceOptions.contrast.toString());
      formData.append('saturation', enhanceOptions.saturation.toString());
      
      // Add export options - make sure these are the CURRENT values
      formData.append('exportFormat', exportFormat);
      formData.append('exportSize', exportSize);
      formData.append('exportLayout', exportLayout);
      
      // Add custom dimensions if needed
      if (exportSize === ExportSize.CUSTOM) {
        formData.append('customWidth', customDimensions.width.toString());
        formData.append('customHeight', customDimensions.height.toString());
      }

      // Log what we're sending for debugging
      console.log("Sending batch with settings:", {
        background: background,
        enhancement: enhanceOptions,
        exportFormat,
        exportSize,
        exportLayout
      });

      // Send the request
      const response = await fetch('/api/batch/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      const batchId = result.batchId;
      setCurrentBatchId(batchId);

      // Set all images to "processing" status
      const processingImages = uploadedImages.map(img => ({
        ...img,
        status: 'processing' as const,
        processed: null // Ensure processed images are cleared
      }));
      setUploadedImages(processingImages);

    } catch (error) {
      console.error('Error starting batch processing:', error);
      setIsProcessing(false);
      setCurrentBatchId(null);
    }
  };

  const checkBatchStatus = async (batchId: string) => {
    try {
      const response = await fetch(`/api/batch/status/${batchId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to get batch status: ${response.status}`);
      }
      
      const status = await response.json();

      // Update processed count
      setProcessedCount(status.processedCount);

      // Update image statuses
      const updatedImages = [...uploadedImages];

      for (let i = 0; i < status.images.length; i++) {
        if (i < updatedImages.length) {
          const imgInfo = status.images[i];
          updatedImages[i].status = imgInfo.status as any;

          if (imgInfo.error) {
            updatedImages[i].error = imgInfo.error;
          }

          // If this image is completed but we don't have the processed version yet
          // or we are reprocessing (clear cache)
          if (imgInfo.status === 'completed' && 
              (!updatedImages[i].processed || true)) {
              
            try {
              // Force a fresh fetch by adding a cache-busting query parameter
              const timestamp = new Date().getTime();
              const imgResponse = await fetch(`/api/batch/result/${batchId}/${i}?t=${timestamp}`);
              
              if (imgResponse.ok) {
                // Revoke any existing blob URL to prevent memory leaks
                if (updatedImages[i].processed && 
                    updatedImages[i].processed.startsWith('blob:')) {
                  URL.revokeObjectURL(updatedImages[i].processed);
                }
                
                const blob = await imgResponse.blob();
                updatedImages[i].processed = URL.createObjectURL(blob);
              } else {
                console.error(`Error fetching processed image ${i}: ${imgResponse.status}`);
              }
            } catch (e) {
              console.error(`Error getting processed image ${i}:`, e);
            }
          }
        }
      }

      setUploadedImages(updatedImages);

      // If all images are processed, stop polling
      const allCompleted = status.completed || 
                          updatedImages.every(img => 
                            img.status === 'completed' || img.status === 'failed');
      
      if (allCompleted) {
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error checking batch status:', error);
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

  // Handle custom dimension changes
  const handleCustomWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const width = parseInt(e.target.value, 10);
    if (!isNaN(width) && width > 0) {
      setCustomDimensions(prev => ({ ...prev, width }));
    }
  };

  const handleCustomHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const height = parseInt(e.target.value, 10);
    if (!isNaN(height) && height > 0) {
      setCustomDimensions(prev => ({ ...prev, height }));
    }
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <ImageUploader
                      onUpload={handleImageUpload}
                      multiple={true}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-3 text-center">Take a Photo</h3>
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-500 transition-colors"
                      onClick={() => setShowCamera(true)}
                    >
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-2">
                          <CameraIcon size={32} />
                        </div>
                        <span className="text-lg text-indigo-600 font-medium">Use Camera</span>
                        <p className="mt-2 text-sm text-gray-500">Take a photo with your device camera</p>
                      </div>
                    </div>
                  </div>
                </div>

                {uploadedImages.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-medium">Uploaded Images ({uploadedImages.length})</h3>
                      <button
                        onClick={clearAllImages}
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
                    <h3 className="font-medium text-gray-700 mb-3">Image Enhancement</h3>
                    <EnhancementControls
                      options={enhanceOptions}
                      onChange={handleEnhanceChange}
                      preEnhancementImage={null}
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
                        <label className="block text-sm text-gray-600 mb-1">Photo Size</label>
                        <select
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          value={exportSize}
                          onChange={(e) => setExportSize(e.target.value)}
                        >
                          <option value={ExportSize.STANDARD_35x45}>Singapore NRIC/Passport (35x45mm)</option>
                          <option value={ExportSize.US_PASSPORT_2x2}>US Passport/Visa (2x2 inch)</option>
                          <option value={ExportSize.CHINA_VISA}>China Visa (33x48mm)</option>
                          <option value={ExportSize.MALAYSIA_PASSPORT}>Malaysia Visa/Passport (35x50mm)</option>
                          <option value={ExportSize.AUSTRALIA_VISA}>Australia Visa (35x45mm)</option>
                          <option value={ExportSize.INDIA_PASSPORT}>Indian Passport/Visa (35x35mm)</option>
                          <option value={ExportSize.SMU_ID}>SMU Student ID</option>
                          <option value={ExportSize.CUSTOM}>Custom Size</option>
                        </select>
                      </div>

                      {/* Custom size inputs - only show when custom size is selected */}
                      {exportSize === ExportSize.CUSTOM && (
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Width (px)</label>
                            <input
                              type="number"
                              className="w-full border border-gray-300 rounded-md px-3 py-2"
                              value={customDimensions.width}
                              onChange={handleCustomWidthChange}
                              min="1"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Height (px)</label>
                            <input
                              type="number"
                              className="w-full border border-gray-300 rounded-md px-3 py-2"
                              value={customDimensions.height}
                              onChange={handleCustomHeightChange}
                              min="1"
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Layout</label>
                        <select
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          value={exportLayout}
                          onChange={(e) => setExportLayout(e.target.value)}
                        >
                          <option value="single">Single Photo</option>
                          <option value="2x2">2x2 Grid</option>
                          <option value="4x6">4x6 Grid</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={isProcessing ? cancelProcessing : resetAndStartProcessing}
                disabled={uploadedImages.length === 0}
                className={`w-full flex items-center justify-center px-4 py-3 rounded-md text-white font-medium
                  ${uploadedImages.length === 0 
                    ? 'bg-gray-400 cursor-not-allowed'
                    : isProcessing
                      ? 'bg-red-600 hover:bg-red-700 transition-colors'
                      : 'bg-indigo-600 hover:bg-indigo-700 transition-colors'
                  }`}
              >
                {isProcessing ? (
                  <>
                    <X size={18} className="mr-2" />
                    Cancel Processing
                  </>
                ) : (
                  <>
                    <Play size={18} className="mr-2" />
                    Start Batch Processing
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Inline Camera Modal */}
      {showCamera && (
        <InlineCamera
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      <Footer />
    </div>
  );
};

export default BatchPage;