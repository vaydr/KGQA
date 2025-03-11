import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onSuccess: (graphId: number) => void;
}

export function FileUpload({ onSuccess }: FileUploadProps) {
  const { toast } = useToast();

  const handleUpload = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/graphs", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const data = await res.json();
      onSuccess(data.id);
      
      toast({
        title: "Success",
        description: "Graph uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload graph",
        variant: "destructive",
      });
    }
  }, [onSuccess, toast]);

  return (
    <div className="flex flex-col items-center">
      <input
        type="file"
        id="file-upload"
        className="hidden"
        accept=".json"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
      />
      <label htmlFor="file-upload">
        <Button asChild>
          <span>Choose File</span>
        </Button>
      </label>
      <p className="text-sm text-muted-foreground mt-2">
        Upload a JSON file containing triples data
      </p>
    </div>
  );
}
