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
            'background-color': '#6366f1',
            'label': 'data(label)',
            'color': '#000000',
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
            'line-color': '#94a3b8',
            'target-arrow-color': '#94a3b8',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-size': '10px',
            'text-rotation': 'autorotate'
          } as cytoscape.Css.Edge
        }
      ],
      layout: {
        name: 'cose',
        // More natural physics simulation
        animate: true,
        refresh: 30,
        randomize: true,
        componentSpacing: 150,
        nodeRepulsion: () => 6000,
        idealEdgeLength: () => 120,
        edgeElasticity: () => 200,
        gravity: 40,
        // More iterations for better stabilization
        numIter: 2000,
        initialTemp: 250,
        coolingFactor: 0.97,
        minTemp: 0.5,
        // Prevent overlapping
        nodeOverlap: 30,
        padding: 50,
        fit: true
      } as cytoscape.LayoutOptions
    });

    // Enable drag-and-drop for nodes
    cyRef.current.on('dragfree', 'node', function(evt) {
      const node = evt.target;
      node.lock(); // Lock position after drag
    });

    // Double-click to unlock node
    cyRef.current.on('dblclick', 'node', function(evt) {
      const node = evt.target;
      node.unlock();
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