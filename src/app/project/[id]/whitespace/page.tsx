export default function WhitespacePage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">Whitespace Analysis</h1>
      <p className="text-lg text-muted-foreground">
        ValueForge engine — project {params.id}
      </p>
    </main>
  );
}
