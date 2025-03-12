import { useState, useContext, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SendHorizontal, Loader2, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { OpenAI } from "openai";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ForceGraphContainerRef } from "./ForceGraphContainer";
import React from "react";

// Initialize the DeepSeek client with the provided API key
const client = new OpenAI({
  apiKey: "sk-adffd4ce0a624b5f98f47092fadcf7e1",
  baseURL: "https://api.deepseek.com",
  dangerouslyAllowBrowser: true // Enable API calls from the browser
});

// Function to parse a query into clauses using LLM
async function queryToClauses(edgeTypes: string[], query: string): Promise<string> {
  const edgeTypesStr = edgeTypes.join(", ");
  const prompt = `
    You are a reasoning assistant designed to break down complex natural language queries into structured clauses corresponding to typed edges and entities in a knowledge graph.

    Given:
    - A set of available edge types: is, has, is_not, owns, contains, part_of, located_in, created_by, belongs_to, member_of, causes, affects, related_to, depends_on, supports, opposes, precedes, follows, similar_to, different_from, larger_than, smaller_than, equal_to, subset_of, superset_of, instance_of, type_of, used_for, capable_of, made_of, consists_of, requires, produces, consumes, converts, transmits, connects, separates, controls, regulates, measures, represents, symbolizes, indicates, brother_of, son_of, daughter_of, parent_of, sibling_of, spouse_of, friend_of, colleague_of, ${edgeTypesStr}
    - A user's natural language query: "${query}"

    Your task:
    1. Break down the query into a sequence of clauses, where each clause represents exactly one edge from the provided edge types.
    2. Each clause should be in the form (entity1, edge_type, entity2), chaining logically to represent the meaning of the query.
    3. For each entity in your clauses, provide a plausible and specific real-world example of such an entity.

    Respond with:
    1. A comma-separated sequence of clauses in the form (entity1, edge_type, entity2)
    2. Then on a new line after the clauses, provide a mapping of generic entity names to specific examples.
    Format: "ENTITIES: entity1 = [specific example], entity2 = [specific example], ..."

    For example, if the query is "Who is the brother of the king of Spain?", you might respond:
    (person, brother_of, king), (king, rules, Spain)
    ENTITIES: person = Felipe VI's brother, king = Felipe VI, Spain = Kingdom of Spain
  `;

  try {
    // Call the DeepSeek API without streaming
    const response = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: prompt.trim() }
      ],
      stream: false
    });

    // Return the content
    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Error calling DeepSeek API:", error);
    throw new Error("Failed to process with LLM");
  }
}

// Function to extract edge types from the LLM response
function extractEdges(input: string): string[] {
  // First attempt: look for patterns like (entity1, edge_type, entity2)
  const pattern = /\(\s*([^,]+?)\s*,\s*([^,]+?)\s*,\s*([^,]+?)\s*\)/g;
  const matches: string[][] = [];
  
  // Use exec in a loop instead of matchAll for better compatibility
  let match;
  while ((match = pattern.exec(input)) !== null) {
    matches.push([match[1], match[2], match[3]]);
  }
  
  if (matches.length > 0) {
    // Use index 1 for edge_type, which is the second element in each match
    return matches.map(m => m[1].trim());
  }

  // Fallback: split by separators and extract middle parts
  const edges: string[] = [];
  for (const clause of input.split(/;|\n|,/)) {
    const parts = clause.trim().replace(/[()]/g, '').split(',');
    if (parts.length === 3) {
      edges.push(parts[1].trim());
    }
  }
  
  return edges;
}

// New function to extract entity examples from the LLM response
function extractEntityExamples(input: string): Record<string, string> {
  const entityMap: Record<string, string> = {};
  
  // Look for the ENTITIES: section without using the 's' flag
  const entitiesMatch = input.match(/ENTITIES\s*:\s*(.*?)(\n|$)/);
  if (entitiesMatch && entitiesMatch[1]) {
    const mappings = entitiesMatch[1].split(',');
    
    for (const mapping of mappings) {
      const parts = mapping.split('=');
      if (parts.length >= 2) {
        const entityName = parts[0].trim();
        const entityExample = parts[1].trim();
        entityMap[entityName] = entityExample;
      }
    }
  }
  
  return entityMap;
}

