import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as d3 from 'd3';
// Import d3 color scales - using d3's built-in interpolate functions if available
// Fallback implementations if d3-scale-chromatic is not available
const d3ColorScales = {
  // Seaborn-equivalent color palettes as arrays of hex colors
  // These are hardcoded to match Seaborn palettes exactly
  
  // Viridis palette (perceptually uniform)
  viridis: [
    "#440154", "#481567", "#482677", "#453781", "#404788", "#39568C", "#33638D", 
    "#2D708E", "#287D8E", "#238A8D", "#1F968B", "#20A387", "#29AF7F", "#3CBB75", 
    "#55C667", "#73D055", "#95D840", "#B8DE29", "#DCE319", "#FDE725"
  ],
  
  // Plasma palette
  plasma: [
    "#0D0887", "#41049D", "#6A00A8", "#8F0DA4", "#B12A90", "#CB4678", "#E16462", 
    "#F1834B", "#FCA636", "#FCCD25", "#F0F921"
  ],
  
  // Inferno palette
  inferno: [
    "#000004", "#160B39", "#420A68", "#6A176E", "#932667", "#BC3754", "#DD513A", 
    "#F37819", "#FCA50A", "#F6D746", "#FCFFA4"
  ],
  
  // Magma palette
  magma: [
    "#000004", "#140E36", "#3B0F70", "#641A80", "#8C2981", "#B5367A", "#DE4968", 
    "#F66E5B", "#FD9F6C", "#FDCD90", "#FBFCBF"
  ],
  
  // Rainbow palette (spectral, not perceptually uniform but matches Seaborn)
  rainbow: [
    "#6E40AA", "#8F3F99", "#AE4283", "#C74570", "#D84C5B", "#E25A49", "#E47037", 
    "#E08D2A", "#D3A81F", "#BFC01D", "#A6D71E", "#88DD28", "#69DF45", "#4EDF69", 
    "#37DF8D", "#2CDEB0", "#2BDAD2", "#34D1ED", "#4BC9F2", "#6ABFEF", "#8BB4E8", 
    "#A9A9DC", "#C29DCE", "#D691BE", "#E387AE"
  ],
  
  // Turbo palette (alternative to jet/rainbow)
  turbo: [
    "#23171B", "#271A28", "#2B1C38", "#2F1E49", "#32205A", "#34236B", "#36257D", 
    "#36278E", "#36299F", "#342CB0", "#322FC0", "#2E32CF", "#2A36DD", "#2539E9", 
    "#1F3CF4", "#193FFE", "#1C43EF", "#2347DF", "#2C4ACD", "#374DBC", "#4150AB", 
    "#4B539A", "#555689", "#5E5978", "#675C68", "#6F5F58", "#776248", "#7E6538", 
    "#856829", "#8B6B1A", "#916D0C", "#967001", "#9B7200", "#A07400", "#A47700", 
    "#A97A00", "#AE7D00", "#B28000", "#B98305", "#BF8609", "#C6890D", "#CC8C11", 
    "#D28F15", "#D89218", "#DE951C", "#E49820", "#EA9B24", "#EF9E27", "#F4A12B", 
    "#F9A42F", "#FDA734", "#FEA938", "#FEAC3C", "#FEAF40", "#FEB244", "#FEB548", 
    "#FEB84C", "#FEBB50", "#FEBE54", "#FEC157", "#FEC45B", "#FEC75F", "#FECA63", 
    "#FECD66", "#FED06A", "#FED36E", "#FED672", "#FED976", "#FEDC7A", "#FEDF7D", 
    "#FEE281", "#FEE585", "#FEE889", "#FEEB8D", "#FEEE91", "#FEF195", "#FEF499", 
    "#FEF69D", "#FEF9A1", "#FEFCA5", "#FDFDFA"
  ],
  
  // Cividis (colorblind-friendly)
  cividis: [
    "#00204C", "#00214E", "#002250", "#002251", "#002353", "#002355", "#002456", 
    "#002558", "#00265A", "#00275B", "#00285D", "#00295E", "#002A5F", "#002B61", 
    "#002C62", "#002D63", "#002E64", "#002F65", "#003066", "#003167", "#003268", 
    "#003369", "#00346A", "#00356B", "#00366C", "#00376C", "#00386D", "#00396E", 
    "#003A6E", "#003B6F", "#003C70", "#003D70", "#003E71", "#003F71", "#004072", 
    "#004172", "#004273", "#004373", "#004473", "#004574", "#004674", "#004775", 
    "#004875", "#004975", "#004A76", "#004B76", "#004C76", "#004D77", "#004E77", 
    "#004F77", "#005078", "#005178", "#005278", "#005378", "#005479", "#005579", 
    "#005679", "#005779", "#00587A", "#00597A", "#005A7A", "#005B7A", "#005C7A", 
    "#005D7B", "#005E7B", "#005F7B", "#01617B", "#02627B", "#03637B", 
    "#04647B", "#05657B", "#06667B", "#07677B", "#08687B", "#09697B", "#0A6A7B", 
    "#0B6B7B", "#0C6C7B", "#0D6D7B", "#0E6E7B", "#0F6F7B", "#10707B", "#11717B", 
    "#12727B", "#13737B", "#14747B", "#15757B", "#16767A", "#17777A", "#18787A", 
    "#19797A", "#1A7A7A", "#1B7B7A", "#1C7C7A", "#1D7D7A", "#1E7E7A", "#1F7F79", 
    "#208079", "#218179", "#228279", "#238378", "#248478", "#258578", "#268677", 
    "#278777", "#288876", "#298976", "#2A8A75", "#2B8B75", "#2C8C74", "#2D8D74", 
    "#2E8E73", "#2F8F72", "#308F72", "#319071", "#329170", "#339270", "#34936F", 
    "#35946E", "#36956D", "#37966D", "#38976C", "#39986B", "#3A996A", "#3B9A69", 
    "#3C9B68", "#3D9C67", "#3E9D66", "#3F9E65", "#409F64", "#41A063", "#42A162", 
    "#43A261", "#44A35F", "#45A45E", "#46A55D", "#47A65C", "#48A75A", "#49A859", 
    "#4AA957", "#4BAA56", "#4CAB55", "#4DAC53", "#4EAD52", "#4FAE50", "#50AF4F", 
    "#51B04D", "#52B14C", "#53B24A", "#54B349", "#56B447", "#57B546", "#58B644", 
    "#59B743", "#5AB741", "#5BB840", "#5CB93E", "#5DBA3D", "#5FBB3B", "#60BC3A", 
    "#61BD38", "#62BE37", "#63BF35", "#65C034", "#66C132", "#67C231", "#68C32F", 
    "#69C42E", "#6BC52C", "#6CC62B", "#6DC729", "#70C926", "#71CA25", "#72CB23", 
    "#73CC22", "#75CD21", "#76CE1F", "#77CF1E", "#79D01C", "#7AD11B", "#7BD21A", 
    "#7CD319", "#7ED417", "#7FD516", "#80D615", "#82D714", "#83D813", "#84D911", 
    "#86DA10", "#87DB0F", "#88DC0E", "#8ADD0D", "#8BDE0C", "#8CDF0B", "#8EE00A", 
    "#8FE109", "#90E308", "#92E407", "#93E506", "#94E606", "#96E705", "#97E804", 
    "#98E904", "#9AEA03", "#9BEB02", "#9DEC02", "#9EED01", "#9FEE01", "#A1EF00", 
    "#A2F000", "#A3F100", "#A5F200", "#A6F300", "#A8F400", "#A9F500", "#AAF600", 
    "#ACF700", "#ADF800", "#AEF900", "#B0FA00", "#B1FB00", "#B3FC00", "#B4FD00", 
    "#B6FE00", "#B7FF00"
  ],
  
  // Restore the interpolation function interfaces to maintain compatibility
  interpolateViridis: (t: number): string => {
    const index = Math.min(Math.floor(t * d3ColorScales.viridis.length), d3ColorScales.viridis.length - 1);
    return d3ColorScales.viridis[index];
  },
  
  interpolatePlasma: (t: number): string => {
    const index = Math.min(Math.floor(t * d3ColorScales.plasma.length), d3ColorScales.plasma.length - 1);
    return d3ColorScales.plasma[index];
  },
  
  interpolateInferno: (t: number): string => {
    const index = Math.min(Math.floor(t * d3ColorScales.inferno.length), d3ColorScales.inferno.length - 1);
    return d3ColorScales.inferno[index];
  },
  
  interpolateMagma: (t: number): string => {
    const index = Math.min(Math.floor(t * d3ColorScales.magma.length), d3ColorScales.magma.length - 1);
    return d3ColorScales.magma[index];
  },
  
  interpolateRainbow: (t: number): string => {
    const index = Math.min(Math.floor(t * d3ColorScales.rainbow.length), d3ColorScales.rainbow.length - 1);
    return d3ColorScales.rainbow[index];
  },
  
  interpolateTurbo: (t: number): string => {
    const index = Math.min(Math.floor(t * d3ColorScales.turbo.length), d3ColorScales.turbo.length - 1);
    return d3ColorScales.turbo[index];
  },
  
  interpolateCividis: (t: number): string => {
    const index = Math.min(Math.floor(t * d3ColorScales.cividis.length), d3ColorScales.cividis.length - 1);
    return d3ColorScales.cividis[index];
  }
};

