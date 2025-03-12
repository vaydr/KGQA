import React, { forwardRef } from 'react';
import type { Graph } from '@shared/schema';
import ForceGraphContainer, { ForceGraphContainerRef } from './ForceGraphContainer';

interface GraphViewerProps {
  graph: Graph;
}

export const GraphViewer = forwardRef<ForceGraphContainerRef, GraphViewerProps>(
  ({ graph }, ref) => {
    return (
      <div className="w-full h-full">
        <ForceGraphContainer 
          ref={ref}
          graph={graph} 
          useSampleData={false}
        />
      </div>
    );
  }
);