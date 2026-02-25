import Card from "../components/ui/Card";
import PageContainer from "../components/ui/PageContainer";

export default function AdminDashboard() {
  return (
    <PageContainer className="px-0 py-0">
      <Card>
        <h1 className="text-2xl font-bold text-neutral-900">Admin Dashboard</h1>
        <p className="mt-2 text-neutral-600">Placeholder for system management overview.</p>
      </Card>
    </PageContainer>
  );
}
