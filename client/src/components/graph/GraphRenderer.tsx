import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GraphNode, GraphLink } from './types';
import { setupDragBehavior, handleNodeClick } from './GraphInteractions';
import { getColorFromEdgeScheme } from './colorSchemes';

interface GraphRendererProps {
  width: number;
  height: number;
  nodes: GraphNode[];
  links: GraphLink[];
  edgeFilterRange: [number, number];
  settings: any;
  simulationRef: React.MutableRefObject<d3.Simulation<GraphNode, undefined> | null>;
  svgRef: React.RefObject<SVGSVGElement>;
  gRef: React.MutableRefObject<d3.Selection<any, unknown, null, undefined> | undefined>;
  nodesRef: React.MutableRefObject<d3.Selection<any, GraphNode, SVGGElement, unknown> | undefined>;
  linksRef: React.MutableRefObject<d3.Selection<any, GraphLink, SVGGElement, unknown> | undefined>;
  labelsRef: React.MutableRefObject<d3.Selection<any, GraphNode, SVGGElement, unknown> | undefined>;
  linkLabelsRef: React.MutableRefObject<d3.Selection<any, GraphLink, SVGGElement, unknown> | undefined>;
  isSpacePressed: React.MutableRefObject<boolean>;
  isNPressed: React.MutableRefObject<boolean>;
  isMPressed: React.MutableRefObject<boolean>;
  neighborhoodSelection: React.MutableRefObject<any>;
  exactLayerSelection: React.MutableRefObject<any>;
  colorPicker: any;
  setColorPicker: React.Dispatch<React.SetStateAction<any>>;
}

const GraphRenderer: React.FC<GraphRendererProps> = ({
  width,
  height,
  nodes,
  links,
  edgeFilterRange,
  settings,
  simulationRef,
  svgRef,
  gRef,
  nodesRef,
  linksRef, 
  labelsRef,
  linkLabelsRef,
  isSpacePressed,
  isNPressed,
  isMPressed,
  neighborhoodSelection,
  exactLayerSelection,
  colorPicker,
  setColorPicker
}) => {
  // Keep track of the previous edge filter range for changes
  const prevEdgeFilterRef = useRef<[number, number]>(edgeFilterRange);

  // Initialize the visualization
  useEffect(() => {
    if (!nodes.length || !svgRef.current) return;

    console.log("Initializing visualization with", nodes.length, "nodes and", links.length, "links");
    
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
      .attr('stroke-width', settings.edgeThickness) // Use edgeThickness setting
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', (d: GraphLink) => {
        if (d.isHighlighted) return '#000000'; // Highlighted path
        
        if (d.relevanceScore === undefined) return '#94a3b8'; // Default color for edges without scores
        
        // Check if the edge is within the filter range
        if (edgeFilterRange && 
            (d.relevanceScore < edgeFilterRange[0] || 
             d.relevanceScore > edgeFilterRange[1])) {
          return '#cccccc'; // Gray color for filtered edges
        }
        
        // Use the selected color scheme for edges in range
        return getColorFromEdgeScheme(d.relevanceScore, settings.edgeColorScheme);
      })
      .attr('stroke-opacity', (d: GraphLink) => {
        if (d.isHighlighted) return 1.0; // Full opacity for highlighted
        
        if (d.relevanceScore === undefined) return 0.6; // Default opacity
        
        // Reduce opacity for filtered edges
        if (edgeFilterRange && 
            (d.relevanceScore < edgeFilterRange[0] || 
             d.relevanceScore > edgeFilterRange[1])) {
          return 0.3; // Lower opacity for filtered edges
        }
        
        return 0.8; // Higher opacity for visible edges
      });
    
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

    // Apply drag behavior to nodes
    const dragBehavior = setupDragBehavior(sim, nodes, isSpacePressed);
    node.call(dragBehavior as any);

    // Add node click handler with neighborhood selection functionality
    node.on('click', (event: any, d: GraphNode) => {
      handleNodeClick(
        event, 
        d, 
        nodes, 
        neighborhoodSelection,
        exactLayerSelection,
        isNPressed,
        isMPressed,
        links,
        sim
      );
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
          const tooltipContainer = gRef.current ? d3.select(gRef.current.node()) : null;
          if (tooltipContainer && !tooltipContainer.empty()) {
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

  // Effect to update edge colors when the filter range changes
  useEffect(() => {
    if (!linksRef.current || !links.length) return;
    
    console.log("Updating edge colors based on filter:", edgeFilterRange, "and color scheme:", settings.edgeColorScheme);
    
    // Apply edge coloring based on relevance score and filter range
    linksRef.current
      .attr('stroke', (d: GraphLink) => {
        if (d.isHighlighted) return '#000000'; // Highlighted path
        
        if (d.relevanceScore === undefined) return '#94a3b8'; // Default color for edges without scores
        
        // Check if the edge is within the filter range
        if (edgeFilterRange && 
            (d.relevanceScore < edgeFilterRange[0] || 
             d.relevanceScore > edgeFilterRange[1])) {
          return '#cccccc'; // Gray color for filtered edges
        }
        
        // Use the selected color scheme for edges in range
        return getColorFromEdgeScheme(d.relevanceScore, settings.edgeColorScheme);
      })
      .attr('stroke-opacity', (d: GraphLink) => {
        if (d.isHighlighted) return 1.0; // Full opacity for highlighted
        
        if (d.relevanceScore === undefined) return 0.6; // Default opacity
        
        // Reduce opacity for filtered edges
        if (edgeFilterRange && 
            (d.relevanceScore < edgeFilterRange[0] || 
             d.relevanceScore > edgeFilterRange[1])) {
          return 0.3; // Lower opacity for filtered edges
        }
        
        return 0.8; // Higher opacity for visible edges
      });
    
    // For dynamic updates, use a very gentle reheat or none at all
    // Only reheat for significant changes in the filter range
    if (simulationRef.current !== null && 
        (Math.abs(edgeFilterRange[0] - (prevEdgeFilterRef.current?.[0] || 0)) > 0.1 ||
        Math.abs(edgeFilterRange[1] - (prevEdgeFilterRef.current?.[1] || 1)) > 0.1)) {
      simulationRef.current.alpha(0.05).restart();
    }
    
    // Store current filter range for comparison next time
    prevEdgeFilterRef.current = [...edgeFilterRange];
  }, [edgeFilterRange, settings.edgeColorScheme, links.length]);

  return null; // This component doesn't render anything directly, it just manages D3
};

export default GraphRenderer; 