import { type Graph, type InsertGraph, type Question, type Node, type Edge } from "@shared/schema";

export interface IStorage {
  createGraph(graph: InsertGraph): Promise<Graph>;
  getGraph(id: number): Promise<Graph | undefined>;
  getSampleGraph(): Promise<Graph>;
  getGraphAnswer(graphId: number, question: string): Promise<Question>;
}

export class MemStorage implements IStorage {
  private graphs: Map<number, Graph>;
  private currentId: number;

  constructor() {
    this.graphs = new Map();
    this.currentId = 1;
    this.initializeSampleGraph();
  }

  private initializeSampleGraph() {
    // Helper function to generate unique IDs
    const getId = (prefix: string, num: number) => `${prefix}${num}`;

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Add Scientists (30 nodes)
    const scientists = [
      "Albert Einstein", "Marie Curie", "Isaac Newton", "Niels Bohr", "Max Planck",
      "Richard Feynman", "Stephen Hawking", "Galileo Galilei", "Werner Heisenberg",
      "Erwin Schrödinger", "Paul Dirac", "Louis Pasteur", "Charles Darwin",
      "Nikola Tesla", "James Clerk Maxwell", "Michael Faraday", "Robert Boyle",
      "Ernest Rutherford", "James Watt", "Antoine Lavoisier", "Gregor Mendel",
      "Ada Lovelace", "Alan Turing", "Emmy Noether", "Lise Meitner", "Rosalind Franklin",
      "Dorothy Hodgkin", "Barbara McClintock", "Grace Hopper", "Rachel Carson"
    ];

    scientists.forEach((name, i) => {
      nodes.push({ id: getId('s', i), label: name });
    });

    // Add Fields of Study (20 nodes)
    const fields = [
      "Physics", "Chemistry", "Biology", "Mathematics", "Computer Science",
      "Astronomy", "Quantum Mechanics", "Relativity", "Thermodynamics", "Genetics",
      "Evolution", "Molecular Biology", "Nuclear Physics", "Electromagnetism",
      "Organic Chemistry", "Number Theory", "Algebra", "Calculus", "Statistics",
      "Artificial Intelligence"
    ];

    fields.forEach((field, i) => {
      nodes.push({ id: getId('f', i), label: field });
    });

    // Add Discoveries/Theories (50 nodes)
    const discoveries = [
      "Theory of Relativity", "Quantum Theory", "Laws of Motion", "Electromagnetic Theory",
      "DNA Structure", "Natural Selection", "Radioactivity", "Penicillin", "Computer Algorithm",
      "Quantum Entanglement", "Wave-Particle Duality", "Periodic Table", "Cell Theory",
      "Big Bang Theory", "Black Holes", "Gravity", "Electromagnetism", "Nuclear Fission",
      "Evolution Theory", "Genetic Inheritance", "Quantum Tunneling", "Superconductivity",
      "Theory of Everything", "Standard Model", "Higgs Boson", "Dark Matter",
      "Cosmic Inflation", "String Theory", "Quantum Computing", "Neural Networks",
      "Machine Learning", "Internet", "Blockchain", "Quantum Cryptography",
      "Gene Editing", "Stem Cells", "Cancer Treatment", "Vaccines", "Antibiotics",
      "Artificial Intelligence", "Virtual Reality", "Cloud Computing", "Big Data",
      "Robotics", "Nanotechnology", "Renewable Energy", "Space Exploration",
      "Mars Colonization", "Nuclear Fusion", "Quantum Internet"
    ];

    discoveries.forEach((discovery, i) => {
      nodes.push({ id: getId('d', i), label: discovery });
    });

    // Add Awards/Recognition (20 nodes)
    const awards = [
      "Nobel Prize in Physics", "Nobel Prize in Chemistry", "Nobel Prize in Medicine",
      "Fields Medal", "Turing Award", "Copley Medal", "Royal Medal", "Priestley Medal",
      "Darwin Medal", "Einstein Award", "Maxwell Medal", "Planck Medal", "Curie Award",
      "Lovelace Medal", "Mendel Medal", "Rutherford Medal", "Tesla Award",
      "Faraday Medal", "Bohr Medal", "Dirac Medal"
    ];

    awards.forEach((award, i) => {
      nodes.push({ id: getId('a', i), label: award });
    });

    // Generate edges
    // Connect scientists to their fields
    scientists.forEach((_, i) => {
      const numFields = 1 + Math.floor(Math.random() * 3);
      for (let j = 0; j < numFields; j++) {
        const fieldIndex = Math.floor(Math.random() * fields.length);
        edges.push({
          source: getId('s', i),
          target: getId('f', fieldIndex),
          type: "specialized_in"
        });
      }
    });

    // Connect scientists to their discoveries
    scientists.forEach((_, i) => {
      const numDiscoveries = 1 + Math.floor(Math.random() * 4);
      for (let j = 0; j < numDiscoveries; j++) {
        const discoveryIndex = Math.floor(Math.random() * discoveries.length);
        edges.push({
          source: getId('s', i),
          target: getId('d', discoveryIndex),
          type: "discovered"
        });
      }
    });

    // Connect scientists to awards
    scientists.forEach((_, i) => {
      const numAwards = Math.floor(Math.random() * 2);
      for (let j = 0; j < numAwards; j++) {
        const awardIndex = Math.floor(Math.random() * awards.length);
        edges.push({
          source: getId('s', i),
          target: getId('a', awardIndex),
          type: "received"
        });
      }
    });

    // Connect discoveries to fields
    discoveries.forEach((_, i) => {
      const numFields = 1 + Math.floor(Math.random() * 2);
      for (let j = 0; j < numFields; j++) {
        const fieldIndex = Math.floor(Math.random() * fields.length);
        edges.push({
          source: getId('d', i),
          target: getId('f', fieldIndex),
          type: "belongs_to"
        });
      }
    });

    const sampleGraph: InsertGraph = {
      name: "Scientific Knowledge Graph",
      nodes,
      edges
    };

    this.createGraph(sampleGraph);
  }

  async createGraph(insertGraph: InsertGraph): Promise<Graph> {
    const id = this.currentId++;
    const graph: Graph = { ...insertGraph, id };
    this.graphs.set(id, graph);
    return graph;
  }

  async getGraph(id: number): Promise<Graph | undefined> {
    return this.graphs.get(id);
  }

  async getSampleGraph(): Promise<Graph> {
    return this.graphs.get(1)!;
  }

  async getGraphAnswer(graphId: number, question: string): Promise<Question> {
    const graph = await this.getGraph(graphId);
    if (!graph) {
      throw new Error("Graph not found");
    }

    // Simple mock Q&A - in production this would use an actual LLM
    return {
      text: question,
      subgraphNodeIds: graph.nodes.slice(0, 2).map(n => n.id),
      reasoningPath: graph.edges.slice(0, 1),
      answer: "This is a sample answer based on the knowledge graph."
    };
  }
}

export const storage = new MemStorage();