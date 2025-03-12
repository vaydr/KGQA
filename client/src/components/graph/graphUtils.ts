import * as d3 from 'd3';
import { Graph } from '@shared/schema';
import { GraphNode, GraphLink } from './types';
import { getColorFromEdgeScheme } from './colorSchemes';

/**
 * Converts graph data to D3 format with position data
 */
export const transformGraphData = (
  graph: Graph, 
  oldNodes: GraphNode[] = [],
  nodeRadius: number
): [GraphNode[], GraphLink[]] => {
  // Create a map for quick lookup of old nodes by ID
  const oldNodeMap = new Map<string, GraphNode>();
  oldNodes.forEach(node => oldNodeMap.set(node.id, node));
  
  // Create nodes with position data from old nodes if available
  const nodes: GraphNode[] = graph.nodes.map((node, index) => {
    const oldNode = oldNodeMap.get(node.id);
    
    return {
      ...oldNode, // Copy all properties from the old node if it exists
      id: node.id,
      label: node.label,
      r: nodeRadius,
      index,
      // Keep position if the node already exists
      x: oldNode?.x,
      y: oldNode?.y,
      // Keep selection state
      isSelected: oldNode?.isSelected || false,
      // Initial node color - may be overridden by color scheme
      color: oldNode?.color || '#6366f1',
      // For path highlighting
      isHighlighted: oldNode?.isHighlighted || false,
      // Tooltip text (for entity examples)
      tooltipText: oldNode?.tooltipText,
      // Keep fixed position if the node was already fixed
      fx: oldNode?.fx,
      fy: oldNode?.fy,
      // Allow transition of new nodes
      vx: oldNode?.vx || 0,
      vy: oldNode?.vy || 0,
    };
  });
  
  // Create a map for quick lookup of nodes by ID
  const nodeMap = new Map<string, GraphNode>();
  nodes.forEach(node => nodeMap.set(node.id, node));
  
  // Create edges
  const links: GraphLink[] = graph.edges.map((edge, edgeIndex) => {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);
    
    // Skip the edge if either the source or target node doesn't exist
    if (!sourceNode || !targetNode) {
      console.warn(`Edge ${edge.source} -> ${edge.target} references unknown node(s)`);
      return null;
    }
    
    // Generate a stable relevance score based on edge index to ensure consistency
    // This ensures the same edge always gets the same score on refreshes
    // Use a seeded random approach for more realistic distribution
    const seed = edgeIndex + (edge.source.length + edge.target.length);
    const relevanceScore = (seed % 100) / 100; // Generate value between 0 and 1
    
    return {
      source: sourceNode,
      target: targetNode,
      type: edge.type,
      edgeIndex: edgeIndex,
      length: 30, // Default length, can be customized
      relevanceScore: relevanceScore,
      isHighlighted: false,
      highlightLabel: ''
    };
  }).filter(Boolean) as GraphLink[];
  
  console.log("Transformed graph data:", nodes.length, "nodes and", links.length, "links with relevant scores");
  
  return [nodes, links];
};

/**
 * Build adjacency list for graph algorithms
 */
export const buildAdjacencyList = (nodes: GraphNode[], links: GraphLink[]) => {
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
};

/**
 * Helper function to find nodes at each depth using BFS
 */
export const findNodesAtDepths = (
  startNodeId: string, 
  maxDepth: number, 
  adjList: Map<string, Set<string>>
) => {
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
};

/**
 * Function to find a random path in the graph with the specified length
 */
export const findRandomPath = (
  length: number,
  nodes: GraphNode[],
  links: GraphLink[]
): GraphLink[] | null => {
  if (length <= 0 || !links.length || !nodes.length) return null;
  
  // Build adjacency list for faster path finding
  const adjacencyList = buildAdjacencyList(nodes, links);
  
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
        return findRandomPath(length, nodes, links); // Recursive retry with a different start node
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
    return findRandomPath(length, nodes, links); // Recursive retry
  }
  
  return path;
};

/**
 * Helper function for Girvan-Newman to find shortest path distance
 */
export const getShortestPathDistance = (
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

/**
 * Function to detect communities using different algorithms
 */
export const detectCommunities = (
  nodes: GraphNode[], 
  algorithm: string,
  links: GraphLink[]
): Map<string, number> => {
  const communities = new Map<string, number>();
  
  // Build adjacency list for community detection
  const adjacencyList = buildAdjacencyList(nodes, links);
  
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

/**
 * Function to apply color scheme based on node index or community
 */
export const applyColorScheme = (
  nodes: GraphNode[], 
  colorScheme: string, 
  communityDetection: string,
  links: GraphLink[]
): GraphNode[] => {
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
    communities = detectCommunities(nodes, communityDetection, links);
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
        node.color = d3.interpolateViridis(colorValue);
        break;
      case 'plasma':
        node.color = d3.interpolatePlasma(colorValue);
        break;
      case 'rainbow':
        node.color = d3.interpolateRainbow(colorValue);
        break;
      case 'magma':
        node.color = d3.interpolateMagma(colorValue);
        break;
      case 'inferno':
        node.color = d3.interpolateInferno(colorValue);
        break;
      case 'turbo':
        node.color = d3.interpolateTurbo(colorValue);
        break;
      case 'cividis':
        node.color = d3.interpolateCividis(colorValue);
        break;
      default:
        node.color = '#6366f1'; // Default color
    }
  });
  
  return nodes;
}; 