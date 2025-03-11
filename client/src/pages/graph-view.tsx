import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { GraphViewer } from "@/components/graph-viewer";
import { QuestionPanel } from "@/components/question-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function GraphView() {
  const { id } = useParams<{ id: string }>();
  const graphId = id === "sample" ? "sample" : parseInt(id);

  const { data: graph, isLoading, error } = useQuery({
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

  return (
    <div className="h-screen flex">
      <div className="flex-1 relative">
        <GraphViewer graph={graph} />
      </div>
      <div className="w-96 border-l">
        <QuestionPanel graphId={graphId} />
      </div>
    </div>
  );
}
