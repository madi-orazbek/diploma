import { Card } from '@/components/ui/card';
export default function AdminDashboard() {
  return <div className="space-y-4"><h1 className="text-3xl font-bold">Admin Dashboard</h1><div className="grid md:grid-cols-6 gap-3"><Card title="Total users" value={24} /><Card title="Total students" value={13} /><Card title="Total clients" value={10} /><Card title="Total projects" value={30} /><Card title="Total applications" value={42} /><Card title="Flagged items" value={2} /></div></div>;
}
