"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowUp, Loader2, CheckCircle2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export default function IntakePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: "assistant", content: "Hi! I'm your Intake Agent. Let's start with a simple question: What is the core idea of your product?" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [brief, setBrief] = useState<any>({
    idea_summary: null,
    problem_statement: null,
    target_user: null,
    product_type: null,
    known_competitors: [],
    category: null,
    budget_constraint: null,
    timeline_constraint: null,
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userMessage = { role: "user", content: inputValue };
    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputValue("");
    setLoading(true);

    try {
      const data = await fetchWithAuth(`/project/${params.id}/intake/chat`, {
        method: "POST",
        body: JSON.stringify({ history: newHistory }),
      });
      
      setMessages([...newHistory, { role: "assistant", content: data.agent_reply }]);
      setBrief(data.brief);
    } catch (err) {
      console.error(err);
      setMessages([...newHistory, { role: "assistant", content: "Sorry, an error occurred while processing your response." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    try {
      setLoading(true);
      await fetchWithAuth(`/project/${params.id}`, {
        method: "PUT",
        body: JSON.stringify({ current_stage: "whitespace" }),
      });
      router.push(`/project/${params.id}/whitespace`);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const isComplete = brief.idea_summary && brief.problem_statement && brief.target_user && brief.product_type;

  const renderBriefField = (label: string, value: any) => {
    const isFilled = value && (Array.isArray(value) ? value.length > 0 : value.toString().trim() !== "");
    return (
      <div className={`p-3 rounded-lg border transition-colors ${isFilled ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-dashed text-muted-foreground"}`}>
        <div className="text-xs font-semibold uppercase tracking-wider mb-1 flex items-center justify-between">
          {label}
          {isFilled && <CheckCircle2 className="w-3 h-3 text-primary" />}
        </div>
        <div className="text-sm">
          {!isFilled ? "Pending..." : Array.isArray(value) ? value.join(", ") : value}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Left side: Chat */}
      <div className="w-1/2 flex flex-col border-r">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Intake Conversation</h2>
          <p className="text-sm text-muted-foreground">Answer a few questions to build your product brief.</p>
        </div>
        
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-xl px-4 py-2 ${
                  msg.role === "user" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted"
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-xl px-4 py-2 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Agent is thinking...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your answer here..."
              className="pr-12 rounded-full bg-muted/50 focus-visible:ring-1"
              disabled={loading}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="absolute right-1 w-8 h-8 rounded-full" 
              disabled={!inputValue.trim() || loading}
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Right side: Live Brief */}
      <div className="w-1/2 flex flex-col bg-muted/10">
        <div className="p-4 border-b flex justify-between items-center bg-background">
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              Live Product Brief
              {isComplete && <Badge variant="default" className="bg-green-500 hover:bg-green-600">Ready</Badge>}
            </h2>
          </div>
          <Button onClick={handleContinue} disabled={!isComplete || loading}>
            Looks good, continue
          </Button>
        </div>
        
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4 max-w-lg mx-auto">
            {renderBriefField("Idea Summary", brief.idea_summary)}
            {renderBriefField("Problem Statement", brief.problem_statement)}
            {renderBriefField("Target User", brief.target_user)}
            {renderBriefField("Product Type", brief.product_type)}
            {renderBriefField("Category", brief.category)}
            {renderBriefField("Known Competitors", brief.known_competitors)}
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              {renderBriefField("Budget", brief.budget_constraint)}
              {renderBriefField("Timeline", brief.timeline_constraint)}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
