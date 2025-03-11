import React, { useState, useRef, useEffect } from 'react';
import { X, Check } from 'lucide-react';

interface NodeColorPickerProps {
  position: { x: number, y: number };
  initialColor: string;
  onColorChange: (color: string) => void;
  onClose: () => void;
}

// Convert hex color to RGB
const hexToRgb = (hex: string): { r: number, g: number, b: number } => {
  // Default color if parsing fails
  const defaultColor = { r: 100, g: 100, b: 255 };
  
  try {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : defaultColor;
  } catch (e) {
    console.error('Error parsing hex color', e);
    return defaultColor;
  }
};

// Convert RGB to hex color
const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map(x => {
    const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

// Simple vertical slider component
interface ColorSliderProps {
  color: string;
  value: number; 
  onChange: (value: number) => void;
}

const ColorSlider: React.FC<ColorSliderProps> = ({ color, value, onChange }) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const height = 100; // Smaller height for more compact display
  
  // Calculate thumb position from value (0-255)
  const thumbPosition = height - (value / 255 * height);
  
  // Handle mouse down on the slider track
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    
    // Calculate new value based on click position
    const rect = sliderRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const newValue = Math.round(255 * (1 - Math.min(Math.max(0, y), height) / height));
    onChange(Math.max(0, Math.min(255, newValue)));
    
    setIsDragging(true);
  };
  
  // Handle mouse move while dragging
  useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!sliderRef.current) return;
      
      const rect = sliderRef.current.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const newValue = Math.round(255 * (1 - Math.min(Math.max(0, y), height) / height));
      onChange(Math.max(0, Math.min(255, newValue)));
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onChange]);
  
  return (
    <div 
      ref={sliderRef}
      className="h-[100px] w-full relative rounded overflow-hidden border border-gray-300 cursor-pointer"
      onMouseDown={handleMouseDown}
    >
      {/* Background gradient */}
      <div 
        className="absolute inset-0" 
        style={{ background: `linear-gradient(to bottom, ${color}, rgb(0,0,0))` }}
      />
      
      {/* Slider thumb */}
      <div 
        className="absolute w-full h-3 flex items-center pointer-events-none" 
        style={{ top: `${thumbPosition}px` }}
      >
        <div className="h-1 w-full bg-white opacity-30"></div>
        <div className="absolute h-3 w-3 rounded-full bg-white border border-gray-400 left-1/2 transform -translate-x-1/2 shadow-sm"></div>
      </div>
    </div>
  );
};

const NodeColorPicker: React.FC<NodeColorPickerProps> = ({
  position,
  initialColor,
  onColorChange,
  onClose,
}) => {
  // Parse initial RGB values from hex color
  const initialRgb = hexToRgb(initialColor);
  
  // RGB state
  const [red, setRed] = useState(initialRgb.r);
  const [green, setGreen] = useState(initialRgb.g);
  const [blue, setBlue] = useState(initialRgb.b);
  
  // Current hex color
  const hexColor = rgbToHex(red, green, blue);
  
  const pickerRef = useRef<HTMLDivElement>(null);
  
  // Handle clicks outside the picker to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  // Apply new color and close
  const handleApply = () => {
    onColorChange(hexColor);
    onClose();
  };
  
  // Position the picker slightly offset from the node
  const pickerStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${position.x + 15}px`,
    top: `${position.y - 15}px`,
    zIndex: 1000,
  };

  // Handle number input changes
  const handleNumberInput = (
    setter: React.Dispatch<React.SetStateAction<number>>
  ) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value >= 0 && value <= 255) {
      setter(value);
    }
  };
  
  return (
    <div 
      ref={pickerRef}
      className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 w-[200px]"
      style={pickerStyle}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center">
          <div className="w-4 h-4 rounded border border-gray-300 mr-1" style={{ backgroundColor: hexColor }}></div>
          <div className="text-xs font-mono">{hexColor}</div>
        </div>
        <div className="flex space-x-1">
          <button 
            className="p-0.5 hover:bg-gray-100 rounded"
            onClick={handleApply}
            title="Apply color"
          >
            <Check size={12} className="text-green-600" />
          </button>
          <button 
            className="p-0.5 hover:bg-gray-100 rounded"
            onClick={onClose}
            title="Cancel"
          >
            <X size={12} className="text-gray-600" />
          </button>
        </div>
      </div>
      
      {/* RGB sliders */}
      <div className="flex space-x-2">
        {/* Red channel */}
        <div className="flex-1">
          <ColorSlider 
            color="rgb(255,0,0)" 
            value={red} 
            onChange={setRed} 
          />
          <div className="flex items-center mt-0.5">
            <span className="text-[10px] text-red-700 font-bold mr-1">R</span>
            <input 
              type="number" 
              min="0" 
              max="255" 
              value={red}
              onChange={handleNumberInput(setRed)}
              className="w-full text-[10px] p-0.5 border border-gray-300 rounded"
            />
          </div>
        </div>
        
        {/* Green channel */}
        <div className="flex-1">
          <ColorSlider 
            color="rgb(0,255,0)" 
            value={green} 
            onChange={setGreen} 
          />
          <div className="flex items-center mt-0.5">
            <span className="text-[10px] text-green-700 font-bold mr-1">G</span>
            <input 
              type="number" 
              min="0" 
              max="255" 
              value={green}
              onChange={handleNumberInput(setGreen)}
              className="w-full text-[10px] p-0.5 border border-gray-300 rounded"
            />
          </div>
        </div>
        
        {/* Blue channel */}
        <div className="flex-1">
          <ColorSlider 
            color="rgb(0,0,255)" 
            value={blue} 
            onChange={setBlue} 
          />
          <div className="flex items-center mt-0.5">
            <span className="text-[10px] text-blue-700 font-bold mr-1">B</span>
            <input 
              type="number" 
              min="0" 
              max="255" 
              value={blue}
              onChange={handleNumberInput(setBlue)}
              className="w-full text-[10px] p-0.5 border border-gray-300 rounded"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeColorPicker; 