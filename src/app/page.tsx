import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Bot, Target, FileText, Blocks, TrendingUp, BarChart3, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">UAPA</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Log in
            </Link>
            <Link href="/signup">
              <Button size="sm" className="rounded-full px-6">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-32">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background -z-10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full -z-10 opacity-50 pointer-events-none" />
          
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <div className="inline-flex items-center rounded-full border bg-muted/30 px-3 py-1 text-sm font-medium mb-8 backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
              Autonomous AI Product Manager
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
              From raw idea to <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">pitch-ready product</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Stop guessing what to build next. UAPA autonomously interviews you, analyses competitors, drafts PRDs, generates prototypes, and models your unit economics in minutes.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="h-14 px-8 text-lg rounded-full group">
                  Start building for free
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full">
                  Login to demo project
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* 6 Stages Section */}
        <section className="py-24 bg-muted/30 border-y relative overflow-hidden">
          <div className="container mx-auto px-4 max-w-6xl relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">The 6-Stage Autonomous Pipeline</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Our AI agents handle the heavy lifting so you can focus on execution. No expensive consultants or fragmented toolchains required.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Bot, title: "1. Intake Agent", desc: "Conversational AI extracts your constraints, target market, and core problem." },
                { icon: Target, title: "2. Whitespace Analysis", desc: "Real-time web scraping to find competitor gaps and psychographic drivers." },
                { icon: FileText, title: "3. Definition", desc: "Auto-generates user personas, feature prioritization, and a full PRD." },
                { icon: Blocks, title: "4. Rapid Prototyping", desc: "Generates software scaffolds or physical product concept renders instantly." },
                { icon: TrendingUp, title: "5. GTM & Economics", desc: "Models CAC/LTV, payback periods, and crafts your go-to-market strategy." },
                { icon: BarChart3, title: "6. Tracking Loop", desc: "Upload live metrics. AI detects anomalies and feeds back into the pipeline." }
              ].map((feature, i) => (
                <Card key={i} className="bg-background/50 backdrop-blur-sm border-muted-foreground/10 hover:border-primary/30 transition-all hover:-translate-y-1 hover:shadow-lg group">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background py-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© {new Date().getFullYear()} UAPA (Unified AI Product Accelerator). Built for the Hackathon.</p>
        </div>
      </footer>
    </div>
  );
}
