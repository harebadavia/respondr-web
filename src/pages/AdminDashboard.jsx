import Card from "../components/ui/Card";
import PageContainer from "../components/ui/PageContainer";
import RolePageHeader from "../components/ui/RolePageHeader";

export default function AdminDashboard() {
  return (
    <PageContainer className="space-y-4 !max-w-none px-0 py-0">
      <RolePageHeader
        role="admin"
        title="Admin Dashboard"
        subtitle="System management and oversight workspace."
      />
      <Card>
        <p className="text-neutral-600">Admin analytics and system controls will appear here.</p>
      </Card>
    </PageContainer>
  );
}
