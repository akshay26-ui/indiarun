import TrackingPage from "../../../../../design/pages/TrackingPage";

export default function Page({ params }: { params: { id: string } }) {
  return <TrackingPage projectId={params.id} />;
}
