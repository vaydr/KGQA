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
        d3Force={(d3) => {
          // Configure link force with constant functions
          const linkForce = d3.force('link');
          if (linkForce) {
            linkForce
              .distance(settings.linkDistance)
              .strength(settings.linkStrength);
          }

          // Configure charge force (node repulsion)
          const chargeForce = d3.force('charge');
          if (chargeForce) {
            chargeForce.strength(settings.chargeStrength * -100);
          }

          // Configure center force
          const centerForce = d3.force('center');
          if (centerForce) {
            centerForce.strength(settings.gravity);
          }

          // Set simulation parameters
          d3.velocityDecay(settings.velocityDecay);

          // Reheat simulation
          d3.alpha(1).restart();
        }}
        onNodeDrag={(node: ForceGraphNode) => {
          node.fx = node.x;
          node.fy = node.y;
        }}
        onNodeDragEnd={(node: ForceGraphNode) => {
          node.fx = node.x;
          node.fy = node.y;
        }}
      />
    </div>
  );
}