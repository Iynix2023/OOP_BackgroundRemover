import React from 'react';
import { EnhanceOptions } from '../types';

interface EnhancementControlsProps {
  options: EnhanceOptions;
  onChange: (options: EnhanceOptions) => void;
}

const EnhancementControls: React.FC<EnhancementControlsProps> = ({ 
  options, 
  onChange 
}) => {
  // Handle changes with debouncing to prevent too many updates
  const handleChange = (property: keyof EnhanceOptions, value: number) => {
    // Create a new object to ensure React detects the change
    const newOptions = {
      ...options,
      [property]: value
    };
    onChange(newOptions);
  };

  // Reset all values to default
// In EnhancementControls.tsx
const handleReset = () => {
  // Create a new object to ensure React detects the change
  const resetValues = { 
    brightness: 0, 
    contrast: 0, 
    saturation: 0, 
    smoothing: 0 
  };
  
  // Directly call onChange with the reset values
  onChange(resetValues);
  
  // You might want to add a small delay to ensure UI updates first
  setTimeout(() => {
    // Force a re-processing if needed
    onChange({...resetValues});
  }, 10);
};

  // Apply auto-enhance preset
  const handleAutoEnhance = () => {
    // Conservative auto-enhance values
    const enhancedValues = { 
      brightness: 5, 
      contrast: 10, 
      saturation: 5, 
      smoothing: 20 
    };
    onChange(enhancedValues);
  };

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
        
        <div>
          <div className="flex justify-between">
            <label htmlFor="smoothing" className="text-sm text-gray-600">Skin Smoothing</label>
            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">
              {options.smoothing}%
            </span>
          </div>
          <input
            id="smoothing"
            type="range"
            min="0"
            max="100"
            step="5"
            value={options.smoothing}
            onChange={(e) => handleChange('smoothing', parseInt(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Applies gentle skin smoothing while preserving details
          </p>
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