// Try to use d3-scale-chromatic if available
try {
  const d3ScaleChromatic = require('d3-scale-chromatic');
  if (d3ScaleChromatic) {
    console.log("Using d3-scale-chromatic for color palettes");
    // We're now going to keep our custom Seaborn palettes instead of using d3's
  }
} catch (e) {
  console.warn("d3-scale-chromatic not available, using Seaborn-like color palettes");
  console.info("To use original d3 color scales, install d3-scale-chromatic:");
  console.info("npm install d3-scale-chromatic");
}

import { Graph } from '@shared/schema';
import NodeColorPicker from './NodeColorPicker';

// --- Physics settings types ---
export interface PhysicsSettings {
  linkDistance: number;
  linkStrength: number;
  chargeStrength: number;
  gravity: number;
  velocityDecay: number;
  edgeThickness: number; // New setting for edge thickness
  nodeRadius: number;    // New setting for node radius
  colorScheme: string;   // Color scheme for node coloring
  communityDetection: string; // Community detection algorithm
}

// Convert to a function that returns the default settings to make it compatible with Fast Refresh
export const getDefaultPhysicsSettings = (): PhysicsSettings => ({
  linkDistance: 30,    // Smaller default for larger graphs
  linkStrength: 0.2,   // Slightly weaker links
  chargeStrength: -50, // Less repulsion
  gravity: 0.05,       // Less gravity
  velocityDecay: 0.5,  // More damping
  edgeThickness: 0.5,  // Default edge thickness
  nodeRadius: 5,       // Default node radius
  colorScheme: 'default', // Default color scheme
  communityDetection: 'none', // No community detection by default
});

// Keep this for backward compatibility
export const defaultPhysicsSettings = getDefaultPhysicsSettings();

// --- Internal graph data types ---
interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  r: number;
  color: string;
  isSelected: boolean; // Always use this as the single source of truth for selection
  isHighlighted: boolean; // For special highlighting of path nodes
  tooltipText?: string; // For showing entity examples as tooltips
}

interface GraphLink {
  source: any;
  target: any;
  type: string;
  isHighlighted: boolean; // For special highlighting of path edges
  highlightLabel?: string; // For showing the edge type as a tooltip
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
interface ForceDirectedGraphProps {
  graph: Graph;
  width?: number;
  height?: number;
  settings?: PhysicsSettings;
  onSettingsChange?: (settings: PhysicsSettings) => void;
}

// Interface for color picker state
interface ColorPickerState {
  isOpen: boolean;
  nodeIndex: number; // Index of the node being edited
  position: { x: number; y: number };
  color: string;
}

// Interface for neighborhood selection state
interface NeighborhoodSelection {
  sourceNodeId: string | null;
  currentDepth: number;
}

// Interface for exact-layer selection state
interface ExactLayerSelection {
  sourceNodeId: string | null;
  currentLayer: number;
}

// Convert to forwardRef component to expose methods
const ForceDirectedGraph = forwardRef<ForceGraphRef, ForceDirectedGraphProps>(({
  graph,
  width = 800,
  height = 600,
  settings = defaultPhysicsSettings,
  onSettingsChange,
}, ref) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, undefined> | null>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  
  // State for the color picker
  const [colorPicker, setColorPicker] = useState<ColorPickerState>({
    isOpen: false,
    nodeIndex: -1,
    position: { x: 0, y: 0 },
    color: '#6366f1',
  });
  
  // Track key state for different selection modes
  const isSpacePressed = useRef(false);
  const isNPressed = useRef(false);
  const isMPressed = useRef(false);
  
  // Track neighborhood selection state
  const neighborhoodSelection = useRef<NeighborhoodSelection>({
    sourceNodeId: null,
    currentDepth: 0
  });
  
  // Track exact layer selection state for M key
  const exactLayerSelection = useRef<ExactLayerSelection>({
    sourceNodeId: null,
    currentLayer: 0
  });
  
  // Reference to store graph elements for updates
  const gRef = useRef<any>(null);
  const linksRef = useRef<any>(null);
  const nodesRef = useRef<any>(null);
  const labelsRef = useRef<any>(null);
  const linkLabelsRef = useRef<any>(null); // Reference for edge labels

  // Convert graph data to D3 format
  useEffect(() => {
    // Transform nodes
    const nodeData: GraphNode[] = graph.nodes.map(node => ({
      id: node.id,
      label: node.label,
      r: 5, // Smaller nodes for larger graphs
      color: '#6366f1', // Default color - will be overridden by color scheme
      isSelected: false,
      isHighlighted: false
    }));

    // Transform links
    const linkData = graph.edges.map(edge => ({
      source: edge.source,
      target: edge.target,
      type: edge.type,
      isHighlighted: false,
      highlightLabel: edge.type
    }));

    // Apply color scheme if we have settings
    let coloredNodes = nodeData;
    if (settings && settings.colorScheme) {
      coloredNodes = applyColorScheme(nodeData, settings.colorScheme, settings.communityDetection || 'none');
    }

    setNodes(coloredNodes);
    setLinks(linkData);
  }, [graph, settings.colorScheme, settings.communityDetection]);

  // Handle keyboard events at component level
  useEffect(() => {
    // Reference to the SVG element
    const svgElement = svgRef.current;
    if (!svgElement) return;
    
    // Create a ref to track if mouse is over the graph
    const isMouseOverGraph = { current: false };
    
    // Mouse enter/leave handlers to track mouse position
    const handleMouseEnter = () => {
      isMouseOverGraph.current = true;
    };
    
    const handleMouseLeave = () => {
      isMouseOverGraph.current = false;
    };
    
    // Only handle key events when mouse is over the graph or SVG is focused
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isMouseOverGraph.current) {
        if (e.code === 'Space') {
          e.preventDefault(); // Prevent scrolling ONLY when mouse is over graph
          isSpacePressed.current = true;
        } else if (e.code === 'KeyN') {
          e.preventDefault(); // Prevent typing 'n' in inputs when over graph
          isNPressed.current = true;
        } else if (e.code === 'KeyM') {
          e.preventDefault(); // Prevent typing 'm' in inputs when over graph
          isMPressed.current = true;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressed.current = false;
      } else if (e.code === 'KeyN') {
        isNPressed.current = false;
      } else if (e.code === 'KeyM') {
        isMPressed.current = false;
      }
    };

    // Add handlers to track mouse position relative to the graph
    svgElement.addEventListener('mouseenter', handleMouseEnter);
    svgElement.addEventListener('mouseleave', handleMouseLeave);
    
    // Add listeners to window for key events
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      // Clean up all event listeners
      svgElement.removeEventListener('mouseenter', handleMouseEnter);
      svgElement.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Initialize the visualization once
  useEffect(() => {
    if (!nodes.length || !svgRef.current) return;

    // Clear previous simulation
    d3.select(svgRef.current).selectAll('*').remove();

    // Set up SVG with zoom
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'max-width: 100%; height: auto;');
    
    // Add zoom behavior
    const zoomHandler = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      })
      // Explicitly disable D3's default double-click zoom behavior
      .filter(event => !(event.type === 'dblclick'));
    
    svg.call(zoomHandler);
    
    // Create a group for all elements that should be zoomed
    const g = svg.append('g');
    gRef.current = g;
    
    // Performance optimization: create quadtree for collision detection
    const quadtree = d3.quadtree<GraphNode>()
      .x(d => d.x || 0)
      .y(d => d.y || 0)
      .addAll(nodes);
    
    // Create the simulation with current settings
    const sim = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>()
        .id((d: GraphNode) => d.id)
        .links(links)
        .distance(settings.linkDistance)
        .strength(settings.linkStrength))
      .force('charge', d3.forceManyBody<GraphNode>()
        .strength(settings.chargeStrength)
        .distanceMax(300) // Limit the range of repulsion
        .theta(0.9)) // Higher theta for performance
      .force('center', d3.forceCenter<GraphNode>(width / 2, height / 2)
        .strength(settings.gravity))
      .velocityDecay(settings.velocityDecay)
      .alphaDecay(0.02); // Faster cooling for large graphs
    
