import React from 'react';
import type { Graph } from '@shared/schema';
import ForceGraphContainer from './ForceGraphContainer';

interface GraphViewerProps {
  graph: Graph;
}

export function GraphViewer({ graph }: GraphViewerProps) {
  return (
    <div className="w-full h-full">
      <ForceGraphContainer 
        graph={graph} 
        useSampleData={true} // Always use sample data with 30% edge density
      />
    </div>
  );
}