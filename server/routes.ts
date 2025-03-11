import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { graphSchema } from "@shared/schema";
import multer from "multer";
import { z } from "zod";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Get sample graph
  app.get("/api/graphs/sample", async (req, res) => {
    const graph = await storage.getSampleGraph();
    res.json(graph);
  });

  // Upload new graph
  app.post("/api/graphs", upload.single("file"), async (req, res) => {
    try {
      const fileContent = JSON.parse(req.file?.buffer.toString() || "{}");
      const validatedData = graphSchema.parse(fileContent);
      const graph = await storage.createGraph(validatedData);
      res.json(graph);
    } catch (error) {
      res.status(400).json({ message: "Invalid graph data format" });
    }
  });

  // Get graph by ID
  app.get("/api/graphs/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const graph = await storage.getGraph(id);
    if (!graph) {
      res.status(404).json({ message: "Graph not found" });
      return;
    }
    res.json(graph);
  });

  // Get answer for a question
  app.post("/api/graphs/:id/answer", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const question = z.object({ text: z.string() }).parse(req.body);
      const answer = await storage.getGraphAnswer(id, question.text);
      res.json(answer);
    } catch (error) {
      res.status(400).json({ message: "Invalid question format" });
    }
  });

  return createServer(app);
}
