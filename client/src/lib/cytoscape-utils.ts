import cytoscape from 'cytoscape';
import type { Node, Edge } from '@shared/schema';

export function createCytoscapeConfig(nodes: Node[], edges: Edge[], container: HTMLElement) {
  return {
    container,
    elements: {
      nodes: nodes.map(node => ({
        data: { id: node.id, label: node.label }
      })),
      edges: edges.map(edge => ({
        data: {
          id: `${edge.source}-${edge.target}`,
          source: edge.source,
          target: edge.target,
          label: edge.type
        }
      }))
    },
    style: [
      {
        selector: 'node',
        style: {
          'background-color': '#6366f1',
          'label': 'data(label)',
          'color': '#000000',
          'text-valign': 'center',
          'text-halign': 'center',
          'font-size': '12px',
          'width': '40px',
          'height': '40px'
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 2,
          'line-color': '#94a3b8',
          'target-arrow-color': '#94a3b8',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'label': 'data(label)',
          'font-size': '10px',
          'text-rotation': 'autorotate'
        }
      },
      {
        selector: '.highlighted',
        style: {
          'background-color': '#f43f5e',
          'line-color': '#f43f5e',
          'target-arrow-color': '#f43f5e',
          'transition-property': 'background-color, line-color, target-arrow-color',
          'transition-duration': '0.5s'
        }
      }
    ],
    layout: {
      name: 'cose',
      animate: false,
      nodeRepulsion: 8000,
      idealEdgeLength: 100
    }
  };
}

export function highlightPath(cy: cytoscape.Core, nodeIds: string[], edgePaths: Edge[]) {
  // Reset previous highlights
  cy.elements().removeClass('highlighted');
  
  // Highlight nodes
  nodeIds.forEach(id => {
    cy.$(`node[id = "${id}"]`).addClass('highlighted');
  });

  // Highlight edges in the reasoning path
  edgePaths.forEach(edge => {
    cy.$(`edge[source = "${edge.source}"][target = "${edge.target}"]`).addClass('highlighted');
  });
}
