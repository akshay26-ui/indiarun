import PrototypePage from "../../../../../design/pages/PrototypePage";

export default function Page({ params }: { params: { id: string } }) {
  return <PrototypePage projectId={params.id} />;
}
