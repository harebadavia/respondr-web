import Card from "../components/ui/Card";
import PageContainer from "../components/ui/PageContainer";
import RolePageHeader from "../components/ui/RolePageHeader";

export default function OfficialDashboard() {
  return (
    <PageContainer className="space-y-4 !max-w-none px-0 py-0">
      <RolePageHeader
        role="official"
        title="Official Dashboard"
        subtitle="Overview placeholder for barangay incident operations."
      />
      <Card>
        <p className="text-neutral-600">Operational dashboard widgets will appear here.</p>
      </Card>
    </PageContainer>
  );
}
