import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import type { Graph } from '@shared/schema';

interface GraphVisualizationProps {
  graph: Graph;
}

export function GraphVisualization({ graph }: GraphVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: {
        nodes: graph.nodes.map(node => ({
          data: { id: node.id, label: node.label }
        })),
        edges: graph.edges.map(edge => ({
          data: {
            id: `${edge.source}-${edge.target}`,
            source: edge.source,
            target: edge.target,
            label: edge.type
          }
        }))
      },
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#666',
            'label': 'data(label)',
            'color': '#fff',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '12px',
            'width': '40px',
            'height': '40px'
          } as cytoscape.Css.Node
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#999',
            'target-arrow-color': '#999',
            'target-arrow-shape': 'triangle',
            'label': 'data(label)',
            'font-size': '10px',
            'text-rotation': 'autorotate',
            'curve-style': 'bezier'
          } as cytoscape.Css.Edge
        }
      ],
      layout: {
        name: 'cose',
        idealEdgeLength: () => 100,
        nodeOverlap: 20,
        refresh: 20,
        fit: true,
        padding: 30,
        randomize: false,
        componentSpacing: 100,
        nodeRepulsion: () => 400000,
        edgeElasticity: () => 100,
        nestingFactor: 5,
        gravity: 80,
        numIter: 1000,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0
      } as cytoscape.LayoutOptions
    });

    return () => {
      cyRef.current?.destroy();
    };
  }, [graph]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-[calc(100vh-2rem)]"
    />
  );
}