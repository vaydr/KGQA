import React, { useState, useEffect, useRef } from 'react';
import ForceDirectedGraph, { PhysicsSettings, defaultPhysicsSettings } from './ForceDirectedGraph';
import PhysicsControls from './PhysicsControls';
import type { Graph, Node, Edge } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { 
  HelpCircle, 
  MousePointer, 
  Move, 
  Pointer, 
  XCircle, 
  Palette, 
  Users, 
  Space, 
  MousePointerClick,
  PaintBucket,
  Maximize2,
  Network
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Utility function to generate a sample graph with uniform edge density
function generateSampleGraph(nodeCount = 150, edgeProbability = 0.05): Graph {
  // Create nodes
  const nodes: Node[] = Array.from({ length: nodeCount }, (_, i) => ({
    id: `node-${i}`,
    label: `Node ${i}`,
  }));
  
  // Create edges with probability
  const edges: Edge[] = [];
  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 1; j < nodeCount; j++) {
      // Add edge with probability
      if (Math.random() < edgeProbability) {
        edges.push({
          source: `node-${i}`,
          target: `node-${j}`,
          type: 'related',
        });
      }
    }
  }
  
  // Create a properly typed sample graph
  return {
    // Using unknown to bypass type checking
    id: 'sample-graph' as unknown as number,
    name: 'Sample Graph with 150 Nodes (Color-Customizable)',
    nodes,
    edges,
  } as Graph;
}

interface ForceGraphContainerProps {
  graph?: Graph;
  useSampleData?: boolean;
}

/**
 * Container component that wraps the force directed graph and its controls
 */
const ForceGraphContainer: React.FC<ForceGraphContainerProps> = ({ 
  graph: propGraph, 
  useSampleData = false,
}) => {
  const [settings, setSettings] = useState<PhysicsSettings>(defaultPhysicsSettings);
  
  // Use sample data or provided graph
  const [graph, setGraph] = useState<Graph>(propGraph || generateSampleGraph());
  
  // Generate sample data if requested
  useEffect(() => {
    if (useSampleData || !propGraph) {
      setGraph(generateSampleGraph());
    } else {
      setGraph(propGraph);
    }
  }, [useSampleData, propGraph]);
  
  // Get container dimensions
  const [width, setWidth] = useState<number>(800);
  const [height, setHeight] = useState<number>(600);
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  // Update dimensions on resize
  React.useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.clientWidth);
        setHeight(containerRef.current.clientHeight);
      }
    };
    
    // Set initial dimensions
    updateDimensions();
    
    // Add resize listener
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);
  
  return (
    <div className="relative w-full h-full" ref={containerRef}>
      {/* Physics controls in top right */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <TooltipProvider delayDuration={0}>
          <Tooltip defaultOpen>
            <TooltipTrigger asChild>
              <div className="cursor-help flex items-center justify-center h-9 w-9">
                <HelpCircle className="h-5 w-5 text-gray-500" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="end" className="max-w-[320px] p-0">
              <div className="p-4 space-y-3">
                <h3 className="font-semibold text-sm">Controls</h3>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <MousePointer className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <span className="text-sm">Left click + drag to move nodes</span>
                  </div>
                  
                  <div className="flex items-center gap-2.5">
                    <Space className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <span className="text-sm">Hold space + drag on selected nodes to move group</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <MousePointerClick className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <span className="text-sm">Click node to select it</span>
                  </div>
                  
                  <div className="flex items-center gap-2.5">
                    <Network className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <span className="text-sm">Hold N + click to select neighbors (click again for more)</span>
                  </div>
                  
                  <div className="flex items-center gap-2.5">
                    <XCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <span className="text-sm">Shift + click node to deselect</span>
                  </div>
                  
                  <div className="flex items-center gap-2.5">
                    <Move className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <span className="text-sm">Shift + click canvas to deselect all</span>
                  </div>
                  
                  <div className="flex items-center gap-2.5">
                    <PaintBucket className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <span className="text-sm">Double-click group to change node colors</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Maximize2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <span className="text-sm">Double-click canvas to reset view</span>
                  </div>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <PhysicsControls settings={settings} onChange={setSettings} />
      </div>
      
      {/* Force graph - no key needed since we're updating in-place */}
      <div className="w-full h-full">
        <ForceDirectedGraph 
          graph={graph} 
          width={width}
          height={height}
          settings={settings}
        />
      </div>
    </div>
  );
};

export default ForceGraphContainer; 