import React, { useState, useCallback, useRef } from 'react';
import { ArrowLeft, ArrowRight, Save, Undo, Redo, Check } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ImageUploader from '../components/ImageUploader';
import ImageCropper from '../components/ImageCropper';
import BackgroundSelector from '../components/BackgroundSelector';
import ClothesSelector from '../components/ClothesSelector';
import EnhancementControls from '../components/EnhancementControls';
import ComplianceChecker from '../components/ComplianceChecker';
import { BackgroundOptions, ClothesOptions, CropArea, EnhanceOptions, ComplianceResult } from '../types';
import imageProcessingService from '../services/imageProcessingService';
import PhotoSheetGenerator from '../components/PhotoSheetGenerator';

const ProcessPage: React.FC = () => {
  const debounceTimer = useRef<number | null>(null);
  const [step, setStep] = useState<number>(1);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [background, setBackground] = useState<BackgroundOptions>({ type: 'color', value: '#FFFFFF' });
  const [clothes, setClothes] = useState<ClothesOptions>({ type: 'suit', color: '#0A192F' });
  const [enhanceOptions, setEnhanceOptions] = useState<EnhanceOptions>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    smoothing: 0
  });
  const [complianceResult, setComplianceResult] = useState<ComplianceResult>({
    isCompliant: true,
    issues: []
  });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // History for undo/redo
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const handleImageUpload = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setUploadedImage(imageData);
        setProcessedImage(imageData);
        
        // Initialize history
        setHistory([imageData]);
        setHistoryIndex(0);
        
        // Move to the next step
        setStep(2);
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = useCallback((croppedArea: CropArea) => {
    setCropArea(croppedArea);
  }, []);

  const applyCrop = async () => {
    if (!processedImage || !cropArea) return;
    
    setIsProcessing(true);
    try {
      const croppedImage = await imageProcessingService.cropImage(processedImage, cropArea);
      setProcessedImage(croppedImage);
      
      // Add to history
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(croppedImage);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackgroundChange = async (options: BackgroundOptions) => {
    setBackground(options);
    
    if (!processedImage) return;
    
    setIsProcessing(true);
    try {
      const newImage = await imageProcessingService.removeBackground(processedImage, options);
      setProcessedImage(newImage);
      
      // Add to history
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newImage);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    } catch (error) {
      console.error('Error changing background:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClothesChange = async (options: ClothesOptions) => {
    setClothes(options);
    
    if (!processedImage) return;
    
    setIsProcessing(true);
    try {
      const newImage = await imageProcessingService.replaceClothes(processedImage, options);
      setProcessedImage(newImage);
      
      // Add to history
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newImage);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    } catch (error) {
      console.error('Error changing clothes:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEnhanceChange = async (options: EnhanceOptions) => {
    // Update UI state immediately
    setEnhanceOptions(options);
    
    if (!processedImage) return;
    
    // For reset, bypass debouncing
    const isReset = options.brightness === 0 && 
                   options.contrast === 0 && 
                   options.saturation === 0 && 
                   options.smoothing === 0;
                   
    if (debounceTimer.current !== null && !isReset) {
      window.clearTimeout(debounceTimer.current);
    }
    
    // Set processing state
    setIsProcessing(true);
    
    // For reset, process immediately without debounce
    const processImage = async () => {
      try {
        console.log("Processing with options:", options);
        const newImage = await imageProcessingService.enhanceImage(processedImage, options);
        console.log("Processing complete");
        
        setProcessedImage(newImage);
        
        // Add to history
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newImage);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      } catch (error) {
        console.error('Error enhancing image:', error);
      } finally {
        setIsProcessing(false);
        debounceTimer.current = null;
      }
    };
    
    if (isReset) {
      // Process reset immediately
      processImage();
    } else {
      // Use debouncing for regular adjustments
      debounceTimer.current = window.setTimeout(processImage, 300);
    }
  };

  const checkCompliance = async () => {
    if (!processedImage) return;
    
    setIsProcessing(true);
    try {
      const result = await imageProcessingService.checkCompliance(processedImage);
      setComplianceResult(result);
    } catch (error) {
      console.error('Error checking compliance:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setProcessedImage(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setProcessedImage(history[historyIndex + 1]);
    }
  };

  const downloadImage = () => {
    if (!processedImage) return;
    
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = 'id-photo.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const nextStep = async () => {
    if (step === 2 && cropArea) {
      await applyCrop();
    } else if (step === 5) {
      await checkCompliance();
    }
    
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Upload Your Photo</h2>
            <ImageUploader onUpload={handleImageUpload} />
            <p className="mt-4 text-sm text-gray-500 text-center">
              Upload a clear portrait photo with your face visible. For best results, use a photo with a plain background.
            </p>
          </div>
        );
      
      case 2:
        return (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Crop & Resize</h2>
            {uploadedImage && (
              <ImageCropper 
                imageUrl={uploadedImage} 
                onCropComplete={handleCropComplete} 
                aspectRatio={35/45}  
                lockAspectRatio={true} 
              />
            )}
            <p className="mt-4 text-sm text-gray-500">
              Adjust the crop area to position your face properly. The standard ID photo has a 35:45 aspect ratio.
            </p>
          </div>
        );
      
      case 3:
        return (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Background Removal & Replacement</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                {processedImage && (
                  <div className="bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                      src={processedImage} 
                      alt="Processed" 
                      className="w-full h-auto"
                    />
                  </div>
                )}
                {isProcessing && (
                  <div className="mt-4 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
                    <p className="mt-2 text-sm text-gray-600">Processing image...</p>
                  </div>
                )}
              </div>
              <div>
                <BackgroundSelector 
                  onSelect={handleBackgroundChange}
                  currentBackground={background}
                />
              </div>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Clothes Replacement</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                {processedImage && (
                  <div className="bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                      src={processedImage} 
                      alt="Processed" 
                      className="w-full h-auto"
                    />
                  </div>
                )}
                {isProcessing && (
                  <div className="mt-4 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
                    <p className="mt-2 text-sm text-gray-600">Processing image...</p>
                  </div>
                )}
              </div>
              <div>
                <ClothesSelector 
                  onSelect={handleClothesChange}
                  currentClothes={clothes}
                />
              </div>
            </div>
          </div>
        );
      
      case 5:
        return (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Photo Enhancement</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                {processedImage && (
                  <div className="bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                      src={processedImage} 
                      alt="Processed" 
                      className="w-full h-auto"
                    />
                  </div>
                )}
                {isProcessing && (
                  <div className="mt-4 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
                    <p className="mt-2 text-sm text-gray-600">Processing image...</p>
                  </div>
                )}
              </div>
              <div>
                <EnhancementControls 
                  options={enhanceOptions}
                  onChange={handleEnhanceChange}
                />
              </div>
            </div>
          </div>
        );
      
      case 6:
        return (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Compliance Check & Export</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                {processedImage && (
                  <div className="bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                      src={processedImage} 
                      alt="Processed" 
                      className="w-full h-auto"
                    />
                  </div>
                )}
                <div className="mt-6 flex space-x-4">
                  <button 
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                    onClick={downloadImage}
                  >
                    <Save size={18} className="mr-2" />
                    Download
                  </button>
                  <button className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                    <Save size={18} className="mr-2" />
                    Save to Cloud
                  </button>
                </div>
              </div>
              <div className="space-y-6">
                <ComplianceChecker result={complianceResult} />
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-700 mb-2">Export Options</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Format</label>
                      <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                        <option value="jpeg">JPEG</option>
                        <option value="png">PNG</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Size</label>
                      <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                        <option value="35x45">35x45 mm (Standard)</option>
                        <option value="2x2">2x2 inch (US Passport)</option>
                        <option value="custom">Custom Size</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Layout</label>
                      <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                        <option value="single">Single Photo</option>
                        <option value="2x2">2x2 Grid</option>
                        <option value="4x6">4x6 Grid</option>
                      </select>
                    </div>
                  </div>
                </div>
                <PhotoSheetGenerator processedImage={processedImage} />
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow py-8">
        <div className="container mx-auto px-4">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between max-w-3xl mx-auto">
              {[1, 2, 3, 4, 5, 6].map((stepNumber) => (
                <div 
                  key={stepNumber}
                  className={`flex flex-col items-center ${stepNumber < 6 ? 'w-1/5' : ''}`}
                >
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      stepNumber === step
                        ? 'bg-indigo-600 text-white'
                        : stepNumber < step
                        ? 'bg-indigo-200 text-indigo-700'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {stepNumber < step ? <Check size={18} /> : stepNumber}
                  </div>
                  {stepNumber < 6 && (
                    <div 
                      className={`h-1 w-full mt-4 ${
                        stepNumber < step ? 'bg-indigo-400' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Step Content */}
          <div className="mb-8">
            {renderStepContent()}
          </div>
          
          {/* Navigation Buttons */}
          {step > 1 && (
            <div className="flex justify-between max-w-4xl mx-auto mt-8">
              <button
                onClick={prevStep}
                className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                disabled={isProcessing}
              >
                <ArrowLeft size={18} className="mr-2" />
                Previous
              </button>
              
              <div className="flex space-x-4">
                <button 
                  className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  onClick={handleUndo}
                  disabled={historyIndex <= 0 || isProcessing}
                >
                  <Undo size={18} className="mr-2" />
                  Undo
                </button>
                <button 
                  className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1 || isProcessing}
                >
                  <Redo size={18} className="mr-2" />
                  Redo
                </button>
              </div>
              
              {step < 6 ? (
                <button
                  onClick={nextStep}
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                  disabled={isProcessing}
                >
                  Next
                  <ArrowRight size={18} className="ml-2" />
                </button>
              ) : (
                <button
                  onClick={downloadImage}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  disabled={isProcessing}
                >
                  Finish
                  <Check size={18} className="ml-2" />
                </button>
              )}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ProcessPage;