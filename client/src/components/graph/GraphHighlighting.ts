import * as d3 from 'd3';
import { GraphNode, GraphLink } from './types';
import { findRandomPath } from './graphUtils';
import { getColorFromEdgeScheme } from './colorSchemes';

/**
 * Highlights a random path in the graph based on extracted edges from LLM
 * @param extractedEdges Array of edge types extracted from LLM response
 * @param clauses Optional array of clauses with entity information
 * @param entityExamples Optional mapping of entity names to specific examples
 */
export const highlightPath = (
  extractedEdges: string[],
  nodes: GraphNode[],
  links: GraphLink[],
  gRef: React.MutableRefObject<d3.Selection<any, unknown, null, undefined> | undefined>,
  linksRef: React.MutableRefObject<d3.Selection<any, GraphLink, SVGGElement, unknown> | undefined>,
  nodesRef: React.MutableRefObject<d3.Selection<any, GraphNode, SVGGElement, unknown> | undefined>,
  linkLabelsRef: React.MutableRefObject<d3.Selection<any, GraphLink, SVGGElement, unknown> | undefined>,
  simulation: d3.Simulation<GraphNode, undefined> | null,
  settings: any,
  clauses?: Array<{entity1: string, relation: string, entity2: string}>,
  entityExamples?: Record<string, string>
): void => {
  if (!nodes.length || !links.length || !extractedEdges.length) return;
  
  // First, reset any previous highlighting
  resetHighlighting(
    nodes, 
    links, 
    gRef, 
    linksRef, 
    nodesRef, 
    linkLabelsRef,
    settings
  );
  
  // The number of edges we need to highlight
  const pathLength = extractedEdges.length;
  
  // Find a valid path of the required length
  const path = findRandomPath(pathLength, nodes, links);
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
  updateHighlighting(
    nodes, 
    links, 
    gRef, 
    linksRef, 
    nodesRef, 
    linkLabelsRef, 
    settings
  );
  
  // Gently reheat the simulation to adjust to the new fixed nodes
  if (simulation) {
    simulation.alpha(0.2).restart();
  }
};

/**
 * Reset all highlighting in the graph
 */
export const resetHighlighting = (
  nodes: GraphNode[],
  links: GraphLink[],
  gRef: React.MutableRefObject<d3.Selection<any, unknown, null, undefined> | undefined>,
  linksRef: React.MutableRefObject<d3.Selection<any, GraphLink, SVGGElement, unknown> | undefined>,
  nodesRef: React.MutableRefObject<d3.Selection<any, GraphNode, SVGGElement, unknown> | undefined>,
  linkLabelsRef: React.MutableRefObject<d3.Selection<any, GraphLink, SVGGElement, unknown> | undefined>,
  settings: any
): void => {
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
    linkLabelsRef.current = undefined;
  }
};

/**
 * Update the visual representation of highlighting
 */
export const updateHighlighting = (
  nodes: GraphNode[],
  links: GraphLink[],
  gRef: React.MutableRefObject<d3.Selection<any, unknown, null, undefined> | undefined>,
  linksRef: React.MutableRefObject<d3.Selection<any, GraphLink, SVGGElement, unknown> | undefined>,
  nodesRef: React.MutableRefObject<d3.Selection<any, GraphNode, SVGGElement, unknown> | undefined>,
  linkLabelsRef: React.MutableRefObject<d3.Selection<any, GraphLink, SVGGElement, unknown> | undefined>,
  settings: any
): void => {
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
      .attr('stroke', (d: GraphLink) => d.isHighlighted ? '#000000' : getEdgeColor(d, settings));
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

// Helper function to get the correct edge color based on relevance score
const getEdgeColor = (d: GraphLink, settings: any): string => {
  if (d.isHighlighted) return '#000000'; // Highlighted path
  
  if (d.relevanceScore === undefined) return '#94a3b8'; // Default color for edges without scores
  
  // Check if edge filter range is defined in settings
  const edgeFilterRange = settings.edgeFilterRange || [0, 1];
  
  // Check if the edge is within the filter range
  if (d.relevanceScore < edgeFilterRange[0] || d.relevanceScore > edgeFilterRange[1]) {
    return '#cccccc'; // Gray color for filtered edges
  }
  
  // Use the selected color scheme for edges in range
  return getColorFromEdgeScheme(d.relevanceScore, settings.edgeColorScheme);
}; 