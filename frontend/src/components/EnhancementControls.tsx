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
  const handleChange = (property: keyof EnhanceOptions, value: number) => {
    onChange({
      ...options,
      [property]: value
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-700">Photo Enhancement</h3>
      
      <div className="space-y-3">
        <div>
          <div className="flex justify-between">
            <label htmlFor="brightness" className="text-sm text-gray-600">Brightness</label>
            <span className="text-sm text-gray-500">{options.brightness}</span>
          </div>
          <input
            id="brightness"
            type="range"
            min="-100"
            max="100"
            value={options.brightness}
            onChange={(e) => handleChange('brightness', parseInt(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div>
          <div className="flex justify-between">
            <label htmlFor="contrast" className="text-sm text-gray-600">Contrast</label>
            <span className="text-sm text-gray-500">{options.contrast}</span>
          </div>
          <input
            id="contrast"
            type="range"
            min="-100"
            max="100"
            value={options.contrast}
            onChange={(e) => handleChange('contrast', parseInt(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div>
          <div className="flex justify-between">
            <label htmlFor="saturation" className="text-sm text-gray-600">Saturation</label>
            <span className="text-sm text-gray-500">{options.saturation}</span>
          </div>
          <input
            id="saturation"
            type="range"
            min="-100"
            max="100"
            value={options.saturation}
            onChange={(e) => handleChange('saturation', parseInt(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div>
          <div className="flex justify-between">
            <label htmlFor="smoothing" className="text-sm text-gray-600">Skin Smoothing</label>
            <span className="text-sm text-gray-500">{options.smoothing}</span>
          </div>
          <input
            id="smoothing"
            type="range"
            min="0"
            max="100"
            value={options.smoothing}
            onChange={(e) => handleChange('smoothing', parseInt(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
      
      <button
        onClick={() => onChange({ brightness: 0, contrast: 0, saturation: 0, smoothing: 0 })}
        className="text-sm text-indigo-600 hover:text-indigo-800"
      >
        Reset to Default
      </button>
    </div>
  );
};

export default EnhancementControls;