import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Graph } from '@shared/schema';
import NodeColorPicker from './NodeColorPicker';

// --- Physics settings types ---
export interface PhysicsSettings {
  linkDistance: number;
  linkStrength: number;
  chargeStrength: number;
  gravity: number;
  velocityDecay: number;
}

export const defaultPhysicsSettings: PhysicsSettings = {
  linkDistance: 30,  // Smaller default for larger graphs
  linkStrength: 0.2, // Slightly weaker links
  chargeStrength: -50, // Less repulsion
  gravity: 0.05,     // Less gravity
  velocityDecay: 0.5, // More damping
};

// --- Internal graph data types ---
interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  r: number;
  color: string;
  isSelected: boolean; // Always use this as the single source of truth for selection
}

interface GraphLink {
  source: any;
  target: any;
  type: string;
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

const ForceDirectedGraph: React.FC<ForceDirectedGraphProps> = ({
  graph,
  width = 800,
  height = 600,
  settings = defaultPhysicsSettings,
  onSettingsChange,
}) => {
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
  
  // Track neighborhood selection state
  const neighborhoodSelection = useRef<NeighborhoodSelection>({
    sourceNodeId: null,
    currentDepth: 0
  });
  
  // Reference to store graph elements for updates
  const gRef = useRef<any>(null);
  const linksRef = useRef<any>(null);
  const nodesRef = useRef<any>(null);
  const labelsRef = useRef<any>(null);

  // Convert graph data to D3 format
  useEffect(() => {
    // Transform nodes
    const nodeData: GraphNode[] = graph.nodes.map(node => ({
      id: node.id,
      label: node.label,
      r: 5, // Smaller nodes for larger graphs
      color: '#6366f1',
      isSelected: false
    }));

    // Transform links
    const linkData = graph.edges.map(edge => ({
      source: edge.source,
      target: edge.target,
      type: edge.type,
    }));

    setNodes(nodeData);
    setLinks(linkData);
  }, [graph]);

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
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressed.current = false;
      } else if (e.code === 'KeyN') {
        isNPressed.current = false;
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
      });
    
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
      .attr('stroke-width', 0.5) // Thinner lines for large graphs
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
      .attr('r', (d: GraphNode) => d.r)
      .attr('fill', (d: GraphNode) => d.color)
      .attr('fill-opacity', 0.8) // Slightly transparent
      .attr('stroke', (d: GraphNode) => d.isSelected ? '#000000' : 'none') // Use isSelected for stroke
      .attr('stroke-width', 1.5);
    
    nodesRef.current = node;

    // ---- SIMPLIFIED DRAG BEHAVIOR ----
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
    }
    
    function dragged(event: any, d: GraphNode) {
      // Get the current x,y position from the D3 event
      const currentX = event.x;
      const currentY = event.y;
      
      // Calculate change since LAST position (not since original position)
      // This is important to ensure smooth movement
      const deltaX = currentX - (d.fx || d.x || 0);
      const deltaY = currentY - (d.fy || d.y || 0);
      
      // Always update the dragged node first
      d.fx = currentX;
      d.fy = currentY;
      
      // Group movement with space key
      if (isSpacePressed.current) {
        // Move all selected nodes EXCEPT the one we're directly dragging
        nodes.forEach(node => {
          if (node === d) return; // Skip the node we're directly dragging
          
          // Only move nodes that are part of the selection
          if (node.isSelected === true) {
            // If node doesn't have fixed position yet, initialize it
            if (node.fx === undefined || node.fy === undefined) {
              if (node.x !== undefined && node.y !== undefined) {
                node.fx = node.x;
                node.fy = node.y;
              } else {
                // Safety check for uninitialized coordinates
                return;
              }
            }
            
            // Apply the exact same movement delta to this node
            node.fx! += deltaX;
            node.fy! += deltaY;
          }
        });
      }
    }
    
    function dragended(event: any, d: GraphNode) {
      if (!event.active) sim.alphaTarget(0);
      
      // Keep the node fixed at its final position (already selected)
      d.fx = event.x;
      d.fy = event.y;
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
    });

    // SVG shift+click to unfix/deselect all nodes
    svg.on('click', (event: MouseEvent) => {
      if (event.shiftKey) {
        // Reset neighborhood selection state completely
        neighborhoodSelection.current = {
          sourceNodeId: null,
          currentDepth: 0
        };
      
        // Deselect all nodes (SOURCE OF TRUTH)
        nodes.forEach(node => {
          node.isSelected = false;
          // Then clear fixed positions
          node.fx = null;
          node.fy = null;
        });
        
        // Remove all selection indicators
        d3.selectAll('circle')
          .attr('stroke', 'none');
        
        // Restart with higher energy
        sim.alpha(0.5).restart();
        
        // Prevent other click handlers
        event.stopPropagation();
        if (event.preventDefault) event.preventDefault();
      }
    });

    // Handle double-click on nodes to show color picker
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

    // Update tick function to also reflect selection state in the visual representation
    sim.on('tick', () => {
      link
        .attr('x1', (d: GraphLink) => (d.source as any).x)
        .attr('y1', (d: GraphLink) => (d.source as any).y)
        .attr('x2', (d: GraphLink) => (d.target as any).x)
        .attr('y2', (d: GraphLink) => (d.target as any).y);

      node
        .attr('cx', (d: GraphNode) => d.x!)
        .attr('cy', (d: GraphNode) => d.y!)
        .attr('stroke', (d: GraphNode) => d.isSelected ? '#000000' : 'none');

      labels
        .attr('x', (d: GraphNode) => d.x!)
        .attr('y', (d: GraphNode) => d.y!);
        
      // Update quadtree for performance
      quadtree
        .x(d => d.x || 0)
        .y(d => d.y || 0);
    });

    // Initial zoom to fit all nodes
    svg.call(zoomHandler);
    
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
    
    // Reset zoom on double click
    svg.on('dblclick.zoom', function() {
      // Calculate the bounds of all nodes
      if (!nodes.length) return;
      
      const transform = fitGraphToView();
      if (transform) {
        // Apply the transform with a smooth transition
        svg.transition().duration(750).call(zoomHandler.transform, transform);
      }
    });
    
    // Start with a higher alpha for initial layout
    sim.alpha(0.5).restart();

    // Cleanup function
    return () => {
      sim.stop();
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
    
    // 5. Gently reheat the simulation for a smooth transition
    sim.alpha(0.3).restart();
    
    console.log("Updated force parameters:", settings);
  }, [settings]);

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
        clickedNode.fx = clickedNode.x;
        clickedNode.fy = clickedNode.y;
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
};

export default ForceDirectedGraph; 