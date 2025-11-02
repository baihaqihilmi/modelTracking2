import DashboardLayout from '@/components/layout/DashboardLayout';
import ModelTable from '@/components/model/ModelTable';

export default function ModelPage() {
  return (
    <DashboardLayout>
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem', color: '#1e293b' }}>
          Model List
        </h1>
        <ModelTable />
      </div>
    </DashboardLayout>
  );
}

