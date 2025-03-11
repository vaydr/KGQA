import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "@/components/file-upload";
import { Database, Share2 } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-transparent bg-clip-text">
            Knowledge Graph Explorer
          </h1>
          <p className="text-muted-foreground text-lg">
            Visualize and explore knowledge graphs with interactive Q&A capabilities
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Sample Graph
              </CardTitle>
              <CardDescription>
                Explore our pre-built knowledge graph example
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => navigate("/graph/sample")}
              >
                View Sample
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Upload Graph
              </CardTitle>
              <CardDescription>
                Upload your own knowledge graph data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}