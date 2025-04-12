import {
  BackgroundOptions,
  // ClothesOptions,
  EnhanceOptions,
  CropArea,
  ComplianceResult,
} from "../types";
const API_URL = "http://localhost:8080";
// This service handles all image processing functionality
class ImageProcessingService {
  // Process an image with background removal
  async removeBackground(
    imageData: string,
    options: BackgroundOptions
  ): Promise<string> {
    try {
      // If using a custom background image, call the custom endpoint
      if (options.type === "image" && options.value) {
        return this.applyCustomBackgroundImage(imageData, options.value);
      }

      // Otherwise use the normal background removal endpoint
      // Convert the base64/blob URL image to a file object
      const imageFile = await this.dataURLtoFile(imageData, "image.png");

      // Create form data for the API call
      const formData = new FormData();
      formData.append("image", imageFile);

      // Add background color information
      formData.append("backgroundType", options.type);
      formData.append("backgroundColor", options.value);

      // Send the request to the backend
      const response = await fetch(`${API_URL}/process-image`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Background removal failed: ${response.status}`);
      }

      // Convert the response to a blob and create an object URL
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("Background removal error:", error);

      // Fallback to client-side processing if server fails
      return this.clientSideBackgroundRemoval(imageData, options);
    }
  }

  // New method to handle custom background images
  private async applyCustomBackgroundImage(
    personImage: string,
    backgroundImage: string
  ): Promise<string> {
    try {
      // Ensure we have base64 data
      const personBase64 = personImage.startsWith("data:")
        ? personImage
        : await this.blobUrlToBase64(personImage);

      const backgroundBase64 = backgroundImage.startsWith("data:")
        ? backgroundImage
        : await this.blobUrlToBase64(backgroundImage);

      // Create URL-encoded form data
      const formData = new URLSearchParams();
      formData.append("personImage", personBase64);
      formData.append("backgroundImage", backgroundBase64);

      // Send the request to the backend
      const response = await fetch(`${API_URL}/process-custom-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        throw new Error(
          `Custom background application failed: ${response.status}`
        );
      }

      // Convert the response to a blob and create an object URL
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("Custom background application error:", error);
      throw error;
    }
  }

  // Add this helper method to convert dataURL to File object
  public async dataURLtoFile(
    dataURL: string,
    filename: string
  ): Promise<File> {
    // If it's a blob URL, fetch and convert to base64 first
    if (dataURL.startsWith("blob:")) {
      const base64Data = await this.blobUrlToBase64(dataURL);
      dataURL = base64Data;
    }

    // Split the base64 string to get the actual data
    const arr = dataURL.split(",");
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
  }

  // Create a fallback method using the original client-side implementation
  private clientSideBackgroundRemoval(
    imageData: string,
    options: BackgroundOptions
  ): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = img.width;
        canvas.height = img.height;

        if (!ctx) {
          resolve(imageData);
          return;
        }

        // Draw the original image
        ctx.drawImage(img, 0, 0);

