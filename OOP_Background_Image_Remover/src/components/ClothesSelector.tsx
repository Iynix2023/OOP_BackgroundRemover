import React from 'react';
import { ClothesOptions } from '../types';

interface ClothesSelectorProps {
  onSelect: (options: ClothesOptions) => void;
  currentClothes: ClothesOptions;
}

const ClothesSelector: React.FC<ClothesSelectorProps> = ({ 
  onSelect, 
  currentClothes 
}) => {
  const clothesTypes = [
    { label: 'Business Suit', value: 'suit' },
    { label: 'Formal Shirt', value: 'shirt' },
    { label: 'Blouse', value: 'blouse' },
    { label: 'Dress', value: 'dress' },
  ];

  const colorOptions = [
    { label: 'Black', value: '#000000' },
    { label: 'Navy', value: '#0A192F' },
    { label: 'Gray', value: '#6B7280' },
    { label: 'White', value: '#FFFFFF' },
    { label: 'Blue', value: '#3B82F6' },
  ];

  const handleTypeSelect = (type: string) => {
    onSelect({ ...currentClothes, type });
  };

  const handleColorSelect = (color: string) => {
    onSelect({ ...currentClothes, color });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-700">Clothes Options</h3>
      
      <div className="space-y-2">
        <p className="text-sm text-gray-600">Clothes Type</p>
        <div className="grid grid-cols-2 gap-2">
          {clothesTypes.map((item) => (
            <button
              key={item.value}
              onClick={() => handleTypeSelect(item.value)}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                currentClothes.type === item.value
                  ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm text-gray-600">Color</p>
        <div className="flex flex-wrap gap-2">
          {colorOptions.map((color) => (
            <button
              key={color.value}
              onClick={() => handleColorSelect(color.value)}
              className={`w-8 h-8 rounded-full border-2 ${
                currentClothes.color === color.value
                  ? 'border-indigo-500'
                  : 'border-gray-200'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.label}
            />
          ))}
        </div>
      </div>
      
      <div className="pt-2">
        <p className="text-xs text-gray-500 italic">
          Note: Clothes replacement requires a clear face and upper body in the image
        </p>
      </div>
    </div>
  );
};

export default ClothesSelector;