    simulationRef.current = sim;

    // Draw links - use lines for better performance with large datasets
    const link = g.append('g')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', settings.edgeThickness) // Use edgeThickness setting
      .attr('stroke-opacity', 0.6) // More transparent
      .selectAll('line')
      .data(links)
      .join('line');
    
    linksRef.current = link;

    // Draw nodes - use smaller circles for large graphs
    const node = g.append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', (d: GraphNode) => settings.nodeRadius) // Use nodeRadius setting
      .attr('fill', (d: GraphNode) => d.color)
      .attr('fill-opacity', 0.8) // Slightly transparent
      .attr('stroke', (d: GraphNode) => d.isSelected ? '#000000' : 'none') // Use isSelected for stroke
      .attr('stroke-width', 1.5);
    
    nodesRef.current = node;

    // ---- SIMPLIFIED DRAG BEHAVIOR ----
    // Create a map to store initial positions of nodes being group-dragged
    const dragStartPositions = new Map<string, { x: number, y: number }>();
    
    function dragstarted(event: any, d: GraphNode) {
      // Prevent zoom panning during drag
      event.sourceEvent.stopPropagation();
      
      if (!event.active) sim.alphaTarget(0.3).restart();
      
      // Mark the node as selected and fix its position
      d.isSelected = true;
      
      // Make sure it has fixed coordinates
      if (d.x !== undefined && d.y !== undefined) {
        d.fx = d.x;
        d.fy = d.y;
      }

      // Update visual selection indicator
      d3.select(event.sourceEvent.target)
        .attr('stroke', '#000000')
        .attr('stroke-width', 1.5);
        
      // If this is a node we've previously used for neighborhood selection,
      // reset that state to avoid confusion
      if (neighborhoodSelection.current.sourceNodeId === d.id && 
          !isNPressed.current) {
        neighborhoodSelection.current.currentDepth = 0;
      }
      
      // Store initial positions of all selected nodes when space is pressed
      // This helps avoid the teleporting issue with M and N key selections
      if (isSpacePressed.current) {
        dragStartPositions.clear();
        
        // Save initial positions of all selected nodes
        nodes.forEach(node => {
          if (node.isSelected) {
            // Make sure the node has defined coordinates
            const x = node.fx !== undefined && node.fx !== null 
              ? node.fx 
              : (node.x !== undefined && node.x !== null ? node.x : 0);
            const y = node.fy !== undefined && node.fy !== null 
              ? node.fy 
              : (node.y !== undefined && node.y !== null ? node.y : 0);
            
            // Store the initial position
            dragStartPositions.set(node.id, { x, y });
            
            // Also ensure all selected nodes have their positions fixed
            if (node.fx === undefined || node.fy === undefined) {
              node.fx = node.x || 0;
              node.fy = node.y || 0;
            }
          }
        });
      }
    }
    
    function dragged(event: any, d: GraphNode) {
      // Get the current x,y position from the D3 event
      const currentX = event.x;
      const currentY = event.y;
      
      // Always update the dragged node first
      d.fx = currentX;
      d.fy = currentY;
      
      // Group movement with space key
      if (isSpacePressed.current) {
        // Get the initial position of the dragged node
        const startPos = dragStartPositions.get(d.id);
        if (!startPos) return;
        
        // Calculate the total offset from the original position
        const totalDeltaX = currentX - startPos.x;
        const totalDeltaY = currentY - startPos.y;
        
        // Move all selected nodes EXCEPT the one we're directly dragging
        nodes.forEach(node => {
          if (node.id === d.id) return; // Skip the node we're directly dragging
          
          // Only move nodes that are part of the selection
          if (node.isSelected) {
            // Get this node's start position from our map
            const nodeStartPos = dragStartPositions.get(node.id);
            if (!nodeStartPos) return;
            
            // Apply the same total delta from the original position
            node.fx = (nodeStartPos.x + totalDeltaX) as number;
            node.fy = (nodeStartPos.y + totalDeltaY) as number;
          }
        });
      }
    }
    
    function dragended(event: any, d: GraphNode) {
      if (!event.active) sim.alphaTarget(0);
      
      // Keep the node fixed at its final position (already selected)
      d.fx = event.x;
      d.fy = event.y;
      
      // Clear the drag start positions
      if (isSpacePressed.current) {
        dragStartPositions.clear();
      }
    }
    
    // Apply the drag behavior
    node.call(
      d3.drag<SVGCircleElement, GraphNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any
    );

