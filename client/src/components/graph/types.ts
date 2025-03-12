import * as d3 from 'd3';
import { Graph } from '@shared/schema';

// --- Physics settings types ---
export interface PhysicsSettings {
  linkDistance: number;
  linkStrength: number;
  chargeStrength: number;
  gravity: number;
  velocityDecay: number;
  edgeThickness: number;
  nodeRadius: number;
  colorScheme: string;
  edgeColorScheme: string;
  communityDetection: string;
}

// Convert to a function that returns the default settings to make it compatible with Fast Refresh
export const getDefaultPhysicsSettings = (): PhysicsSettings => ({
  linkDistance: 30,
  linkStrength: 0.2,
  chargeStrength: -50,
  gravity: 0.05,
  velocityDecay: 0.5,
  edgeThickness: 0.5,
  nodeRadius: 5,
  colorScheme: 'default',
  edgeColorScheme: 'default',
  communityDetection: 'none',
});

// --- Internal graph data types ---
export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  r: number;
  color: string;
  isSelected: boolean;
  isHighlighted: boolean;
  tooltipText?: string;
}

// Interface for links with additional properties for the visualization
export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: GraphNode | string;
  target: GraphNode | string;
  type?: string;
  color?: string;
  edgeIndex?: number;
  length?: number;
  relevanceScore: number;
  isHighlighted?: boolean;
  highlightLabel?: string;
}

// Define the ref types for external access
export interface ForceGraphRef {
  highlightPath: (
    extractedEdges: string[],
    clauses?: Array<{entity1: string, relation: string, entity2: string}>,
    entityExamples?: Record<string, string>
  ) => void;
}

// --- Component props ---
export interface ForceDirectedGraphProps {
  graph: Graph;
  width?: number;
  height?: number;
  settings?: PhysicsSettings;
  onSettingsChange?: (settings: PhysicsSettings) => void;
  edgeFilterRange?: [number, number];
}

// Interface for color picker state
export interface ColorPickerState {
  isOpen: boolean;
  nodeIndex: number;
  position: { x: number; y: number };
  color: string;
}

// Interface for neighborhood selection state
export interface NeighborhoodSelection {
  sourceNodeId: string | null;
  currentDepth: number;
}

// Interface for exact-layer selection state
export interface ExactLayerSelection {
  sourceNodeId: string | null;
  currentLayer: number;
} 