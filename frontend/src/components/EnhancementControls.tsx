import React, { useCallback } from 'react';
import { EnhanceOptions } from '../types';
import imageProcessingService from '../services/imageProcessingService';

// Add preEnhancementImage as a prop
interface EnhancementControlsProps {
  options: EnhanceOptions;
  onChange: (options: EnhanceOptions) => void;
  preEnhancementImage: string | null;
}

// Update the component props
const EnhancementControls: React.FC<EnhancementControlsProps> = ({ 
  options, 
  onChange,
  preEnhancementImage
}) => {
  // Use debounced change handler to prevent too many updates
  const handleChange = useCallback((property: keyof EnhanceOptions, value: number) => {
    // Include a timestamp to ensure each change is treated as unique
    const newOptions = {
      ...options,
      [property]: value,
      _timestamp: Date.now() // This forces the parent to treat the object as new
    };
    onChange(newOptions);
  }, [options, onChange]);

  // Reset all values to default
  const handleReset = useCallback(() => {
    const resetValues = { 
      brightness: 0, 
      contrast: 0, 
      saturation: 0, 
      _timestamp: Date.now() // This ensures reset is treated as a new change
    };
    onChange(resetValues);
  }, [onChange]);

  // Update the auto-enhance function
  const handleAutoEnhance = useCallback(async () => {
    if (!preEnhancementImage) return;
    
    try {
      // Show loading state
      const loadingValues = { 
        brightness: 0, 
        contrast: 0, 
        saturation: 0,
        _timestamp: Date.now(),
        _loading: true // Add a loading flag
      };
      onChange(loadingValues);
      
      // Analyze the image
      const enhancedValues = await imageProcessingService.analyzeImage(preEnhancementImage);
      
      // Apply the recommended values
      onChange({
        ...enhancedValues,
        _timestamp: Date.now()
      });
    } catch (error) {
      console.error('Auto-enhance failed:', error);
      // Fall back to default values
      const defaultValues = { 
        brightness: 5, 
        contrast: 10, 
        saturation: 5,
        _timestamp: Date.now()
      };
      onChange(defaultValues);
    }
  }, [preEnhancementImage, onChange]);


  return (
    <div className="space-y-4 border rounded-lg p-4 bg-white">
      <h3 className="font-medium text-gray-700">Photo Enhancement</h3>
      
      <div className="space-y-3">
        <div>
          <div className="flex justify-between">
            <label htmlFor="brightness" className="text-sm text-gray-600">Brightness</label>
            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">
              {options.brightness > 0 ? `+${options.brightness}` : options.brightness}
            </span>
          </div>
          <input
            id="brightness"
            type="range"
            min="-50"
            max="50"
            step="5"
            value={options.brightness}
            onChange={(e) => handleChange('brightness', parseInt(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div>
          <div className="flex justify-between">
            <label htmlFor="contrast" className="text-sm text-gray-600">Contrast</label>
            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">
              {options.contrast > 0 ? `+${options.contrast}` : options.contrast}
            </span>
          </div>
          <input
            id="contrast"
            type="range"
            min="-50"
            max="50"
            step="5"
            value={options.contrast}
            onChange={(e) => handleChange('contrast', parseInt(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div>
          <div className="flex justify-between">
            <label htmlFor="saturation" className="text-sm text-gray-600">Saturation</label>
            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">
              {options.saturation > 0 ? `+${options.saturation}` : options.saturation}
            </span>
          </div>
          <input
            id="saturation"
            type="range"
            min="-50"
            max="50"
            step="5"
            value={options.saturation}
            onChange={(e) => handleChange('saturation', parseInt(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
      
      <div className="flex space-x-2 pt-2">
        <button
          type="button"
          onClick={handleReset}
          className="text-sm text-gray-600 hover:text-gray-800 border px-2 py-1 rounded"
        >
          Reset All
        </button>
        <button
          type="button"
          onClick={handleAutoEnhance}
          className="text-sm text-white bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded"
        >
          Auto Enhance
        </button>
      </div>
    </div>
  );
};

export default EnhancementControls;