// src/services/sheetGeneratorService.ts

import axios from 'axios';
import { ExportOptions } from '../types';

const API_URL = 'http://localhost:8080/api/photo';

export interface SheetGeneratorResponse {
  imageData: string;
}

/**
 * Generate a sheet of multiple ID photos with the specified layout
 * 
 * @param imageData The base64-encoded image data
 * @param exportOptions Export options (format, size, layout)
 * @returns Promise with the generated sheet image data
 */
export const generatePhotoSheet = async (
  imageData: string,
  exportOptions: ExportOptions
): Promise<string> => {
  try {
    const response = await axios.post<SheetGeneratorResponse>(
      `${API_URL}/generate-sheet`,
      {
        imageData,
        exportOptions
      }
    );
    
    return response.data.imageData;
  } catch (error) {
    console.error('Error generating photo sheet:', error);
    throw error;
  }
};

export default {
  generatePhotoSheet
};