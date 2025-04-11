import React from 'react';
import { ExportLayout } from '../types';

interface SheetLayoutPreviewProps {
  layout: ExportLayout;
  onClick: (layout: ExportLayout) => void;
  isSelected: boolean;
}

const SheetLayoutPreview: React.FC<SheetLayoutPreviewProps> = ({ 
  layout, 
  onClick, 
  isSelected 
}) => {
  // Render different layouts based on the selected type
  const renderLayoutPreview = () => {
    switch (layout) {
      case ExportLayout.SINGLE:
        return (
          <div className="w-16 h-20 bg-gray-200 border border-gray-300">
            <div className="w-full h-full bg-indigo-100"></div>
          </div>
        );
      
      case ExportLayout.GRID_2x2:
        return (
          <div className="w-16 h-20 bg-gray-200 border border-gray-300 p-1">
            <div className="grid grid-cols-2 gap-1 h-full">
              <div className="bg-indigo-100"></div>
              <div className="bg-indigo-100"></div>
              <div className="bg-indigo-100"></div>
              <div className="bg-indigo-100"></div>
            </div>
          </div>
        );
      
      case ExportLayout.GRID_4x6:
        return (
          <div className="w-16 h-20 bg-gray-200 border border-gray-300 p-1">
            <div className="grid grid-cols-4 grid-rows-6 gap-px h-full">
              {Array.from({ length: 24 }).map((_, index) => (
                <div key={index} className="bg-indigo-100"></div>
              ))}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  // Get layout name
  const getLayoutName = () => {
    switch (layout) {
      case ExportLayout.SINGLE:
        return 'Single Photo';
      case ExportLayout.GRID_2x2:
        return '2×2 Grid';
      case ExportLayout.GRID_4x6:
        return '4×6 Grid';
      default:
        return '';
    }
  };
  
  return (
    <button
      onClick={() => onClick(layout)}
      className={`flex flex-col items-center p-2 rounded-md transition-colors ${
        isSelected 
          ? 'bg-indigo-100 border border-indigo-300' 
          : 'border border-transparent hover:bg-gray-100'
      }`}
    >
      {renderLayoutPreview()}
      <span className="mt-2 text-sm">{getLayoutName()}</span>
    </button>
  );
};

export default SheetLayoutPreview;