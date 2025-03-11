import { useState, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { Graph } from '@shared/schema';
import { GraphSettings, type GraphSettings as GraphSettingsType, defaultSettings } from './graph-settings';

interface GraphViewerProps {
  graph: Graph;
}

interface ForceGraphNode {
  id: string;
  name: string;
  val: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export function GraphViewer({ graph }: GraphViewerProps) {
  const [settings, setSettings] = useState<GraphSettingsType>(defaultSettings);
  const fgRef = useRef<any>();

  // Convert Graph data to ForceGraph format
  const graphData = {
    nodes: graph.nodes.map(node => ({
      id: node.id,
      name: node.label,
      val: 1,
    })),
    links: graph.edges.map(edge => ({
      source: edge.source,
      target: edge.target,
      name: edge.type,
    }))
  };

  const handleSettingsChange = useCallback((newSettings: GraphSettingsType) => {
    setSettings(newSettings);
    if (fgRef.current) {
      const fg = fgRef.current;

      // Update force simulation parameters
      fg.d3Force('link')
        .distance(newSettings.linkDistance)
        .strength(newSettings.linkStrength);

      fg.d3Force('charge')
        .strength(newSettings.chargeStrength);

      fg.d3Force('center')
        .strength(newSettings.gravity);

      // Fixed collision radius for consistent node spacing
      fg.d3Force('collision')
        .radius(20);

      // Update simulation parameters
      fg.d3VelocityDecay(newSettings.velocityDecay);

      // Reheat the simulation to apply changes
      fg.d3ReheatSimulation();
    }
  }, []);

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 right-4 z-10">
        <GraphSettings 
          settings={settings}
          onSettingsChange={handleSettingsChange}
        />
      </div>
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        nodeLabel="name"
        linkLabel="name"
        nodeColor={() => "#6366f1"}
        linkColor={() => "#94a3b8"}
        nodeRelSize={6}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={2}
        warmupTicks={100}
        cooldownTicks={50}
        enableNodeDrag={true}
        onNodeDragEnd={(node: ForceGraphNode) => {
          // Fix node position after drag
          node.fx = node.x;
          node.fy = node.y;
        }}
        onNodeDrag={(node: ForceGraphNode) => {
          // Update position during drag
          node.fx = node.x;
          node.fy = node.y;
        }}
        onNodeDragStart={(node: ForceGraphNode) => {
          // Start dragging from current position
          node.fx = node.x;
          node.fy = node.y;
        }}
      />
    </div>
  );
}