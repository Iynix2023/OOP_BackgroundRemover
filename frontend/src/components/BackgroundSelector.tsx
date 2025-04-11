import React from 'react';
import { BackgroundOptions } from '../types';

interface BackgroundSelectorProps {
  onSelect: (options: BackgroundOptions) => void;
  currentBackground: BackgroundOptions;
}

const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({ 
  onSelect, 
  currentBackground 
}) => {
  const colorOptions = [
    { label: 'White', value: '#FFFFFF' },
    { label: 'Blue', value: '#3B82F6' },
    { label: 'Red', value: '#EF4444' },
    { label: 'Gray', value: '#9CA3AF' },
  ];

  const handleColorSelect = (color: string) => {
    onSelect({ type: 'color', value: color });
  };

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        onSelect({ type: 'image', value: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTransparentSelect = () => {
    onSelect({ type: 'transparent', value: 'transparent' });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-700">Background Options</h3>
      
      <div className="space-y-2">
        <p className="text-sm text-gray-600">Apply a background color</p>
        <div className="flex space-x-2">
          {colorOptions.map((color) => (
            <button
              key={color.value}
              onClick={() => handleColorSelect(color.value)}
              className={`w-10 h-10 rounded-full border-2 ${
                currentBackground.type === 'color' && currentBackground.value === color.value
                  ? 'border-indigo-500'
                  : 'border-gray-200'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.label}
            />
          ))}
        </div>
      </div>
      
      {/* <div>
        <p className="text-sm text-gray-600 mb-2">Custom Background</p>
        <label className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
          <span>Upload Image</span>
          <input
            type="file"
            className="sr-only"
            accept="image/*"
            onChange={handleCustomImageUpload}
          />
        </label>
      </div>
      
      <div>
        <button
          onClick={handleTransparentSelect}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            currentBackground.type === 'transparent'
              ? 'bg-indigo-100 text-indigo-700'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Transparent Background
        </button>
      </div> */}
    </div>
  );
};

export default BackgroundSelector;