"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Package, Smartphone, Plus } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await fetchWithAuth("/project");
        setProjects(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Manage your projects here.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={handleLogout}>Log out</Button>
          <Link href="/project/new">
            <Button><Plus className="w-4 h-4 mr-2" /> New Project</Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div>Loading projects...</div>
      ) : error ? (
        <div className="text-destructive">Error: {error}</div>
      ) : projects.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <CardHeader>
            <CardTitle>No projects yet</CardTitle>
            <CardDescription>You haven't created any projects. Let's start with your first idea!</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/project/new">
              <Button>Create a Project</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
            <Card key={p.id} className="hover:border-primary transition-colors cursor-pointer" onClick={() => router.push(`/project/${p.id}/whitespace`)}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl">{p.idea_name}</CardTitle>
                {p.product_type === "software" ? <Smartphone className="w-5 h-5 text-muted-foreground" /> : <Package className="w-5 h-5 text-muted-foreground" />}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mt-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                    {p.current_stage}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground capitalize">
                    {p.status.replace("_", " ")}
                  </span>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-xs text-muted-foreground">Last updated: {new Date(p.updated_at).toLocaleDateString()}</p>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
