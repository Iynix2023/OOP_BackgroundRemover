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
        
        // Apply filters based on enhancement options
        const brightness = options.brightness / 100;
        const contrast = options.contrast / 100;
        const saturation = options.saturation / 100;
        const smoothing = options.smoothing / 100;
        
        // Get image data for processing
        const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageDataObj.data;
        
        // Apply brightness and contrast
        for (let i = 0; i < data.length; i += 4) {
          // Brightness
          data[i] = Math.min(255, Math.max(0, data[i] + brightness * 255));
          data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + brightness * 255));
          data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + brightness * 255));
          
          // Contrast
          data[i] = Math.min(255, Math.max(0, (data[i] - 128) * (1 + contrast) + 128));
          data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * (1 + contrast) + 128));
          data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * (1 + contrast) + 128));
          
          // Saturation (convert to HSL, adjust S, convert back)
          const r = data[i] / 255;
          const g = data[i + 1] / 255;
          const b = data[i + 2] / 255;
          
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          let h, s, l = (max + min) / 2;
          
          if (max === min) {
            h = s = 0; // achromatic
          } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
              case r: h = (g - b) / d + (g < b ? 6 : 0); break;
              case g: h = (b - r) / d + 2; break;
              case b: h = (r - g) / d + 4; break;
              default: h = 0;
            }
            
            h /= 6;
          }
          
          // Adjust saturation
          s = Math.min(1, Math.max(0, s * (1 + saturation)));
          
          // Convert back to RGB
          if (s === 0) {
            data[i] = data[i + 1] = data[i + 2] = l * 255;
          } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            
            data[i] = this.hue2rgb(p, q, h + 1/3) * 255;
            data[i + 1] = this.hue2rgb(p, q, h) * 255;
            data[i + 2] = this.hue2rgb(p, q, h - 1/3) * 255;
          }
        }
        
        // Apply skin smoothing (simple blur for skin tones)
        if (smoothing > 0) {
          // This is a simplified version - real apps would use more sophisticated algorithms
          const tempData = new Uint8ClampedArray(data);
          
          for (let y = 1; y < canvas.height - 1; y++) {
            for (let x = 1; x < canvas.width - 1; x++) {
              const idx = (y * canvas.width + x) * 4;
              
              // Check if pixel is likely skin tone (simplified)
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              
              // Simple skin detection
              if (r > 60 && g > 40 && b > 20 && r > g && r > b && r - g > 15) {
                // Apply blur for skin pixels
                for (let c = 0; c < 3; c++) {
                  let sum = 0;
                  for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                      const srcIdx = ((y + dy) * canvas.width + (x + dx)) * 4 + c;
                      sum += tempData[srcIdx];
                    }
                  }
                  // Weighted average based on smoothing amount
                  data[idx + c] = Math.floor(data[idx + c] * (1 - smoothing) + (sum / 9) * smoothing);
                }
              }
            }
          }
        }
        
        // Put the processed image data back
        ctx.putImageData(imageDataObj, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      
      img.src = imageData;
    });
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
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(imageData);
          return;
        }
        
        // Set canvas size to crop dimensions
        canvas.width = cropArea.width;
        canvas.height = cropArea.height;
        
        // Draw the cropped portion of the image
        ctx.drawImage(
          img,
          cropArea.x,
          cropArea.y,
          cropArea.width,
          cropArea.height,
          0,
          0,
          cropArea.width,
          cropArea.height
        );
        
        resolve(canvas.toDataURL('image/png'));
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