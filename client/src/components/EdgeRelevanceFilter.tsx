import React, { useState, useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface EdgeRelevanceFilterProps {
  colorScheme: string;
  onChange: (minFrac: number, maxFrac: number) => void;
  width?: number;
}

const EdgeRelevanceFilter: React.FC<EdgeRelevanceFilterProps> = ({
  colorScheme = 'default',
  onChange,
  width = 200
}) => {
  const [minFrac, setMinFrac] = useState(0);
  const [maxFrac, setMaxFrac] = useState(1);
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);
  const [tooltipValue, setTooltipValue] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const gradientRef = useRef<HTMLDivElement>(null);
  
  // Helper function to get color from scheme
  const getColorFromScheme = (value: number): string => {
    // Default blue gradient
    if (colorScheme === 'default') {
      return d3.interpolateBlues(value);
    }
    
    // Use the color schemes matching the node color schemes
    switch (colorScheme) {
      case 'viridis': return d3.interpolateViridis(value);
      case 'plasma': return d3.interpolatePlasma(value);
      case 'inferno': return d3.interpolateInferno(value);
      case 'magma': return d3.interpolateMagma(value);
      case 'rainbow': return d3.interpolateRainbow(value);
      case 'turbo': return d3.interpolateTurbo(value);
      case 'cividis': return d3.interpolateCividis(value);
      default: return d3.interpolateBlues(value);
    }
  };
  
  // Generate the gradient from the chosen color scheme
  useEffect(() => {
    if (!gradientRef.current) return;
    
    // Create a gradient with 20 steps
    const gradientElements = [];
    for (let i = 0; i < 20; i++) {
      const value = i / 19;
      const color = getColorFromScheme(value);
      const div = document.createElement('div');
      div.style.backgroundColor = color;
      div.style.width = `${100 / 20}%`;
      div.style.height = '100%';
      gradientElements.push(div);
    }
    
    // Set the gradient
    gradientRef.current.innerHTML = '';
    const fragment = document.createDocumentFragment();
    gradientElements.forEach(div => {
      fragment.appendChild(div);
    });
    gradientRef.current.appendChild(fragment);
  }, [colorScheme]);
  
  // Handle mouse move during dragging
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newFrac = Math.max(0, Math.min(1, x / width));
    
    // Update the appropriate handle position
    if (isDragging === 'min') {
      if (newFrac <= maxFrac) {
        setMinFrac(newFrac);
        // Call onChange immediately for dynamic updates
        onChange(newFrac, maxFrac);
      }
    } else if (isDragging === 'max') {
      if (newFrac >= minFrac) {
        setMaxFrac(newFrac);
        // Call onChange immediately for dynamic updates
        onChange(minFrac, newFrac);
      }
    }
    
    // Show tooltip with the current value
    setTooltipValue(newFrac);
    setTooltipPos(x);
  };
  
  // Handle mouse up - stop dragging
  const handleMouseUp = () => {
    if (isDragging) {
      // No need to call onChange here since we're already calling it during drag
      setIsDragging(null);
      setTooltipValue(null);
    }
  };
  
  // Add and remove event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, minFrac, maxFrac]);
  
  return (
    <div className="relative" style={{ width: `${width}px` }}>
      <div className="text-xs font-medium mb-1 text-gray-700">Edge Relevance Filter</div>
      
      {/* Main container for the gradient and handles */}
      <div 
        ref={containerRef}
        className="relative h-6 rounded overflow-hidden border border-gray-300"
        style={{ width: `${width}px` }}
      >
        {/* Gradient */}
        <div 
          ref={gradientRef}
          className="absolute inset-0 flex"
        />
        
        {/* Gray overlay for filtered out areas */}
        <div 
          className="absolute inset-0 left-0 bg-gray-500 bg-opacity-70"
          style={{ width: `${minFrac * 100}%` }}
        />
        <div 
          className="absolute inset-0 right-0 bg-gray-500 bg-opacity-70"
          style={{ 
            left: `${maxFrac * 100}%`, 
            width: `${(1 - maxFrac) * 100}%` 
          }}
        />
        
        {/* Min handle */}
        <div
          className="absolute top-0 bottom-0 w-2 bg-white border border-gray-400 cursor-ew-resize shadow-sm"
          style={{ left: `${minFrac * 100}%`, transform: 'translateX(-50%)' }}
          onMouseDown={() => setIsDragging('min')}
        />
        
        {/* Max handle */}
        <div
          className="absolute top-0 bottom-0 w-2 bg-white border border-gray-400 cursor-ew-resize shadow-sm"
          style={{ left: `${maxFrac * 100}%`, transform: 'translateX(-50%)' }}
          onMouseDown={() => setIsDragging('max')}
        />
      </div>
      
      {/* Labels for min/max values */}
      <div className="flex justify-between mt-1 text-xs text-gray-500">
        <span>{minFrac.toFixed(2)}</span>
        <span>{maxFrac.toFixed(2)}</span>
      </div>
      
      {/* Tooltip */}
      {tooltipValue !== null && (
        <div 
          className="absolute bg-black text-white text-xs py-1 px-2 rounded pointer-events-none"
          style={{
            left: tooltipPos,
            bottom: '100%',
            transform: 'translateX(-50%)',
            marginBottom: '4px'
          }}
        >
          {tooltipValue.toFixed(2)}
        </div>
      )}
    </div>
  );
};

export default EdgeRelevanceFilter; 