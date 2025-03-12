import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as d3 from 'd3';
import { Graph } from '@shared/schema';
import { ForceDirectedGraphProps, ForceGraphRef, GraphNode, GraphLink, ColorPickerState, NeighborhoodSelection, ExactLayerSelection, getDefaultPhysicsSettings } from './types';
import { transformGraphData } from './graphUtils';
import { applyColorScheme } from './graphUtils';
import { highlightPath } from './GraphHighlighting';
import GraphRenderer from './GraphRenderer';
import NodeColorPicker from '../NodeColorPicker';

// Convert to forwardRef component to expose methods
const ForceDirectedGraph = forwardRef<ForceGraphRef, ForceDirectedGraphProps>(
  function ForceDirectedGraph({
    graph,
    width = 800,
    height = 600,
    settings = getDefaultPhysicsSettings(),
    onSettingsChange,
    edgeFilterRange = [0, 1],
  }, ref) {
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
    
    // D3 selection refs with proper types
    const gRef = useRef<d3.Selection<any, unknown, null, undefined>>();
    const linksRef = useRef<d3.Selection<any, GraphLink, SVGGElement, unknown>>();
    const nodesRef = useRef<d3.Selection<any, GraphNode, SVGGElement, unknown>>();
    const labelsRef = useRef<d3.Selection<any, GraphNode, SVGGElement, unknown>>();
    const linkLabelsRef = useRef<d3.Selection<any, GraphLink, SVGGElement, unknown>>();
    
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

    // Update graph data when it changes
    useEffect(() => {
      if (!graph) return;

      console.log("Graph data changed:", graph);
      
      // Transform the graph data, preserving positions of existing nodes
      const [newNodes, newLinks] = transformGraphData(graph, nodes, settings.nodeRadius);
      
      // Update state
      setNodes(newNodes);
      setLinks(newLinks);
    }, [graph]);

    // Handle color scheme and community detection changes separately
    useEffect(() => {
      if (!nodes.length) return;
      
      console.log("Updating color scheme:", settings.colorScheme, settings.communityDetection);
      
      // Apply color scheme to nodes
      const coloredNodes = applyColorScheme(
        [...nodes], 
        settings.colorScheme, 
        settings.communityDetection,
        links
      );
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
              if (nodesRef.current && nodeIdx >= 0) {
                d3.select(nodesRef.current.nodes()[nodeIdx])
                  .attr('fill', newColor);
              }
              
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

    // Expose the highlightPath function to parent components
    useImperativeHandle(ref, () => ({
      highlightPath: (
        extractedEdges: string[],
        clauses?: Array<{entity1: string, relation: string, entity2: string}>,
        entityExamples?: Record<string, string>
      ) => {
        highlightPath(
          extractedEdges, 
          nodes, 
          links, 
          gRef, 
          linksRef, 
          nodesRef, 
          linkLabelsRef, 
          simulationRef.current, 
          settings,
          clauses, 
          entityExamples
        );
      }
    }));

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

    // Return the React component JSX
    return (
      <div className="w-full h-full relative">
        <svg ref={svgRef} className="w-full h-full" />
        
        {/* Graph Renderer - manages D3 */}
        <GraphRenderer 
          width={width}
          height={height}
          nodes={nodes}
          links={links}
          edgeFilterRange={edgeFilterRange}
          settings={settings}
          simulationRef={simulationRef}
          svgRef={svgRef}
          gRef={gRef}
          nodesRef={nodesRef}
          linksRef={linksRef}
          labelsRef={labelsRef}
          linkLabelsRef={linkLabelsRef}
          isSpacePressed={isSpacePressed}
          isNPressed={isNPressed}
          isMPressed={isMPressed}
          neighborhoodSelection={neighborhoodSelection}
          exactLayerSelection={exactLayerSelection}
          colorPicker={colorPicker}
          setColorPicker={setColorPicker}
        />
        
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
  }
);

export default ForceDirectedGraph; 