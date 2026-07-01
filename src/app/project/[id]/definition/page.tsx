"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Download, FileText, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { fetchWithAuth } from "@/lib/api";
import { API_BASE_URL } from "@/lib/api"; // I will define this if it's not exported, or just manually fetch it. 
// Wait, I can just use window.open for PDF. Let's see how I can do this cleanly.

export default function DefinitionPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [approving, setApproving] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching definition for project:", projectId);
        const json = await fetchWithAuth(`/project/${projectId}/definition`);
        console.log("Received definition data:", json);
        console.log("Personas array:", json?.personas);
        console.log("Features array:", json?.features);
        setData(json);
      } catch (err) {
        console.error("Error fetching definition:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  const handleDownloadPRD = () => {
    if (!data?.prd) return;
    const blob = new Blob([data.prd], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PRD_${projectId}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async () => {
    const token = localStorage.getItem("token") || "";
    // Note: To download a binary file via fetch with auth:
    try {
      const response = await fetch(`http://localhost:8000/api/project/${projectId}/definition/prd/pdf`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Failed to generate PDF");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `PRD_${projectId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Error downloading PDF");
    }
  };

  const handleApprove = async () => {
    try {
      setApproving(true);
      await fetchWithAuth(`/project/${projectId}/definition/approve`, {
        method: "POST"
      });
      router.push(`/project/${projectId}/prototype`);
    } catch (e) {
      console.error(e);
      setApproving(false);
    }
  };

  const handleGenerateDefinition = async () => {
    try {
      setGenerating(true);
      await fetchWithAuth(`/project/${projectId}/definition/generate`, {
        method: "POST"
      });
      // reload data
      const json = await fetchWithAuth(`/project/${projectId}/definition`);
      setData(json);
    } catch (e) {
      console.error(e);
      alert("Failed to generate definition");
    } finally {
      setGenerating(false);
    }
  };

  const handlePersonaUpdate = async (personaId: string, field: string, value: any) => {
    try {
      await fetchWithAuth(`/project/${projectId}/definition/personas/${personaId}`, {
        method: "PATCH",
        body: JSON.stringify({ [field]: value })
      });
    } catch (e) {
      console.error("Failed to update persona", e);
    }
  };

  const handleFeatureEffortChange = async (featureId: string, newEffort: number) => {
    if (newEffort <= 0) return;
    
    // Optimistic UI update
    setData((prev: any) => {
      const newFeatures = prev.features.map((f: any) => {
        if (f.id === featureId) {
          const rice_score = (f.reach * f.impact * f.confidence) / newEffort;
          let priority_label = "low";
          if (rice_score >= 80) priority_label = "very_high";
          else if (rice_score >= 50) priority_label = "high";
          else if (rice_score >= 20) priority_label = "medium";
          
          return { ...f, effort: newEffort, rice_score, priority_label };
        }
        return f;
      });
      return { ...prev, features: newFeatures };
    });

    try {
      await fetchWithAuth(`/project/${projectId}/definition/features/${featureId}`, {
        method: "PATCH",
        body: JSON.stringify({ effort: newEffort })
      });
    } catch (e) {
      console.error("Failed to update feature effort", e);
    }
  };

  if (loading || generating) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 font-medium">{generating ? "AI is generating Personas and PRD... this takes about 30 seconds." : "Loading definition artifacts..."}</span>
      </div>
    );
  }

  if (!data) {
    return <div className="container py-10">Error loading data.</div>;
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <Button variant="ghost" onClick={() => router.push("/dashboard")} className="mb-6 -ml-4">
        <ArrowLeft className="mr-2 w-4 h-4" /> Back to Dashboard
      </Button>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Definition Engine</h1>
          <p className="text-muted-foreground mt-2">
            Review and edit AI-generated Personas, Feature Prioritization, and PRD.
          </p>
        </div>
        <div className="flex gap-4">
          {(!data.personas || data.personas.length === 0) && (
            <Button onClick={handleGenerateDefinition} disabled={generating} size="lg" variant="default">
              <Sparkles className="mr-2 w-4 h-4" />
              Generate Definition
            </Button>
          )}
          <Button onClick={handleApprove} disabled={approving || data.personas?.length === 0} size="lg" className="bg-green-600 hover:bg-green-700">
            {approving && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
            Approve prioritization & PRD
          </Button>
        </div>
      </div>

      <Tabs defaultValue="personas" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger value="personas" className="text-base">Target Personas</TabsTrigger>
          <TabsTrigger value="features" className="text-base">Feature Prioritization</TabsTrigger>
          <TabsTrigger value="prd" className="text-base">PRD Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="personas">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.personas?.map((persona: any) => (
              <Card key={persona.id} className="shadow-md flex flex-col">
                <CardHeader>
                  <Input 
                    defaultValue={persona.name} 
                    onBlur={(e) => handlePersonaUpdate(persona.id, "name", e.target.value)}
                    className="text-xl font-bold border-transparent hover:border-input focus:border-input mb-1 bg-transparent px-1"
                  />
                  <Input 
                    defaultValue={persona.quote} 
                    onBlur={(e) => handlePersonaUpdate(persona.id, "quote", e.target.value)}
                    className="italic text-muted-foreground border-transparent hover:border-input focus:border-input bg-transparent px-1"
                  />
                </CardHeader>
                <CardContent className="space-y-4 text-sm flex-1">
                  {persona.demographics && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {Object.entries(persona.demographics).map(([key, val]) => (
                        <Badge key={key} variant="secondary" className="capitalize">
                          {key.replace('_', ' ')}: {String(val)}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-primary block mb-1">Scenario: </span>
                    <Textarea 
                      defaultValue={persona.scenario}
                      onBlur={(e) => handlePersonaUpdate(persona.id, "scenario", e.target.value)}
                      className="resize-none border-transparent hover:border-input focus:border-input bg-transparent"
                    />
                  </div>
                  <div>
                    <span className="font-semibold text-primary block mb-1">Goals (comma separated): </span>
                    <Textarea 
                      defaultValue={persona.goals?.join(", ")}
                      onBlur={(e) => handlePersonaUpdate(persona.id, "goals", e.target.value.split(",").map((s:string)=>s.trim()))}
                      className="resize-none border-transparent hover:border-input focus:border-input bg-transparent min-h-[80px]"
                    />
                  </div>
                  <div>
                    <span className="font-semibold text-primary block mb-1">Pain Points (comma separated): </span>
                    <Textarea 
                      defaultValue={persona.pain_points?.join(", ")}
                      onBlur={(e) => handlePersonaUpdate(persona.id, "pain_points", e.target.value.split(",").map((s:string)=>s.trim()))}
                      className="resize-none border-transparent hover:border-input focus:border-input bg-transparent min-h-[80px]"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
            {!data.personas?.length && <p className="text-muted-foreground">No personas generated.</p>}
          </div>
        </TabsContent>

        <TabsContent value="features">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>RICE Prioritization</CardTitle>
              <CardDescription>
                Adjust the <b>Effort</b> value for each feature. The RICE score and Priority label will recalculate automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Feature</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Reach</TableHead>
                    <TableHead className="text-right">Impact</TableHead>
                    <TableHead className="text-right">Confidence</TableHead>
                    <TableHead className="text-right w-24">Effort</TableHead>
                    <TableHead className="text-right font-semibold text-primary">RICE</TableHead>
                    <TableHead>Priority</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...data.features].sort((a:any, b:any) => b.rice_score - a.rice_score).map((f: any) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{f.description}</TableCell>
                      <TableCell className="text-right">{f.reach}</TableCell>
                      <TableCell className="text-right">{f.impact}</TableCell>
                      <TableCell className="text-right">{Math.round(f.confidence * 100)}%</TableCell>
                      <TableCell className="text-right">
                        <Input 
                          type="number" 
                          min="0.1" 
                          step="0.1" 
                          defaultValue={f.effort} 
                          onBlur={(e) => handleFeatureEffortChange(f.id, parseFloat(e.target.value))}
                          className="w-20 text-right ml-auto"
                        />
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">{Math.round(f.rice_score * 10) / 10}</TableCell>
                      <TableCell>
                        <Badge variant={f.priority_label === 'very_high' ? 'destructive' : f.priority_label === 'high' ? 'default' : 'secondary'}>
                          {f.priority_label.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prd">
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Uber-Template PRD</CardTitle>
                <CardDescription>Compiled from Intake Brief, Brand Brief, Personas, and Features.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleDownloadPRD} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" /> .md
                </Button>
                <Button onClick={handleDownloadPDF} variant="outline" size="sm">
                  <FileText className="mr-2 h-4 w-4" /> .pdf
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-slate max-w-none dark:prose-invert">
                <ReactMarkdown>{data.prd || "*No PRD content found.*"}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
