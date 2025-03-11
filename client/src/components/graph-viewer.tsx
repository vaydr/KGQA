import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import { createCytoscapeConfig, highlightPath } from '@/lib/cytoscape-utils';
import type { Graph, Question } from '@shared/schema';

interface GraphViewerProps {
  graph: Graph;
  highlightedPath?: Question;
}

export function GraphViewer({ graph, highlightedPath }: GraphViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const config = createCytoscapeConfig(
      graph.nodes,
      graph.edges,
      containerRef.current
    );

    cyRef.current = cytoscape(config);

    return () => {
      cyRef.current?.destroy();
    };
  }, [graph]);

  useEffect(() => {
    if (!cyRef.current || !highlightedPath) return;

    highlightPath(
      cyRef.current,
      highlightedPath.subgraphNodeIds,
      highlightedPath.reasoningPath
    );
  }, [highlightedPath]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full"
    />
  );
}