// Function to extract clauses with entities from the LLM response
function extractClauses(input: string): Array<{entity1: string, relation: string, entity2: string}> {
  const clauses: Array<{entity1: string, relation: string, entity2: string}> = [];
  
  // First attempt: look for patterns like (entity1, edge_type, entity2)
  const pattern = /\(\s*([^,]+?)\s*,\s*([^,]+?)\s*,\s*([^,]+?)\s*\)/g;
  
  // Use exec in a loop instead of matchAll for better compatibility
  let match;
  while ((match = pattern.exec(input)) !== null) {
    clauses.push({
      entity1: match[1].trim(),
      relation: match[2].trim(),
      entity2: match[3].trim()
    });
  }
  
  return clauses;
}

// Get unique edge types from a graph
function getEdgeTypes(graph: any): string[] {
  if (!graph || !graph.edges) return [];
  const types = new Set<string>();
  graph.edges.forEach((edge: any) => {
    if (edge.type) types.add(edge.type);
  });
  return Array.from(types);
}

// Create a context to access the ForceGraphContainer ref
export const ForceGraphContainerContext = React.createContext<ForceGraphContainerRef | null>(null);

interface QuestionPanelProps {
  graphId: number | "sample";
}

export function QuestionPanel({ graphId }: QuestionPanelProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [clauses, setClauses] = useState("");
  const [extractedEdges, setExtractedEdges] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showApiWarning, setShowApiWarning] = useState(false);
  const [apiErrorMessage, setApiErrorMessage] = useState("");
  const [debugInfo, setDebugInfo] = useState("");
  const [isDebugExpanded, setIsDebugExpanded] = useState(false);
  const { toast } = useToast();

  // Fetch the graph data to extract edge types
  const { data: graph } = useQuery({
    queryKey: [`/api/graphs/${graphId}`],
    enabled: graphId !== undefined,
  });

  // Get the ForceGraphContainer ref from context
  const forceGraphContainer = useContext(ForceGraphContainerContext);

  // Process question with LLM to extract clauses and edge types
  const processQuestion = async () => {
    if (!question) return;
    
    setIsProcessing(true);
    setClauses("");
    setExtractedEdges([]);
    setShowApiWarning(false);
    setApiErrorMessage("");
    setAnswer("");
    setDebugInfo("");
    
    let success = false;
    
    try {
      // Get edge types from the graph
      const edgeTypes = getEdgeTypes(graph);
      
      // Process with DeepSeek LLM
      const result = await queryToClauses(edgeTypes, question);
      
      // Update state with results
      setClauses(result);
      const edges = extractEdges(result);
      setExtractedEdges(edges);
      
      // Extract clauses and entity examples from the result
      const clauses = extractClauses(result);
      const entityExamples = extractEntityExamples(result);
      
      console.log("Extracted clauses:", clauses);
      console.log("Entity examples:", entityExamples);
      
      // Highlight the path in the graph using the extracted edges and entity examples
      if (forceGraphContainer && edges.length > 0) {
        forceGraphContainer.highlightPathFromEdges(edges, clauses, entityExamples);
      }
      
      // LLM processing succeeded
      success = true;
      
      // Now try to get an answer from the API (but don't let this failing stop us)
      try {
        // The server expects a numeric ID - convert from string if needed
        let id = graphId;
        if (id === "sample") id = 1; // The server stores the sample graph with ID 1
        
        // Make sure we send exactly what the API expects
        const payload = { text: question.trim() };
        setDebugInfo(`API request:\nEndpoint: /api/graphs/${id}/answer\nPayload: ${JSON.stringify(payload)}`);
        
        // Send the request
        const res = await fetch(`/api/graphs/${id}/answer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        
        // Log the response status
        setDebugInfo(prev => `${prev}\nStatus code: ${res.status} ${res.statusText}`);
        
        // Read the response
        const text = await res.text();
        setDebugInfo(prev => `${prev}\nResponse body: ${text}`);
        
        // If the response is successful, parse and display the answer
        if (res.ok) {
          try {
            const data = JSON.parse(text);
            setAnswer(data.answer || "No answer provided");
          } catch (e) {
            setApiErrorMessage("Invalid response format from server");
            setShowApiWarning(true);
          }
        } else {
          // Handle error response
          try {
            const errorData = JSON.parse(text);
            setApiErrorMessage(errorData.message || "Unknown error");
          } catch (e) {
            setApiErrorMessage(`HTTP error: ${res.status} ${res.statusText}`);
          }
          setShowApiWarning(true);
        }
      } catch (apiError: any) {
        console.error("API Error:", apiError);
        
        // Show an inline warning about the API call failure
        setShowApiWarning(true);
        setApiErrorMessage(apiError.message || "Could not get detailed answer");
      }
    } catch (error: any) {
      console.error("Error processing question:", error);
      
      // Only show error toast if LLM processing failed
      toast({
        title: "Error",
        description: error.message || "Failed to process query",
        variant: "destructive",
      });
    } finally {
      // If the LLM processing succeeded, show success toast
      if (success) {
        toast({
          title: "Success!",
          description: "Query analyzed successfully",
          variant: "default",
          className: "bg-green-500 text-white border-none",
          duration: 3000,
        });
      }
      
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-full p-4 space-y-4 overflow-y-auto">
      <Card>
        <CardHeader>
          <CardTitle>Ask a Question</CardTitle>
          <CardDescription>
            Ask questions about the knowledge graph
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter your question..."
              disabled={isProcessing}
              onKeyDown={(e) => e.key === 'Enter' && !isProcessing && processQuestion()}
            />
            <Button 
              onClick={processQuestion}
              disabled={!question || isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizontal className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Display the query parsing results */}
      {(clauses || isProcessing) && (
        <Card>
          <CardHeader>
            <CardTitle>Query Analysis</CardTitle>
            <CardDescription>
              Breaking down your question into graph traversal steps
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <div className="text-sm font-medium">Extracted Clauses:</div>
              <div className="text-sm whitespace-pre-wrap bg-slate-50 p-2 rounded-md">
                {clauses || "Processing..."}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">Edge Types Used:</div>
              <div className="flex flex-wrap gap-1">
                {extractedEdges.length > 0 ? (
                  extractedEdges.map((edge, i) => (
                    <div key={i} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {edge}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 italic">
                    {isProcessing ? "Identifying edges..." : "No edges extracted"}
                  </div>
                )}
              </div>
            </div>
            
            {/* Debug info - collapsible section */}
            {debugInfo && (
              <div className="mt-4">
                <button 
                  className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setIsDebugExpanded(!isDebugExpanded)}
                  aria-label="Toggle debug information"
                >
                  {isDebugExpanded ? 
                    <ChevronUp className="h-3 w-3" /> : 
                    <ChevronDown className="h-3 w-3" />
                  }
                  <span className="font-medium">Debug</span>
                </button>
                
                {isDebugExpanded && (
                  <div className="mt-1 p-2 text-xs text-gray-500 whitespace-pre-wrap bg-gray-50 rounded border border-gray-200">
                    {debugInfo}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* API warning */}
      {showApiWarning && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertTitle>API Response Unavailable</AlertTitle>
          <AlertDescription>
            The graph query was analyzed successfully, but the detailed answer API returned an error: {apiErrorMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Display the answer */}
      {answer && (
        <Card>
          <CardHeader>
            <CardTitle>Answer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap">{answer}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
