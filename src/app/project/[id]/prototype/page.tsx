"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Play, ExternalLink, Download, AlertTriangle } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";
import { API_BASE_URL } from "@/lib/api";

export default function PrototypePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [prototype, setPrototype] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [generating, setGenerating] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPrototype();
  }, [projectId]);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const fetchPrototype = async () => {
    try {
      const data = await fetchWithAuth(`/project/${projectId}/prototype`);
      if (data && Object.keys(data).length > 0) {
        setPrototype(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const generatePrototype = async () => {
    setGenerating(true);
    setLogs([]);
    const token = localStorage.getItem("token") || "";

    try {
      const response = await fetch(`${API_BASE_URL}/project/${projectId}/prototype/generate`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const parsed = JSON.parse(line.slice(6));
                if (parsed.type === "reasoning_step") {
                  setLogs((prev) => [...prev, parsed.message]);
                } else if (parsed.type === "final_output") {
                  await fetchPrototype();
                } else if (parsed.type === "error") {
                  setLogs((prev) => [...prev, `ERROR: ${parsed.message}`]);
                }
              } catch {
                // Ignore parse errors from incomplete chunks
              }
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
      setLogs((prev) => [...prev, "ERROR: Connection failed."]);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    const token = localStorage.getItem("token") || "";
    try {
      const response = await fetch(`${API_BASE_URL}/project/${projectId}/prototype/download`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to download");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prototype_${projectId}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Error downloading code.");
    }
  };

  const proceedToGtm = async () => {
    const token = localStorage.getItem("token") || "";
    try {
      await fetch(`${API_BASE_URL}/api/project/${projectId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ current_stage: "gtm" })
      });
      router.push(`/project/${projectId}/gtm`);
    } catch (e) {
      console.error(e);
      alert("Failed to advance stage");
    }
  };

  const handleDownloadSpec = async () => {
    const token = localStorage.getItem("token") || "";
    try {
      const response = await fetch(`${API_BASE_URL}/project/${projectId}/prototype/download-spec`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to download spec");
      const text = await response.text();
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `spec_sheet_${projectId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Error downloading spec sheet.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 font-medium">Loading prototype engine...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <Button variant="ghost" onClick={() => router.push(`/project/${projectId}/definition`)} className="mb-6 -ml-4">
        <ArrowLeft className="mr-2 w-4 h-4" /> Back to Definition
      </Button>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Prototype Engine</h1>
          <p className="text-muted-foreground mt-2">
            AI-generated structural prototypes based on your PRD.
          </p>
        </div>
        {prototype && (
          <Button onClick={proceedToGtm} size="lg" className="bg-green-600 hover:bg-green-700">
            Continue to GTM
          </Button>
        )}
      </div>

      {!prototype ? (
        <Card className="max-w-2xl mx-auto shadow-md border-primary/20">
          <CardHeader className="text-center pb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-primary ml-1" />
            </div>
            <CardTitle className="text-2xl">Ready to Build</CardTitle>
            <p className="text-muted-foreground mt-2">
              The engine will analyze your PRD and automatically generate {generating ? "your prototype..." : "a functioning prototype."}
            </p>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {!generating && (
              <Button onClick={generatePrototype} size="lg" className="w-full text-lg h-14">
                Launch Prototype Engine
              </Button>
            )}

            {generating && (
              <div className="w-full bg-slate-950 rounded-md p-4 mt-4 font-mono text-sm text-green-400 h-64 overflow-y-auto">
                <div className="flex items-center text-slate-400 mb-4 border-b border-slate-800 pb-2">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  System initializing...
                </div>
                {logs.map((log, i) => (
                  <div key={i} className="mb-2">
                    <span className="text-slate-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
                    {log}
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {prototype.type === 'physical' && prototype.concept_stage_disclaimer && (
            <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-400 dark:border-amber-700 text-amber-800 dark:text-amber-200 p-4 rounded-md flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold">Concept visualization — not an engineering-validated prototype.</h4>
                <p className="text-sm mt-1">This generated image and spec sheet are illustrative concepts only. Do not use for manufacturing without engineering review.</p>
              </div>
            </div>
          )}

          {prototype.type === 'physical' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Concept Render</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md overflow-hidden border">
                    <img 
                      src={prototype.concept_image_url || "https://placehold.co/800x600/png?text=Render+Unavailable,+Try+Again"} 
                      alt="Physical Concept Render" 
                      className="w-full h-auto object-cover"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Structural Spec Sheet</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {prototype.spec_sheet ? (
                    <>
                      <div>
                        <h4 className="font-semibold text-primary">Materials</h4>
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{prototype.spec_sheet.materials}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-primary">Format & Dimensions</h4>
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{prototype.spec_sheet.format_dimensions}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-primary">Packaging</h4>
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{prototype.spec_sheet.packaging}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-primary">Manufacturing Notes</h4>
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{prototype.spec_sheet.manufacturing_notes}</p>
                      </div>
                      <div className="pt-4 border-t border-border mt-4">
                        <Button onClick={handleDownloadSpec} variant="outline" className="w-full">
                          <Download className="w-4 h-4 mr-2" />
                          Download Spec Sheet
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Spec sheet failed to generate.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-card p-4 rounded-md border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Play className="w-5 h-5 text-primary ml-1" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Software Scaffold Deployed</h3>
                    <p className="text-sm text-muted-foreground truncate max-w-md">
                      {prototype.preview_url === 'pending_download' ? 'Vercel deploy skipped (no token). Ready for local run.' : prototype.preview_url}
                    </p>
                    {prototype.capped_features && (
                      <p className="text-xs text-amber-500 mt-1">
                        Note: Auto-scaffolding is capped at the top 8 must-have features by RICE score. Lower-priority features were not included.
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleDownload} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download Code (.zip)
                  </Button>
                  {prototype.preview_url && prototype.preview_url !== 'pending_download' && (
                    <Button onClick={() => window.open(prototype.preview_url, "_blank")}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Preview
                    </Button>
                  )}
                </div>
              </div>

              {prototype.preview_url && prototype.preview_url !== 'pending_download' && (
                <Card className="overflow-hidden border shadow-sm">
                  <div className="bg-slate-100 dark:bg-slate-900 border-b p-2 flex items-center gap-2">
                    <div className="flex gap-1.5 ml-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="mx-auto bg-white dark:bg-slate-800 text-xs px-3 py-1 rounded text-muted-foreground font-mono">
                      {prototype.preview_url}
                    </div>
                  </div>
                  <iframe 
                    src={prototype.preview_url} 
                    className="w-full h-[600px] border-none bg-white"
                    title="Software Preview"
                  />
                </Card>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
