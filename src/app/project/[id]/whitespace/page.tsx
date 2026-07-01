"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ChevronDown, ChevronRight, Loader2, ArrowLeft } from "lucide-react";

export default function WhitespacePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [steps, setSteps] = useState<any[]>([]);
  const [finalOutput, setFinalOutput] = useState<any>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    // We cannot use standard EventSource easily if we need to pass Authorization headers natively, 
    // but the backend endpoint doesn't seem to enforce auth currently for the mock. 
    // Assuming we can just hit it using fetch and read the stream.
    
    let isMounted = true;
    
    const startStream = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`http://localhost:8000/api/project/${projectId}/whitespace`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.body) return;
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          
          let eventType = "";
          let eventData = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.substring(7).trim();
            } else if (line.startsWith("data: ")) {
              eventData = line.substring(6).trim();
              if (eventType === "reasoning_step") {
                const parsed = JSON.parse(eventData);
                if (isMounted) {
                  setSteps(prev => {
                    if (prev.find(s => s.payload.step === parsed.payload.step)) return prev;
                    return [...prev, parsed];
                  });
                }
              } else if (eventType === "final_output") {
                const parsed = JSON.parse(eventData);
                if (isMounted) {
                  setFinalOutput(parsed);
                  setIsProcessing(false);
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("Stream error", err);
        setIsProcessing(false);
      }
    };

    startStream();
    return () => { isMounted = false; };
  }, [projectId]);

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <Button variant="ghost" onClick={() => router.push("/dashboard")} className="mb-6 -ml-4">
        <ArrowLeft className="mr-2 w-4 h-4" /> Back to Dashboard
      </Button>

      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-3xl font-bold">Agent Workspace</h1>
        {isProcessing && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
      </div>

      <div className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold">Reasoning Log</h2>
        {steps.map((step, idx) => {
          const isExpanded = expandedStep === idx;
          return (
            <Card key={idx} className="overflow-hidden">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedStep(isExpanded ? null : idx)}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <span className="font-medium text-sm text-muted-foreground">Step {step.payload.step}</span>
                  <span className="font-semibold">{step.payload.title}</span>
                </div>
              </div>
              {isExpanded && (
                <div className="px-11 pb-4 text-muted-foreground text-sm">
                  {step.payload.content}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {finalOutput && (
        <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
          <h2 className="text-2xl font-bold mb-4 text-primary">Final Output: Brand Brief</h2>
          <Card className="border-primary/50 shadow-lg">
            <CardHeader>
              <CardTitle>Whitespace Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg">{finalOutput.payload.whitespace_summary}</p>
              
              <div>
                <h3 className="font-semibold mb-2 text-primary">Recommended Attributes</h3>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  {finalOutput.payload.recommended_attributes.map((attr: string, i: number) => (
                    <li key={i}>{attr}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-primary">Target Psychographic</h3>
                <p className="font-medium">{finalOutput.payload.psychographic_target.driver}</p>
                <p className="text-sm text-muted-foreground">{finalOutput.payload.psychographic_target.evidence_summary}</p>
              </div>

            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
