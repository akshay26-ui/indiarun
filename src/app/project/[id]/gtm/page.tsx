"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, BarChart, Save, Sparkles, FileText, Download, ArrowRight, AlertTriangle } from "lucide-react";
import { fetchWithAuth, API_BASE_URL } from "@/lib/api";

export default function GTMPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [savingUE, setSavingUE] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [ueReasoning, setUeReasoning] = useState<string | null>(null);
  const [planReasoning, setPlanReasoning] = useState<string | null>(null);
  
  // -- Unit Economics State --
  const [cac, setCac] = useState<number>(0);
  const [arpu, setArpu] = useState<number>(0);
  const [serviceDeliveryCost, setServiceDeliveryCost] = useState<number>(0);
  const [customerLifetimeMonths, setCustomerLifetimeMonths] = useState<number>(0);
  const [grossMargin, setGrossMargin] = useState<number>(0);
  const [ltv, setLtv] = useState<number>(0);
  const [cacPaybackMonths, setCacPaybackMonths] = useState<number>(0);
  const [ltvCacRatio, setLtvCacRatio] = useState<number>(0);
  const [verdict, setVerdict] = useState<string | null>(null);

  // -- GTM Plan State --
  const [plan, setPlan] = useState({
    objective: "",
    target_market: "",
    positioning: "",
    gtm_motion: "",
    packaging_strategy: "",
    key_differentiators: "",
    success_metrics: ""
  });

  useEffect(() => {
    fetchData();
  }, [projectId]);

  // Client-side live recompute
  useEffect(() => {
    const margin = arpu - serviceDeliveryCost;
    const computedLtv = margin * customerLifetimeMonths;
    const payback = margin > 0 ? (cac / margin) : 9999;
    const ratio = cac > 0 ? (computedLtv / cac) : 9999;
    
    setGrossMargin(margin);
    setLtv(computedLtv);
    setCacPaybackMonths(Number(payback.toFixed(2)));
    setLtvCacRatio(Number(ratio.toFixed(2)));
  }, [cac, arpu, serviceDeliveryCost, customerLifetimeMonths]);

  const fetchData = async () => {
    try {
      let ueData = await fetchWithAuth(`/project/${projectId}/gtm/unit-economics`);
      if (!ueData || !ueData.id) {
        // Auto-generate UE with defaults
        const token = localStorage.getItem("token") || "";
        setSavingUE(true);
        try {
          // Fire and forget the UE save so it populates something
          await fetch(`${API_BASE_URL}/project/${projectId}/gtm/unit-economics`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ cac: 50, arpu: 150, service_delivery_cost: 20, customer_lifetime_months: 24 })
          });
          // re-fetch
          ueData = await fetchWithAuth(`/project/${projectId}/gtm/unit-economics`);
        } catch (e) {
          console.error("Auto UE save failed", e);
        } finally {
          setSavingUE(false);
        }
      }

      if (ueData && ueData.id) {
        setCac(ueData.cac);
        setArpu(ueData.arpu);
        setServiceDeliveryCost(ueData.service_delivery_cost);
        setCustomerLifetimeMonths(ueData.customer_lifetime_months);
        setVerdict(ueData.verdict);
      } else {
        // Fallback to UI defaults if auto-save completely failed
        setCac(50);
        setArpu(150);
        setServiceDeliveryCost(20);
        setCustomerLifetimeMonths(24);
      }
      
      let planData = await fetchWithAuth(`/project/${projectId}/gtm/plan`);
      if (!planData || !planData.id) {
         setGeneratingPlan(true);
         const token = localStorage.getItem("token") || "";
         try {
           await fetch(`${API_BASE_URL}/project/${projectId}/gtm/plan/generate`, {
             method: "POST",
             headers: { "Authorization": `Bearer ${token}` }
           });
           planData = await fetchWithAuth(`/project/${projectId}/gtm/plan`);
         } catch (e) {
           console.error("Auto plan gen failed", e);
         } finally {
           setGeneratingPlan(false);
         }
      }

      if (planData && planData.id) {
        setPlan({
          objective: planData.objective || "",
          target_market: planData.target_market || "",
          positioning: planData.positioning || "",
          gtm_motion: planData.gtm_motion || "",
          packaging_strategy: planData.packaging_strategy || "",
          key_differentiators: planData.key_differentiators ? planData.key_differentiators.join(", ") : "",
          success_metrics: planData.success_metrics ? planData.success_metrics.join(", ") : ""
        });
      }
    } catch (e) {
      console.error("Failed to load GTM data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUE = async () => {
    setSavingUE(true);
    setUeReasoning(null);
    const token = localStorage.getItem("token") || "";
    try {
      const response = await fetch(`${API_BASE_URL}/project/${projectId}/gtm/unit-economics`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ cac, arpu, service_delivery_cost: serviceDeliveryCost, customer_lifetime_months: customerLifetimeMonths })
      });
      
      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let buffer = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.replace("data: ", "");
            try {
              const data = JSON.parse(dataStr);
              if (data.type === "reasoning_step") {
                setUeReasoning(data.message);
              } else if (data.type === "final_output") {
                setGrossMargin(data.data.gross_margin);
                setLtv(data.data.ltv);
                setCacPaybackMonths(data.data.cac_payback_months);
                setLtvCacRatio(data.data.ltv_cac_ratio);
                setVerdict(data.data.verdict);
                setUeReasoning(null);
              } else if (data.type === "error") {
                alert("Error: " + data.message);
                setUeReasoning(null);
              }
            } catch {}
          }
        }
      }
    } catch (e) {
      console.error(e);
      alert("Failed to analyze viability.");
      setUeReasoning(null);
    } finally {
      setSavingUE(false);
    }
  };

  const handleGeneratePlan = async () => {
    setGeneratingPlan(true);
    setPlanReasoning(null);
    const token = localStorage.getItem("token") || "";
    try {
      const response = await fetch(`${API_BASE_URL}/project/${projectId}/gtm/plan/generate`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let buffer = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.replace("data: ", "");
            try {
              const data = JSON.parse(dataStr);
              if (data.type === "reasoning_step") {
                setPlanReasoning(data.message);
              } else if (data.type === "final_output") {
                const pd = data.data;
                setPlan({
                  objective: pd.objective || "",
                  target_market: pd.target_market || "",
                  positioning: pd.positioning || "",
                  gtm_motion: pd.gtm_motion || "",
                  packaging_strategy: pd.packaging_strategy || "",
                  key_differentiators: pd.key_differentiators ? pd.key_differentiators.join(", ") : "",
                  success_metrics: pd.success_metrics ? pd.success_metrics.join(", ") : ""
                });
                setPlanReasoning(null);
              } else if (data.type === "error") {
                alert("Error: " + data.message);
                setPlanReasoning(null);
              }
            } catch {}
          }
        }
      }
    } catch (e) {
      console.error(e);
      setPlanReasoning(null);
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleSavePlan = async () => {
    setSavingPlan(true);
    const token = localStorage.getItem("token") || "";
    try {
      const payload = {
        objective: plan.objective,
        target_market: plan.target_market,
        positioning: plan.positioning,
        gtm_motion: plan.gtm_motion,
        packaging_strategy: plan.packaging_strategy,
        key_differentiators: plan.key_differentiators.split(",").map(s => s.trim()).filter(Boolean),
        success_metrics: plan.success_metrics.split(",").map(s => s.trim()).filter(Boolean)
      };
      
      const res = await fetch(`${API_BASE_URL}/project/${projectId}/gtm/plan`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed");
      alert("GTM Plan saved.");
    } catch (e) {
      alert("Failed to save plan.");
    } finally {
      setSavingPlan(false);
    }
  };

  const handleDownloadPDF = () => {
    const token = localStorage.getItem("token") || "";
    // We can't easily fetch a blob and download it cleanly with auth headers via standard <a> tag,
    // so we fetch it as a blob and create an object URL
    fetch(`${API_BASE_URL}/project/${projectId}/gtm/launch-pack-pdf`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Launch_Pack.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    })
    .catch(() => alert("Failed to download PDF"));
  };

  const handleContinue = async () => {
    const token = localStorage.getItem("token") || "";
    await fetch(`${API_BASE_URL}/project/${projectId}/gtm/continue-tracking`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    });
    router.push(`/project/${projectId}/tracking`);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Loading GTM Data...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-5xl">
      <Button variant="ghost" onClick={() => router.push(`/project/${projectId}/prototype`)} className="mb-6 -ml-4">
        <ArrowLeft className="mr-2 w-4 h-4" /> Back to Prototype
      </Button>

      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold">Go-To-Market & Unit Economics</h1>
          <p className="text-muted-foreground mt-2">
            Build your launch plan and validate your financial viability.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="w-4 h-4 mr-2" />
            Launch Pack PDF
          </Button>
          <Button onClick={handleContinue}>
            Continue to Tracking
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="economics" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="economics">Unit Economics</TabsTrigger>
          <TabsTrigger value="plan">GTM Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="economics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-primary/20 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <BarChart className="w-5 h-5 mr-2 text-primary" />
                  Raw Inputs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Customer Acquisition Cost (CAC) $</Label>
                  <Input 
                    type="number" 
                    value={cac} 
                    onChange={(e) => setCac(Math.max(0, Number(e.target.value)))} 
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Average Revenue Per User (ARPU) $</Label>
                  <Input 
                    type="number" 
                    value={arpu} 
                    onChange={(e) => setArpu(Math.max(0, Number(e.target.value)))} 
                    min={0}
                  />
                  {cac > arpu && cac > 0 && arpu > 0 && (
                    <div className="flex items-center text-amber-600 text-sm mt-1 font-medium bg-amber-50 p-2 rounded">
                      <AlertTriangle className="w-4 h-4 mr-1" /> Wait, is your CAC higher than your ARPU? 
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Service Delivery Cost (COGS) $</Label>
                  <Input 
                    type="number" 
                    value={serviceDeliveryCost} 
                    onChange={(e) => setServiceDeliveryCost(Math.max(0, Number(e.target.value)))} 
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Customer Lifetime (Months)</Label>
                  <Input 
                    type="number" 
                    value={customerLifetimeMonths} 
                    onChange={(e) => setCustomerLifetimeMonths(Math.max(0, Number(e.target.value)))} 
                    min={0}
                  />
                </div>
              </CardContent>
              <CardFooter className="pt-2 flex flex-col items-stretch gap-2">
                <Button onClick={handleSaveUE} disabled={savingUE} className="w-full">
                  {savingUE ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save & Analyze Viability
                </Button>
                {ueReasoning && (
                  <p className="text-xs text-center text-primary font-medium animate-pulse">{ueReasoning}</p>
                )}
              </CardFooter>
            </Card>

            <div className="space-y-6">
              <Card className="border bg-slate-50 dark:bg-slate-900/50">
                <CardHeader>
                  <CardTitle className="text-lg">Computed Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-slate-950 p-4 rounded-md border shadow-sm">
                      <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1 block">Gross Margin</span>
                      <span className="text-2xl font-bold">${grossMargin.toFixed(2)}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-950 p-4 rounded-md border shadow-sm">
                      <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1 block">LTV</span>
                      <span className="text-2xl font-bold">${ltv.toFixed(2)}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-950 p-4 rounded-md border shadow-sm">
                      <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1 block">CAC Payback</span>
                      <span className="text-2xl font-bold">{cacPaybackMonths === 9999 ? "∞" : cacPaybackMonths} mos</span>
                    </div>
                    <div className="bg-white dark:bg-slate-950 p-4 rounded-md border shadow-sm">
                      <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1 block">LTV:CAC</span>
                      <span className={`text-2xl font-bold ${ltvCacRatio >= 3 ? 'text-green-600' : 'text-amber-500'}`}>
                        {ltvCacRatio === 9999 ? "∞" : ltvCacRatio}x
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {verdict && (
                <Card className="border border-primary/30 bg-primary/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center text-primary">
                      <Sparkles className="w-5 h-5 mr-2" /> AI Viability Verdict
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm dark:prose-invert max-w-none">{verdict}</div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="plan">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-primary" />
                  GTM Plan
                </CardTitle>
              </div>
              <Button onClick={handleGeneratePlan} disabled={generatingPlan} variant="secondary">
                {generatingPlan ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Auto-Generate from PRD
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {planReasoning && (
                <div className="bg-primary/10 text-primary p-3 rounded-md text-sm font-medium animate-pulse mb-4 text-center">
                  {planReasoning}
                </div>
              )}
              <div className="grid gap-4">
                <div>
                  <Label>Objective</Label>
                  <Input value={plan.objective} onChange={e => setPlan({...plan, objective: e.target.value})} />
                </div>
                <div>
                  <Label>Target Market</Label>
                  <Input value={plan.target_market} onChange={e => setPlan({...plan, target_market: e.target.value})} />
                </div>
                <div>
                  <Label>Positioning</Label>
                  <Textarea value={plan.positioning} onChange={e => setPlan({...plan, positioning: e.target.value})} />
                </div>
                <div>
                  <Label>GTM Motion</Label>
                  <Input value={plan.gtm_motion} onChange={e => setPlan({...plan, gtm_motion: e.target.value})} />
                </div>
                <div>
                  <Label>Packaging Strategy</Label>
                  <Input value={plan.packaging_strategy} onChange={e => setPlan({...plan, packaging_strategy: e.target.value})} />
                </div>
                <div>
                  <Label>Key Differentiators (comma separated)</Label>
                  <Input value={plan.key_differentiators} onChange={e => setPlan({...plan, key_differentiators: e.target.value})} />
                </div>
                <div>
                  <Label>Success Metrics (comma separated)</Label>
                  <Input value={plan.success_metrics} onChange={e => setPlan({...plan, success_metrics: e.target.value})} />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSavePlan} disabled={savingPlan}>
                {savingPlan ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Plan
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