    // Add node click handler with neighborhood selection functionality
    node.on('click', (event: any, d: GraphNode) => {
      // Check if shift key is pressed for deselection
      if (event.sourceEvent?.shiftKey || event.shiftKey) {
        // Use event.stopPropagation() directly if it's a native event
        if (event.stopPropagation) {
          event.stopPropagation();
        } else if (event.sourceEvent?.stopPropagation) {
          event.sourceEvent.stopPropagation();
        }
        
        // Unselect this node (SOURCE OF TRUTH)
        d.isSelected = false;
        
        // Reset the neighborhood selection state for this node
        if (neighborhoodSelection.current.sourceNodeId === d.id) {
          neighborhoodSelection.current.currentDepth = 0;
        }
        
        // Then clear fixed position as a result of selection change
        d.fx = null;
        d.fy = null;
        
        // Update visual indicator
        d3.select(event.currentTarget || event.target)
          .attr('stroke', 'none');
        
        // Restart with higher energy for this node
        sim.alpha(0.3).restart();
      }
      // Check if N key is pressed for neighborhood selection
      else if (isNPressed.current) {
        // Stop event propagation
        if (event.stopPropagation) {
          event.stopPropagation();
        } else if (event.sourceEvent?.stopPropagation) {
          event.sourceEvent.stopPropagation();
        }
        
        // Get the clicked node's ID
        const clickedNodeId = d.id;
        
        // If the node is not currently selected, or if it's a different node than the last one,
        // reset the depth counter to start fresh
        if (!d.isSelected || neighborhoodSelection.current.sourceNodeId !== clickedNodeId) {
          neighborhoodSelection.current = {
            sourceNodeId: clickedNodeId,
            currentDepth: 1  // Start with depth 1 (immediate neighbors)
          };
        } else {
          // Only increment depth if we're continuing with the same selected node
          neighborhoodSelection.current.currentDepth += 1;
        }
        
        // Find and select the node's neighborhood up to the current depth
        selectNodeNeighborhood(clickedNodeId, neighborhoodSelection.current.currentDepth);
        
        // Update simulation with a gentle reheat
        sim.alpha(0.2).restart();
      }
      // Check if M key is pressed for exact layer selection
      else if (isMPressed.current) {
        // Stop event propagation
        if (event.stopPropagation) {
          event.stopPropagation();
        } else if (event.sourceEvent?.stopPropagation) {
          event.sourceEvent.stopPropagation();
        }
        
        // Get the clicked node's ID
        const clickedNodeId = d.id;
        
        // If the node is not currently selected, or if it's a different node than the last one,
        // reset the layer counter to start fresh
        if (!d.isSelected || exactLayerSelection.current.sourceNodeId !== clickedNodeId) {
          exactLayerSelection.current = {
            sourceNodeId: clickedNodeId,
            currentLayer: 1  // Start with layer 1 (immediate neighbors)
          };
        } else {
          // Increment layer if continuing with the same node
          exactLayerSelection.current.currentLayer += 1;
        }
        
        // Select only nodes at exactly the specified layer
        selectExactLayer(clickedNodeId, exactLayerSelection.current.currentLayer);
        
        // Update simulation with a gentle reheat
        sim.alpha(0.2).restart();
      }
    });

    // SVG shift+click to unfix/deselect all nodes
    svg.on('click', (event: MouseEvent) => {
      if (event.shiftKey) {
        // Reset all selection states
        neighborhoodSelection.current = {
          sourceNodeId: null,
          currentDepth: 0
        };
        
        exactLayerSelection.current = {
          sourceNodeId: null,
          currentLayer: 0
        };
      
        // Deselect all nodes (SOURCE OF TRUTH)
        nodes.forEach(node => {
          node.isSelected = false;
          // Then clear fixed positions
          node.fx = null;
          node.fy = null;
        });
        
        // Remove all selection indicators for nodes
        d3.selectAll('circle')
          .attr('stroke', 'none');
        
        // Also reset any highlighting - this will update all visual elements
        resetHighlighting();
        
        // Restart with higher energy
        sim.alpha(0.5).restart();
        
        // Prevent other click handlers
        event.stopPropagation();
        if (event.preventDefault) event.preventDefault();
      }
    });

    // Helper function to fit the graph to the viewport
    const fitGraphToView = () => {
      if (!nodes.length) return;
      
      // Get bounds of all nodes
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
      nodes.forEach(node => {
        if (node.x === undefined || node.y === undefined) return;
        
        minX = Math.min(minX, node.x - node.r);
        minY = Math.min(minY, node.y - node.r);
        maxX = Math.max(maxX, node.x + node.r);
        maxY = Math.max(maxY, node.y + node.r);
      });
      
      // Add padding
      const padding = 40;
      minX -= padding;
      minY -= padding;
      maxX += padding;
      maxY += padding;
      
      // Calculate dimensions and scale
      const graphWidth = maxX - minX;
      const graphHeight = maxY - minY;
      
      // Calculate the scale to fit the graph in the viewport
      const scaleX = width / graphWidth;
      const scaleY = height / graphHeight;
      const scale = Math.min(scaleX, scaleY, 2); // Limit max zoom to 2x for initial view
      
      // Calculate center of the graph
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      
      // Transform to center and fit the graph
      const transform = d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(scale)
        .translate(-centerX, -centerY);
      
      return transform;
    };
    
    // Apply initial fit after layout has stabilized
    sim.on('end', () => {
      // Wait a bit for the simulation to settle, then fit to view
      setTimeout(() => {
        const transform = fitGraphToView();
        if (transform) {
          svg.transition().duration(750).call(zoomHandler.transform, transform);
        }
      }, 300);
    });
    
    // Create a function for resetting zoom that can be called directly
    const resetZoom = () => {
      const transform = fitGraphToView();
      if (transform) {
        // Apply the transform with a smooth transition
        svg.transition().duration(750).call(zoomHandler.transform, transform);
      }
    };
    
    // Clear any existing dblclick listeners to avoid conflicts
    svg.on("dblclick.zoom", null);
    
    // Add double-click to fit view - directly on the SVG element
    svg.on("dblclick", (event) => {
      // Only reset if the click is on the background, not on a node
      const target = event.target as Element;
      if (target === svgRef.current || target.tagName === 'svg' || target.tagName === 'g') {
        event.preventDefault();
        event.stopPropagation();
        resetZoom();
      }
    });

    // Make sure node double-clicks don't trigger the canvas double-click
    node.on('dblclick', function(event: any, d: GraphNode) {
      // Prevent event bubbling to avoid triggering the zoom reset
      event.stopPropagation();
      event.preventDefault();
      
      // Find node index in array
      const nodeIndex = nodes.findIndex(n => n.id === d.id);
      
      // Get the current color from the node
      const currentColor = d.color || '#6366f1';
      
      // Set color picker state
      setColorPicker({
        isOpen: true,
        nodeIndex,
        position: { x: event.pageX, y: event.pageY },
        color: currentColor,
      });
    });
    
    // For performance, only show labels when zoomed in
    const labels = g.append('g')
      .attr('display', 'none') // Hide initially
      .selectAll('text')
      .data(nodes)
      .join('text')
      .text((d: GraphNode) => d.label)
      .attr('font-size', '8px') // Smaller font
      .attr('dx', 6)  // Position closer to node
      .attr('dy', 3)
      .attr('fill', '#374151')
      .attr('pointer-events', 'none'); // Don't interfere with interactions
    
