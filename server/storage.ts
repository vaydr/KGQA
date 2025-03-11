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
    const sampleGraph: InsertGraph = {
      name: "Sample Knowledge Graph",
      nodes: [
        { id: "1", label: "Albert Einstein" },
        { id: "2", label: "Physics" },
        { id: "3", label: "Nobel Prize" },
        { id: "4", label: "Theory of Relativity" }
      ],
      edges: [
        { source: "1", target: "2", type: "studied" },
        { source: "1", target: "3", type: "won" },
        { source: "1", target: "4", type: "developed" }
      ]
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
