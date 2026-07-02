import DefinitionPage from "../../../../../design/pages/DefinitionPage";

export default function Page({ params }: { params: { id: string } }) {
  return <DefinitionPage projectId={params.id} />;
}
