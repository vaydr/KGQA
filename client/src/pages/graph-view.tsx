import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { GraphViewer } from "@/components/graph-viewer";
import { QuestionPanel, ForceGraphContainerContext } from "@/components/question-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { Graph } from "@shared/schema";
import { useRef, useState, useEffect } from "react";
import type { ForceGraphContainerRef } from "@/components/ForceGraphContainer";

export default function GraphView() {
  const { id } = useParams<{ id: string }>();
  const graphId = id === "sample" ? "sample" : parseInt(id);
  
  // Create ref to pass to ForceGraphContainer
  const forceGraphContainerRef = useRef<ForceGraphContainerRef>(null);
  // Create state to track the ref's current value for the context
  const [graphContainerRef, setGraphContainerRef] = useState<ForceGraphContainerRef | null>(null);
  
  // Update the state when the ref changes
  useEffect(() => {
    // Check if the ref has changed and update the state
    if (forceGraphContainerRef.current !== graphContainerRef) {
      setGraphContainerRef(forceGraphContainerRef.current);
    }
  });

  const { data: graph, isLoading, error } = useQuery<Graph>({
    queryKey: [`/api/graphs/${graphId}`],
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load graph data</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!graph) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Graph not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <ForceGraphContainerContext.Provider value={graphContainerRef}>
      <div className="h-screen flex">
        <div className="flex-1 relative">
          <GraphViewer ref={forceGraphContainerRef} graph={graph} />
        </div>
        <div className="w-96 border-l">
          <QuestionPanel graphId={graphId} />
        </div>
      </div>
    </ForceGraphContainerContext.Provider>
  );
}