import Card from "../components/ui/Card";
import PageContainer from "../components/ui/PageContainer";

export default function ResidentDashboard() {
  return (
    <PageContainer className="px-0 py-0">
      <Card>
        <h1 className="text-2xl font-bold text-neutral-900">Resident Dashboard</h1>
        <p className="mt-2 text-neutral-600">Welcome to RESPONDR resident portal.</p>
      </Card>
    </PageContainer>
  );
}
