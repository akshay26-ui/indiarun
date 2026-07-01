"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/api";

export default function NewProjectPage() {
  const router = useRouter();

  useEffect(() => {
    const createDraftProject = async () => {
      try {
        const data = await fetchWithAuth("/project", {
          method: "POST",
          body: JSON.stringify({
            idea_name: "Draft",
            product_type: "software",
          }),
        });
        router.push(`/project/${data.id}/intake`);
      } catch (err) {
        console.error("Failed to create draft project", err);
      }
    };
    createDraftProject();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/40">
      <div className="text-muted-foreground animate-pulse">Initializing Intake Brief...</div>
    </div>
  );
}
