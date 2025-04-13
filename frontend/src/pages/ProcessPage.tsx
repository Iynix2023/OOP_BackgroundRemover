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
import PhotoSheetGenerator, {
  PhotoSheetGeneratorRef,
} from "../components/PhotoSheetGenerator";

// import cloudUploadService from "../services/cloudUploadService";

import { uploadToCloud } from "../services/cloudUploadService";

import { ToastContainer, toast } from "react-toastify";

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
    [key: string]: string | null;
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

  // Add a new state variable to store the sheet image
  const [sheetImage, setSheetImage] = useState<string | null>(null);

  // Ref for PhotoSheetGenerator component
  const photoSheetGeneratorRef = useRef<PhotoSheetGeneratorRef>(null);

  // Add this state variable to store the recommended settings
  const [recommendedSettings, setRecommendedSettings] =
    useState<EnhanceOptions | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

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
    if (!uploadedImage) return;

    setIsProcessing(true);
    try {
      // First get transparent version (this runs ML once)
      const transparentVersion = await fetch(
        `http://localhost:8080/process-transparent`,
        {
          method: "POST",
          body: await (async () => {
            const formData = new FormData();
            formData.append(
              "image",
              await imageProcessingService.dataURLtoFile(
                uploadedImage,
                "image.png"
              )
            );
            return formData;
          })(),
        }
      )
        .then((res) => res.blob())
        .then((blob) => URL.createObjectURL(blob));

      // Store transparent version
      setStepImages((prev) => ({
        ...prev,
        "2-transparent": transparentVersion,
      }));

      // Now apply background client-side (no ML needed)
      let coloredVersion;
      if (options.type === "transparent") {
        coloredVersion = transparentVersion;
      } else if (options.type === "image" && options.value) {
        // Use client-side method for image backgrounds
        coloredVersion = await imageProcessingService.applyBackgroundImage(
          transparentVersion,
          options.value
        );
      } else {
        coloredVersion = await imageProcessingService.applyBackgroundColor(
          transparentVersion,
          options.value
        );
      }

      // Update UI with colored version
      setProcessedImage(coloredVersion);
      setStepImages((prev) => ({ ...prev, 2: coloredVersion }));

      // Rest of your code...
    } catch (error) {
      console.error("Error in background removal:", error);
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
    // Get both versions from step 2
    const sourceImage = stepImages[2];
    const transparentSource = stepImages["2-transparent"];

    if (!sourceImage || !cropArea || !transparentSource) return;

    setIsProcessing(true);
    try {
      // Crop both versions
      const croppedImage = await imageProcessingService.cropImage(
        sourceImage,
        cropArea
      );
      const croppedTransparent = await imageProcessingService.cropImage(
        transparentSource,
        cropArea
      );

      setProcessedImage(croppedImage);

      // Store both cropped versions
      setStepImages((prev) => ({
        ...prev,
        3: croppedImage,
        "3-transparent": croppedTransparent,
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
      const transparentVersion = stepImages["3-transparent"];
      if (transparentVersion) {
        setPreEnhancementImage(transparentVersion);
      } else if (processedImage) {
        // Fallback to colored version only if transparent isn't available
        setPreEnhancementImage(processedImage);
      }
    }
  }, [step, processedImage, preEnhancementImage]);

  // handleEnhanceChange function
  const handleEnhanceChange = async (options: EnhanceOptions) => {
    // Update UI state immediately
    setEnhanceOptions(options);

    // Use transparent source
    const transparentSource = stepImages["3-transparent"];
    if (!transparentSource) return;

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

        // Use transparent source
        const enhancedTransparent = await imageProcessingService.enhanceImage(
          transparentSource,
          cleanOptions
        );

        // Apply the appropriate background to the enhanced transparent image
        let colored;
        if (background.type === "transparent") {
          colored = enhancedTransparent;
        } else if (background.type === "image" && background.value) {
          // Use image background
          colored = await imageProcessingService.applyBackgroundImage(
            enhancedTransparent,
            background.value
          );
        } else {
          // Use color background
          colored = await imageProcessingService.applyBackgroundColor(
            enhancedTransparent,
            background.value
          );
        }

        if (colored) {
          setProcessedImage(colored);

          // Store the enhanced image for step 4
          setStepImages((prev) => ({
            ...prev,
            4: colored,
            "4-transparent": enhancedTransparent,
          }));

          // Add to history
          const newHistory = history.slice(0, historyIndex + 1);
          newHistory.push(colored);
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
      // Apply background to transparent image instead of using it directly
      setIsProcessing(true);

      // Apply the appropriate background to the transparent image
      let reapplyBackgroundPromise;
      if (background.type === "transparent") {
        reapplyBackgroundPromise = Promise.resolve(transparentSource);
      } else if (background.type === "image" && background.value) {
        reapplyBackgroundPromise = imageProcessingService.applyBackgroundImage(
          transparentSource,
          background.value
        );
      } else {
        reapplyBackgroundPromise = imageProcessingService.applyBackgroundColor(
          transparentSource,
          background.value || "#FFFFFF"
        );
      }

      reapplyBackgroundPromise
        .then((coloredReset) => {
          setProcessedImage(coloredReset);

          // Store the reset image with background for step 4
          setStepImages((prev) => ({
            ...prev,
            4: coloredReset,
            "4-transparent": transparentSource,
          }));

          // Add to history
          const newHistory = history.slice(0, historyIndex + 1);
          newHistory.push(coloredReset);
          setHistory(newHistory);
          setHistoryIndex(newHistory.length - 1);

          setIsProcessing(false);
        })
        .catch((error) => {
          console.error("Error applying background during reset:", error);
          setIsProcessing(false);
        });

      // Clear the timer since we're handling it separately
      if (debounceTimer.current !== null) {
        window.clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
    } else {
      // Use debouncing for regular adjustments
      debounceTimer.current = window.setTimeout(processImage, 300);
    }
  };

  useEffect(() => {
    if (step === 5 && processedImage) {
      checkCompliance();
    }
  }, [step, processedImage]);

  const checkCompliance = async () => {
    if (!processedImage) return;

    const blob = await fetch(processedImage).then((res) => res.blob());
    const formData = new FormData();
    formData.append("file", blob, "id-photo.png");

    const response = await fetch("http://localhost:8080/api/compliance/check", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    setComplianceResult({
      isCompliant: result.compliant,
      issues: [
        !result.faceDetected && "No face detected",
        !result.faceSizeOk && "Face size is not within required range",
        !result.faceCentered && "Face is not horizontally centered",
        !result.uniformBackground && "Background is not uniform",
      ].filter(Boolean),
    });
  };

  // const checkCompliance = async () => {
  //   const blob = await fetch(processedImage).then(res => res.blob());
  //   const formData = new FormData();
  //   formData.append("file", blob, "id-photo.png");

  //   const response = await fetch("http://localhost:8080/api/compliance/check", {
  //     method: "POST",
  //     body: formData,
  //   });

  //   const result = await response.json();
  //   setComplianceResult(result);
  // };

  // const checkCompliance = async () => {
  //   if (!processedImage) return;

  //   setIsProcessing(true);
  //   try {
  //     const result = await imageProcessingService.checkCompliance(
  //       processedImage
  //     );
  //     setComplianceResult(result);
  //   } catch (error) {
  //     console.error("Error checking compliance:", error);
  //   } finally {
  //     setIsProcessing(false);
  //   }
  // };

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

    const nextStepValue = step + 1;
    setStep(nextStepValue);

    // Auto-generate sheet when reaching step 5
    if (nextStepValue === 5) {
      // Use setTimeout to ensure the component has mounted before we call its method
      setTimeout(() => {
        if (photoSheetGeneratorRef.current) {
          photoSheetGeneratorRef.current.generateSheet();
        }
      }, 300);
    }
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

  // Create a handler function for the PhotoSheetGenerator
  const handleSheetImageGenerated = (generatedImage: string) => {
    console.log("Image generated - updating sheet image");
    setSheetImage(generatedImage);
  };

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
                    <div className="absolute top-2 right-2 bg-green-600 text-white text-xs py-1 px-2 rounded z-10">
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
                  <div className="bg-gray-100 rounded-lg overflow-hidden w-[300px] border-2 border-gray-300 shadow-sm relative">
                    <div className="absolute top-2 right-2 bg-red-700 text-white text-xs py-1 px-2 rounded z-10">
                      After
                    </div>
                    <img
                      src={processedImage}
                      alt="Processed"
                      className="w-full h-auto"
                    />
                    {isProcessing && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
                        <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
                        <p className="mt-2 text-sm text-white">Processing...</p>
                      </div>
                    )}
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
                    <div className="absolute top-2 right-2 bg-green-600 text-white text-xs py-1 px-2 rounded z-10">
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
                  <div className="bg-gray-100 rounded-lg overflow-hidden w-[300px] border-2 border-gray-300 shadow-sm relative">
                    <div className="absolute top-2 right-2 bg-red-700 text-white text-xs py-1 px-2 rounded z-10">
                      After
                    </div>
                    <img
                      src={processedImage}
                      alt="Enhanced"
                      className="w-full h-auto"
                    />
                    {isProcessing && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
                        <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
                        <p className="mt-2 text-sm text-white">Processing...</p>
                      </div>
                    )}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-1">
                {(sheetImage || processedImage) && (
                  <div className="bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-300 shadow-sm">
                    <img
                      src={sheetImage || processedImage || ""}
                      alt="Processed"
                      className="w-full h-auto"
                      // Add a key to force re-render when image changes
                      key={sheetImage || processedImage || "no-image"}
                    />
                  </div>
                )}
              </div>
              <div className="space-y-6">
                <ComplianceChecker result={complianceResult} />

                <PhotoSheetGenerator
                  ref={photoSheetGeneratorRef}
                  processedImage={processedImage}
                  onImageGenerated={handleSheetImageGenerated}
                />
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
                Previous
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

      {/* <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastClassName="text-lg text-gray-800 font-semibold shadow-lg rounded-xl px-6 py-4"
        bodyClassName="flex justify-center items-center text-center"
      /> */}
    </div>
  );
};

export default ProcessPage;
