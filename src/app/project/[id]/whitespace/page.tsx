import WhitespacePage from "../../../../../design/pages/WhitespacePage";

export default function Page({ params }: { params: { id: string } }) {
  return <WhitespacePage projectId={params.id} />;
}
