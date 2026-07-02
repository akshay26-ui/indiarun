import OverviewPage from "../../../../../design/pages/OverviewPage";

export default function Page({ params }: { params: { id: string } }) {
  return <OverviewPage projectId={params.id} />;
}
