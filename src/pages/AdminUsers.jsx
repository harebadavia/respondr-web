import Card from "../components/ui/Card";
import PageContainer from "../components/ui/PageContainer";

export default function AdminUsers() {
  return (
    <PageContainer className="px-0 py-0">
      <Card>
        <h1 className="text-2xl font-bold text-neutral-900">Admin Users</h1>
        <p className="mt-2 text-neutral-600">Phase 4 target: list users, edit role, and toggle active status.</p>
      </Card>
    </PageContainer>
  );
}
