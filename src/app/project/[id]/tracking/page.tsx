export default function TrackingPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">Tracking</h1>
      <p className="text-lg text-muted-foreground">
        Metrics dashboard &amp; feedback loop — project {params.id}
      </p>
    </main>
  );
}
