export default function OverviewPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">Project Overview</h1>
      <p className="text-lg text-muted-foreground">
        Full project state across all stages — project {params.id}
      </p>
    </main>
  );
}
