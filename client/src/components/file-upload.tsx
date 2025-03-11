import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Upload } from "lucide-react";

export function FileUpload() {
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await apiRequest("POST", "/api/graphs", formData);
      const data = await res.json();
      toast({
        title: "Success",
        description: "Graph uploaded successfully"
      });
      navigate(`/graph/${data.id}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload graph data"
      });
    }
  };

  return (
    <div className="space-y-4">
      <Input
        ref={fileRef}
        type="file"
        accept=".json"
        onChange={handleUpload}
        className="hidden"
      />
      <Button 
        className="w-full"
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="mr-2 h-4 w-4" />
        Upload JSON
      </Button>
    </div>
  );
}