"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Loader2, Sparkles, CheckCircle2, ChevronRight } from "lucide-react";
import { fetchWithAuth, API_BASE_URL } from "@/lib/api";

export default function WhitespacePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<string[]>([]);

  const handleGenerate = async () => {
    setLoading(true);
    setSteps([]);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/project/${projectId}/whitespace/generate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });

      if (!response.ok) throw new Error("Failed to generate whitespace");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No reader");

      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.substring(6);
            try {
              const data = JSON.parse(dataStr);
              if (data.type === "reasoning_step") {
                setSteps(prev => [...prev, data.message]);
              } else if (data.type === "final_output") {
                setSteps(prev => [...prev, "Compiling PRD & Personas..."]);
                await fetchWithAuth(`/project/${projectId}/definition/generate`, {
                  method: "POST"
                });
                router.push(`/project/${projectId}/definition`);
                return;
              } else if (data.type === "error") {
                throw new Error(data.message);
              }
            } catch(e) {
              console.error("Parse error", e);
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert("Error generating whitespace. Check backend logs.");
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-2xl">
      <Button variant="ghost" onClick={() => router.push("/dashboard")} className="mb-6 -ml-4">
        <ArrowLeft className="mr-2 w-4 h-4" /> Back to Dashboard
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Whitespace Engine</CardTitle>
          <CardDescription>
            Our AI agents will search the web, analyze competitors, cluster prices into tiers, and extract psychographic drivers using sentiment analysis and Google Trends.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            {!loading && <Sparkles className="w-16 h-16 text-primary animate-pulse" />}
            
            {loading ? (
              <div className="w-full space-y-4">
                <div className="flex items-center space-x-2 text-primary font-medium mb-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Agents are working...</span>
                </div>
                
                <div className="bg-slate-900 text-slate-300 rounded-lg p-4 font-mono text-sm space-y-2 h-64 overflow-y-auto">
                  {steps.map((step, i) => (
                    <div key={i} className="flex items-start">
                      <ChevronRight className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0 text-slate-500" />
                      <span>{step}</span>
                    </div>
                  ))}
                  <div className="animate-pulse">_</div>
                </div>
              </div>
            ) : (
              <>
                <p className="text-center text-muted-foreground">
                  Ready to find the perfect market gap for your product?
                </p>
                <Button onClick={handleGenerate} size="lg" className="w-full">
                  Run Whitespace Analysis & Generate PRD
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
