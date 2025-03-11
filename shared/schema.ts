import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Graph entities
export const graphs = pgTable("graphs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nodes: jsonb("nodes").notNull().$type<Array<Node>>(),
  edges: jsonb("edges").notNull().$type<Array<Edge>>(),
});

// Custom types for graph data
export interface Node {
  id: string;
  label: string;
}

export interface Edge {
  source: string;
  target: string;
  type: string;
}

export const nodeSchema = z.object({
  id: z.string(),
  label: z.string()
});

export const edgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  type: z.string()
});

export const graphSchema = z.object({
  name: z.string(),
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema)
});

export const insertGraphSchema = createInsertSchema(graphs).omit({ id: true });

export type InsertGraph = z.infer<typeof insertGraphSchema>;
export type Graph = typeof graphs.$inferSelect;

// Question and reasoning paths
export interface Question {
  text: string;
  subgraphNodeIds: string[];
  reasoningPath: Edge[];
  answer: string;
}
