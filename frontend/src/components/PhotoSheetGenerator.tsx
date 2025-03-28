import React, { useState } from 'react';
import { ExportFormat, ExportSize, ExportLayout, ExportOptions } from '../types';
import { Download, RefreshCw } from 'lucide-react';
import SheetLayoutPreview from './SheetLayoutPreview';
import sheetGeneratorService from '../services/sheetGeneratorService';

interface PhotoSheetGeneratorProps {
  processedImage: string | null;
}

const PhotoSheetGenerator: React.FC<PhotoSheetGeneratorProps> = ({ processedImage }) => {
  const [sheetImage, setSheetImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: ExportFormat.JPEG,
    size: ExportSize.STANDARD_35x45,
    layout: ExportLayout.GRID_2x2
  });
  
  // Add state for custom dimensions
  const [customDimensions, setCustomDimensions] = useState({ width: 160, height: 120 });
  
  const handleFormatChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setExportOptions({
      ...exportOptions,
      format: event.target.value as ExportFormat
    });
  };
  
  const handleSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setExportOptions({
      ...exportOptions,
      size: event.target.value as ExportSize
    });
  };
  
  // Add handlers for custom dimensions
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
  
  // The updated generateSheet function with multiple photo standards
  const generateSheet = async () => {
    if (!processedImage) return;
    
    setIsGenerating(true);
    try {
      // Create a canvas to generate the sheet client-side
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          console.error('Could not get canvas context');
          setIsGenerating(false);
          return;
        }
        
        // Set dimensions based on layout
        let cols, rows;
        switch(exportOptions.layout) {
          case ExportLayout.GRID_2x2:
            cols = 2;
            rows = 2;
            break;
          case ExportLayout.GRID_4x6:
            cols = 4;
            rows = 6;
            break;
          default:
            // Single image
            setSheetImage(processedImage);
            setIsGenerating(false);
            return;
        }
        
        // Define photo standards with Singapore focus and Indian passport
        const photoStandards = {
          // Singapore NRIC/Passport (35x45mm)
          [ExportSize.STANDARD_35x45]: {
            width: 140,
            height: 180,
            aspectRatio: 7/9,
            name: "Singapore NRIC/Passport (35x45mm)"
          },
          // US Passport/Visa (2x2 inch square format)
          [ExportSize.US_PASSPORT_2x2]: {
            width: 200,
            height: 200,
            aspectRatio: 1,
            name: "US Passport/Visa (2x2 inch)"
          },
          // China Visa (33x48mm)
          [ExportSize.CHINA_VISA]: {
            width: 132,
            height: 192,
            aspectRatio: 33/48,
            name: "China Visa (33x48mm)"
          },
          // Malaysia Visa/Passport (35x50mm)
          [ExportSize.MALAYSIA_PASSPORT]: {
            width: 140,
            height: 200,
            aspectRatio: 7/10,
            name: "Malaysia Visa/Passport (35x50mm)"
          },
          // Australia Visa (35x45mm, white background)
          [ExportSize.AUSTRALIA_VISA]: {
            width: 140,
            height: 180,
            aspectRatio: 7/9,
            name: "Australia Visa (35x45mm)"
          },
          // Indian Passport/Visa (35x35mm)
          [ExportSize.INDIA_PASSPORT]: {
            width: 140,
            height: 140,
            aspectRatio: 1,
            name: "Indian Passport/Visa (35x35mm)"
          },
          // SMU Student ID
          [ExportSize.SMU_ID]: {
            width: 130,
            height: 170,
            aspectRatio: 13/17,
            name: "SMU Student ID"
          },
          // Custom size
          [ExportSize.CUSTOM]: {
            width: customDimensions.width || 160,
            height: customDimensions.height || 120,
            aspectRatio: (customDimensions.width || 160) / (customDimensions.height || 120),
            name: "Custom Size"
          },
        };
        
        // Get selected standard
        const selectedStandard = photoStandards[exportOptions.size] || photoStandards[ExportSize.STANDARD_35x45];
        const photoWidth = selectedStandard.width;
        const photoHeight = selectedStandard.height;
        const aspectRatio = selectedStandard.aspectRatio;
        
        // Calculate dimensions of final sheet
        const padding = 20;
        const borderWidth = 30;
        
        canvas.width = borderWidth * 2 + (cols * photoWidth) + ((cols - 1) * padding);
        canvas.height = borderWidth * 2 + (rows * photoHeight) + ((rows - 1) * padding);
        
        // Fill white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Calculate source dimensions to maintain aspect ratio
        const sourceAspectRatio = img.width / img.height;
        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = img.width;
        let sourceHeight = img.height;
        
        // Smart cropping with face preservation
        if (sourceAspectRatio > aspectRatio) {
          // Image is wider than needed, crop sides
          sourceWidth = img.height * aspectRatio;
          sourceX = (img.width - sourceWidth) / 2;
        } else {
          // Image is taller than needed, crop top/bottom
          sourceHeight = img.width / aspectRatio;
          // Position crop to favor the top part of the image (where the face usually is)
          sourceY = (img.height - sourceHeight) * 0.3; // 30% from the top
        }
        
        // Draw images in grid
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const x = borderWidth + col * (photoWidth + padding);
            const y = borderWidth + row * (photoHeight + padding);
            
            // First draw a white background for each photo cell
            ctx.fillStyle = 'white';
            ctx.fillRect(x, y, photoWidth, photoHeight);
            
            // Draw the image with proper cropping to maintain aspect ratio
            ctx.drawImage(
              img,
              sourceX, sourceY, sourceWidth, sourceHeight, // Source rectangle
              x, y, photoWidth, photoHeight // Destination rectangle
            );
            
            // Add a subtle border around each photo
            ctx.strokeStyle = '#e5e5e5';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, photoWidth, photoHeight);
          }
        }
        
        // Add a helpful annotation at the bottom of the sheet
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
          `${selectedStandard.name} - ${cols}x${rows} Grid`, 
          canvas.width / 2, 
          canvas.height - 10
        );
        
        // Convert to data URL
        const dataUrl = canvas.toDataURL(exportOptions.format === ExportFormat.JPEG ? 'image/jpeg' : 'image/png');
        setSheetImage(dataUrl);
        setIsGenerating(false);
      };
      
      img.src = processedImage;
      
      // Add error handling for image loading
      img.onerror = () => {
        console.error('Error loading image');
        setIsGenerating(false);
      };
    } catch (error) {
      console.error('Error generating sheet:', error);
      setIsGenerating(false);
    }
  };
  
  const downloadSheet = () => {
    if (!sheetImage) return;
    
    const link = document.createElement('a');
    link.href = sheetImage;
    
    // Set the filename based on the layout
    let filename = 'id-photo';
    switch (exportOptions.layout) {
      case ExportLayout.GRID_2x2:
        filename += '-2x2-sheet';
        break;
      case ExportLayout.GRID_4x6:
        filename += '-4x6-sheet';
        break;
      default:
        filename += '-single';
    }
    
    // Add the format extension
    filename += exportOptions.format === ExportFormat.JPEG ? '.jpg' : '.png';
    
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-medium text-gray-700 mb-3">Photo Sheet Generator</h3>
      
      <div className="space-y-3 mb-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Format</label>
          <select 
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            value={exportOptions.format}
            onChange={handleFormatChange}
          >
            <option value={ExportFormat.JPEG}>JPEG</option>
            <option value={ExportFormat.PNG}>PNG</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm text-gray-600 mb-1">Photo Size</label>
          <select 
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            value={exportOptions.size}
            onChange={handleSizeChange}
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
        {exportOptions.size === ExportSize.CUSTOM && (
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
          <label className="block text-sm text-gray-600 mb-1">Sheet Layout</label>
          <div className="flex justify-between mt-2">
            <SheetLayoutPreview 
              layout={ExportLayout.SINGLE} 
              onClick={(layout) => setExportOptions({...exportOptions, layout})}
              isSelected={exportOptions.layout === ExportLayout.SINGLE}
            />
            <SheetLayoutPreview 
              layout={ExportLayout.GRID_2x2} 
              onClick={(layout) => setExportOptions({...exportOptions, layout})}
              isSelected={exportOptions.layout === ExportLayout.GRID_2x2}
            />
            <SheetLayoutPreview 
              layout={ExportLayout.GRID_4x6} 
              onClick={(layout) => setExportOptions({...exportOptions, layout})}
              isSelected={exportOptions.layout === ExportLayout.GRID_4x6}
            />
          </div>
        </div>
      </div>
      
      <button
        onClick={generateSheet}
        disabled={!processedImage || isGenerating}
        className={`w-full flex items-center justify-center px-3 py-2 rounded-md mb-4
          ${!processedImage || isGenerating
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-indigo-600 text-white hover:bg-indigo-700 transition-colors'
          }`}
      >
        {isGenerating ? (
          <>
            <RefreshCw size={18} className="mr-2 animate-spin" />
            Generating Sheet...
          </>
        ) : (
          <>
            <RefreshCw size={18} className="mr-2" />
            Generate Sheet
          </>
        )}
      </button>
      
      {sheetImage && (
        <div className="space-y-4">
          <div className="bg-gray-100 rounded-lg p-2">
            <img 
              src={sheetImage} 
              alt="Photo Sheet" 
              className="w-full h-auto" 
            />
          </div>
          
          <button
            onClick={downloadSheet}
            className="w-full flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Download size={18} className="mr-2" />
            Download Sheet
          </button>
        </div>
      )}
    </div>
  );
};

export default PhotoSheetGenerator;