        // Get image data for processing
        const imageDataObj = ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );
        const data = imageDataObj.data;

        // Simple background removal algorithm (green screen technique)
        // In a real app, this would use ML-based segmentation
        if (options.type === "color") {
          // Fill with solid color
          const color = options.value;
          const r = parseInt(color.slice(1, 3), 16);
          const g = parseInt(color.slice(3, 5), 16);
          const b = parseInt(color.slice(5, 7), 16);

          // Simple edge detection to find foreground
          for (let i = 0; i < data.length; i += 4) {
            // Check if pixel is likely background (using simple luminance threshold)
            // This is a simplified algorithm - real apps would use ML models
            const luminance =
              data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            if (luminance > 200) {
              // Assuming lighter pixels are background
              data[i] = r; // R
              data[i + 1] = g; // G
              data[i + 2] = b; // B
              // Keep alpha as is
            }
          }
        } else if (options.type === "transparent") {
          // Make background transparent
          for (let i = 0; i < data.length; i += 4) {
            const luminance =
              data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            if (luminance > 200) {
              data[i + 3] = 0; // Set alpha to 0 (transparent)
            }
          }
        } else if (options.type === "image" && options.value) {
          // Load background image
          const bgImg = new Image();
          bgImg.onload = () => {
            // Create a new canvas for the background
            const bgCanvas = document.createElement("canvas");
            bgCanvas.width = canvas.width;
            bgCanvas.height = canvas.height;
            const bgCtx = bgCanvas.getContext("2d");

            if (bgCtx) {
              // Draw background image scaled to fit
              bgCtx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

              // Get background image data
              const bgImageData = bgCtx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
              );
              const bgData = bgImageData.data;

              // Replace background pixels
              for (let i = 0; i < data.length; i += 4) {
                const luminance =
                  data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                if (luminance > 200) {
                  data[i] = bgData[i]; // R
                  data[i + 1] = bgData[i + 1]; // G
                  data[i + 2] = bgData[i + 2]; // B
                  // Keep alpha as is
                }
              }
            }

            // Put the processed image data back
            ctx.putImageData(imageDataObj, 0, 0);
            resolve(canvas.toDataURL("image/png"));
          };
          bgImg.src = options.value;
          return;
        }

        // Put the processed image data back
        ctx.putImageData(imageDataObj, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };

      img.src = imageData;
    });
  }

  // Apply image enhancements
  async enhanceImage(
    imageData: string,
    options: EnhanceOptions
  ): Promise<string> {
    console.log("Sending enhance request with options:", options);

    // Convert blob URL to base64 if needed
    const processedImageData = await this.blobUrlToBase64(imageData);

    const formData = new FormData();
    formData.append("image", processedImageData);
    formData.append("options", JSON.stringify(options));

    try {
      const response = await fetch("http://localhost:8080/api/image/enhance", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error:", errorText);
        throw new Error(
          `Failed to enhance image: ${response.status} ${response.statusText}`
        );
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("Error in enhanceImage service:", error);
      throw error;
    }
  }

  async analyzeImage(imageData: string): Promise<EnhanceOptions> {
    try {
      // Convert blob URL to base64 if needed
      const processedImageData = await this.blobUrlToBase64(imageData);

      const formData = new FormData();
      formData.append("image", processedImageData);

      const response = await fetch("http://localhost:8080/api/image/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const params = await response.json();
      return {
        brightness: params.brightness || 0,
        contrast: params.contrast || 0,
        saturation: params.saturation || 0,
      };
    } catch (error) {
      console.error("Error analyzing image:", error);
      // Fall back to default values
      return {
        brightness: 5,
        contrast: 10,
        saturation: 5,
      };
    }
  }

  // Crop an image based on crop area
  async cropImage(imageData: string, cropArea: CropArea): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // First create a canvas for cropping
        const cropCanvas = document.createElement("canvas");
        const cropCtx = cropCanvas.getContext("2d");

        if (!cropCtx) {
          resolve(imageData);
          return;
        }

        // Set canvas size to crop dimensions
        cropCanvas.width = cropArea.width;
        cropCanvas.height = cropArea.height;

        // Draw the cropped portion of the image
        cropCtx.drawImage(
          img,
          cropArea.x,
          cropArea.y,
          cropArea.width,
          cropArea.height,
          0,
          0,
          cropCanvas.width,
          cropCanvas.height
        );

        // Now create a second canvas for resizing to standard dimensions
        // Standard dimensions for ID photo (35mm × 45mm at 300 DPI)
        // 35mm = 413 pixels, 45mm = 531 pixels at 300 DPI
        const standardWidth = Math.round((35 * 300) / 25.4); // 25.4mm = 1 inch
        const standardHeight = Math.round((45 * 300) / 25.4);

        const resizeCanvas = document.createElement("canvas");
        const resizeCtx = resizeCanvas.getContext("2d");

        if (!resizeCtx) {
          resolve(cropCanvas.toDataURL("image/png"));
          return;
        }

        // Set canvas to standard dimensions
        resizeCanvas.width = standardWidth;
        resizeCanvas.height = standardHeight;

        // Draw and resize the cropped image to standard dimensions
        resizeCtx.drawImage(
          cropCanvas,
          0,
          0,
          cropCanvas.width,
          cropCanvas.height,
          0,
          0,
          standardWidth,
          standardHeight
        );

        resolve(resizeCanvas.toDataURL("image/png"));
      };

      img.src = imageData;
    });
  }
  // For batch processing
  async startBatchProcessing(
    files: File[],
    background: BackgroundOptions,
    // clothes: ClothesOptions,
    enhanceOptions: EnhanceOptions,
    exportFormat: string,
    exportSize: string
  ): Promise<{ batchId: string }> {
    try {
      const formData = new FormData();

      // Add files to FormData
      files.forEach((file) => {
        formData.append("files", file);
      });

      // Add background options
      formData.append("backgroundType", background.type);
      formData.append("backgroundValue", background.value);

      // Add clothes options if provided
      // if (clothes && clothes.type) {
      //   formData.append("clothesType", clothes.type);
      //   formData.append("clothesColor", clothes.color);
      // }

      // Add enhancement options
      formData.append("brightness", enhanceOptions.brightness.toString());
      formData.append("contrast", enhanceOptions.contrast.toString());
      formData.append("saturation", enhanceOptions.saturation.toString());

      // Add export options
      formData.append("exportFormat", exportFormat);
      formData.append("exportSize", exportSize);

      const response = await fetch("/api/batch/process", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Batch processing error:", error);
      throw error;
    }
  }

  /**
   * Get the status of a batch processing job
   */
  async getBatchStatus(batchId: string): Promise<any> {
    try {
      const response = await fetch(`/api/batch/status/${batchId}`);

      if (!response.ok) {
        throw new Error(`Failed to get batch status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error checking batch status:", error);
      throw error;
    }
  }

  /**
   * Get a processed image result
   */
  async getProcessedImage(
    batchId: string,
    imageIndex: number
  ): Promise<string> {
    try {
      const response = await fetch(
        `/api/batch/result/${batchId}/${imageIndex}`
      );

      if (!response.ok) {
        throw new Error(`Failed to get processed image: ${response.status}`);
      }

      // Convert response to blob and create an object URL
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("Error getting processed image:", error);
      throw error;
    }
  }
  // Check if the photo meets compliance requirements
  checkCompliance(imageData: string): Promise<ComplianceResult> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = img.width;
        canvas.height = img.height;

        if (!ctx) {
          resolve({
            isCompliant: false,
            issues: [
              {
                type: "quality",
                message: "Unable to analyze image",
                severity: "error",
              },
            ],
          });
          return;
        }

        // Draw the image
        ctx.drawImage(img, 0, 0);

        // Get image data for analysis
        const imageDataObj = ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );
        const data = imageDataObj.data;

        const issues = [];

        // Check aspect ratio
        const aspectRatio = canvas.width / canvas.height;
        if (Math.abs(aspectRatio - 35 / 45) > 0.1) {
          issues.push({
            type: "size",
            message:
              "Aspect ratio does not match standard ID photo requirements (35:45)",
            severity: "warning",
          });
        }

        // Check resolution
        if (canvas.width < 400 || canvas.height < 500) {
          issues.push({
            type: "quality",
            message: "Image resolution is too low for high-quality printing",
            severity: "warning",
          });
        }

        // Simple face detection (in a real app, this would use ML-based face detection)
        // This is a very simplified version that looks for skin-colored pixels in the upper half
        let facePixelsCount = 0;
        for (let y = 0; y < canvas.height / 2; y++) {
          for (let x = canvas.width / 4; x < (canvas.width * 3) / 4; x++) {
            const idx = (y * canvas.width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            // Simple skin detection
            if (r > 60 && g > 40 && b > 20 && r > g && r > b && r - g > 15) {
              facePixelsCount++;
            }
          }
        }

        const facePixelThreshold = (canvas.width * canvas.height) / 20; // 5% of image
        if (facePixelsCount < facePixelThreshold) {
          issues.push({
            type: "face",
            message: "Face not clearly visible or too small",
            severity: "error",
          });
        }

        // Check background uniformity (simplified)
        let backgroundVariation = 0;
        let lastPixelValue = -1;

        // Sample the edges of the image to check background
        for (let i = 0; i < canvas.width; i += 10) {
          const idx = i * 4; // Top edge
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const value = r + g + b;

          if (lastPixelValue !== -1) {
            backgroundVariation += Math.abs(value - lastPixelValue);
          }
          lastPixelValue = value;
        }

        if (backgroundVariation > 5000) {
          issues.push({
            type: "background",
            message: "Background is not uniform",
            severity: "warning",
          });
        }

        resolve({
          isCompliant: issues.length === 0,
          issues,
        });
      };

      img.src = imageData;
    });
  }

  // Add this helper method to your ImageProcessingService class
  private async blobUrlToBase64(url: string): Promise<string> {
    // If this is already a data URL, return it
    if (url.startsWith("data:")) {
      return url;
    }

    // If it's a blob URL, fetch it and convert to base64
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error converting blob URL to base64:", error);
      throw error;
    }
  }

  // Add this method to apply background to transparent image client-side
  async applyBackgroundColor(transparentImageData: string, backgroundColor: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        
        if (!ctx) {
          resolve(transparentImageData);
          return;
        }
        
        // Fill background with color
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw transparent image on top
        ctx.drawImage(img, 0, 0);
        
        resolve(canvas.toDataURL("image/png"));
      };
      
      img.src = transparentImageData;
    });
  }
}

export default new ImageProcessingService();
