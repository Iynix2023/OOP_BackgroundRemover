export interface ProcessedImage {
  id: string;
  originalUrl: string;
  processedUrl: string;
  status: 'processing' | 'completed' | 'failed';
  actions: ImageAction[];
  currentActionIndex: number;
}

export interface ImageAction {
  type: 'crop' | 'resize' | 'background' | 'clothes' | 'enhance';
  params: Record<string, any>;
  timestamp: number;
}

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BackgroundOptions {
  type: 'color' | 'image' | 'transparent';
  value: string; // color code or image URL
}

export interface ClothesOptions {
  type: 'suit' | 'shirt' | 'blouse' | 'none';
  color: string;
}

export interface EnhanceOptions {
  brightness: number;
  contrast: number;
  saturation: number;
}

export interface ComplianceIssue {
  type: 'face' | 'background' | 'size' | 'quality';
  message: string;
  severity: 'warning' | 'error';
}

export interface ComplianceResult {
  isCompliant: boolean;
  issues: ComplianceIssue[] | string[]; // Accept both formats for backwards compatibility
}

// Export-related types
export enum ExportFormat {
  JPEG = 'JPEG',
  PNG = 'PNG'
}

export enum ExportSize {
  STANDARD_35x45 = 'STANDARD_35x45',      // Singapore NRIC/Passport
  US_PASSPORT_2x2 = 'US_PASSPORT_2x2',    // US Passport/Visa
  CHINA_VISA = 'CHINA_VISA',              // China Visa
  MALAYSIA_PASSPORT = 'MALAYSIA_PASSPORT', // Malaysia Visa/Passport
  AUSTRALIA_VISA = 'AUSTRALIA_VISA',      // Australia Visa
  INDIA_PASSPORT = 'INDIA_PASSPORT',      // Indian Passport/Visa
  SMU_ID = 'SMU_ID',                      // SMU Student ID
  CUSTOM = 'CUSTOM'                       // Custom size
}
export enum ExportLayout {
  SINGLE = 'SINGLE',
  GRID_2x2 = 'GRID_2x2',
  GRID_4x6 = 'GRID_4x6'
}

export interface ExportOptions {
  format: ExportFormat;
  size: ExportSize;
  layout: ExportLayout;
}