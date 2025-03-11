import { useState, useRef, useCallback, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { Graph } from '@shared/schema';
import { GraphSettings, type GraphSettings as GraphSettingsType, defaultSettings } from './graph-settings';
import { ForceLink, ForceCenter, ForceManyBody, Simulation } from 'd3-force';

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

interface D3ForceSimulation extends Simulation<ForceGraphNode, undefined> {
  force(name: string): any;
}

export function GraphViewer({ graph }: GraphViewerProps) {
  const [settings, setSettings] = useState<GraphSettingsType>(defaultSettings);
  const fgRef = useRef<any>();
  const simulationRef = useRef<D3ForceSimulation | null>(null);

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

  // Update force simulation when settings change
  useEffect(() => {
    if (!simulationRef.current) return;

    const simulation = simulationRef.current;

    // Update link force
    const linkForce = simulation.force('link') as ForceLink<ForceGraphNode, undefined>;
    if (linkForce) {
      linkForce
        .distance(settings.linkDistance)
        .strength(settings.linkStrength);
    }

    // Update charge force
    const chargeForce = simulation.force('charge') as ForceManyBody<ForceGraphNode>;
    if (chargeForce) {
      chargeForce.strength(settings.chargeStrength * -100);
    }

    // Update center force
    const centerForce = simulation.force('center') as ForceCenter<ForceGraphNode>;
    if (centerForce) {
      centerForce.strength(settings.gravity);
    }

    // Update simulation parameters
    simulation.velocityDecay(settings.velocityDecay);
    simulation.alpha(1).restart();

  }, [settings]);

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
        onNodeDrag={(node: ForceGraphNode) => {
          node.fx = node.x;
          node.fy = node.y;
        }}
        onNodeDragEnd={(node: ForceGraphNode) => {
          node.fx = node.x;
          node.fy = node.y;
        }}
        d3Force={(d3: D3ForceSimulation) => {
          // Store simulation reference for later updates
          simulationRef.current = d3;

          // Initial force setup
          const linkForce = d3.force('link') as ForceLink<ForceGraphNode, undefined>;
          if (linkForce) {
            linkForce
              .distance(settings.linkDistance)
              .strength(settings.linkStrength);
          }

          const chargeForce = d3.force('charge') as ForceManyBody<ForceGraphNode>;
          if (chargeForce) {
            chargeForce.strength(settings.chargeStrength * -100);
          }

          const centerForce = d3.force('center') as ForceCenter<ForceGraphNode>;
          if (centerForce) {
            centerForce.strength(settings.gravity);
          }

          d3.velocityDecay(settings.velocityDecay);
        }}
      />
    </div>
  );
}