    labelsRef.current = labels;

    // Show labels only when zoomed in
    zoomHandler.on('zoom.labels', (event) => {
      const scale = event.transform.k;
      labels.attr('display', scale > 1.5 ? null : 'none');
    });

    // Update tick function to also reflect selection and highlighting state
    sim.on('tick', () => {
      link
        .attr('x1', (d: GraphLink) => (d.source as any).x)
        .attr('y1', (d: GraphLink) => (d.source as any).y)
        .attr('x2', (d: GraphLink) => (d.target as any).x)
        .attr('y2', (d: GraphLink) => (d.target as any).y);

      node
        .attr('cx', (d: GraphNode) => d.x!)
        .attr('cy', (d: GraphNode) => d.y!)
        .attr('stroke', (d: GraphNode) => {
          if (d.isHighlighted) return '#000000';
          return d.isSelected ? '#000000' : 'none';
        })
        .attr('stroke-width', (d: GraphNode) => d.isHighlighted ? 3 : 1.5);

      labels
        .attr('x', (d: GraphNode) => d.x!)
        .attr('y', (d: GraphNode) => d.y!);
        
      // Update edge label positions
      if (linkLabelsRef.current) {
        linkLabelsRef.current
          .attr('x', (d: GraphLink) => {
            const source = d.source as any;
            const target = d.target as any;
            return (source.x + target.x) / 2;
          })
          .attr('y', (d: GraphLink) => {
            const source = d.source as any;
            const target = d.target as any;
            return (source.y + target.y) / 2;
          });
      }
      
      // Update node tooltip positions
      if (gRef.current) {
        try {
          // First, try to find the tooltip container
          const tooltipContainer = d3.select(gRef.current).select('.tooltip-container');
          if (!tooltipContainer.empty()) {
            // If container exists, select all tooltips within it
            tooltipContainer.selectAll('.node-tooltip')
              .attr('transform', function() {
                // Get the node data directly from the element
                const d = d3.select(this).datum() as GraphNode;
                if (d && d.x !== undefined && d.y !== undefined) {
                  return `translate(${d.x},${d.y - 20})`;
                }
                return '';
              });
          }
        } catch (e) {
          // If there's an error, silently continue - tooltips aren't critical
          console.debug("Error updating tooltips:", e);
        }
      }
      
      // Update quadtree for performance
      quadtree
        .x(d => d.x || 0)
        .y(d => d.y || 0);
    });

    // Initial zoom to fit all nodes
    svg.call(zoomHandler);
    
    // Start with a higher alpha for initial layout
    sim.alpha(0.5).restart();

