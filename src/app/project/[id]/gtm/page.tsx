export default function GtmPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">GTM &amp; Unit Economics</h1>
      <p className="text-lg text-muted-foreground">
        Go-to-market strategy &amp; unit economics — project {params.id}
      </p>
    </main>
  );
}
