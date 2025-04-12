import React, { useState } from "react";
import { HexColorPicker } from "react-colorful";
import { BackgroundOptions } from "../types";

interface BackgroundSelectorProps {
  onSelect: (options: BackgroundOptions) => void;
  currentBackground: BackgroundOptions;
}

const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({
  onSelect,
  currentBackground,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColor, setCustomColor] = useState("#FFFFFF");
  // Add a local state to track selected background before applying
  const [localBackground, setLocalBackground] =
    useState<BackgroundOptions>(currentBackground);

  const colorOptions = [
    { label: "White", value: "#FFFFFF" },
    { label: "Blue", value: "#3B82F6" },
    { label: "Red", value: "#EF4444" },
    { label: "Gray", value: "#9CA3AF" },
  ];

  const handleColorSelect = (color: string) => {
    // Update local state only
    setLocalBackground({ type: "color", value: color });
  };

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const imageResult = reader.result as string;
        setLocalBackground({ type: "image", value: imageResult });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color);
    setLocalBackground({ type: "color", value: color });
  };

  const handleApplyBackground = () => {
    // Only call parent handler when explicitly applying
    onSelect(localBackground);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-700">Background Options</h3>

      <div className="space-y-2">
        <p className="text-sm text-gray-600">Background Type</p>
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() =>
              setLocalBackground({ ...localBackground, type: "color" })
            }
            className={`px-3 py-1 text-sm rounded-md ${
              localBackground.type === "color"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            Solid Color
          </button>
          <button
            onClick={() =>
              setLocalBackground({ ...localBackground, type: "image" })
            }
            className={`px-3 py-1 text-sm rounded-md ${
              localBackground.type === "image"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            Image
          </button>
        </div>
      </div>

      {/* Color options when "Solid Color" is selected */}
      {localBackground.type === "color" && (
        <>
          <div className="space-y-2 w-[250px]">
            <p className="text-sm text-gray-600">Common colors</p>
            <div className="flex space-x-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleColorSelect(color.value)}
                  className={`w-10 h-10 rounded-full border-2 ${
                    localBackground.value === color.value
                      ? "border-indigo-500"
                      : "border-gray-200"
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}

              {/* Custom color button */}
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                  !colorOptions.some((c) => c.value === localBackground.value)
                    ? "border-indigo-500"
                    : "border-gray-200"
                }`}
                style={{
                  backgroundColor: !colorOptions.some(
                    (c) => c.value === localBackground.value
                  )
                    ? localBackground.value
                    : "white",
                }}
                title="Custom Color"
              >
                {!colorOptions.some(
                  (c) => c.value === localBackground.value
                ) ? (
                  <span className="text-xs">✓</span>
                ) : (
                  <span className="text-xs">+</span>
                )}
              </button>
            </div>
          </div>

          {/* Color picker */}
          {showColorPicker && (
            <div className="mt-3 p-3 border border-gray-300 rounded-md bg-white shadow-sm">
              <p className="text-sm text-gray-600 mb-2">Choose custom color</p>
              <HexColorPicker
                color={
                  !colorOptions.some((c) => c.value === localBackground.value)
                    ? localBackground.value
                    : customColor
                }
                onChange={handleCustomColorChange}
              />
              <div className="flex items-center mt-2">
                <div className="flex-1">
                  <div
                    className="w-full h-6 rounded border border-gray-300"
                    style={{ backgroundColor: customColor }}
                  />
                </div>
                <div className="ml-2">
                  <span className="text-sm font-medium">
                    {customColor.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Image upload option when "Image" is selected */}
      {localBackground.type === "image" && (
        <div className="w-[250px] space-y-2">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Custom Background Image
            </p>
            <label className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer w-full">
              <span>
                {localBackground.value &&
                localBackground.value.startsWith("data:")
                  ? "Change Image"
                  : "Upload Image"}
              </span>
              <input
                type="file"
                className="sr-only"
                accept="image/*"
                onChange={handleCustomImageUpload}
              />
            </label>
          </div>

          {/* Image preview */}
          {localBackground.value &&
            localBackground.value.startsWith("data:") && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-1">Preview</p>
                <div className="border border-gray-300 rounded-md overflow-hidden">
                  <img
                    src={localBackground.value}
                    alt="Background preview"
                    className="w-full h-auto object-cover"
                    style={{ maxHeight: "150px" }}
                  />
                </div>
              </div>
            )}
        </div>
      )}

      {/* Apply button */}
      <div>
        <button
          onClick={handleApplyBackground}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Apply Background
        </button>
      </div>
    </div>
  );
};

export default BackgroundSelector;
