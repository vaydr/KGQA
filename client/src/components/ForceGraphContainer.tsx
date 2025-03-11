import React, { useState, useEffect, useRef } from 'react';
import ForceDirectedGraph, { PhysicsSettings, defaultPhysicsSettings } from './ForceDirectedGraph';
import PhysicsControls from './PhysicsControls';
import type { Graph, Node, Edge } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
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
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <div className="space-y-2 p-1">
                <p className="font-medium text-sm">Graph Interactions:</p>
                <ul className="text-xs space-y-1">
                  <li><span className="font-medium">Pan:</span> Drag empty canvas area</li>
                  <li><span className="font-medium">Zoom:</span> Scroll wheel or pinch</li>
                  <li><span className="font-medium">Move node:</span> Drag any node</li>
                  <li><span className="font-medium">Group move:</span> Hold space + drag (moves all fixed nodes)</li>
                  <li><span className="font-medium">Unfix node:</span> Shift+click on node</li>
                  <li><span className="font-medium">Unfix all:</span> Shift+click on canvas</li>
                  <li><span className="font-medium">Change color:</span> Double-click on node</li>
                </ul>
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