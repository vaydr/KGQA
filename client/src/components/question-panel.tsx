import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SendHorizontal } from "lucide-react";

interface QuestionPanelProps {
  graphId: number | "sample";
}

export function QuestionPanel({ graphId }: QuestionPanelProps) {
  const [question, setQuestion] = useState("");
  const { toast } = useToast();

  const { mutate: askQuestion, isPending } = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/graphs/${graphId}/answer`, {
        text: question
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Answer",
        description: data.answer
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get answer"
      });
    }
  });

  return (
    <div className="h-full p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Ask a Question</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter your question..."
              disabled={isPending}
            />
            <Button 
              onClick={() => askQuestion()}
              disabled={!question || isPending}
            >
              <SendHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
