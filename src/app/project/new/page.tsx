"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function NewProjectPage() {
  const router = useRouter();
  const [ideaName, setIdeaName] = useState("");
  const [productType, setProductType] = useState("software");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await fetchWithAuth("/project", {
        method: "POST",
        body: JSON.stringify({
          idea_name: ideaName,
          product_type: productType,
        }),
      });
      router.push(`/project/${data.id}/whitespace`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/40">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">New Project</CardTitle>
          <CardDescription>Tell us about your next big idea.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ideaName">Idea Name</Label>
              <Input 
                id="ideaName" 
                placeholder="E.g., Uber for dogs" 
                required 
                value={ideaName} 
                onChange={(e) => setIdeaName(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="productType">Product Type</Label>
              <select 
                id="productType" 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
              >
                <option value="software">Software</option>
                <option value="physical">Physical Product</option>
              </select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Project"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">
            Cancel
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