    // Cleanup function
    return () => {
      sim.stop();
      if (svgRef.current) {
        d3.select(svgRef.current).on("dblclick", null);
      }
    };
  }, [nodes, links, width, height]);

  // Update simulation parameters when settings change - without recreating the graph
  useEffect(() => {
    if (!simulationRef.current) return;
    
    const sim = simulationRef.current;
    
    // Smoothly update all force parameters
    // 1. Update link force
    const linkForce = sim.force('link') as d3.ForceLink<GraphNode, GraphLink>;
    if (linkForce) {
      linkForce
        .distance(settings.linkDistance)
        .strength(settings.linkStrength);
    }
    
    // 2. Update charge force
    const chargeForce = sim.force('charge') as d3.ForceManyBody<GraphNode>;
    if (chargeForce) {
      chargeForce.strength(settings.chargeStrength);
    }
    
    // 3. Update center gravity
    const centerForce = sim.force('center') as d3.ForceCenter<GraphNode>;
    if (centerForce) {
      centerForce.strength(settings.gravity);
    }
    
    // 4. Update simulation parameters
    sim.velocityDecay(settings.velocityDecay);
    
    // 5. Update visual elements
    if (nodesRef.current) {
      nodesRef.current.attr('r', settings.nodeRadius);
    }
    
    if (linksRef.current) {
      linksRef.current.attr('stroke-width', settings.edgeThickness);
    }
    
    // Gently reheat the simulation for a smooth transition
    sim.alpha(0.3).restart();
    
    console.log("Updated physics parameters:", settings);
  }, [
    settings.linkDistance, 
    settings.linkStrength, 
    settings.chargeStrength, 
    settings.gravity, 
    settings.velocityDecay, 
    settings.edgeThickness, 
    settings.nodeRadius
  ]);
  
  // Handle color scheme and community detection changes separately
  useEffect(() => {
    if (!nodes.length) return;
    
    console.log("Updating color scheme:", settings.colorScheme, settings.communityDetection);
    
    // Apply color scheme to nodes
    const coloredNodes = applyColorScheme([...nodes], settings.colorScheme, settings.communityDetection);
    setNodes(coloredNodes);
    
    // Update node colors in the DOM
    if (nodesRef.current) {
      nodesRef.current.attr('fill', (d: GraphNode) => d.color);
    }
    
    // Gently reheat simulation if needed
    if (simulationRef.current) {
      simulationRef.current.alpha(0.1).restart();
    }
  }, [settings.colorScheme, settings.communityDetection, nodes.length]);

  // Function to handle color change from the color picker
  const handleNodeColorChange = (newColor: string) => {
    if (colorPicker.nodeIndex < 0 || colorPicker.nodeIndex >= nodes.length) return;
    
    // Get the clicked node
    const clickedNode = nodes[colorPicker.nodeIndex];
    
    // Find which nodes should be updated based ONLY on their selection state
    let nodesToUpdate: GraphNode[] = [];
    
    // If the double-clicked node is selected AND there are other selected nodes,
    // change all selected nodes as a group
    const hasSelectedNodesGroup = nodes.some(n => n.isSelected && n !== clickedNode);
    
    if (clickedNode.isSelected && hasSelectedNodesGroup) {
      // Change color of all selected nodes as a group
      nodesToUpdate = nodes.filter(node => node.isSelected);
    } else {
      // Just change the double-clicked node, and select it if not already
      if (!clickedNode.isSelected) {
        clickedNode.isSelected = true;
        
        // Update visual selection indicator
        if (nodesRef.current) {
          const nodeIdx = nodes.findIndex(n => n.id === clickedNode.id);
          if (nodeIdx >= 0) {
            d3.select(nodesRef.current.nodes()[nodeIdx])
              .attr('stroke', '#000000')
              .attr('stroke-width', 1.5);
          }
        }
        
        // Fix its position to mark as selected
        clickedNode.fx = clickedNode.x || 0;
        clickedNode.fy = clickedNode.y || 0;
      }
      
      nodesToUpdate = [clickedNode];
    }
    
    if (nodesRef.current) {
      try {
        // Update colors in the DOM
        nodesToUpdate.forEach(nodeToUpdate => {
          const nodeIdx = nodes.findIndex(n => n.id === nodeToUpdate.id);
          if (nodeIdx >= 0) {
            // Update DOM element color
            d3.select(nodesRef.current.nodes()[nodeIdx])
              .attr('fill', newColor);
            
            // Update data model
            nodeToUpdate.color = newColor;
          }
        });
        
        // Small visual refresh
        if (simulationRef.current) {
          simulationRef.current.alpha(0.1).restart();
        }
      } catch (err) {
        console.error("Error updating node colors:", err);
      }
    }
  };

  // Close the color picker
  const handleCloseColorPicker = () => {
    setColorPicker(prev => ({ ...prev, isOpen: false }));
  };

  /**
   * Selects all nodes within a specified graph distance from a source node
   */
  const selectNodeNeighborhood = (sourceNodeId: string, depth: number) => {
    if (!nodes.length || !links.length) return;
    
    // Find the source node
    const sourceNode = nodes.find(n => n.id === sourceNodeId);
    if (!sourceNode) return;
    
    // Always select the source node first
    sourceNode.isSelected = true;
    
    // Only fix the position if it's not already fixed
    if (sourceNode.fx === undefined || sourceNode.fy === undefined) {
      // Make sure the node has actual coordinates before fixing
      if (sourceNode.x !== undefined && sourceNode.y !== undefined) {
        sourceNode.fx = sourceNode.x;
        sourceNode.fy = sourceNode.y;
      }
    }
    
    // Update visual selection indicator for source node
    if (nodesRef.current) {
      const sourceNodeIdx = nodes.findIndex(n => n.id === sourceNodeId);
      if (sourceNodeIdx >= 0) {
        d3.select(nodesRef.current.nodes()[sourceNodeIdx])
          .attr('stroke', '#000000')
          .attr('stroke-width', 1.5);
      }
    }
    
    // If depth is 0, we're done - just select the source node
    if (depth === 0) return;
    
    // Build the adjacency list only once
    const adjacencyList = buildAdjacencyList();
    
    // Find all nodes at each depth level up to the target depth
    const nodesByDepth = findNodesAtDepths(sourceNodeId, depth, adjacencyList);
    
    // Select and fix all nodes at each depth level
    for (let i = 1; i <= depth; i++) {
      const nodesAtThisDepth = nodesByDepth.get(i) || new Set<string>();
      
      for (const nodeId of Array.from(nodesAtThisDepth)) {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) continue;
        
        // Mark as selected
        node.isSelected = true;
        
        // Fix position only if it's not already fixed
        if (node.fx === undefined || node.fy === undefined) {
          // Make sure the node has actual coordinates before fixing
          if (node.x !== undefined && node.y !== undefined) {
            node.fx = node.x;
            node.fy = node.y;
          }
        }
        
        // Update visual selection indicator
        if (nodesRef.current) {
          const nodeIdx = nodes.findIndex(n => n.id === nodeId);
          if (nodeIdx >= 0) {
            d3.select(nodesRef.current.nodes()[nodeIdx])
              .attr('stroke', '#000000')
              .attr('stroke-width', 1.5);
          }
        }
      }
    }
  }

  // Helper function to build the adjacency list
  function buildAdjacencyList() {
    const adjList = new Map<string, Set<string>>();
    
    // Initialize all nodes in the adjacency list
    nodes.forEach(node => {
      adjList.set(node.id, new Set<string>());
    });
    
    // Add edges to the adjacency list (undirected graph)
    links.forEach(link => {
      const source = typeof link.source === 'object' ? link.source.id : link.source;
      const target = typeof link.target === 'object' ? link.target.id : link.target;
      
      // Add both directions (undirected graph)
      adjList.get(source)?.add(target);
      adjList.get(target)?.add(source);
    });
    
    return adjList;
  }
  
  // Helper function to find nodes at each depth using BFS
  function findNodesAtDepths(startNodeId: string, maxDepth: number, adjList: Map<string, Set<string>>) {
    const nodesAtDepth = new Map<number, Set<string>>();
    for (let i = 0; i <= maxDepth; i++) {
      nodesAtDepth.set(i, new Set<string>());
    }
    nodesAtDepth.get(0)?.add(startNodeId);
    
    // BFS traversal
    const visited = new Set<string>([startNodeId]);
    const queue: {nodeId: string, distance: number}[] = [{nodeId: startNodeId, distance: 0}];
    
    while (queue.length > 0) {
      const {nodeId, distance} = queue.shift()!;
      
      // Skip if we're already at max depth
      if (distance >= maxDepth) continue;
      
      // Process neighbors
      const neighbors = adjList.get(nodeId) || new Set<string>();
      for (const neighborId of Array.from(neighbors)) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push({nodeId: neighborId, distance: distance + 1});
          nodesAtDepth.get(distance + 1)?.add(neighborId);
        }
      }
    }
    
    return nodesAtDepth;
  }

  /**
   * Selects ONLY nodes at exactly k steps away from the source node
   */
  const selectExactLayer = (sourceNodeId: string, layerDepth: number) => {
    if (!nodes.length || !links.length || layerDepth < 1) return;
    
    // Find the source node
    const sourceNode = nodes.find(n => n.id === sourceNodeId);
    if (!sourceNode) return;
    
    // First, deselect all nodes
    nodes.forEach(node => {
      // Skip the source node
      if (node.id === sourceNodeId) return;
      
      // Deselect this node
      node.isSelected = false;
      node.fx = null;
      node.fy = null;
      
      // Update visual indicator
      if (nodesRef.current) {
        const nodeIdx = nodes.findIndex(n => n.id === node.id);
        if (nodeIdx >= 0) {
          d3.select(nodesRef.current.nodes()[nodeIdx])
            .attr('stroke', 'none');
        }
      }
    });
    
    // Always select and fix the source node
    sourceNode.isSelected = true;
    
    // Only fix the position if it's not already fixed
    if (sourceNode.fx === undefined || sourceNode.fy === undefined) {
      // Make sure the node has actual coordinates before fixing
      if (sourceNode.x !== undefined && sourceNode.y !== undefined) {
        sourceNode.fx = sourceNode.x;
        sourceNode.fy = sourceNode.y;
      }
    }
    
    // Update visual indicator for source node
    if (nodesRef.current) {
      const sourceNodeIdx = nodes.findIndex(n => n.id === sourceNodeId);
      if (sourceNodeIdx >= 0) {
        d3.select(nodesRef.current.nodes()[sourceNodeIdx])
          .attr('stroke', '#000000')
          .attr('stroke-width', 1.5);
      }
    }
    
    // If layer depth is 0, we're done - just select the source node
    if (layerDepth === 0) return;
    
    // Build the adjacency list only once
    const adjacencyList = buildAdjacencyList();
    
    // Find all nodes at each depth level up to the target depth
    const nodesByDepth = findNodesAtDepths(sourceNodeId, layerDepth, adjacencyList);
    
    // Get the nodes at exactly the requested layer
    const nodesAtExactLayer = nodesByDepth.get(layerDepth) || new Set<string>();
    
    // Select and fix only nodes at exactly this layer depth
    for (const nodeId of Array.from(nodesAtExactLayer)) {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) continue;
      
      // Mark as selected
      node.isSelected = true;
      
      // Fix position only if it's not already fixed
      if (node.fx === undefined || node.fy === undefined) {
        // Make sure the node has actual coordinates before fixing
        if (node.x !== undefined && node.y !== undefined) {
          node.fx = node.x;
          node.fy = node.y;
        }
      }
      
      // Update visual selection indicator
      if (nodesRef.current) {
        const nodeIdx = nodes.findIndex(n => n.id === nodeId);
        if (nodeIdx >= 0) {
          d3.select(nodesRef.current.nodes()[nodeIdx])
            .attr('stroke', '#000000')
            .attr('stroke-width', 1.5);
        }
      }
    }
  }

  /**
   * Highlights a random path in the graph based on extracted edges from LLM
   * @param extractedEdges Array of edge types extracted from LLM response
   * @param clauses Optional array of clauses with entity information
   * @param entityExamples Optional mapping of entity names to specific examples
   */
  const highlightPath = (
    extractedEdges: string[],
    clauses?: Array<{entity1: string, relation: string, entity2: string}>,
    entityExamples?: Record<string, string>
  ) => {
    if (!nodes.length || !links.length || !extractedEdges.length) return;
    
    // First, reset any previous highlighting
    resetHighlighting();
    
    // The number of edges we need to highlight
    const pathLength = extractedEdges.length;
    
    // Find a valid path of the required length
    const path = findRandomPath(pathLength);
    if (!path || path.length < pathLength) {
      console.warn('Could not find a valid path of length', pathLength);
      return;
    }
    
    // Apply highlighting to the found path
    for (let i = 0; i < path.length; i++) {
      const edge = path[i];
      
      // Highlight the edge with the corresponding extracted edge type
      edge.isHighlighted = true;
      edge.highlightLabel = extractedEdges[i];
      
      // Get clause for this edge if available
      const clause = clauses && clauses[i];
      
      // Highlight the source and target nodes
      const source = typeof edge.source === 'object' ? edge.source : nodes.find(n => n.id === edge.source);
      const target = typeof edge.target === 'object' ? edge.target : nodes.find(n => n.id === edge.target);
      
      if (source) {
        source.isHighlighted = true;
        // Also select the node
        source.isSelected = true;
        // Fix position
        if (source.x !== undefined && source.y !== undefined) {
          source.fx = source.x;
          source.fy = source.y;
        }
        
        // Set tooltip from entity examples if available
        if (clause && entityExamples) {
          const entityName = clause.entity1;
          const example = entityExamples[entityName];
          if (example) {
            source.tooltipText = example;
          }
        }
      }
      
      if (target) {
        target.isHighlighted = true;
        // Also select the node
        target.isSelected = true;
        // Fix position
        if (target.x !== undefined && target.y !== undefined) {
          target.fx = target.x;
          target.fy = target.y;
        }
        
        // Set tooltip from entity examples if available
        if (clause && entityExamples) {
          const entityName = clause.entity2;
          const example = entityExamples[entityName];
          if (example) {
            target.tooltipText = example;
          }
        }
      }
    }
    
    // Update visual representation
    updateHighlighting();
    
    // Gently reheat the simulation to adjust to the new fixed nodes
    if (simulationRef.current) {
      simulationRef.current.alpha(0.2).restart();
    }
  };
  
  /**
   * Finds a random path in the graph with the specified length
   * @param length The number of edges in the path
   * @returns Array of edges forming a path, or null if no path found
   */
  const findRandomPath = (length: number): GraphLink[] | null => {
    if (length <= 0 || !links.length || !nodes.length) return null;
    
    // Build adjacency list for faster path finding
    const adjacencyList = buildAdjacencyList();
    
    // Pick a random starting node
    const startNodeIdx = Math.floor(Math.random() * nodes.length);
    const startNode = nodes[startNodeIdx];
    
    // Try to find a path from this node
    const path: GraphLink[] = [];
    let currentNodeId = startNode.id;
    
    for (let i = 0; i < length; i++) {
      // Get all neighbors of the current node
      const neighbors = adjacencyList.get(currentNodeId) || new Set<string>();
      const neighborArray = Array.from(neighbors);
      
      // If we have no more neighbors, we can't continue the path
      if (neighborArray.length === 0) {
        // Start over with a different node if this is the first edge
        if (i === 0) {
          return findRandomPath(length); // Recursive retry with a different start node
        }
        break;
      }
      
      // Pick a random neighbor
      const nextNodeId = neighborArray[Math.floor(Math.random() * neighborArray.length)];
      
      // Find the edge between current and next node
      const edge = links.find(link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        return (sourceId === currentNodeId && targetId === nextNodeId) || 
               (sourceId === nextNodeId && targetId === currentNodeId);
      });
      
      if (!edge) break;
      
      // Add this edge to the path
      path.push(edge);
      
      // Move to the next node
      currentNodeId = nextNodeId;
    }
    
    // If we couldn't find a path of the required length, try again with a different start node
    if (path.length < length) {
      return findRandomPath(length); // Recursive retry
    }
    
    return path;
  };
  
  /**
   * Reset all highlighting in the graph
   */
  const resetHighlighting = () => {
    // Reset node highlighting
    nodes.forEach(node => {
      node.isHighlighted = false;
      node.tooltipText = undefined; // Clear tooltip text
    });
    
    // Reset edge highlighting
    links.forEach(link => {
      link.isHighlighted = false;
      link.highlightLabel = undefined;
    });
    
    // Update visual elements to reflect the reset state
    if (nodesRef.current) {
      nodesRef.current
        .attr('stroke-width', (d: GraphNode) => d.isHighlighted ? 3 : 1.5)
        .attr('stroke', (d: GraphNode) => {
          if (d.isHighlighted) return '#000000';
          return d.isSelected ? '#000000' : 'none';
        });
    }
    
    if (linksRef.current) {
      linksRef.current
        .attr('stroke-width', settings.edgeThickness)
        .attr('stroke', '#94a3b8');
    }
    
    // Remove any edge labels/tooltips
    if (gRef.current) {
      gRef.current.selectAll('.edge-label').remove();
      gRef.current.selectAll('.node-tooltip').remove();
      // Clear the reference
      linkLabelsRef.current = null;
    }
  };
  
  /**
   * Update the visual representation of highlighting
   */
  const updateHighlighting = () => {
    // Update node highlighting
    if (nodesRef.current) {
      nodesRef.current
        .attr('stroke-width', (d: GraphNode) => d.isHighlighted ? 3 : 1.5)
        .attr('stroke', (d: GraphNode) => {
          if (d.isHighlighted) return '#000000';
          return d.isSelected ? '#000000' : 'none';
        });
    }
    
    // Update edge highlighting
    if (linksRef.current) {
      linksRef.current
        .attr('stroke-width', (d: GraphLink) => d.isHighlighted ? settings.edgeThickness * 3 : settings.edgeThickness)
        .attr('stroke', (d: GraphLink) => d.isHighlighted ? '#000000' : '#94a3b8');
    }
    
    // Remove existing tooltips and labels
    if (gRef.current) {
      gRef.current.selectAll('.edge-label').remove();
      gRef.current.selectAll('.node-tooltip').remove();
      
      // Create new labels for highlighted edges
      const edgeLabels = gRef.current.append('g')
        .selectAll('.edge-label')
        .data(links.filter(link => link.isHighlighted && link.highlightLabel))
        .enter().append('text')
        .attr('class', 'edge-label')
        .attr('font-size', '10px')
        .attr('fill', '#000')
        .attr('text-anchor', 'middle')
        .attr('dy', -5)
        .attr('pointer-events', 'none')
        .text((d: GraphLink) => d.highlightLabel || '');
      
      // Store reference to edge labels
      linkLabelsRef.current = edgeLabels;
      
      // Create tooltips for highlighted nodes with tooltip text
      const nodeTooltips = gRef.current.append('g')
        .attr('class', 'tooltip-container') // Add a container class
        .selectAll('.node-tooltip')
        .data(nodes.filter(node => node.isHighlighted && node.tooltipText))
        .enter().append('g')
        .attr('class', 'node-tooltip')
        .each(function(this: SVGGElement, d: GraphNode) {
          // Store a direct reference to the node data in each tooltip element
          // This helps avoid issues with D3's data binding
          (this as any).__data__ = d;
        })
        .attr('transform', (d: GraphNode) => `translate(${d.x || 0},${(d.y || 0) - 20})`); // Position above node
      
      // Add background rectangle for better readability
      nodeTooltips.append('rect')
        .attr('rx', 5)
        .attr('ry', 5)
        .attr('fill', 'white')
        .attr('stroke', '#000')
        .attr('stroke-width', 0.5)
        .attr('fill-opacity', 0.9)
        .attr('x', -50) // Center horizontally
        .attr('width', 100)
        .attr('height', 20);
      
      // Add tooltip text
      nodeTooltips.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', 14) // Vertical centering within rectangle
        .attr('font-size', '10px')
        .attr('pointer-events', 'none')
        .text((d: GraphNode) => d.tooltipText || '');
    }
  };

  // Expose the highlightPath function to parent components
  useImperativeHandle(ref, () => ({
    highlightPath
  }));

  // Function to apply color scheme based on node index or community
  const applyColorScheme = (nodes: GraphNode[], colorScheme: string, communityDetection: string) => {
    // Track only existing color scheme - don't handle manual colors here
    // This ensures we can always switch between color schemes
    
    // Default color for all nodes
    if (colorScheme === 'default') {
      nodes.forEach(node => {
        // Set to default color unless it has a custom color
        if (!node.color || node.color.startsWith('#') || 
            node.color.startsWith('rgb') || node.color.startsWith('hsl')) {
          node.color = '#6366f1';
        }
      });
      return nodes;
    }

    // Compute communities if needed
    let communities: Map<string, number> | null = null;
    if (communityDetection !== 'none') {
      communities = detectCommunities(nodes, communityDetection);
    }
    
    // Apply the selected color scheme to all nodes
    nodes.forEach((node, i) => {
      // Determine what value to base the color on (index or community)
      let colorValue: number;
      
      if (communities && communities.has(node.id)) {
        // Use community for coloring if available
        const communityIndex = communities.get(node.id)!;
        const maxCommunity = Math.max(1, Math.max(...Array.from(communities.values())));
        colorValue = communityIndex / maxCommunity;
      } else {
        // Use index for coloring
        colorValue = i / Math.max(1, nodes.length - 1);
      }
      
      // Apply the correct color scheme
      switch (colorScheme) {
        case 'viridis':
          node.color = d3ColorScales.interpolateViridis(colorValue);
          break;
        case 'plasma':
          node.color = d3ColorScales.interpolatePlasma(colorValue);
          break;
        case 'rainbow':
          node.color = d3ColorScales.interpolateRainbow(colorValue);
          break;
        case 'magma':
          node.color = d3ColorScales.interpolateMagma(colorValue);
          break;
        case 'inferno':
          node.color = d3ColorScales.interpolateInferno(colorValue);
          break;
        case 'turbo':
          node.color = d3ColorScales.interpolateTurbo(colorValue);
          break;
        case 'cividis':
          node.color = d3ColorScales.interpolateCividis(colorValue);
          break;
        default:
          node.color = '#6366f1'; // Default color
      }
    });
    
    return nodes;
  };

  // Function to detect communities using different algorithms
  const detectCommunities = (nodes: GraphNode[], algorithm: string): Map<string, number> => {
    const communities = new Map<string, number>();
    
    // Build adjacency list for community detection
    const adjacencyList = buildAdjacencyList();
    
    switch (algorithm) {
      case 'louvain': 
        // Louvain-inspired community detection (simplified)
        // In a real implementation, we'd use a proper Louvain algorithm
        // Here we're just using degree-based clustering as a simple approximation
        nodes.forEach(node => {
          // Count node degree (number of connections)
          const neighbors = adjacencyList.get(node.id) || new Set();
          const degree = neighbors.size;
          
          // Use degree as a rough community indicator
          // Map to a small number of communities
          const communityIndex = Math.min(9, Math.floor(degree / 2));
          communities.set(node.id, communityIndex);
        });
        break;
        
      case 'girvan-newman':
        // Girvan-Newman inspired approach
        // Another simplified approximation based on path lengths
        // In a full implementation, we'd remove edges with high betweenness centrality
        
        // We'll assign communities based on rough clustering by graph distance
        // Pick a few "seed" nodes and assign communities based on closest seed
        const seedCount = Math.min(10, Math.max(3, Math.floor(nodes.length / 20)));
        const seeds: string[] = [];
        
        // Select seed nodes (evenly spaced in the node array for simplicity)
        for (let i = 0; i < seedCount; i++) {
          const index = Math.floor(i * (nodes.length / seedCount));
          seeds.push(nodes[index].id);
        }
        
        // Assign each node to community of closest seed
        nodes.forEach(node => {
          if (seeds.includes(node.id)) {
            // Seed nodes get their own community index
            communities.set(node.id, seeds.indexOf(node.id));
            return;
          }
          
          // Find closest seed by BFS
          let closestSeed = seeds[0];
          let shortestDistance = Infinity;
          
          for (const seed of seeds) {
            const distance = getShortestPathDistance(node.id, seed, adjacencyList);
            if (distance < shortestDistance) {
              shortestDistance = distance;
              closestSeed = seed;
            }
          }
          
          communities.set(node.id, seeds.indexOf(closestSeed));
        });
        break;
        
      default:
        // Default simple hashing based on node ID
        nodes.forEach(node => {
          const firstChar = node.id.charAt(0).toLowerCase();
          const communityIndex = firstChar.charCodeAt(0) % 10; // Simple hash
          communities.set(node.id, communityIndex);
        });
    }
    
    return communities;
  };
  
  // Helper function for Girvan-Newman to find shortest path distance
  const getShortestPathDistance = (
    startId: string, 
    endId: string, 
    adjList: Map<string, Set<string>>
  ): number => {
    if (startId === endId) return 0;
    
    const visited = new Set<string>([startId]);
    const queue: {id: string, distance: number}[] = [{id: startId, distance: 0}];
    
    while (queue.length > 0) {
      const {id, distance} = queue.shift()!;
      
      const neighbors = adjList.get(id) || new Set();
      for (const neighborId of Array.from(neighbors)) {
        if (neighborId === endId) return distance + 1;
        
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push({id: neighborId, distance: distance + 1});
        }
      }
    }
    
    // If no path found
    return Infinity;
  };

  // Return the React component JSX
  return (
    <div className="w-full h-full relative">
      <svg ref={svgRef} className="w-full h-full" />
      
      {/* Render color picker when open */}
      {colorPicker.isOpen && (
        <NodeColorPicker
          position={colorPicker.position}
          initialColor={colorPicker.color}
          onColorChange={handleNodeColorChange}
          onClose={handleCloseColorPicker}
        />
      )}
    </div>
  );
});

export default ForceDirectedGraph; 