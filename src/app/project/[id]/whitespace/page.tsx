"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Loader2, Sparkles, ChevronRight, BarChart3, AlertTriangle, Lightbulb, Link as LinkIcon } from "lucide-react";
import { fetchWithAuth, API_BASE_URL } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";

export default function WhitespacePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [initLoading, setInitLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetchWithAuth(`/project/${projectId}/whitespace`);
        if (res.brief) {
          setData(res);
        }
      } catch (err) {
        console.error("Failed to fetch whitespace data", err);
      } finally {
        setInitLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

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
                setSteps(prev => [...prev, "Refreshing dashboard..."]);
                // Refresh data
                const res = await fetchWithAuth(`/project/${projectId}/whitespace`);
                setData(res);
                setLoading(false);
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

  if (initLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 font-medium">Loading market analysis...</span>
      </div>
    );
  }

  // Render the dashboard if we have a Brand Brief
  if (data && data.brief) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-5xl">
        <Button variant="ghost" onClick={() => router.push("/dashboard")} className="mb-6 -ml-4">
          <ArrowLeft className="mr-2 w-4 h-4" /> Back to Dashboard
        </Button>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Brand Brief</h1>
            <p className="text-muted-foreground mt-2">Market positioning, target insights, and recommended attributes.</p>
          </div>
          <div className="flex gap-4">
             <Button variant="outline" onClick={handleGenerate}>Regenerate</Button>
             <Button onClick={() => router.push(`/project/${projectId}/definition`)}>Proceed to PRD</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg"><BarChart3 className="mr-2 w-5 h-5 text-blue-500" /> Whitespace Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert">
                <ReactMarkdown>{data.brief.whitespace_summary}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg"><Lightbulb className="mr-2 w-5 h-5 text-yellow-500" /> Psychographic Target</CardTitle>
            </CardHeader>
            <CardContent>
              {data.brief.psychographic_target ? (
                <div className="space-y-4">
                  <div>
                    <span className="font-semibold text-muted-foreground block text-sm uppercase tracking-wide">Primary Driver</span>
                    <Badge className="mt-1 px-3 py-1 text-sm bg-primary/20 text-primary hover:bg-primary/30 border-none capitalize">{data.brief.psychographic_target.driver}</Badge>
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground block text-sm uppercase tracking-wide">Evidence</span>
                    <p className="mt-1 text-sm">{data.brief.psychographic_target.evidence_summary}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No psychographic data available.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {data.brief.brand_credibility_score !== null && (
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Brand Credibility Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="text-4xl font-bold text-primary">{data.brief.brand_credibility_score}/10</div>
                <p className="text-sm text-muted-foreground">Plausibility rating of your brand pivoting into this new category based on public perception.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {data.brief.price_tier_map?.tiers && (
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Price Tier Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                {data.brief.price_tier_map.tiers.map((tier: any, i: number) => (
                  <div key={i} className={`flex-1 p-4 rounded-lg border ${tier.recommended ? 'bg-primary/5 border-primary shadow-sm' : 'bg-card'}`}>
                    <div className="flex justify-between items-center mb-2">
                       <h3 className="font-semibold capitalize">{tier.name}</h3>
                       {tier.recommended && <Badge variant="default" className="text-xs">Recommended</Badge>}
                    </div>
                    <div className="text-2xl font-bold">${tier.min} - ${tier.max}</div>
                    <div className="text-sm text-muted-foreground mt-1">{tier.count} competitors</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg"><AlertTriangle className="mr-2 w-5 h-5 text-red-500" /> Failure Simulation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.failure_risks?.map((risk: any, i: number) => (
                <div key={i} className="border-l-2 border-red-500 pl-4 py-1">
                  <h4 className="font-semibold text-sm">Similar to: {risk.precedent_name}</h4>
                  <p className="text-sm mt-1"><strong>Risk:</strong> {risk.similarity_reason}</p>
                  <p className="text-sm mt-1 text-muted-foreground"><strong>Mitigation:</strong> {risk.mitigation_suggestion}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg"><Sparkles className="mr-2 w-5 h-5 text-indigo-500" /> Recommended Attributes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.brief.recommended_attributes?.map((attr: any, i: number) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-900 rounded-md p-3">
                  <h4 className="font-semibold text-sm text-indigo-600 dark:text-indigo-400">{attr.attribute}</h4>
                  <p className="text-sm mt-1">{attr.rationale}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {data.citations?.length > 0 && (
          <Card className="mb-6 bg-slate-50 dark:bg-slate-950 border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-sm font-medium"><LinkIcon className="mr-2 w-4 h-4" /> Source Citations ({data.citations.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-xs text-muted-foreground space-y-1">
                {data.citations.map((c: any, i: number) => (
                  <li key={i} className="truncate">
                    <span className="font-medium">[{c.field_referenced}]</span> {c.source_url}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Render the Generate UI if no Brand Brief
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
                  Run Whitespace Analysis
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
