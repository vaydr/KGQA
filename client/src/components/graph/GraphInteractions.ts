import * as d3 from 'd3';
import { GraphNode, GraphLink, NeighborhoodSelection, ExactLayerSelection } from './types';
import { buildAdjacencyList, findNodesAtDepths } from './graphUtils';

/**
 * Setup for drag behavior in the force graph
 */
export const setupDragBehavior = (
  simulation: d3.Simulation<GraphNode, undefined>,
  nodes: GraphNode[],
  isSpacePressed: React.MutableRefObject<boolean>
) => {
  // Create a map to store initial positions of nodes being group-dragged
  const dragStartPositions = new Map<string, { x: number, y: number }>();
  
  function dragstarted(event: any, d: GraphNode) {
    // Prevent zoom panning during drag
    event.sourceEvent.stopPropagation();
    
    if (!event.active) simulation.alphaTarget(0.3).restart();
    
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
    if (!event.active) simulation.alphaTarget(0);
    
    // Keep the node fixed at its final position (already selected)
    d.fx = event.x;
    d.fy = event.y;
    
    // Clear the drag start positions
    if (isSpacePressed.current) {
      dragStartPositions.clear();
    }
  }
  
  // Return the drag behavior to be applied to nodes
  return d3.drag<SVGCircleElement, GraphNode>()
    .on('start', dragstarted)
    .on('drag', dragged)
    .on('end', dragended);
};

/**
 * Setup for node click behavior
 */
export const handleNodeClick = (
  event: any, 
  d: GraphNode, 
  nodes: GraphNode[],
  neighborhoodSelection: React.MutableRefObject<NeighborhoodSelection>,
  exactLayerSelection: React.MutableRefObject<ExactLayerSelection>,
  isNPressed: React.MutableRefObject<boolean>,
  isMPressed: React.MutableRefObject<boolean>,
  links: GraphLink[],
  simulation: d3.Simulation<GraphNode, undefined>
): void => {
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
    simulation.alpha(0.3).restart();
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
    selectNodeNeighborhood(
      clickedNodeId, 
      neighborhoodSelection.current.currentDepth,
      nodes,
      links,
      simulation
    );
    
    // Update simulation with a gentle reheat
    simulation.alpha(0.2).restart();
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
    selectExactLayer(
      clickedNodeId, 
      exactLayerSelection.current.currentLayer,
      nodes,
      links,
      simulation
    );
    
    // Update simulation with a gentle reheat
    simulation.alpha(0.2).restart();
  }
};

/**
 * Selects all nodes within a specified graph distance from a source node
 */
export const selectNodeNeighborhood = (
  sourceNodeId: string, 
  depth: number,
  nodes: GraphNode[],
  links: GraphLink[],
  simulation: d3.Simulation<GraphNode, undefined>
): void => {
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
  const nodesSelection = d3.selectAll('circle');
  const sourceNodeIdx = nodes.findIndex(n => n.id === sourceNodeId);
  if (sourceNodeIdx >= 0 && nodesSelection.size() > sourceNodeIdx) {
    d3.select(nodesSelection.nodes()[sourceNodeIdx])
      .attr('stroke', '#000000')
      .attr('stroke-width', 1.5);
  }
  
  // If depth is 0, we're done - just select the source node
  if (depth === 0) return;
  
  // Build the adjacency list only once
  const adjacencyList = buildAdjacencyList(nodes, links);
  
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
      const nodeIdx = nodes.findIndex(n => n.id === nodeId);
      if (nodeIdx >= 0 && nodesSelection.size() > nodeIdx) {
        d3.select(nodesSelection.nodes()[nodeIdx])
          .attr('stroke', '#000000')
          .attr('stroke-width', 1.5);
      }
    }
  }
};

/**
 * Selects ONLY nodes at exactly k steps away from the source node
 */
export const selectExactLayer = (
  sourceNodeId: string, 
  layerDepth: number,
  nodes: GraphNode[],
  links: GraphLink[],
  simulation: d3.Simulation<GraphNode, undefined>
): void => {
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
    const nodesSelection = d3.selectAll('circle');
    const nodeIdx = nodes.findIndex(n => n.id === node.id);
    if (nodeIdx >= 0 && nodesSelection.size() > nodeIdx) {
      d3.select(nodesSelection.nodes()[nodeIdx])
        .attr('stroke', 'none');
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
  const nodesSelection = d3.selectAll('circle');
  const sourceNodeIdx = nodes.findIndex(n => n.id === sourceNodeId);
  if (sourceNodeIdx >= 0 && nodesSelection.size() > sourceNodeIdx) {
    d3.select(nodesSelection.nodes()[sourceNodeIdx])
      .attr('stroke', '#000000')
      .attr('stroke-width', 1.5);
  }
  
  // If layer depth is 0, we're done - just select the source node
  if (layerDepth === 0) return;
  
  // Build the adjacency list only once
  const adjacencyList = buildAdjacencyList(nodes, links);
  
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
    const nodeIdx = nodes.findIndex(n => n.id === nodeId);
    if (nodeIdx >= 0 && nodesSelection.size() > nodeIdx) {
      d3.select(nodesSelection.nodes()[nodeIdx])
        .attr('stroke', '#000000')
        .attr('stroke-width', 1.5);
    }
  }
}; 