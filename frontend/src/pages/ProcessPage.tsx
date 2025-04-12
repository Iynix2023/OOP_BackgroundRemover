import React, { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Undo,
  Redo,
  Check,
  Camera as CameraIcon,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ImageUploader from "../components/ImageUploader";
import ImageCropper from "../components/ImageCropper";
import BackgroundSelector from "../components/BackgroundSelector";
// import ClothesSelector from "../components/ClothesSelector";
import EnhancementControls from "../components/EnhancementControls";
import ComplianceChecker from "../components/ComplianceChecker";
import InlineCamera from "../components/InlineCamera";
import {
  BackgroundOptions,
  // ClothesOptions,
  CropArea,
  EnhanceOptions,
  ComplianceResult,
} from "../types";
import imageProcessingService from "../services/imageProcessingService";
import PhotoSheetGenerator from "../components/PhotoSheetGenerator";

// import cloudUploadService from "../services/cloudUploadService";

import { uploadToCloud } from "../services/cloudUploadService";

import { ToastContainer, toast } from 'react-toastify';



// useEffect(() => {
//   const params = new URLSearchParams(window.location.search);
//   if (params.get("authorized") === "true") {
//     alert("Authorization successful! You can now upload to cloud.");
//     // You could even trigger an auto-upload here if desired
//   }
// }, []);



function base64ToBlob(base64: string, mime: string) {
  const byteString = atob(base64.split(",")[1]);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const intArray = new Uint8Array(arrayBuffer);
  for (let i = 0; i < byteString.length; i++) {
    intArray[i] = byteString.charCodeAt(i);
  }
  return new Blob([intArray], { type: mime });
}


const ProcessPage: React.FC = () => {
  const navigate = useNavigate();
  const debounceTimer = useRef<number | null>(null);
  const [step, setStep] = useState<number>(1);

  // Original uploaded image that never changes
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Current displayed/processed image
  const [processedImage, setProcessedImage] = useState<string | null>(null);

  // Store images at each processing step
  const [stepImages, setStepImages] = useState<{
    [key: number]: string | null;
  }>({});

  // Store crop area information
  const [cropArea, setCropArea] = useState<CropArea | null>(null);

  // Store crop areas for different steps if needed
  const [stepCropAreas, setStepCropAreas] = useState<{
    [key: number]: CropArea | null;
  }>({});

  const [background, setBackground] = useState<BackgroundOptions>({
    type: "color",
    value: "#FFFFFF",
  });
  // const [clothes, setClothes] = useState<ClothesOptions>({
  //   type: "suit",
  //   color: "#0A192F",
  // });
  const [enhanceOptions, setEnhanceOptions] = useState<EnhanceOptions>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
  });
  const [complianceResult, setComplianceResult] = useState<ComplianceResult>({
    isCompliant: true,
    issues: [],
  });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showCamera, setShowCamera] = useState<boolean>(false);

  // History for undo/redo
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Add this state variable to store the original pre-enhancement image
  const [preEnhancementImage, setPreEnhancementImage] = useState<string | null>(
    null
  );

  // =======================================================================
  // Step 1: Uploading the image or getting the image through camera capture
  // =======================================================================
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

        // Store the original image for step 1
        setStepImages({
          1: imageData,
        });

        // Move to the next step
        setStep(2);
      };

      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = (imageData: string) => {
    setUploadedImage(imageData);
    setProcessedImage(imageData);

    // Initialize history
    setHistory([imageData]);
    setHistoryIndex(0);

    // Store the original image for step 1
    setStepImages({
      1: imageData,
    });

    // Close camera
    setShowCamera(false);

    // Move to the next step
    setStep(2);
  };

  // =======================================================================
  // Step 2: Removing the background on the image and centering the person
  // =======================================================================
  const handleBackgroundChange = async (options: BackgroundOptions) => {
    setBackground(options);

    // Use original uploaded image for background removal
    if (!uploadedImage) return;

    setIsProcessing(true);
    try {
      const newImage = await imageProcessingService.removeBackground(
        uploadedImage, // Use original image
        options
      );
      setProcessedImage(newImage);

      // Store the background-changed image for step 2
      setStepImages((prev) => ({
        ...prev,
        2: newImage,
      }));

      // Add to history
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newImage);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    } catch (error) {
      console.error("Error changing background:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // =======================================================================
  // Step 3: Cropping the image based on the image in step 2
  // =======================================================================
  const handleCropComplete = useCallback((croppedArea: CropArea) => {
    setCropArea(croppedArea);
    // Also store this crop area for the current step
    setStepCropAreas((prev) => ({
      ...prev,
      3: croppedArea, // Changed from 2 to 3
    }));
  }, []);

  const applyCrop = async () => {
    // Get the background-removed image from PREVIOUS step
    const sourceImage = stepImages[2];
    if (!sourceImage || !cropArea) return;

    setIsProcessing(true);
    try {
      const croppedImage = await imageProcessingService.cropImage(
        sourceImage, // Use background-removed image instead of uploadedImage
        cropArea
      );
      setProcessedImage(croppedImage);

      // Store the cropped image for step 3
      setStepImages((prev) => ({
        ...prev,
        3: croppedImage,
      }));

      // Add to history
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(croppedImage);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    } catch (error) {
      console.error("Error cropping image:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Clothes Change not implemented
  // const handleClothesChange = async (options: ClothesOptions) => {
  // };

  // =======================================================================
  // Step 4: Add enhancements to the cropped image
  // =======================================================================
  // Modify the step change logic to capture the image before enhancement
  useEffect(() => {
    if (step === 4 && processedImage && !preEnhancementImage) {
      // Store the image right before entering the enhancement step
      setPreEnhancementImage(processedImage);
    }
  }, [step, processedImage, preEnhancementImage]);

  // handleEnhanceChange function
  const handleEnhanceChange = async (options: EnhanceOptions) => {
    // Update UI state immediately
    setEnhanceOptions(options);

    // Get the appropriate source image (now cropped image from step 3)
    const sourceImage = stepImages[3]; // Changed from 3 to 2
    if (!sourceImage) return;

    // Rest of your function remains the same, but use sourceImage
    const isReset =
      options.brightness === 0 &&
      options.contrast === 0 &&
      options.saturation === 0;

    if (debounceTimer.current !== null) {
      window.clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }

    const processImage = async () => {
      setIsProcessing(true);

      try {
        console.log("Processing with options:", options);

        const cleanOptions = {
          brightness: options.brightness,
          contrast: options.contrast,
          saturation: options.saturation,
        };

        // Use sourceImage instead of preEnhancementImage
        const newImage = await imageProcessingService.enhanceImage(
          sourceImage,
          cleanOptions
        );

        if (newImage) {
          setProcessedImage(newImage);

          // Store the enhanced image for step 4
          setStepImages((prev) => ({
            ...prev,
            4: newImage,
          }));

          // Add to history
          const newHistory = history.slice(0, historyIndex + 1);
          newHistory.push(newImage);
          setHistory(newHistory);
          setHistoryIndex(newHistory.length - 1);
        }
      } catch (error) {
        console.error("Error enhancing image:", error);
      } finally {
        setIsProcessing(false);
        debounceTimer.current = null;
      }
    };

    if (isReset) {
      // For reset, just use the original source image
      setProcessedImage(sourceImage);

      // Store the reset image for step 4
      setStepImages((prev) => ({
        ...prev,
        4: sourceImage,
      }));

      // Add to history
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(sourceImage);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);

      // Clear the timer since we're not actually making a request
      if (debounceTimer.current !== null) {
        window.clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
    } else {
      // Use debouncing for regular adjustments
      debounceTimer.current = window.setTimeout(processImage, 300);
    }
  };

  const checkCompliance = async () => {
    if (!processedImage) return;

    setIsProcessing(true);
    try {
      const result = await imageProcessingService.checkCompliance(
        processedImage
      );
      setComplianceResult(result);
    } catch (error) {
      console.error("Error checking compliance:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // const downloadImage = () => {
  //   if (!processedImage) return;

  //   const link = document.createElement("a");
  //   link.href = processedImage;
  //   link.download = "id-photo.png";
  //   document.body.appendChild(link);
  //   link.click();
  //   document.body.removeChild(link);
  // };

  const nextStep = async () => {
    // When moving from step 2 to step 3, check if we have a background-removed image
    if (step === 2 && !stepImages[2]) {
      // If background removal wasn't done, use the original image as a fallback
      setStepImages((prev) => ({
        ...prev,
        2: stepImages[1], // Use the original uploaded image
      }));
    } else if (step === 3 && cropArea) {
      // Then crop after background is removed
      await applyCrop();
    } else if (step === 5) {
      await checkCompliance();
    }

    setStep(step + 1);
  };

  const prevStep = () => {
    // When going back, restore the image from the previous step
    const prevStepImage = stepImages[step - 1];

    // Special handling for step transitions
    if (step === 4 && step - 1 === 3) {
      // Going from enhancement step to crop step
      // We need to load the background-removed image before it was cropped
      const backgroundRemovedImage = stepImages[2];
      if (backgroundRemovedImage) {
        setProcessedImage(backgroundRemovedImage);

        // Also clear any saved crop area to start fresh
        setCropArea(null);

        // Update step and return
        setStep(step - 1);
        return;
      }
    }

    // Standard step handling
    if (prevStepImage) {
      setProcessedImage(prevStepImage);

      // If going back to crop step, also restore the crop area if it exists
      if (step - 1 === 3) {
        const savedCropArea = stepCropAreas[3];
        if (savedCropArea) {
          setCropArea(savedCropArea);
        }
      }
    } else if (step === 2 && uploadedImage) {
      // Special case for going back to step 1
      setProcessedImage(uploadedImage);
    }

    setStep(step - 1);
  };



  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authorized = params.get("authorized");

    if (authorized === "true") {
      const base64Image = localStorage.getItem("imageToUpload");
    
      if (base64Image) {
        const blob = base64ToBlob(base64Image, "image/png");
    
        const formData = new FormData();
        formData.append("file", blob, "id-photo.png");
        formData.append("description", "Uploaded from ID Photo Processor");

        fetch("http://localhost:8080/upload", {
          method: "POST",
          body: formData,
        })
          .then(async res => {
            const result = await res.json();
            if (res.ok) {
              toast.success(
                <>
                  ✅ Uploaded: <strong>{result.fileName}</strong> <br />
                  <a href={result.driveUrl} target="_blank" rel="noopener noreferrer" className="underline text-blue-400">
                    Open in Google Drive
                  </a>
                </>
              );
              localStorage.removeItem("imageToUpload");
        
              // Optional redirect to file (after delay)
              setTimeout(() => {
                window.open(result.driveUrl, "_blank");
              }, 5000);
            } else {
              toast.error(result.error || "Upload failed");
            }
          })
          .catch((err) => {
            toast.error("Upload error: " + err.message);
          });
        
    
        // fetch("http://localhost:8080/upload", {
        //   method: "POST",
        //   body: formData,
        // })
        //   .then((res) => {
        //     if (res.ok) {

        //       localStorage.removeItem("imageToUpload");

        //       // OPTIONAL: parse JSON with file metadata
        //       const { fileName, driveUrl } = await res.json(); // <-- see backend below

        //       toast.success(
        //         <>
        //           ✅ Image uploaded! <br />
        //           <a href={driveUrl} target="_blank" rel="noopener noreferrer" className="underline text-blue-400">
        //             Open in Google Drive
        //           </a>
        //         </>
        //       );

        //       // Optional: redirect after 5s
        //       setTimeout(() => {
        //         window.location.href = driveUrl;
        //       }, 5000);
        //     } else {
        //       toast.error("Upload failed 😞");
        //     }
        //   })
        //   .catch((err) => {
        //     toast.error("Upload error: " + err.message);
        //   });
      } else {
        toast.info("You're authorized, but no image found.");
      }

      //         alert("Image uploaded to Google Drive successfully!");
      //         localStorage.removeItem("imageToUpload");
      //       } else {
      //         alert("Upload failed");
      //       }
      //     })
      //     .catch((err) => {
      //       alert("Upload error: " + err.message);
      //     });
      // } else {
      //   alert("You're authorized, but there's no image to upload.");
      // }
    
      // Clean up the URL
      const url = new URL(window.location.href);
      url.searchParams.delete("authorized");
      window.history.replaceState({}, document.title, url.toString());
    }
  }, []);  
  
  //   if (authorized === "true") {
  //     if (processedImage) {
  //       uploadToCloud(processedImage)
  //         .then((msg) => alert("Upload successful: " + msg))
  //         .catch((err) => alert("Upload failed: " + err.message));
  //     } else {
  //       alert("You're authorized, but there's no image to upload.");
  //     }
  
  //     // Optional: Clean up the URL to remove ?authorized=true
  //     const url = new URL(window.location.href);
  //     url.searchParams.delete("authorized");
  //     window.history.replaceState({}, document.title, url.toString());
  //   }
  // }, [processedImage]);

  const renderStepContent = (): JSX.Element | null => {
    switch (step) {
      case 1:
        return (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Get Started</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              <div className="h-full flex flex-col">
                <h3 className="text-lg font-medium mb-3 text-center">
                  Upload a Photo
                </h3>
                <div className="flex-grow">
                  <ImageUploader onUpload={handleImageUpload} />
                </div>
              </div>
              <div className="h-full flex flex-col">
                <h3 className="text-lg font-medium mb-3 text-center">
                  Take a Photo
                </h3>
                <div
                  className="flex-grow border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-500 transition-colors flex flex-col justify-center"
                  onClick={() => setShowCamera(true)}
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-2">
                      <CameraIcon size={32} />
                    </div>
                    <span className="text-lg text-indigo-600 font-medium">
                      Use Camera
                    </span>
                    <p className="mt-2 text-sm text-gray-500">
                      Take a photo with your device camera
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-6 text-sm text-gray-500 text-center">
              Upload a clear portrait photo with your face visible. For best
              results, use a photo with a plain background.
            </p>
          </div>
        );

      case 2: // Now background removal step
        return (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">
              Background Removal & Replacement
            </h2>

            <div className="flex flex-col md:flex-row gap-8 md:justify-center">
              <div className="flex-shrink-0 relative">
                {processedImage && (
                  <div className="bg-gray-100 rounded-lg overflow-hidden w-[300px] border-2 border-gray-300 shadow-sm">
                    <div className="absolute top-2 right-2 bg-black text-white text-xs py-1 px-2 rounded z-10">
                      Before
                    </div>
                    <img
                      src={uploadedImage || processedImage}
                      alt="Original"
                      className="w-full h-auto"
                    />
                  </div>
                )}
              </div>
              <div className="flex-shrink-0 relative">
                {processedImage && (
                  <div className="bg-gray-100 rounded-lg overflow-hidden w-[300px] border-2 border-gray-300 shadow-sm">
                    <div className="absolute top-2 right-2 bg-black text-white text-xs py-1 px-2 rounded z-10">
                      After
                    </div>
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
                    <p className="mt-2 text-sm text-gray-600">
                      Processing image...
                    </p>
                  </div>
                )}
              </div>
              <div className="flex-grow md:flex-grow-0 md:max-w-sm">
                <BackgroundSelector
                  onSelect={handleBackgroundChange}
                  currentBackground={background}
                />
              </div>
            </div>
          </div>
        );

      case 3: // Now crop step
        return (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Crop & Resize</h2>
            {processedImage && ( // Use processedImage (background-removed) instead of uploadedImage
              <ImageCropper
                imageUrl={processedImage}
                onCropComplete={handleCropComplete}
                aspectRatio={35 / 45}
                lockAspectRatio={true}
              />
            )}
            <p className="mt-4 text-sm text-gray-500">
              Adjust the crop area to position your face properly. The standard
              ID photo has a 35:45 aspect ratio.
            </p>
          </div>
        );

      case 4: // Photo Enhancement - Updated to match case 2 layout
        return (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">
              Photo Enhancement
            </h2>

            <div className="flex flex-col md:flex-row gap-8 md:justify-center">
              <div className="flex-shrink-0 relative">
                {processedImage && stepImages[3] && (
                  <div className="bg-gray-100 rounded-lg overflow-hidden w-[300px] border-2 border-gray-300 shadow-sm">
                    <div className="absolute top-2 right-2 bg-black text-white text-xs py-1 px-2 rounded z-10">
                      Before
                    </div>
                    <img
                      src={stepImages[3]} // Show pre-enhanced image
                      alt="Original"
                      className="w-full h-auto"
                    />
                  </div>
                )}
              </div>
              <div className="flex-shrink-0 relative">
                {processedImage && (
                  <div className="bg-gray-100 rounded-lg overflow-hidden w-[300px] border-2 border-gray-300 shadow-sm">
                    <div className="absolute top-2 right-2 bg-black text-white text-xs py-1 px-2 rounded z-10">
                      After
                    </div>
                    <img
                      src={processedImage}
                      alt="Enhanced"
                      className="w-full h-auto"
                    />
                  </div>
                )}
                {isProcessing && (
                  <div className="mt-4 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
                    <p className="mt-2 text-sm text-gray-600">
                      Processing image...
                    </p>
                  </div>
                )}
              </div>
              <div className="flex-grow md:flex-grow-0 md:max-w-sm">
                <EnhancementControls
                  options={enhanceOptions}
                  onChange={handleEnhanceChange}
                  preEnhancementImage={preEnhancementImage}
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">
              Compliance Check & Export
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                {processedImage && (
                  <div className="bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-300 shadow-sm">
                    <img
                      src={processedImage}
                      alt="Processed"
                      className="w-full h-auto"
                    />
                  </div>
                )}
              </div>
              <div className="space-y-6">
                <ComplianceChecker result={complianceResult} />

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
              {[1, 2, 3, 4, 5].map((stepNumber) => (
                <div
                  key={stepNumber}
                  className="flex flex-col items-center flex-1"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      stepNumber === step
                        ? "bg-indigo-600 text-white"
                        : stepNumber < step
                        ? "bg-indigo-200 text-indigo-700"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {stepNumber < step ? <Check size={18} /> : stepNumber}
                  </div>
                  <div
                    className={`h-1 w-full mt-4 ${
                      stepNumber < step ? "bg-indigo-400" : "bg-gray-200"
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="mb-8">{renderStepContent()}</div>

          {/* Navigation Buttons */}
          {step > 1 && (
            <div className="flex justify-between max-w-4xl mx-auto mt-8">
              <button
                onClick={prevStep}
                className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                disabled={isProcessing}
              >
                <ArrowLeft size={18} className="mr-2" />
                Undo
              </button>

              {step < 5 ? (
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
                  onClick={() => navigate("/")}
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

      {/* Inline Camera Modal */}
      {showCamera && (
        <InlineCamera
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      <Footer />

      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

    </div>
  );
};

export default ProcessPage;
