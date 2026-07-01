"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";

export default function WhitespacePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // Run the whitespace engine
      await fetchWithAuth(`/project/${projectId}/whitespace/generate`, {
        method: "POST"
      });
      
      // Then generate the definition artifacts
      await fetchWithAuth(`/project/${projectId}/definition/generate`, {
        method: "POST"
      });
      
      router.push(`/project/${projectId}/definition`);
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
            <Sparkles className="w-16 h-16 text-primary animate-pulse" />
            <p className="text-center text-muted-foreground">
              Ready to find the perfect market gap for your product?
            </p>
            <Button onClick={handleGenerate} size="lg" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Agents are analyzing the market (this takes ~30 seconds)...
                </>
              ) : (
                "Run Whitespace Analysis & Generate PRD"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
