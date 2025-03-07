import { BackgroundOptions, ClothesOptions, EnhanceOptions, CropArea, ComplianceResult } from '../types';

// This service handles all image processing functionality
class ImageProcessingService {
  // Process an image with background removal
  async removeBackground(
    imageData: string,
    options: BackgroundOptions
  ): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        if (!ctx) {
          resolve(imageData);
          return;
        }
        
        // Draw the original image
        ctx.drawImage(img, 0, 0);
        
        // Get image data for processing
        const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageDataObj.data;
        
        // Simple background removal algorithm (green screen technique)
        // In a real app, this would use ML-based segmentation
        if (options.type === 'color') {
          // Fill with solid color
          const color = options.value;
          const r = parseInt(color.slice(1, 3), 16);
          const g = parseInt(color.slice(3, 5), 16);
          const b = parseInt(color.slice(5, 7), 16);
          
          // Simple edge detection to find foreground
          for (let i = 0; i < data.length; i += 4) {
            // Check if pixel is likely background (using simple luminance threshold)
            // This is a simplified algorithm - real apps would use ML models
            const luminance = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
            if (luminance > 200) { // Assuming lighter pixels are background
              data[i] = r;     // R
              data[i + 1] = g; // G
              data[i + 2] = b; // B
              // Keep alpha as is
            }
          }
        } else if (options.type === 'transparent') {
          // Make background transparent
          for (let i = 0; i < data.length; i += 4) {
            const luminance = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
            if (luminance > 200) {
              data[i + 3] = 0; // Set alpha to 0 (transparent)
            }
          }
        } else if (options.type === 'image' && options.value) {
          // Load background image
          const bgImg = new Image();
          bgImg.onload = () => {
            // Create a new canvas for the background
            const bgCanvas = document.createElement('canvas');
            bgCanvas.width = canvas.width;
            bgCanvas.height = canvas.height;
            const bgCtx = bgCanvas.getContext('2d');
            
            if (bgCtx) {
              // Draw background image scaled to fit
              bgCtx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
              
              // Get background image data
              const bgImageData = bgCtx.getImageData(0, 0, canvas.width, canvas.height);
              const bgData = bgImageData.data;
              
              // Replace background pixels
              for (let i = 0; i < data.length; i += 4) {
                const luminance = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
                if (luminance > 200) {
                  data[i] = bgData[i];         // R
                  data[i + 1] = bgData[i + 1]; // G
                  data[i + 2] = bgData[i + 2]; // B
                  // Keep alpha as is
                }
              }
            }
            
            // Put the processed image data back
            ctx.putImageData(imageDataObj, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          };
          bgImg.src = options.value;
          return;
        }
        
        // Put the processed image data back
        ctx.putImageData(imageDataObj, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      
      img.src = imageData;
    });
  }
  
  // Apply clothes replacement
  async replaceClothes(
    imageData: string,
    options: ClothesOptions
  ): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        if (!ctx) {
          resolve(imageData);
          return;
        }
        
        // Draw the original image
        ctx.drawImage(img, 0, 0);
        
        // Get image data for processing
        const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageDataObj.data;
        
        // Simple clothes replacement (in a real app, this would use ML-based segmentation)
        // Detect the lower part of the image (assuming it contains clothes)
        const lowerThird = Math.floor(canvas.height * 0.4); // Start from 40% down
        
        // Parse the color
        const color = options.color;
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        
        // Apply color to the lower part with some blending
        for (let y = lowerThird; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const idx = (y * canvas.width + x) * 4;
            
            // Skip pixels that are likely background (very light)
            const luminance = (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114);
            if (luminance > 240) continue;
            
            // Apply color with blending to maintain texture
            data[idx] = Math.floor((data[idx] * 0.3) + (r * 0.7));     // R
            data[idx + 1] = Math.floor((data[idx + 1] * 0.3) + (g * 0.7)); // G
            data[idx + 2] = Math.floor((data[idx + 2] * 0.3) + (b * 0.7)); // B
            // Alpha remains unchanged
          }
        }
        
        // Add collar based on clothes type
        if (options.type === 'suit') {
          // Draw a simple suit collar
          const collarY = Math.floor(canvas.height * 0.4);
          const collarWidth = Math.floor(canvas.width * 0.2);
          
          ctx.putImageData(imageDataObj, 0, 0);
          
          // Draw collar
          ctx.fillStyle = '#FFFFFF'; // White shirt
          ctx.beginPath();
          ctx.moveTo(canvas.width / 2 - collarWidth, collarY);
          ctx.lineTo(canvas.width / 2, collarY + collarWidth);
          ctx.lineTo(canvas.width / 2 + collarWidth, collarY);
          ctx.closePath();
          ctx.fill();
          
          return resolve(canvas.toDataURL('image/png'));
        } else if (options.type === 'shirt' || options.type === 'blouse') {
          // Add a simple collar
          const collarY = Math.floor(canvas.height * 0.35);
          const collarWidth = Math.floor(canvas.width * 0.15);
          
          ctx.putImageData(imageDataObj, 0, 0);
          
          // Draw collar
          ctx.fillStyle = '#FFFFFF'; // White collar
          ctx.beginPath();
          ctx.moveTo(canvas.width / 2 - collarWidth, collarY);
          ctx.lineTo(canvas.width / 2, collarY + collarWidth / 2);
          ctx.lineTo(canvas.width / 2 + collarWidth, collarY);
          ctx.closePath();
          ctx.fill();
          
          return resolve(canvas.toDataURL('image/png'));
        }
        
        // Put the processed image data back
        ctx.putImageData(imageDataObj, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      
      img.src = imageData;
    });
  }
  
  // Apply image enhancements
  async enhanceImage(
    imageData: string,
    options: EnhanceOptions
  ): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        if (!ctx) {
          resolve(imageData);
          return;
        }
        
        // Draw the original image
        ctx.drawImage(img, 0, 0);
        
        // Get image data for processing
        const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageDataObj.data;
        
        // Handle options more carefully
        // Convert slider values to usable ranges
        const brightnessAdjust = options.brightness / 100; // -0.5 to 0.5
        const contrastAdjust = 1 + options.contrast / 100; // 0.5 to 1.5
        const saturationAdjust = 1 + options.saturation / 100; // 0.5 to 1.5
        const smoothingAdjust = options.smoothing / 100; // 0 to 1
        
        // Process each pixel
        for (let i = 0; i < data.length; i += 4) {
          // Get original RGB values
          let r = data[i];
          let g = data[i + 1];
          let b = data[i + 2];
          
          // Apply brightness
          r += brightnessAdjust * 255;
          g += brightnessAdjust * 255;
          b += brightnessAdjust * 255;
          
          // Apply contrast
          const factor = (259 * (contrastAdjust * 100 + 255)) / (255 * (259 - contrastAdjust * 100));
          r = factor * (r - 128) + 128;
          g = factor * (g - 128) + 128;
          b = factor * (b - 128) + 128;
          
          // Apply saturation
          const avg = (r + g + b) / 3;
          r = avg + saturationAdjust * (r - avg);
          g = avg + saturationAdjust * (g - avg);
          b = avg + saturationAdjust * (b - avg);
          
          // Clamp values to valid range
          data[i] = Math.max(0, Math.min(255, Math.round(r)));
          data[i + 1] = Math.max(0, Math.min(255, Math.round(g)));
          data[i + 2] = Math.max(0, Math.min(255, Math.round(b)));
          // Alpha remains unchanged
        }
        
        // Apply skin smoothing if needed
        if (smoothingAdjust > 0) {
          // Create a copy of the processed data
          const smoothedData = new Uint8ClampedArray(data);
          
          // Simple box blur for skin tones
          for (let y = 1; y < canvas.height - 1; y++) {
            for (let x = 1; x < canvas.width - 1; x++) {
              const idx = (y * canvas.width + x) * 4;
              
              // Simple skin detection (adjust as needed)
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              
              // Check if pixel is likely skin
              if (r > 60 && g > 40 && b > 20 && r > g && r > b) {
                // Apply box blur to skin pixels
                for (let c = 0; c < 3; c++) {
                  let sum = 0;
                  let count = 0;
                  
                  // Sample 3x3 neighborhood
                  for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                      const nx = x + dx;
                      const ny = y + dy;
                      
                      if (nx >= 0 && nx < canvas.width && ny >= 0 && ny < canvas.height) {
                        const neighborIdx = (ny * canvas.width + nx) * 4 + c;
                        sum += data[neighborIdx];
                        count++;
                      }
                    }
                  }
                  
                  // Blend original with smoothed value
                  const blendedValue = (1 - smoothingAdjust) * data[idx + c] + smoothingAdjust * (sum / count);
                  smoothedData[idx + c] = Math.max(0, Math.min(255, Math.round(blendedValue)));
                }
              }
            }
          }
          
          // Replace data with smoothed version
          for (let i = 0; i < data.length; i++) {
            data[i] = smoothedData[i];
          }
        }
        
        // Put the processed image data back
        ctx.putImageData(imageDataObj, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      
      img.src = imageData;
    });
  }
  
  // Helper function to clamp values between 0-255
  private clamp(value: number): number {
    return Math.max(0, Math.min(255, Math.round(value)));
  }
  
  // Helper function for HSL to RGB conversion
  private hue2rgb(p: number, q: number, t: number): number {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  }
  
  // Crop an image based on crop area
  async cropImage(
    imageData: string,
    cropArea: CropArea
  ): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // First create a canvas for cropping
        const cropCanvas = document.createElement('canvas');
        const cropCtx = cropCanvas.getContext('2d');
        
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
        const standardWidth = Math.round(35 * 300 / 25.4); // 25.4mm = 1 inch
        const standardHeight = Math.round(45 * 300 / 25.4);
        
        const resizeCanvas = document.createElement('canvas');
        const resizeCtx = resizeCanvas.getContext('2d');
        
        if (!resizeCtx) {
          resolve(cropCanvas.toDataURL('image/png'));
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
        
        resolve(resizeCanvas.toDataURL('image/png'));
      };
      
      img.src = imageData;
    });
  }
  
  // Check if the photo meets compliance requirements
  checkCompliance(imageData: string): Promise<ComplianceResult> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        if (!ctx) {
          resolve({
            isCompliant: false,
            issues: [{
              type: 'quality',
              message: 'Unable to analyze image',
              severity: 'error'
            }]
          });
          return;
        }
        
        // Draw the image
        ctx.drawImage(img, 0, 0);
        
        // Get image data for analysis
        const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageDataObj.data;
        
        const issues = [];
        
        // Check aspect ratio
        const aspectRatio = canvas.width / canvas.height;
        if (Math.abs(aspectRatio - (35/45)) > 0.1) {
          issues.push({
            type: 'size',
            message: 'Aspect ratio does not match standard ID photo requirements (35:45)',
            severity: 'warning'
          });
        }
        
        // Check resolution
        if (canvas.width < 400 || canvas.height < 500) {
          issues.push({
            type: 'quality',
            message: 'Image resolution is too low for high-quality printing',
            severity: 'warning'
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
            type: 'face',
            message: 'Face not clearly visible or too small',
            severity: 'error'
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
            type: 'background',
            message: 'Background is not uniform',
            severity: 'warning'
          });
        }
        
        resolve({
          isCompliant: issues.length === 0,
          issues
        });
      };
      
      img.src = imageData;
    });
  }
}

export default new ImageProcessingService();