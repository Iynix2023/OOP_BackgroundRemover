// src/services/sheetGeneratorService.ts
import axios from 'axios';
import { ExportOptions } from '../types';

const API_URL = 'http://localhost:8080/api/photo';

/**
 * Generate a sheet of multiple ID photos with the specified layout
 */
export const generatePhotoSheet = async (
  imageData: string,
  exportOptions: {
    format: string;
    size: string;
    layout: string;
    customWidth?: number;
    customHeight?: number;
  }
): Promise<string> => {
  try {
    // If imageData is already a data URL, use it as is
    // If it's a blob URL, fetch it and convert to data URL
    let processedImageData = imageData;
    if (imageData.startsWith('blob:')) {
      const response = await fetch(imageData);
      const blob = await response.blob();
      processedImageData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
    
    // Call the backend API
    const response = await axios.post(
      `${API_URL}/generate-sheet`,
      {
        imageData: processedImageData,
        exportOptions: exportOptions
      }
    );
    
    // Return the processed image data
    return response.data.imageData;
  } catch (error) {
    console.error('Error generating photo sheet:', error);
    throw error;
  }
};

export default {
  generatePhotoSheet
};