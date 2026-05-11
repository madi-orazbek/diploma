import { CategoryChart, ActivityChart } from '@/components/dashboard/charts';

const categories = [{ name: 'Web', value: 12 }, { name: 'Data', value: 7 }, { name: 'Mobile', value: 6 }, { name: 'Design', value: 5 }];
const trend = [{ date: 'Mar-20', value: 4 }, { date: 'Mar-21', value: 7 }, { date: 'Mar-22', value: 5 }, { date: 'Mar-23', value: 8 }, { date: 'Mar-24', value: 11 }];

export default function AdminAnalyticsPage() {
  return <div className="space-y-4"><h1 className="text-3xl font-bold">Platform Analytics</h1><div className="grid lg:grid-cols-2 gap-4"><div className="card p-4"><h2 className="font-semibold mb-2">Projects by category</h2><CategoryChart data={categories} /></div><div className="card p-4"><h2 className="font-semibold mb-2">Applications over time</h2><ActivityChart data={trend} /></div></div></div>;
}
