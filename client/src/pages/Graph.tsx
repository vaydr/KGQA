import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { GraphVisualization } from "@/components/GraphVisualization";
import { QuestionPanel } from "@/components/QuestionPanel";
import { type Graph } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function Graph() {
  const { id } = useParams<{ id: string }>();
  const graphId = parseInt(id);

  const { data: graph, isLoading } = useQuery<Graph>({
    queryKey: [`/api/graphs/${graphId}`],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen p-4">
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!graph) {
    return <div>Graph not found</div>;
  }

  return (
    <div className="min-h-screen flex">
      <div className="flex-grow">
        <GraphVisualization graph={graph} />
      </div>
      <QuestionPanel graphId={graphId} />
    </div>
  );
}
