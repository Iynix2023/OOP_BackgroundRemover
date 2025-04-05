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
  type: string; // e.g., 'suit', 'dress', 'shirt'
  color: string;
}

export interface EnhanceOptions {
  brightness: number;
  contrast: number;
  saturation: number;
}

export interface ComplianceResult {
  isCompliant: boolean;
  issues: ComplianceIssue[];
}

export interface ComplianceIssue {
  type: 'face' | 'background' | 'size' | 'quality';
  message: string;
  severity: 'warning' | 'error';
}