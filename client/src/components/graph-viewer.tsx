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
      const d3 = fg.d3Force();

      // Update link force
      d3.force('link')
        .distance(newSettings.linkDistance)
        .strength(newSettings.linkStrength);

      // Update charge force (repulsion between nodes)
      d3.force('charge')
        .strength(newSettings.chargeStrength * -100); // Make repulsion stronger and negative

      // Update center force (gravity towards center)
      d3.force('center')
        .strength(newSettings.gravity);

      // Update decay
      d3.velocityDecay(newSettings.velocityDecay);

      // Reheat and restart the simulation
      d3.alpha(1).restart();
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
        onNodeDrag={(node: ForceGraphNode) => {
          node.fx = node.x;
          node.fy = node.y;
        }}
        onNodeDragEnd={(node: ForceGraphNode) => {
          node.fx = node.x;
          node.fy = node.y;
        }}
        onEngineStop={() => {
          // Once the simulation stops, update all forces with current settings
          const d3 = fgRef.current?.d3Force();
          if (d3) {
            d3.force('link')
              .distance(settings.linkDistance)
              .strength(settings.linkStrength);
            d3.force('charge')
              .strength(settings.chargeStrength * -100);
            d3.force('center')
              .strength(settings.gravity);
            d3.velocityDecay(settings.velocityDecay);
          }
        }}
        d3Force={(d3) => {
          // Initialize forces with default settings
          d3.force('link')
            .distance(settings.linkDistance)
            .strength(settings.linkStrength);
          d3.force('charge')
            .strength(settings.chargeStrength * -100);
          d3.force('center')
            .strength(settings.gravity);
          d3.velocityDecay(settings.velocityDecay);
        }}
      />
    </div>
  );
}