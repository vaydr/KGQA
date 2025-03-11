import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { type Question } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";

interface QuestionPanelProps {
  graphId: number;
}

export function QuestionPanel({ graphId }: QuestionPanelProps) {
  const [question, setQuestion] = useState("");
  const { toast } = useToast();

  const { data: questions } = useQuery<Question[]>({
    queryKey: [`/api/graphs/${graphId}/questions`],
  });

  const askQuestion = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ graphId, text: question }),
      });
      if (!res.ok) throw new Error("Failed to ask question");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/graphs/${graphId}/questions`] });
      setQuestion("");
      toast({
        title: "Question submitted",
        description: "Your question has been processed",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit question",
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="w-80 h-screen overflow-y-auto">
      <CardHeader>
        <CardTitle>Questions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question..."
          />
          <Button 
            onClick={() => askQuestion.mutate()}
            disabled={!question || askQuestion.isPending}
          >
            Ask
          </Button>
        </div>

        <div className="space-y-4">
          {questions?.map((q) => (
            <div key={q.id} className="p-3 bg-muted rounded-lg">
              <p className="font-medium">{q.text}</p>
              {q.answer && (
                <>
                  <p className="text-sm mt-2">{q.answer}</p>
                  {q.reasoningPath && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Path: {q.reasoningPath.join(" → ")}
                    </p>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
