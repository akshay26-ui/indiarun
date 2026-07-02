"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ArrowLeft, UploadCloud, AlertCircle, FileSpreadsheet, TrendingDown, ArrowRight } from "lucide-react";
import { fetchWithAuth, API_BASE_URL } from "@/lib/api";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar
} from "recharts";

export default function TrackingPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDashboard();
  }, [projectId]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth(`/project/${projectId}/tracking/dashboard`);
      setMetrics(data.metrics || []);
      setAnomalies(data.anomalies || []);
    } catch (e) {
      console.error("Failed to load dashboard:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      alert("Please upload a CSV file.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("token") || "";

    try {
      const response = await fetch(`${API_BASE_URL}/project/${projectId}/tracking/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Upload failed");
      }

      if (data.status === "error") {
        console.error("CSV Errors:", data.errors);
        alert(`Failed to parse CSV. Found ${data.errors.length} row errors. Check console for details.`);
      } else {
        if (data.errors && data.errors.length > 0) {
          console.warn("Partial Success, Errors:", data.errors);
          alert(`Inserted ${data.inserted_count} rows, but found ${data.errors.length} errors.`);
        }
        await fetchDashboard();
      }
    } catch (e: any) {
      console.error(e);
      alert("Upload failed: " + e.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSendToDiscovery = async (anomalyId: string) => {
    try {
      const response = await fetchWithAuth(`/project/${projectId}/tracking/feedback-loop/${anomalyId}/send-to-discovery`, {
        method: "POST"
      });
      alert("Sent to Discovery! This insight will be included in the next Whitespace Engine pass.");
      await fetchDashboard();
    } catch (e) {
      console.error(e);
      alert("Failed to send to discovery");
    }
  };

  const handleRerunWhitespace = async () => {
    try {
      await fetchWithAuth(`/project/${projectId}/tracking/feedback-loop/rerun-whitespace`, {
        method: "POST"
      });
      alert("Project stage updated. Redirecting to Whitespace Engine...");
      router.push(`/project/${projectId}/intake`); // Intake leads to whitespace
    } catch (e) {
      console.error(e);
      alert("Failed to trigger re-run");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 font-medium">Loading tracking data...</span>
      </div>
    );
  }

  if (metrics.length === 0) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-4xl">
        <Button variant="ghost" onClick={() => router.push(`/project/${projectId}/gtm`)} className="mb-6 -ml-4">
          <ArrowLeft className="mr-2 w-4 h-4" /> Back to GTM
        </Button>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Tracking Dashboard</h1>
          <p className="text-muted-foreground mt-2">Upload your post-launch metrics CSV to begin tracking.</p>
        </div>
        
        <Card>
          <CardContent className="p-10">
            <div 
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <UploadCloud className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Drag & Drop your CSV here</h3>
              <p className="text-sm text-muted-foreground mb-6">Required columns: date, dau, mau, retention_rate, nps_score, csat_score, churn_rate, revenue, funnel_conversion_rate</p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
                Browse Files
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-7xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <Button variant="ghost" onClick={() => router.push(`/project/${projectId}/gtm`)} className="mb-4 -ml-4">
            <ArrowLeft className="mr-2 w-4 h-4" /> Back to GTM
          </Button>
          <h1 className="text-3xl font-bold">Post-Launch Metrics</h1>
          <p className="text-muted-foreground mt-1">
            Tracking dashboard and automated anomaly detection.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right mr-4">
            <p className="text-sm font-medium">Data Source</p>
            <p className="text-xs text-muted-foreground">CSV Upload ({metrics.length} points)</p>
          </div>
          <Button onClick={() => router.push('/dashboard')} variant="default">
             Back to Dashboard <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* DAU / MAU */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Active Users (DAU & MAU)</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="date" tick={{fontSize: 10}} />
                    <YAxis tick={{fontSize: 10}} />
                    <RechartsTooltip />
                    <Legend wrapperStyle={{fontSize: "12px"}} />
                    <Line type="monotone" dataKey="dau" name="DAU" stroke="#2563eb" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="mau" name="MAU" stroke="#64748b" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Retention */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Retention Curve (%)</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRetention" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="date" tick={{fontSize: 10}} />
                    <YAxis tick={{fontSize: 10}} />
                    <RechartsTooltip />
                    <Area type="monotone" dataKey="retention_rate" name="Retention %" stroke="#10b981" fillOpacity={1} fill="url(#colorRetention)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="date" tick={{fontSize: 10}} />
                    <YAxis tick={{fontSize: 10}} />
                    <RechartsTooltip />
                    <Area type="monotone" dataKey="revenue" name="Revenue $" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Churn vs Funnel */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Funnel Conv vs Churn (%)</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="date" tick={{fontSize: 10}} />
                    <YAxis tick={{fontSize: 10}} />
                    <RechartsTooltip />
                    <Legend wrapperStyle={{fontSize: "12px"}} />
                    <Bar dataKey="funnel_conversion_rate" name="Funnel Conv %" fill="#3b82f6" />
                    <Bar dataKey="churn_rate" name="Churn %" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* NPS & CSAT */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Customer Satisfaction (NPS & CSAT)</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="date" tick={{fontSize: 10}} />
                    <YAxis yAxisId="left" tick={{fontSize: 10}} domain={[-100, 100]} />
                    <YAxis yAxisId="right" orientation="right" tick={{fontSize: 10}} domain={[0, 100]} />
                    <RechartsTooltip />
                    <Legend wrapperStyle={{fontSize: "12px"}} />
                    <Line yAxisId="left" type="monotone" dataKey="nps_score" name="NPS (-100 to 100)" stroke="#f59e0b" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="csat_score" name="CSAT (0 to 100)" stroke="#14b8a6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Insights Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl font-bold">Insights & Anomalies</h2>
            </div>
            {anomalies.length > 0 && (
              <Button size="sm" variant="outline" onClick={handleRerunWhitespace}>
                Re-run Whitespace Engine
              </Button>
            )}
          </div>
          
          {anomalies.length === 0 ? (
            <Card className="bg-slate-50 dark:bg-slate-900 border-dashed">
              <CardContent className="p-6 text-center text-muted-foreground text-sm">
                No significant anomalies detected in this dataset. Metrics appear stable.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {anomalies.map((anomaly, idx) => (
                <Card key={idx} className="border-l-4 border-l-amber-500">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 justify-between">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase">{anomaly.metric}</p>
                          <p className="text-sm font-medium leading-snug">{anomaly.summary}</p>
                          <p className="text-xs text-muted-foreground mt-2">{anomaly.date}</p>
                        </div>
                      </div>
                      {!anomaly.sent_to_discovery ? (
                        <Button size="sm" variant="secondary" onClick={() => handleSendToDiscovery(anomaly.id)}>
                          Send to Discovery
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" disabled>
                          Sent
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
