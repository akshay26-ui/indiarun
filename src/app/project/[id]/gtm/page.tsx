import GtmPage from "../../../../../design/pages/GtmPage";

export default function Page({ params }: { params: { id: string } }) {
  return <GtmPage projectId={params.id} />;
}
